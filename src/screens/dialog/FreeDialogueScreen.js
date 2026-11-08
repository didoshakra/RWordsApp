// screens/dialog/FreeDialogueScreen.js
// добав.
//
// Вільний діалог з AI — без прив'язки до уроку. Чат з бульбашками,
// видно всю історію розмови. М'які виправлення вплетені прямо в
// репліки AI (без окремого формату "виправлення/питання").
//
// STT/мікрофон — той самий підхід, що й в AIDialogueScreen.
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

import {SettingsContext} from '@/context/SettingsContext';

const useTheme = () => {
  const isDarkMode = useColorScheme() === 'dark';
  return {
    isDarkMode,
    cPageBorderBg: isDarkMode ? '#0e0e10' : '#eef0f3',
    cCardContainer: isDarkMode ? '#1c1c1f' : '#ffffff',
    cCardBorder: isDarkMode ? '#333' : '#ddd',
    cBubbleAiBg: isDarkMode ? '#26262a' : '#f7f7fa',
    cBubbleAiBorder: isDarkMode ? '#3a3a40' : '#dcdce2',
    cBubbleUserBg: 'rgba(255,209,26,0.25)',
    cBubbleUserBorder: '#ffd11a',
    cPageOn: isDarkMode ? '#f2f2f2' : '#1a1a1a',
    cLoadText: isDarkMode ? '#cfcfcf' : '#555',
    cErrorOn: '#e0524f',
    cStatusBarBg: isDarkMode ? '#0e0e10' : '#eef0f3',
  };
};

const API_BASE_URL = 'https://rwords.vercel.app/api';

const STAGE = {
  LOADING: 'loading',
  IDLE: 'idle',
  RECORDING: 'recording',
  RECOGNIZING: 'recognizing',
  READY_TO_SEND: 'ready_to_send',
  SENDING: 'sending',
};

const FreeDialogueScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const {settings} = useContext(SettingsContext);
  const enVoice = settings?.voiceByLanguage?.translateVoice1 ?? '';

  const [stage, setStage] = useState(STAGE.LOADING);
  const [messages, setMessages] = useState([]); // [{role, content}] — для рендеру
  const [userText, setUserText] = useState('');
  const [translations, setTranslations] = useState({}); // {msgIndex: translatedText}
  const [translatingIndex, setTranslatingIndex] = useState(null);

  const historyRef = useRef([]); // те саме, що messages, але для бекенду (без зайвих полів)
  const recorderRef = useRef(new AudioRecorderPlayer());
  const scrollRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  const isBusy =
    stage === STAGE.RECOGNIZING ||
    stage === STAGE.SENDING ||
    stage === STAGE.LOADING;
  const isRecording = stage === STAGE.RECORDING;

  // ── Перше повідомлення від AI ──
  useEffect(() => {
    fetchAIReply([], '');
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({animated: true});
  }, [messages, stage]);

  const speak = text => {
    Tts.stop();
    Tts.setDefaultLanguage('en-GB');
    if (enVoice) Tts.setDefaultVoice(enVoice);
    Tts.speak(text);
  };

  const fetchAIReply = async (history, userMessage) => {
    setStage(userMessage ? STAGE.SENDING : STAGE.LOADING);
    try {
      const res = await fetch(`${API_BASE_URL}/dialogue/free`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({history, userMessage}),
      });
      if (!res.ok) throw new Error(`Помилка: ${res.status}`);
      const data = await res.json();
      const reply = data.reply || '';

      const newHistory = [...history];
      if (userMessage) newHistory.push({role: 'user', content: userMessage});
      newHistory.push({role: 'assistant', content: reply});
      historyRef.current = newHistory;
      setMessages(newHistory);

      setUserText('');
      setStage(STAGE.IDLE);
      speak(reply);
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

  const translateMessage = async (text, index) => {
    setTranslatingIndex(index);
    try {
      const res = await fetch(`${API_BASE_URL}/translator/translate`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text, from: 'en-GB', to: 'uk-UA'}),
      });
      if (!res.ok) throw new Error(`Переклад помилка: ${res.status}`);
      const data = await res.json();
      setTranslations(prev => ({...prev, [index]: data.translation}));
    } catch (e) {
      Alert.alert('Помилка перекладу', e.message);
    } finally {
      setTranslatingIndex(null);
    }
  };

  const sendAnswer = () => {
    if (!userText.trim()) return;
    fetchAIReply(historyRef.current, userText.trim());
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
            Вільний діалог
          </Text>
          <TouchableOpacity onPress={finishDialogue}>
            <Text style={{color: theme.cPageOn, fontWeight: '600'}}>
              Завершити
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{flex: 1, paddingHorizontal: 14}}
          contentContainerStyle={{gap: 10, paddingVertical: 12}}>
          {messages.length === 0 && stage === STAGE.LOADING ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.cLoadText} />
            </View>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={idx}
                  style={[
                    styles.bubbleRow,
                    isUser
                      ? {alignItems: 'flex-end'}
                      : {alignItems: 'flex-start'},
                  ]}>
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? {
                            backgroundColor: theme.cBubbleUserBg,
                            borderColor: theme.cBubbleUserBorder,
                          }
                        : {
                            backgroundColor: theme.cBubbleAiBg,
                            borderColor: theme.cBubbleAiBorder,
                          },
                    ]}>
                    <Text
                      selectable
                      style={{
                        color: theme.cPageOn,
                        fontSize: 16,
                        lineHeight: 22,
                      }}>
                      {msg.content}
                    </Text>
                    {!isUser && (
                      <>
                        <TouchableOpacity
                          onPress={() => translateMessage(msg.content, idx)}
                          disabled={translatingIndex === idx}
                          style={styles.translateBtn}>
                          {translatingIndex === idx ? (
                            <ActivityIndicator
                              size="small"
                              color={theme.cLoadText}
                            />
                          ) : (
                            <Text
                              style={{color: theme.cLoadText, fontSize: 13}}>
                              Перекласти ↴
                            </Text>
                          )}
                        </TouchableOpacity>
                        {translations[idx] ? (
                          <Text
                            selectable
                            style={{
                              color: theme.cLoadText,
                              fontSize: 14,
                              lineHeight: 20,
                              marginTop: 6,
                            }}>
                            {translations[idx]}
                          </Text>
                        ) : null}
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}

          {stage === STAGE.SENDING && (
            <View style={styles.busyRowCentered}>
              <ActivityIndicator size="small" color={theme.cLoadText} />
              <Text style={[styles.busyText, {color: theme.cLoadText}]}>
                AI відповідає...
              </Text>
            </View>
          )}
        </ScrollView>

        {(stage === STAGE.READY_TO_SEND || userText) &&
          stage !== STAGE.SENDING && (
            <View style={{paddingHorizontal: 14}}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.cBubbleAiBg,
                    borderColor: theme.cBubbleAiBorder,
                  },
                ]}>
                <TextInput
                  style={{color: theme.cPageOn, fontSize: 16, lineHeight: 22}}
                  value={userText}
                  onChangeText={setUserText}
                  multiline
                  editable={stage === STAGE.READY_TO_SEND}
                  placeholder="Скажіть щось..."
                  placeholderTextColor={theme.cLoadText}
                />
              </View>
            </View>
          )}

        {/* Мікрофон + відправка */}
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
              style={[styles.sendBtn, {borderColor: theme.cBubbleAiBorder}]}
              onPress={sendAnswer}>
              <Text style={[styles.sendBtnText, {color: theme.cPageOn}]}>
                Відправити ↗
              </Text>
            </TouchableOpacity>
          )}
        </View>

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

export default FreeDialogueScreen;

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
  bubbleRow: {width: '100%'},
  bubble: {
    maxWidth: '85%',
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  inputContainer: {
    borderWidth: 2,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
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
});
