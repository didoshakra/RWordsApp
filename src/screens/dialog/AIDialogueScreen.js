//screens/dialog/AIDialogueScreen.js
//
// Крок "Діалог з AI". Формат: одне питання/відповідь за раз, без
// видимої історії на екрані (сама історія тримається в пам'яті й
// відправляється бекенду для зв'язності розмови).
//
// STT перевикористовує /api/translator/stt (той самий, що й Translator).
// Дозволяє поправити розпізнаний текст перед відправкою.
// Без ліміту обмінів — користувач сам тисне "Завершити".
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
  StatusBar,
  Platform,
  ScrollView,
  BackHandler,
  useColorScheme,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Tts from 'react-native-tts-export';
import {PERMISSIONS, request, check, RESULTS} from 'react-native-permissions';

import {openDatabase} from '@/db/dbConfig';
import {getWordsByLesson} from '@/db/lessons/lessonsActions';
import {SettingsContext} from '@/context/SettingsContext';

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

const STAGE = {
  LOADING: 'loading', // перше питання ще завантажується
  IDLE: 'idle', // AI-питання показано, чекаємо мікрофон
  RECORDING: 'recording',
  RECOGNIZING: 'recognizing',
  READY_TO_SEND: 'ready_to_send', // текст розпізнано, можна поправити
  SENDING: 'sending', // чекаємо відповідь AI
};

const AIDialogueScreen = ({route}) => {
  const {lessonId} = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const {settings} = useContext(SettingsContext);
  const ukVoice = settings?.voiceByLanguage?.originalVoice ?? '';
  const enVoice = settings?.voiceByLanguage?.translateVoice1 ?? '';

  const [stage, setStage] = useState(STAGE.LOADING);
  const [aiMessage, setAiMessage] = useState('');
  const [userText, setUserText] = useState('');
  const [aiCorrection, setAiCorrection] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [prevQuestion, setPrevQuestion] = useState('');
  const [pendingQuestion, setPendingQuestion] = useState(''); // нове питання, чекає підтвердження
  const [awaitingChoice, setAwaitingChoice] = useState(false); // показувати кнопки Повторити/Далі
  const pendingUserMessageRef = useRef(''); // репліка користувача, що чекає запису в історію
  const [questionTranslation, setQuestionTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [lessonContext, setLessonContext] = useState(null); // {rule, words}

  const historyRef = useRef([]); // [{role, content}] — не відображається, тільки для бекенду
  const recorderRef = useRef(new AudioRecorderPlayer());
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  const isBusy =
    stage === STAGE.RECOGNIZING ||
    stage === STAGE.SENDING ||
    stage === STAGE.LOADING;
  const isRecording = stage === STAGE.RECORDING;

  // ── Завантаження контексту уроку (правило + слова) і першого питання ──
  useEffect(() => {
    const load = async () => {
      try {
        const words = await getWordsByLesson(lessonId);
        const filteredWords = words.filter(
          w => w.type === 'word' || w.type === 'phrase',
        );

        const db = openDatabase();
        const lessonRow = await new Promise((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              `SELECT lessons.rule_id, levels.name AS level_name
                FROM lessons
                LEFT JOIN levels ON lessons.level_id = levels.id
                WHERE lessons.id = ?`,
              [lessonId],
              (_, res) =>
                resolve(res.rows.length > 0 ? res.rows.item(0) : null),
              (_, err) => {
                reject(err);
                return true;
              },
            );
          });
        });

        let rule = null;
        if (lessonRow?.rule_id) {
          rule = await new Promise((resolve, reject) => {
            db.transaction(tx => {
              tx.executeSql(
                'SELECT title, content_json FROM rules WHERE id = ?',
                [lessonRow.rule_id],
                (_, res) =>
                  resolve(res.rows.length > 0 ? res.rows.item(0) : null),
                (_, err) => {
                  reject(err);
                  return true;
                },
              );
            });
          });
        }

        const context = {
          rule,
          words: filteredWords,
          level: lessonRow.level_name,
        };
        setLessonContext(context);
        await fetchAIReply(context, [], '');
      } catch (e) {
        Alert.alert('Помилка завантаження уроку', e.message);
      }
    };
    load();
  }, [lessonId]);

  // Розбирає відповідь AI на {correction, question} по першому переносу рядка
  const splitReply = reply => {
    const lines = reply
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    return {
      correction: lines[0] || '',
      question: lines[1] || lines[0] || '',
    };
  };

  // Нова функція озвучки по черзі/Озвучує виправлення українською, потім (з невеликою паузою) питання англійською
  const speakSequence = (correction, question) => {
    Tts.stop();
    if (correction) {
      Tts.setDefaultLanguage('uk-UA');
      if (ukVoice) Tts.setDefaultVoice(ukVoice);
      Tts.speak(correction);
    }
    if (question) {
      const delay = correction ? estimateSpeechDuration(correction) : 0;
      setTimeout(() => {
        Tts.setDefaultLanguage('en-GB');
        if (enVoice) Tts.setDefaultVoice(enVoice);
        Tts.speak(question);
      }, delay);
    }
  };

  // Та сама оцінка тривалості, що й у Words.js
  const estimateSpeechDuration = text => {
    const words = text.trim().split(/\s+/).length;
    const baseDurationPerWord = 700;
    const adjustmentFactor = 0.05;
    const adjustedDurationPerWord =
      baseDurationPerWord * (1 - adjustmentFactor * Math.log10(words + 1));
    return Math.max(words * adjustedDurationPerWord, 500);
  };

  // ── Запит до бекенду ──
  const fetchAIReply = async (context, history, userMessage) => {
    setStage(userMessage ? STAGE.SENDING : STAGE.LOADING);
    try {
      const res = await fetch(`${API_BASE_URL}/lesson/dialogue`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          rule: context.rule,
          words: context.words,
          level: context.level,
          history,
          userMessage,
        }),
      });
      if (!res.ok) throw new Error(`Помилка: ${res.status}`);
      const data = await res.json();
      const reply = data.reply || '';

      const newHistory = [...history];
      if (userMessage) newHistory.push({role: 'user', content: userMessage});
      newHistory.push({role: 'assistant', content: reply});
      historyRef.current = newHistory;

      const {correction, question} = splitReply(reply);
      const isCorrect = correction.trim().toLowerCase() === 'добре';

      setAiCorrection(correction);
      setQuestionTranslation('');
      setUserText('');
      setStage(STAGE.IDLE);

      if (isCorrect || !aiQuestion) {
        // Правильна відповідь (або перше питання) — записуємо в історію одразу
        if (userMessage)
          historyRef.current.push({role: 'user', content: userMessage});
        historyRef.current.push({
          role: 'assistant',
          content: `${correction}\n${question}`,
        });

        setAiQuestion(question);
        setPrevQuestion(question);
        setAwaitingChoice(false);
        speakSequence(correction, question);
      } else {
        // Неправильна відповідь — запис в історію ВІДКЛАДАЄМО до вибору користувача
        pendingUserMessageRef.current = userMessage;
        setPendingQuestion(question);
        setAwaitingChoice(true);
        speakSequence(correction, '');
      }
    } catch (e) {
      Alert.alert('Помилка діалогу', e.message);
      setStage(STAGE.IDLE);
    }
  };

  // ── Пульсація мікрофона ──
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

  // ── Вихід ──
  const handleExit = () => {
    navigation.goBack();
  };

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        handleExit();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
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

  const startRecording = async () => {
    const ok = await ensureMicPermission();
    if (!ok) {
      Alert.alert(
        'Потрібен дозвіл',
        'Дозвольте доступ до мікрофона в налаштуваннях.',
      );
      return;
    }
    setUserText('');
    setStage(STAGE.RECORDING);
    try {
      recorderRef.current = new AudioRecorderPlayer();
      await recorderRef.current.startRecorder(undefined, undefined, true);
    } catch (e) {
      Alert.alert('Помилка запису', e.message);
      setStage(STAGE.IDLE);
    }
  };

  const stopRecording = async () => {
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
      setUserText(text);
      setStage(STAGE.READY_TO_SEND);
    } catch (e) {
      Alert.alert('Помилка розпізнавання', e.message);
      setStage(STAGE.IDLE);
    }
  };

  const onMicPress = () => {
    if (isRecording) stopRecording();
    else if (!isBusy) startRecording();
  };

  const recognizeSpeech = async filePath => {
    const formData = new FormData();
    formData.append('audio', {
      uri: Platform.OS === 'android' ? `file://${filePath}` : filePath,
      type: 'audio/m4a',
      name: 'voice.m4a',
    });
    formData.append('language', 'en-GB');
    const res = await fetch(`${API_BASE_URL}/translator/stt`, {
      method: 'POST',
      headers: {'Content-Type': 'multipart/form-data'},
      body: formData,
    });
    if (!res.ok) throw new Error(`STT помилка: ${res.status}`);
    const data = await res.json();
    return data.text;
  };

  //Функція перекладу питання
  const translateQuestion = async () => {
    if (!aiQuestion) return;
    setIsTranslating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/translator/translate`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: aiQuestion, from: 'en-GB', to: 'uk-UA'}),
      });
      if (!res.ok) throw new Error(`Переклад помилка: ${res.status}`);
      const data = await res.json();
      setQuestionTranslation(data.translation);
    } catch (e) {
      Alert.alert('Помилка перекладу', e.message);
    } finally {
      setIsTranslating(false);
    }
  };

  const repeatQuestion = () => {
    historyRef.current.push({
      role: 'user',
      content: pendingUserMessageRef.current,
    });
    historyRef.current.push({
      role: 'assistant',
      content: `${aiCorrection}\n${prevQuestion}`,
    });

    setAwaitingChoice(false);
    speakOnly(prevQuestion);
  };

  const proceedToNextQuestion = () => {
    historyRef.current.push({
      role: 'user',
      content: pendingUserMessageRef.current,
    });
    historyRef.current.push({
      role: 'assistant',
      content: `${aiCorrection}\n${pendingQuestion}`,
    });

    setAiQuestion(pendingQuestion);
    setPrevQuestion(pendingQuestion);
    setAwaitingChoice(false);
    speakOnly(pendingQuestion);
  };

  // Озвучує тільки питання англійською (для "Повторити"/"Далі", без виправлення)
  const speakOnly = question => {
    Tts.stop();
    if (!question) return;
    Tts.setDefaultLanguage('en-GB');
    if (enVoice) Tts.setDefaultVoice(enVoice);
    Tts.speak(question);
  };

  const sendAnswer = () => {
    if (!userText.trim() || !lessonContext) return;
    fetchAIReply(lessonContext, historyRef.current, userText.trim());
  };

  const finishDialogue = () => {
    navigation.goBack();
  };

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: theme.cPageBorderBg,
      }}>
      <StatusBar
        barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.cStatusBarBg}
      />
      <View
        style={[
          styles.pageContainer,
          {
            backgroundColor: theme.cCardContainer,
            borderColor: theme.cCardBorder,
          },
        ]}>
        {/* Шапка */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleExit}>
            <Ionicons name="arrow-back" size={22} color={theme.cPageOn} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: theme.cPageOn}]}>
            Діалог з AI
          </Text>
          <TouchableOpacity onPress={finishDialogue}>
            <Text style={{color: theme.cPageOn, fontWeight: '600'}}>
              Завершити
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{flex: 1, paddingHorizontal: 14}}
          contentContainerStyle={{gap: 16, paddingVertical: 12}}>
          {/* заміна єдиної картки на дві */}
          {stage === STAGE.LOADING && !aiQuestion ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.cLoadText} />
            </View>
          ) : (
            <>
              {aiCorrection && (
                <View
                  style={[
                    styles.wordTextContainer,
                    {
                      backgroundColor: theme.cOutputBg,
                      borderColor: theme.cOutputBorder,
                    },
                  ]}>
                  <Text style={[styles.cardLabel, {color: theme.cLoadText}]}>
                    Виправлення
                  </Text>
                  <Text
                    selectable
                    style={[styles.wordText, {color: theme.cPageOn}]}>
                    {aiCorrection}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.wordTextContainer,
                  {
                    backgroundColor: theme.cOutputBg,
                    borderColor: theme.cOutputBorder,
                  },
                ]}>
                <Text style={[styles.cardLabel, {color: theme.cLoadText}]}>
                  Питання
                </Text>
                <Text
                  selectable
                  style={[styles.wordText, {color: theme.cPageOn}]}>
                  {aiQuestion}
                </Text>
                <TouchableOpacity
                  onPress={translateQuestion}
                  disabled={isTranslating}
                  style={styles.translateBtn}>
                  {isTranslating ? (
                    <ActivityIndicator size="small" color={theme.cLoadText} />
                  ) : (
                    <Text style={{color: theme.cLoadText, fontSize: 13}}>
                      Перекласти ↴
                    </Text>
                  )}
                </TouchableOpacity>
                {questionTranslation ? (
                  <Text
                    selectable
                    style={[
                      styles.wordText,
                      {color: theme.cLoadText, fontSize: 15, marginTop: 6},
                    ]}>
                    {questionTranslation}
                  </Text>
                ) : null}
              </View>
              {awaitingChoice && (
                <View style={styles.choiceRow}>
                  <TouchableOpacity
                    style={[
                      styles.choiceBtn,
                      {borderColor: theme.cOutputBorder},
                    ]}
                    onPress={repeatQuestion}>
                    <Text style={{color: theme.cPageOn, fontWeight: '600'}}>
                      Повторити
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.choiceBtn,
                      styles.choiceBtnPrimary,
                      {borderColor: theme.cOutputBorder},
                    ]}
                    onPress={proceedToNextQuestion}>
                    <Text style={{color: theme.cPageOn, fontWeight: '600'}}>
                      Далі
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {stage === STAGE.SENDING && (
            <View style={styles.busyRowCentered}>
              <ActivityIndicator size="small" color={theme.cLoadText} />
              <Text style={[styles.busyText, {color: theme.cLoadText}]}>
                AI відповідає...
              </Text>
            </View>
          )}

          {(stage === STAGE.READY_TO_SEND || userText) &&
            stage !== STAGE.SENDING && (
              <View
                style={[
                  styles.wordTextContainer,
                  {
                    backgroundColor: theme.cOutputBg,
                    borderColor: theme.cOutputBorder,
                  },
                ]}>
                <Text style={[styles.cardLabel, {color: theme.cLoadText}]}>
                  Твоя відповідь
                </Text>
                <TextInput
                  style={[styles.wordText, {color: theme.cPageOn}]}
                  value={userText}
                  onChangeText={setUserText}
                  multiline
                  editable={stage === STAGE.READY_TO_SEND}
                  placeholder="Скажіть відповідь..."
                  placeholderTextColor={theme.cLoadText}
                />
              </View>
            )}
        </ScrollView>

        {/* Мікрофон + відправка */}
        {!awaitingChoice && (
          <View style={styles.micSmallRow}>
            <Animated.View
              style={[
                styles.pulseSmall,
                {
                  backgroundColor: theme.cErrorOn,
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
                {backgroundColor: isRecording ? theme.cErrorOn : '#ffd11a'},
              ]}
              accessibilityLabel={
                isRecording ? 'Зупинити запис' : 'Записати відповідь'
              }>
              <FontAwesome
                name={isRecording ? 'microphone' : 'microphone-slash'}
                size={20}
                color="#1a1a1a"
              />
            </TouchableOpacity>

            {stage === STAGE.READY_TO_SEND && (
              <TouchableOpacity
                style={[styles.sendBtn, {borderColor: theme.cOutputBorder}]}
                onPress={sendAnswer}>
                <Text style={[styles.sendBtnText, {color: theme.cPageOn}]}>
                  Відправити ↗
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {stage === STAGE.RECOGNIZING && (
          <View style={styles.busyRowCentered}>
            <ActivityIndicator size="small" color={theme.cLoadText} />
            <Text style={[styles.busyText, {color: theme.cLoadText}]}>
              Розпізнаю...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default AIDialogueScreen;

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
  headerTitle: {fontSize: 16, fontWeight: '600'},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  wordTextContainer: {
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 80,
  },
  cardLabel: {fontSize: 11, marginBottom: 6},
  wordText: {fontSize: 20, lineHeight: 28},
  micSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    gap: 16,
  },
  pulseSmall: {position: 'absolute', width: 72, height: 72, borderRadius: 36},
  micButtonSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  sendBtn: {
    borderWidth: 2,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,209,26,0.2)',
  },
  sendBtnText: {fontSize: 14, fontWeight: '600'},
  busyRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  busyText: {fontSize: 12},
  translateBtn: {marginTop: 8, alignSelf: 'flex-start'},
  choiceRow: {flexDirection: 'row', gap: 10, marginTop: 12},
  choiceBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 100,
    paddingVertical: 10,
    alignItems: 'center',
  },
  choiceBtnPrimary: {backgroundColor: 'rgba(255,209,26,0.2)'},
});
