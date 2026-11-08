// TranslatorScreen.js//таймер "тиші з самого початку" (3 сек без жодного звуку)
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
  Switch,
  StatusBar,
  Platform,
  ScrollView,
  ToastAndroid,
  useColorScheme,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useFocusEffect} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Tts from 'react-native-tts-export';
import {PERMISSIONS, request, check, RESULTS} from 'react-native-permissions';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {saveDialogueToSQLite} from '../../db/dialogueActions';
import {SettingsContext} from '@/context/SettingsContext';
import TranslatorHelpModal from './TranslatorHelpModal'; // шлях підправ під свою структу
import TranslatorLanguageModal from './TranslatorLanguageModal';

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

// ─── КЛЮЧІ НАЛАШТУВАНЬ ────────────────────────────────────────────────────────
const KEY_AUTO_SPEAK = 'translator_auto_speak';
const KEY_AUTO_RECOGNIZE = 'translator_auto_recognize'; // перейменовано з KEY_AUTO_STOP
const KEY_PAUSE_DURATION = 'translator_pause_duration';
const KEY_REVERSE_MODE = 'translator_reverse_mode';

const PAUSE_MIN = 1000;
const PAUSE_MAX = 10000;
const PAUSE_STEP = 1000;
const NO_SPEECH_TIMEOUT = 3000; // якщо взагалі немає звуку — стоп без розпізнавання

const STAGE = {
  IDLE: 'idle',
  RECORDING: 'recording',
  RECOGNIZING: 'recognizing',
  TRANSLATING: 'translating',
  RESULT: 'result',
};

// ─── Хелпер: коротка назва мови для підпису ──────────────────────────────────
const langLabel = locale => {
  if (!locale) return '?';
  const code = locale.split('-')[0].toLowerCase();
  const map = {
    uk: 'укр.',
    en: 'англ.',
    de: 'нім.',
    fr: 'фр.',
    pl: 'пол.',
    es: 'ісп.',
    it: 'італ.',
    pt: 'порт.',
    cs: 'чес.',
    nl: 'нід.',
    sv: 'швед.',
    da: 'дан.',
    fi: 'фін.',
    nb: 'норв.',
  };
  return map[code] ?? code;
};

const TranslatorScreen = () => {
  const navigation = useNavigation();
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

  // ── Мови з контексту ──
  const {settings, setSettings} = useContext(SettingsContext);
  const baseFrom = settings?.fromLanguage ?? 'uk-UA';
  const baseTo = settings?.toLanguage ?? 'en-GB';

  const [stage, setStage] = useState(STAGE.IDLE);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  // ── Налаштування ──
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [autoRecognize, setAutoRecognize] = useState(true); // перейменовано з autoStop
  const [pauseDuration, setPauseDuration] = useState(1500);
  const [reverseMode, setReverseMode] = useState(false);

  const [dialogues, setDialogues] = useState([]);
  const [isCurrentSaved, setIsCurrentSaved] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dialoguesRef = useRef([]);
  const recorderRef = useRef(new AudioRecorderPlayer());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);
  const silenceTimer = useRef(null);
  const noSpeechTimer = useRef(null); // таймер повної тиші (нічого не сказали)

  const isBusy = stage === STAGE.RECOGNIZING || stage === STAGE.TRANSLATING;
  const isRecording = stage === STAGE.RECORDING;

  // ── Показуємо кнопки тільки коли є результат і не збережено ──
  const showActionButtons =
    stage === STAGE.RESULT && translatedText.trim() !== '' && !isCurrentSaved;

  // ── Показуємо кнопку "Перекласти"/"Реперекласти" коли є текст і немає активного результату ──
  const showTranslateBtn =
    !isBusy &&
    !isRecording &&
    originalText.trim() !== '' &&
    stage !== STAGE.RESULT;

  // ── Текстове поле завжди редагується крім запису/зайнятості ──
  const isOriginalEditable = !isBusy && !isRecording;

  // ── Активні мови залежно від режиму ──
  const srcLang = reverseMode ? baseTo : baseFrom;
  const dstLang = reverseMode ? baseFrom : baseTo;

  // ── Завантаження налаштувань ──
  useEffect(() => {
    AsyncStorage.multiGet([
      KEY_AUTO_SPEAK,
      KEY_AUTO_RECOGNIZE,
      KEY_PAUSE_DURATION,
      KEY_REVERSE_MODE,
    ]).then(pairs => {
      const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
      if (map[KEY_AUTO_SPEAK] !== null)
        setAutoSpeak(map[KEY_AUTO_SPEAK] === 'true');
      if (map[KEY_AUTO_RECOGNIZE] !== null)
        setAutoRecognize(map[KEY_AUTO_RECOGNIZE] !== 'false');
      if (map[KEY_PAUSE_DURATION] !== null)
        setPauseDuration(Number(map[KEY_PAUSE_DURATION]));
      if (map[KEY_REVERSE_MODE] !== null)
        setReverseMode(map[KEY_REVERSE_MODE] === 'true');
    });
  }, []);

  // ── TTS: оновлюємо мову при зміні dstLang ──
  useEffect(() => {
    Tts.setDefaultLanguage(dstLang);
    Tts.setDefaultRate(0.5);
  }, [dstLang]);

  const saveSetting = async (key, value) => {
    await AsyncStorage.setItem(key, String(value));
  };

  // ── Пульсація ──
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
        handleExit();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBack,
      );
      return () => subscription.remove();
    }, [dialogues]),
  );

  const handleExit = () => {
    const unsaved = dialoguesRef.current.filter(d => !d.saved);
    if (unsaved.length === 0) {
      navigation.navigate('Home');
      return;
    }
    Alert.alert(
      'Зберегти діалоги?',
      `Є ${unsaved.length} незбережених діалогів. Зберегти їх перед виходом?`,
      [
        {text: 'Зберегти всі', onPress: () => saveAll(unsaved, true)},
        {
          text: 'Не зберігати',
          onPress: () => navigation.navigate('Home'),
          style: 'destructive',
        },
        {text: 'Скасувати', style: 'cancel'},
      ],
    );
  };

  const ensureMicPermission = async () => {
    const perm = Platform.select({
      ios: PERMISSIONS.IOS.MICROPHONE,
      android: PERMISSIONS.ANDROID.RECORD_AUDIO,
    });
    const status = await check(perm);
    if (status === RESULTS.GRANTED) return true;
    return (await request(perm)) === RESULTS.GRANTED;
  };

  // ── Авто-розпізнавання після паузи ──
  const warmupTimer = useRef(null);

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
    }, 300); //warmup-затримка 300 мс (було 2000 мс):

    // лічильник гучних кадрів (відсіює одиничні шумові спалахи):
    const loudFrameCount = {value: 0};

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

  // ── Запис ──
  const startRecording = async () => {
    const ok = await ensureMicPermission();
    if (!ok) {
      Alert.alert(
        'Потрібен дозвіл',
        'Дозвольте доступ до мікрофона в налаштуваннях.',
      );
      return;
    }
    setOriginalText(' ');
    setTranslatedText('');
    setIsCurrentSaved(false);
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
    setOriginalText('');
    setTranslatedText('');
    setStage(STAGE.IDLE);
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
      setOriginalText(text);
      if (autoRecognize && text?.trim()) {
        // ── Авто-режим: одразу перекладаємо ──
        await handleTranslate(text);
      } else {
        // ── Ручний режим: показуємо текст, чекаємо кнопку ──
        setStage(STAGE.IDLE);
      }
    } catch (e) {
      Alert.alert('Помилка розпізнавання', e.message);
      setStage(STAGE.IDLE);
    }
  };

  const onMicPress = () => {
    if (isRecording) stopRecording();
    else if (!isBusy) startRecording();
  };

  // ── STT ──
  const recognizeSpeech = async filePath => {
    const formData = new FormData();
    formData.append('audio', {
      uri: Platform.OS === 'android' ? `file://${filePath}` : filePath,
      type: 'audio/m4a',
      name: 'voice.m4a',
    });
    formData.append('language', srcLang);
    const res = await fetch(`${API_BASE_URL}/translator/stt`, {
      method: 'POST',
      headers: {'Content-Type': 'multipart/form-data'},
      body: formData,
    });
    if (!res.ok) throw new Error(`STT помилка: ${res.status}`);
    const data = await res.json();
    return data.text;
  };

  // ── Переклад ──
  const handleTranslate = async textOverride => {
    const text = textOverride ?? originalText;
    if (!text?.trim()) return;
    setStage(STAGE.TRANSLATING);
    try {
      const res = await fetch(`${API_BASE_URL}/translator/translate`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text, from: srcLang, to: dstLang}),
      });
      if (!res.ok) throw new Error(`Переклад помилка: ${res.status}`);
      const data = await res.json();
      setTranslatedText(data.translation);
      setStage(STAGE.RESULT);
      if (autoSpeak) speakTranslation(data.translation);
    } catch (e) {
      Alert.alert('Помилка перекладу', e.message);
      setStage(STAGE.IDLE);
    }
  };

  // ── TTS ──
  const speakTranslation = text => {
    Tts.stop();
    Tts.speak(text);
  };

  const saveCurrentDialogue = async () => {
    if (!originalText.trim() || !translatedText.trim()) return;
    try {
      await saveDialogueToSQLite(originalText, translatedText);
      const newDialogue = {
        id: Date.now(),
        original: originalText.trim(),
        translation: translatedText.trim(),
        saved: true,
      };
      const updated = [...dialoguesRef.current, newDialogue];
      dialoguesRef.current = updated;
      setDialogues(updated);
      ToastAndroid.show('Збережено ✓', ToastAndroid.SHORT);
      setIsCurrentSaved(true);
    } catch (e) {
      Alert.alert('Помилка збереження', e.message);
    }
  };

  const deleteCurrentDialogue = () => {
    setOriginalText('');
    setTranslatedText('');
    setIsCurrentSaved(false);
    setStage(STAGE.IDLE);
  };

  const saveAll = async (unsaved, exitAfter = false) => {
    try {
      for (const d of unsaved)
        await saveDialogueToSQLite(d.original, d.translation);
      if (exitAfter) navigation.navigate('Home');
    } catch (e) {
      Alert.alert('Помилка збереження', e.message);
    }
  };

  // ── Перемикання реверсного режиму ──
  const toggleReverseMode = () => {
    const next = !reverseMode;
    setReverseMode(next);
    saveSetting(KEY_REVERSE_MODE, next);
    setOriginalText('');
    setTranslatedText('');
    setStage(STAGE.IDLE);
  };

  const busyLabel =
    stage === STAGE.RECOGNIZING ? 'Розпізнаю...' : 'Перекладаю...';

  const showTranslation =
    stage === STAGE.RESULT && translatedText.trim() !== '';

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
          <TouchableOpacity onPress={handleExit}>
            <Ionicons name="arrow-back" size={22} color={cPageOn} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, {color: cPageOn}]}>Перекладач</Text>

          <View style={styles.headerRightGroup}>
            <TranslatorHelpModal pcOn={cPageOn} />
            <TouchableOpacity onPress={() => setShowSettings(true)}>
              <Ionicons name="settings-outline" size={22} color={cPageOn} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Новий рядок: пара мов + швидкий реверс ── */}
        <View style={styles.langRow}>
          <TranslatorLanguageModal
            fromLanguage={baseFrom}
            toLanguage={baseTo}
            displayLabel={`${langLabel(srcLang)} → ${langLabel(dstLang)}`}
            onSave={(newFrom, newTo) =>
              setSettings(prev => ({
                ...prev,
                fromLanguage: newFrom,
                toLanguage: newTo,
              }))
            }
          />
          <TouchableOpacity
            onPress={toggleReverseMode}
            style={styles.reverseIconWrap}
            accessibilityLabel="Перемкнути напрямок перекладу">
            <Ionicons
              name="swap-horizontal"
              size={18}
              color={reverseMode ? '#ffd11a' : cLoadText}
            />
          </TouchableOpacity>
        </View>

        {/* ── Модалка налаштувань ── */}
        {showSettings && (
          <View
            style={[
              styles.settingsModal,
              {backgroundColor: cCardContainer, borderColor: cCardBorder},
            ]}>
            <Text style={[styles.settingsTitle, {color: cPageOn}]}>
              Налаштування
            </Text>

            {/* Реверсний переклад */}
            <View style={styles.settingRow}>
              <View style={styles.settingLabelGroup}>
                <Ionicons
                  name="swap-horizontal"
                  size={18}
                  color={reverseMode ? '#ffd11a' : cLoadText}
                  style={styles.settingLabelIcon}
                />

                <View style={styles.settingLabelTextCol}>
                  <Text style={[styles.settingRowLabel, {color: cPageOn}]}>
                    Реверсний переклад
                  </Text>
                  <Text style={[styles.settingRowHint, {color: cLoadText}]}>
                    {reverseMode
                      ? `${langLabel(baseTo)} → ${langLabel(baseFrom)}`
                      : `${langLabel(baseFrom)} → ${langLabel(baseTo)}`}
                  </Text>
                </View>
              </View>
              <Switch
                value={reverseMode}
                onValueChange={v => {
                  setReverseMode(v);
                  saveSetting(KEY_REVERSE_MODE, v);
                  setOriginalText('');
                  setTranslatedText('');
                  setStage(STAGE.IDLE);
                }}
              />
            </View>

            <View style={styles.settingRow}>
              <FontAwesome
                name="volume-up"
                size={20}
                color={autoSpeak ? '#ffd11a' : cLoadText}
              />
              <Text style={[styles.settingRowLabel, {color: cPageOn}]}>
                Авто-озвучення перекладу
              </Text>
              <Switch
                value={autoSpeak}
                onValueChange={v => {
                  setAutoSpeak(v);
                  saveSetting(KEY_AUTO_SPEAK, v);
                }}
              />
            </View>

            {/* Перейменовано: Авто-розпізнавання після паузи */}
            <View style={styles.settingRow}>
              <MaterialIcons
                name="flash-auto"
                size={22}
                color={autoRecognize ? '#ffd11a' : cLoadText}
              />
              <Text style={[styles.settingRowLabel, {color: cPageOn}]}>
                Авто-розпізнавання
              </Text>
              <Switch
                value={autoRecognize}
                onValueChange={v => {
                  setAutoRecognize(v);
                  saveSetting(KEY_AUTO_RECOGNIZE, v);
                }}
              />
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

        {/* ══════════════════════════════════════════
            ОСНОВНИЙ ВМІСТ
            ══════════════════════════════════════════ */}
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

            <TouchableOpacity
              onPress={() => {
                setAutoSpeak(!autoSpeak);
                saveSetting(KEY_AUTO_SPEAK, !autoSpeak);
              }}
              style={styles.micRowSideIcon}
              accessibilityLabel="Авто-озвучення">
              <FontAwesome
                name="volume-up"
                size={20}
                color={autoSpeak ? '#ffd11a' : cLoadText}
              />
            </TouchableOpacity>
          </View>

          {isBusy && (
            <View style={styles.busyRowCentered}>
              <ActivityIndicator size="small" color={cLoadText} />
              <Text style={[styles.busyText, {color: cLoadText}]}>
                {busyLabel}
              </Text>
            </View>
          )}

          {/* ── Картки з текстом ── */}
          <ScrollView
            style={styles.cardsScroll}
            contentContainerStyle={styles.cardsContent}
            keyboardShouldPersistTaps="handled">
            {/* Поле оригіналу — завжди видиме і завжди редагується */}
            <View
              style={[
                styles.wordTextContainer,
                {backgroundColor: cOutputBg, borderColor: cOutputBorder},
              ]}>
              <Text style={[styles.cardLabel, {color: cLoadText}]}>
                {`Оригінал (${langLabel(srcLang)})`}
              </Text>
              <TextInput
                style={[styles.wordText, {color: cPageOn}]}
                value={originalText}
                onChangeText={text => {
                  setOriginalText(text);
                  // Якщо змінили текст після результату — скидаємо переклад
                  if (stage === STAGE.RESULT) {
                    setTranslatedText('');
                    setStage(STAGE.IDLE);
                  }
                }}
                multiline
                editable={isOriginalEditable}
                placeholder={
                  isRecording ? 'Слухаю...' : 'Введіть або скажіть фразу...'
                }
                placeholderTextColor={cLoadText}
              />
            </View>

            {/* Кнопка "Перекласти" — лише в ручному режимі */}
            {showTranslateBtn && (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.translateBtn,
                  {borderColor: cOutputBorder},
                ]}
                onPress={() => handleTranslate()}>
                <Text style={[styles.actionBtnText, {color: cPageOn}]}>
                  Перекласти
                </Text>
              </TouchableOpacity>
            )}

            {/* Поле перекладу */}
            {showTranslation && (
              <View
                style={[
                  styles.wordTextContainer,
                  {backgroundColor: cOutputBg, borderColor: cOutputBorder},
                ]}>
                <Text style={[styles.cardLabel, {color: cLoadText}]}>
                  {`Переклад (${langLabel(dstLang)})`}
                </Text>
                <View style={styles.translationRow}>
                  <Text style={[styles.wordText, {color: cPageOn, flex: 1}]}>
                    {translatedText}
                  </Text>
                  <TouchableOpacity
                    onPress={() => speakTranslation(translatedText)}
                    style={styles.playBtn}
                    accessibilityLabel="Озвучити переклад">
                    <FontAwesome name="volume-up" size={20} color={cPageOn} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* ── Кнопки дій ── */}
          {showActionButtons && (
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, {borderColor: cOutputBorder}]}
                onPress={deleteCurrentDialogue}>
                <Text style={[styles.actionBtnText, {color: cErrorOn}]}>
                  Видалити
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.saveBtn,
                  {borderColor: cOutputBorder},
                ]}
                onPress={saveCurrentDialogue}>
                <Text style={[styles.actionBtnText, {color: cPageOn}]}>
                  Зберегти ↗
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default TranslatorScreen;

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
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reverseIconWrap: {
    marginLeft: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },
  reverseIcon: {
    marginTop: 1,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
  settingLabelGroup: {
    flex: 1,
    marginRight: 8,
    flexDirection: 'row', // іконка і текстовий блок — поруч, в один рядок
    alignItems: 'center', // іконка вертикально по центру відносно тексту
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabelIcon: {
    marginRight: 6,
  },
  settingLabelTextCol: {
    alignItems: 'center', // а ось тут "Реверсний переклад" і хінт центруються
    // одне під одним — і лише вони, іконка сюди не входить
  },
  settingRowLabel: {fontSize: 14},
  settingRowHint: {fontSize: 11, marginTop: 1},
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
  startedContainer: {flex: 1, paddingHorizontal: 10},
  micSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    gap: 24,
  },
  pulseSmall: {
    position: 'absolute',
    width: 72, // було 55
    height: 72, // було 55
    borderRadius: 36,
  },
  micButtonSmall: {
    width: 56, // було 42
    height: 56, // було 42
    borderRadius: 28, // було 21
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  //   busyRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  busyRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  micRowSideIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  busyText: {fontSize: 12},
  cardsScroll: {flex: 1},
  cardsContent: {gap: 12, paddingVertical: 8},
  wordTextContainer: {
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 30,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 90,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 6,
  },
  cardLabel: {fontSize: 11, marginBottom: 6},
  wordText: {
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Poppins-Regular',
    lineHeight: 32,
  },
  translationRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    flexWrap: 'wrap',
  },
  actionBtn: {
    borderWidth: 2,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  translateBtn: {
    alignSelf: 'center',
  },
  saveBtn: {backgroundColor: 'rgba(255,209,26,0.2)'},
  actionBtnText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
  },
});
