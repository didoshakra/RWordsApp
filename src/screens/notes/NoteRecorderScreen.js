// NoteRecorderScreen.js/Новий 01,07,2026
// Майже 1:1 копія робочого TranslatorScreen.js: та сама логіка запису,
// детекції тиші й розпізнавання, без жодного рефакторингу в окремі утиліти.
// Прибрано: переклад, TTS, reverseMode, stage TRANSLATING.
// Додано: крок "перший запис = тема", збереження в notes/note_themes/note_section.
import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
  StatusBar,
  Platform,
  ScrollView,
  ToastAndroid,
  useColorScheme,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useFocusEffect} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {PERMISSIONS, request, check, RESULTS} from 'react-native-permissions';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {
  getOrCreateTodaySection,
  createNoteTheme,
  getThemeById,
  getThemesBySection,
  getLatestThemeBySection,
  addNote,
  updateNote,
  deleteNote,
  getNotesByTheme,
} from '../../db/notes/noteActions';
import NoteRecorderHelpModal from './NoteRecorderHelpModal'; // шлях підправ під свою структуру

const useTheme = () => {
  const isDarkMode = useColorScheme() === 'dark';
  return {
    isDarkMode,
    cPageBorderBg: isDarkMode ? '#0e0e10' : '#eef0f3',
    cCardContainer: isDarkMode ? '#1c1c1f' : '#ffffff',
    cCardBorder: isDarkMode ? '#333' : '#ddd',
    cOutputBg: isDarkMode ? '#26262a' : '#f7f7fa',
    cOutputBorder: isDarkMode ? '#3a3a40' : '#dcdce2',
    cPageOn: isDarkMode ? '#f2f2f2' : '#1a1a1a',
    cLoadText: isDarkMode ? '#cfcfcf' : '#555',
    cErrorOn: '#e0524f',
    cStatusBarBg: isDarkMode ? '#0e0e10' : '#eef0f3',
  };
};

const API_BASE_URL = 'https://rwords.vercel.app/api';
const NOTE_LANG = 'uk-UA';

const KEY_AUTO_RECOGNIZE = 'notes_auto_recognize';
const KEY_PAUSE_DURATION = 'notes_pause_duration';

// Пропоную для нотаток:
const PAUSE_MIN = 500;
const PAUSE_MAX = 3000;
const PAUSE_STEP = 250;
// useState(800) замість useState(1500)
const NO_SPEECH_TIMEOUT = 3000; // якщо взагалі немає звуку — стоп без розпізнавання

const STAGE = {
  IDLE: 'idle',
  RECORDING: 'recording',
  RECOGNIZING: 'recognizing',
  RESULT: 'result',
};

const SESSION = {
  AWAITING_THEME: 'awaiting_theme',
  ADDING_NOTES: 'adding_notes',
};

const NoteRecorderScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const {
    isDarkMode,
    cPageBorderBg,
    cCardContainer,
    cCardBorder,
    cOutputBg,
    cOutputBorder,
    cPageOn,
    cLoadText,
    cErrorOn,
    cStatusBarBg,
  } = useTheme();

  const incomingThemeId = route?.params?.themeId ?? null;

  const [session, setSession] = useState(
    incomingThemeId ? SESSION.ADDING_NOTES : SESSION.AWAITING_THEME,
  );
  const [themeId, setThemeId] = useState(incomingThemeId);
  const [themeName, setThemeName] = useState('');
  const [sectionId, setSectionId] = useState(null);
  const [themesToday, setThemesToday] = useState([]);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const [stage, setStage] = useState(STAGE.IDLE);
  const [draftText, setDraftText] = useState('');

  // ── Налаштування (1:1 як у TranslatorScreen) ──
  const [autoRecognize, setAutoRecognize] = useState(true);
  const [pauseDuration, setPauseDuration] = useState(800); //Змінено з 1500
  const [showSettings, setShowSettings] = useState(false);

  const [notesList, setNotesList] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const recorderRef = useRef(new AudioRecorderPlayer());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);
  const silenceTimer = useRef(null);
  const warmupTimer = useRef(null);
  const noSpeechTimer = useRef(null); // таймер повної тиші (нічого не сказали)
  // autoRecognizeRef — дзеркало стану для читання в async-замиканнях
  const autoRecognizeRef = useRef(autoRecognize);
  // isAutoLoopActive — true тільки коли цикл запущений користувачем,
  // false при ручному стопі або вимкненні авторозпізнавання
  const isAutoLoopActive = useRef(false);

  const isBusy = stage === STAGE.RECOGNIZING;
  const isRecording = stage === STAGE.RECORDING;
  const isAwaitingTheme = session === SESSION.AWAITING_THEME;

  // ── Завантаження налаштувань ──
  useEffect(() => {
    AsyncStorage.multiGet([KEY_AUTO_RECOGNIZE, KEY_PAUSE_DURATION]).then(
      pairs => {
        const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
        if (map[KEY_AUTO_RECOGNIZE] !== null)
          setAutoRecognize(map[KEY_AUTO_RECOGNIZE] !== 'false');
        if (map[KEY_PAUSE_DURATION] !== null)
          setPauseDuration(Number(map[KEY_PAUSE_DURATION]));
      },
    );
  }, []);

  // Синхронізуємо ref при кожній зміні стану
  useEffect(() => {
    autoRecognizeRef.current = autoRecognize;
    if (!autoRecognize) {
      // Вимкнули авторозпізнавання — зупиняємо цикл
      isAutoLoopActive.current = false;
    }
  }, [autoRecognize]);

  const saveSetting = async (key, value) => {
    await AsyncStorage.setItem(key, String(value));
  };

  // ── Якщо прийшли з готовим themeId — підвантажуємо тему й нотатки ──
  useEffect(() => {
    if (!incomingThemeId) return;
    (async () => {
      try {
        const t = await getThemeById(incomingThemeId);
        if (t) setThemeName(t.name);
        const existing = await getNotesByTheme(incomingThemeId);
        setNotesList(existing);
      } catch (e) {
        Alert.alert('Помилка завантаження теми', e.message);
      }
    })();
  }, [incomingThemeId]);

  // ── Якщо прийшли БЕЗ themeId — шукаємо секцію сьогодні й останню тему ──
  useEffect(() => {
    if (incomingThemeId) return;
    (async () => {
      try {
        const secId = await getOrCreateTodaySection();
        setSectionId(secId);
        const latest = await getLatestThemeBySection(secId);
        if (latest) {
          setThemeId(latest.id);
          setThemeName(latest.name);
          const existing = await getNotesByTheme(latest.id);
          setNotesList(existing);
          setSession(SESSION.ADDING_NOTES);
        }
        // Якщо тем на сьогодні нема — лишаємось у SESSION.AWAITING_THEME
        // (початковий стан вже такий за замовчуванням)
      } catch (e) {
        Alert.alert('Помилка завантаження теми', e.message);
      }
    })();
  }, [incomingThemeId]);

  // ── Пульсація (1:1) ──
  useEffect(() => {
    if (isRecording) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // ── Кнопка назад ──
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        navigation.navigate('Home');
        return true;
      };
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBack,
      );
      return () => subscription.remove();
    }, []),
  );

  const ensureMicPermission = async () => {
    const perm = Platform.select({
      ios: PERMISSIONS.IOS.MICROPHONE,
      android: PERMISSIONS.ANDROID.RECORD_AUDIO,
    });
    const status = await check(perm);
    if (status === RESULTS.GRANTED) return true;
    return (await request(perm)) === RESULTS.GRANTED;
  };

  // ── Авто-розпізнавання після паузи (1:1 як у TranslatorScreen) ──
  const startSilenceDetection = pauseMs => {
    const warmedUp = {value: false};
    const hasSoundDetected = {value: false};

    warmupTimer.current = setTimeout(() => {
      warmedUp.value = true;

      // Якщо після прогріву протягом NO_SPEECH_TIMEOUT так і не з'явилось
      // мовлення — вважаємо, що користувач нічого не сказав
      noSpeechTimer.current = setTimeout(() => {
        if (!hasSoundDetected.value) {
          stopRecordingNoSpeech();
        }
      }, NO_SPEECH_TIMEOUT);
    }, 300);

    const loudFrameCount = {value: 0}; // додайте цей рядок ПЕРЕД warmupTimer.current = setTimeout(...)

    recorderRef.current.addRecordBackListener(e => {
      if (!warmedUp.value) return;
      const metering = e.currentMetering ?? -160;
      const isSilent = metering < -30;

      if (!isSilent) {
        loudFrameCount.value += 1;
      } else {
        loudFrameCount.value = 0; // одиничний спалах не накопичується — тиша скидає лічильник
      }

      // Вважаємо мовлення реальним тільки після кількох поспіль "гучних"
      // замірів — це відсіює одиничні шумові спалахи (клац, подих, шурхіт)
      if (loudFrameCount.value >= 3) hasSoundDetected.value = true;

      if (!hasSoundDetected.value) return;

      if (isSilent) {
        if (!silenceTimer.current) {
          silenceTimer.current = setTimeout(() => {
            stopRecording();
          }, pauseMs);
        }
      } else {
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current);
          silenceTimer.current = null;
        }
      }
    });
  };

  const stopSilenceDetection = () => {
    if (warmupTimer.current) {
      clearTimeout(warmupTimer.current);
      warmupTimer.current = null;
    }
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    if (noSpeechTimer.current) {
      clearTimeout(noSpeechTimer.current);
      noSpeechTimer.current = null;
    }
    recorderRef.current.removeRecordBackListener();
  };

  // ── Запис (1:1, тільки без translatedText/isCurrentSaved) ──
  const startRecording = async () => {
    const ok = await ensureMicPermission();
    if (!ok) {
      Alert.alert(
        'Потрібен дозвіл',
        'Дозвольте доступ до мікрофона в налаштуваннях.',
      );
      return;
    }
    setDraftText(' ');
    setStage(STAGE.RECORDING);
    try {
      recorderRef.current = new AudioRecorderPlayer();
      await recorderRef.current.startRecorder(undefined, undefined, true);
      if (autoRecognize) startSilenceDetection(pauseDuration);
    } catch (e) {
      Alert.alert('Помилка запису', e.message);
      setStage(STAGE.IDLE);
    }
  };

  const stopRecordingNoSpeech = async () => {
    stopSilenceDetection();
    try {
      await recorderRef.current.stopRecorder();
    } catch (e) {
      // не критично — головне скинути стан UI
    }
    setStage(STAGE.IDLE);

    if (isAwaitingTheme) {
      // Перший запис сесії (визначення теми) — тиша: нічого не пишемо
      // в поле вводу (щоб не заважати ручному введенню), просто повідомляємо
      // коротким тостом. Юзер сам тисне мікрофон ще раз.
      setDraftText('');
      ToastAndroid.show('Ви нічого не сказали', ToastAndroid.SHORT);
      return;
    }

    // Режим додавання пунктів: тиша тут означає, що юзер закінчив
    // диктувати. Тихо зупиняємо авто-цикл, нічого зайвого не показуємо —
    // всі попередні пункти вже збережені й видні в списку.
    isAutoLoopActive.current = false;
    setDraftText('');
    ToastAndroid.show('Ви нічого не сказали', ToastAndroid.SHORT);
  };

  const stopRecording = async () => {
    stopSilenceDetection();
    let filePath;
    try {
      filePath = await recorderRef.current.stopRecorder();
    } catch (e) {
      Alert.alert('Помилка запису', e.message);
      setStage(STAGE.IDLE);
      return;
    }
    setStage(STAGE.RECOGNIZING);
    try {
      const text = await recognizeSpeech(filePath);

      setDraftText(text);
      setStage(STAGE.RESULT);

      if (
        isAutoLoopActive.current &&
        text?.trim() &&
        session === SESSION.ADDING_NOTES
      ) {
        // Авторежим: пункт (не тема) зберігається одразу, мікрофон сам
        // продовжує слухати наступну фразу.
        await persistNote(text);
        if (isAutoLoopActive.current) startRecording(); // перевіряємо ще раз — міг вимкнути поки зберігали
      }
      // Якщо чекаємо тему — лишаємо текст редагованим, користувач
      // підтверджує кнопкою "Це тема" (навіть в авторежимі).
    } catch (e) {
      Alert.alert('Помилка розпізнавання', e.message);
      setStage(STAGE.IDLE);
    }
  };

  const onMicPress = () => {
    if (isRecording) {
      isAutoLoopActive.current = false; // ручний стоп — цикл не продовжується
      stopRecording();
    } else if (!isBusy) {
      isAutoLoopActive.current = autoRecognizeRef.current; // старт — цикл активний якщо авто
      startRecording();
    }
  };

  // ── STT: той самий ендпоінт, що в TranslatorScreen, без перекладу ──
  const recognizeSpeech = async filePath => {
    const formData = new FormData();
    formData.append('audio', {
      uri: Platform.OS === 'android' ? `file://${filePath}` : filePath,
      type: 'audio/m4a',
      name: 'voice.m4a',
    });
    formData.append('language', NOTE_LANG);
    // formData.append('model', 'whisper-large-v3'); // Модекль розпізнавання голосу.(whisper-large-v3-turbo / whisper-large-v3(Повільніше, дорожче але якісніший)), дефолт лишився turbo
    const res = await fetch(`${API_BASE_URL}/translator/stt`, {
      method: 'POST',
      headers: {'Content-Type': 'multipart/form-data'},
      body: formData,
    });
    if (!res.ok) throw new Error(`STT помилка: ${res.status}`);
    const data = await res.json();
    return data.text;
  };

  // ── Вибір іншої теми за сьогодні ──
  const openThemePicker = async () => {
    if (!sectionId) return;
    try {
      const list = await getThemesBySection(sectionId);
      setThemesToday(list);
      setShowThemePicker(true);
    } catch (e) {
      Alert.alert('Помилка завантаження тем', e.message);
    }
  };

  const selectTheme = async theme => {
    try {
      setThemeId(theme.id);
      setThemeName(theme.name);
      const existing = await getNotesByTheme(theme.id);
      setNotesList(existing);
      setDraftText('');
      setStage(STAGE.IDLE);
      setSession(SESSION.ADDING_NOTES);
      setShowThemePicker(false);
    } catch (e) {
      Alert.alert('Помилка завантаження теми', e.message);
    }
  };

  const startNewThemeFromPicker = () => {
    setThemeId(null);
    setThemeName('');
    setNotesList([]);
    setDraftText('');
    setStage(STAGE.IDLE);
    setSession(SESSION.AWAITING_THEME);
    setShowThemePicker(false);
  };

  // ── Підтвердження теми (перший запис сесії) ──
  const confirmTheme = async () => {
    const name = draftText.trim();
    if (!name) return;
    try {
      const sectionId = await getOrCreateTodaySection();
      const newThemeId = await createNoteTheme(sectionId, name);
      setSectionId(sectionId);
      setThemeId(newThemeId);
      setThemeName(name);
      setSession(SESSION.ADDING_NOTES);
      setDraftText('');
      setStage(STAGE.IDLE);

      // Тема підтверджена — одразу вмикаємо мікрофон для вводу пунктів,
      // ніби юзер сам натиснув кнопку. Авто-цикл активний, якщо ввімкнено
      // авто-розпізнавання (як і при звичайному onMicPress).
      isAutoLoopActive.current = autoRecognizeRef.current;
      startRecording();
    } catch (e) {
      Alert.alert('Помилка створення теми', e.message);
    }
  };

  // ── Збереження пункту в таблицю notes ──
  const persistNote = async text => {
    const clean = text.trim();
    if (!clean || !themeId) return;
    try {
      const id = await addNote(themeId, clean);
      setNotesList(prev => [
        ...prev,
        {id, theme_id: themeId, text: clean, created_at: Date.now() / 1000},
      ]);
      setDraftText('');
      ToastAndroid.show('Додано ✓', ToastAndroid.SHORT);
    } catch (e) {
      Alert.alert('Помилка збереження', e.message);
    }
  };

  // Ручний режим: кнопка "Додати"
  const onManualAdd = async () => {
    await persistNote(draftText);
    setStage(STAGE.IDLE);
  };

  // ── Інлайн редагування/видалення в живому списку ──
  const startEditNote = note => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  const saveEditNote = async () => {
    if (!editingText.trim()) return;
    try {
      await updateNote(editingNoteId, editingText);
      setNotesList(prev =>
        prev.map(n =>
          n.id === editingNoteId ? {...n, text: editingText.trim()} : n,
        ),
      );
      setEditingNoteId(null);
      setEditingText('');
    } catch (e) {
      Alert.alert('Помилка редагування', e.message);
    }
  };

  const removeNote = async noteId => {
    try {
      await deleteNote(noteId);
      setNotesList(prev => prev.filter(n => n.id !== noteId));
    } catch (e) {
      Alert.alert('Помилка видалення', e.message);
    }
  };

  const showThemeConfirmBtn =
    isAwaitingTheme && !isRecording && !isBusy && draftText.trim() !== '';

  const showManualAddBtn =
    !isAwaitingTheme && !isRecording && !isBusy && draftText.trim() !== '';

  const busyLabel = 'Розпізнаю...';

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: cPageBorderBg,
      }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={cStatusBarBg}
      />
      <View
        style={[
          styles.pageContainer,
          {backgroundColor: cCardContainer, borderColor: cCardBorder},
        ]}>
        {/* ── Шапка ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Ionicons name="arrow-back" size={22} color={cPageOn} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, {color: cPageOn}]}>Записник</Text>

          <View style={styles.headerRightGroup}>
            <NoteRecorderHelpModal pcOn={cPageOn} />
            <TouchableOpacity onPress={() => setShowSettings(true)}>
              <Ionicons name="settings-outline" size={22} color={cPageOn} />
            </TouchableOpacity>
          </View>
        </View>
        {/* ── Шапка ── */}
        <View style={styles.langRow}>
          {/* <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Ionicons name="arrow-back" size={22} color={cPageOn} />
          </TouchableOpacity>
          <NoteRecorderHelpModal pcOn={cPageOn} /> */}

          <TouchableOpacity
            style={styles.headerTitleTouchable}
            disabled={isAwaitingTheme}
            onPress={openThemePicker}
            accessibilityLabel="Обрати іншу тему">
            <Text
              style={[styles.headerTitle, {color: cPageOn}]}
              numberOfLines={1}>
              {isAwaitingTheme ? 'Нова тема...' : themeName}
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            onPress={() => {
              const next = !autoRecognize;
              setAutoRecognize(next);
              saveSetting(KEY_AUTO_RECOGNIZE, next);
            }}>
            <FontAwesome
              name="microphone"
              size={20}
              color={autoRecognize ? '#ffd11a' : cLoadText}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={22} color={cPageOn} />
          </TouchableOpacity> */}
        </View>

        {/* ── Модалка налаштувань (пауза) ── */}
        {showSettings && (
          <View
            style={[
              styles.settingsModal,
              {backgroundColor: cCardContainer, borderColor: cCardBorder},
            ]}>
            <Text style={[styles.settingsTitle, {color: cPageOn}]}>
              Налаштування
            </Text>

            <View style={styles.settingRow}>
              <MaterialIcons
                name="flash-auto"
                size={22}
                color={autoRecognize ? '#ffd11a' : cLoadText}
              />
              <Text style={[styles.settingRowLabel, {color: cPageOn}]}>
                Авто-розпізнавання
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const next = !autoRecognize;
                  setAutoRecognize(next);
                  saveSetting(KEY_AUTO_RECOGNIZE, next);
                }}>
                <Ionicons
                  name={autoRecognize ? 'toggle' : 'toggle-outline'}
                  size={28}
                  color={autoRecognize ? '#ffd11a' : cLoadText}
                />
              </TouchableOpacity>
            </View>

            {autoRecognize && (
              <View style={styles.pauseRow}>
                <Text style={[styles.settingRowLabel, {color: cPageOn}]}>
                  Пауза:
                </Text>
                <View style={styles.pauseOptions}>
                  <TouchableOpacity
                    style={[
                      styles.pauseBtn,
                      {opacity: pauseDuration <= PAUSE_MIN ? 0.3 : 1},
                    ]}
                    disabled={pauseDuration <= PAUSE_MIN}
                    onPress={() => {
                      const next = pauseDuration - PAUSE_STEP;
                      setPauseDuration(next);
                      saveSetting(KEY_PAUSE_DURATION, next);
                    }}>
                    <Text style={[styles.pauseBtnText, {color: cPageOn}]}>
                      −
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.pauseValue, {color: cPageOn}]}>
                    {(pauseDuration / 1000).toFixed(1)}с
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.pauseBtn,
                      {opacity: pauseDuration >= PAUSE_MAX ? 0.3 : 1},
                    ]}
                    disabled={pauseDuration >= PAUSE_MAX}
                    onPress={() => {
                      const next = pauseDuration + PAUSE_STEP;
                      setPauseDuration(next);
                      saveSetting(KEY_PAUSE_DURATION, next);
                    }}>
                    <Text style={[styles.pauseBtnText, {color: cPageOn}]}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.settingsCloseBtn, {borderColor: cOutputBorder}]}
              onPress={() => setShowSettings(false)}>
              <Text style={[styles.actionBtnText, {color: cPageOn}]}>
                Закрити
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Модалка вибору теми ── */}
        {showThemePicker && (
          <View
            style={[
              styles.settingsModal,
              {backgroundColor: cCardContainer, borderColor: cCardBorder},
            ]}>
            <Text style={[styles.settingsTitle, {color: cPageOn}]}>
              Теми за сьогодні
            </Text>

            <ScrollView style={styles.themePickerScroll}>
              {themesToday.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.themePickerRow,
                    {borderColor: cOutputBorder},
                    t.id === themeId && styles.themePickerRowActive,
                  ]}
                  onPress={() => selectTheme(t)}>
                  <Text style={[styles.themePickerRowText, {color: cPageOn}]}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.confirmBtn,
                {borderColor: cOutputBorder},
              ]}
              onPress={startNewThemeFromPicker}>
              <Text style={[styles.actionBtnText, {color: cPageOn}]}>
                + Нова тема
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingsCloseBtn, {borderColor: cOutputBorder}]}
              onPress={() => setShowThemePicker(false)}>
              <Text style={[styles.actionBtnText, {color: cPageOn}]}>
                Закрити
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.startedContainer}>
          {/* ── Рядок мікрофона ── */}
          <View style={styles.micSmallRow}>
            <TouchableOpacity
              onPress={() => {
                const next = !autoRecognize;
                setAutoRecognize(next);
                saveSetting(KEY_AUTO_RECOGNIZE, next);
              }}
              style={styles.micRowSideIcon}
              accessibilityLabel="Авто-розпізнавання">
              <MaterialIcons
                name="flash-auto"
                size={22}
                color={autoRecognize ? '#ffd11a' : cLoadText}
              />
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.pulseSmall,
                {
                  backgroundColor: cErrorOn,
                  transform: [{scale: pulseAnim}],
                  opacity: isRecording ? 0.35 : 0,
                },
              ]}
            />
            <TouchableOpacity
              disabled={isBusy}
              onPress={onMicPress}
              style={[
                styles.micButtonSmall,
                {backgroundColor: isRecording ? cErrorOn : '#ffd11a'},
              ]}
              accessibilityLabel={
                isRecording ? 'Зупинити запис' : 'Записати голос'
              }>
              <FontAwesome
                name={isRecording ? 'microphone' : 'microphone-slash'}
                size={20}
                color="#1a1a1a"
              />
            </TouchableOpacity>
            {/* Невидимий "двійник" лівої іконки — та сама розмітка, той самий розмір,
      просто opacity: 0. Це і є секрет чіткого центрування без реального
      правого елемента. */}
            <View
              style={[styles.micRowSideIcon, styles.ghostIcon]}
              pointerEvents="none">
              <MaterialIcons name="flash-auto" size={22} color="transparent" />
            </View>
          </View>

          {isBusy && (
            <View style={styles.busyRowCentered}>
              <ActivityIndicator size="small" color={cLoadText} />
              <Text style={[styles.busyText, {color: cLoadText}]}>
                {busyLabel}
              </Text>
            </View>
          )}

          {/* ── Поле чернетки (тема або новий пункт) ── */}
          <View
            style={[
              styles.draftContainer,
              {backgroundColor: cOutputBg, borderColor: cOutputBorder},
            ]}>
            <Text style={[styles.cardLabel, {color: cLoadText}]}>
              {isAwaitingTheme ? 'Тема (підтвердіть)' : 'Новий пункт'}
            </Text>
            <TextInput
              style={[styles.draftText, {color: cPageOn}]}
              value={draftText}
              onChangeText={setDraftText}
              multiline
              editable={!isBusy && !isRecording}
              placeholder={
                isRecording
                  ? 'Слухаю...'
                  : isAwaitingTheme
                  ? 'Скажіть або введіть назву теми...'
                  : 'Скажіть або введіть пункт...'
              }
              placeholderTextColor={cLoadText}
            />
          </View>

          {showThemeConfirmBtn && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.confirmBtn,
                {borderColor: cOutputBorder},
              ]}
              onPress={confirmTheme}>
              <Text style={[styles.actionBtnText, {color: cPageOn}]}>
                Це тема
              </Text>
            </TouchableOpacity>
          )}

          {showManualAddBtn && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.confirmBtn,
                {borderColor: cOutputBorder},
              ]}
              onPress={onManualAdd}>
              <Text style={[styles.actionBtnText, {color: cPageOn}]}>
                Додати
              </Text>
            </TouchableOpacity>
          )}

          {/* ── Живий список пунктів ── */}
          {!isAwaitingTheme && (
            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled">
              {notesList.map(note => (
                <View
                  key={note.id}
                  style={[
                    styles.noteRow,
                    {backgroundColor: cOutputBg, borderColor: cOutputBorder},
                  ]}>
                  {editingNoteId === note.id ? (
                    <>
                      <TextInput
                        style={[styles.noteEditInput, {color: cPageOn}]}
                        value={editingText}
                        onChangeText={setEditingText}
                        multiline
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={saveEditNote}
                        style={styles.noteIconBtn}>
                        <Ionicons name="checkmark" size={20} color={cPageOn} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.noteText, {color: cPageOn}]}>
                        {note.text}
                      </Text>
                      <TouchableOpacity
                        onPress={() => startEditNote(note)}
                        style={styles.noteIconBtn}>
                        <Ionicons name="pencil" size={16} color={cLoadText} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeNote(note.id)}
                        style={styles.noteIconBtn}>
                        <Ionicons name="trash" size={16} color={cErrorOn} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

export default NoteRecorderScreen;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 2,
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  headerTitleTouchable: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 6,
  },
  settingsModal: {
    position: 'absolute',
    top: 50,
    right: 10,
    left: 10,
    zIndex: 100,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  settingsTitle: {fontSize: 15, fontWeight: '600', marginBottom: 4},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingRowLabel: {fontSize: 14},
  pauseRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 8},
  pauseOptions: {flexDirection: 'row', alignItems: 'center', gap: 12},
  pauseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#aaa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBtnText: {fontSize: 18, fontWeight: '600'},
  pauseValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  settingsCloseBtn: {
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  themePickerScroll: {
    maxHeight: 220,
  },
  themePickerRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  themePickerRowActive: {
    backgroundColor: 'rgba(255,209,26,0.2)',
  },
  themePickerRowText: {
    fontSize: 15,
  },
  startedContainer: {flex: 1, paddingHorizontal: 10},
  micSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    gap: 24,
  },
  pulseSmall: {position: 'absolute', width: 72, height: 72, borderRadius: 28},
  micButtonSmall: {
    width: 56,
    height: 56,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostIcon: {
    opacity: 0,
  },
  busyRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  busyText: {fontSize: 12},
  draftContainer: {
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 70,
  },
  cardLabel: {fontSize: 11, marginBottom: 6},
  draftText: {fontSize: 18, lineHeight: 24},
  actionBtn: {
    borderWidth: 2,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  confirmBtn: {backgroundColor: 'rgba(255,209,26,0.2)'},
  actionBtnText: {fontSize: 14, fontWeight: '500'},
  listScroll: {flex: 1, marginTop: 12},
  listContent: {gap: 8, paddingBottom: 16},
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  noteText: {flex: 1, fontSize: 15, lineHeight: 20},
  noteEditInput: {flex: 1, fontSize: 15, lineHeight: 20, padding: 0},
  noteIconBtn: {padding: 4},
});
