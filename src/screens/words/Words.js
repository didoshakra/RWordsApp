// Words.js/250507з WordsPause/Роб:з БД/Озвучка з перекладу/Постійно і непостійно по опції?

import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  BackHandler,
  ToastAndroid,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Tts from 'react-native-tts-export';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar

//
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';

// import RTopBar from '@/components/main/RTopBar';
// import RBotBar from '@/components/main/RBotBar';
import {ThemeContext} from '@/context/ThemeContext';
import {SettingsContext} from '@/context/SettingsContext';

// import WordsHeadRight from './WordsHeadRight';
import {useVoskControl} from '@/vosk/VoskControl';
import VoskCommandsModal from '@/vosk/VoskCommandsModal';
// import {imageMap} from '@/constants/words/imageMap'; 

import ListenWordsSettingsModal from '@/components/settings/listen_words/ListenWordsSettingsModal';
import {openDatabase} from '@/db/dbConfig';
import TopicsModal from './TopicsModal';
import KnowFilterModal from '@/components/settings/listen_words/KnowFilterModal';
import WordsHelpModal from './WordsHelpModal';
import WordsPlayer from './WordsPlayer';
import WordsMenu from './WordsMenu';

// Tts.setDefaultRate(0.4); //Темп мовлення(по замовчуванню 0.5)
// Tts.setDefaultPitch(1.0); //Тембр голосу(по замовчуванню 1.0)

const Words = ({
  lessonId,
  wordTypeFilter: wordTypeFilterProp,
  embedded = false,
}) => {
  // Перевір, які голоси доступні
  //   Tts.voices().then(voices => {
  //     console.log('Available voices:', voices);
  //   });
  const {height, width} = useWindowDimensions();
  const isLandscape = width > height;
  // ✅ Обчислення напрямку layout тільки при зміні isLandscape
  //   const flexDir = isLandscape ? 'row' : 'column';
  const flexDir = useMemo(
    () => (isLandscape ? 'row' : 'column'),
    [isLandscape],
  );

  const insets = useSafeAreaInsets(); //Верхнє Viev
  const navigation = useNavigation();
  const [untranslatedCount, setUntranslatedCount] = useState(0); //Кількість не перекладених слів
  const [wordData, setWordData] = useState([]); //Для переміщення по списку
  const [wordIndex, setWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false); //Для показу перекладу з затримкою після того як відтворився оригінальний текст
  const [isStarted, setIsStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [repeatTrigger, setRepeatTrigger] = useState(0); //Треба додати примусовий тригер repeat:

  // ⛔ Було useState — стало useRef, бо значення не впливає на рендеринг
  const isVoiceCommandRef = useRef(''); //Для засвітки яка команда була визначеня
  const timerRef = useRef(null);
  //
  const wordStartTimeRef = useRef(null); //для визначення куди відносити 'знаю/не знаю'
  //   const [isKnownEffect, setIsKnownEffect] = useState(2); //локальний стан для ефекту "я знаю"
  const lastKnowRef = useRef(false); //Функція визначення попереднє чи текучий слово
  const lastKnowTimerRef = useRef(null); //Для скидання значення lastKnowRef у false
  const [modalVisible, setModalVisible] = useState(false); //Вікно голосових команд
  //
  const [isSettingsModal, setIsSettingsModal] = useState(false);
  const [lessonTopics, setLessonTopics] = useState([]); // topic_id з lesson_topics (лише для embedded-режиму уроку)
  const [lessonTopicsLoaded, setLessonTopicsLoaded] = useState(false);
  const defaultImage = require('../../assets/WordOnClauds.jpg');

  // ── Вихід з екрана ──
  const handleExit = () => {
    navigation.goBack();
  };

  // ===== ЖЕСТИ =====
  const SWIPE_THRESHOLD = 50;

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onEnd(e => {
      if (!isStarted) return;
      const {translationX, translationY} = e;

      if (Math.abs(translationX) > Math.abs(translationY)) {
        // горизонтальний свайп
        if (translationX > SWIPE_THRESHOLD) handleCommand('back');
        else if (translationX < -SWIPE_THRESHOLD) handleCommand('next');
      } else {
        // вертикальний свайп
        // if (translationY < -SWIPE_THRESHOLD) handleCommand('prev_topic');
        // else if (translationY > SWIPE_THRESHOLD) handleCommand('next_topic');
        if (translationY < -SWIPE_THRESHOLD) handleCommand('next_topic');
        else if (translationY > SWIPE_THRESHOLD) handleCommand('prev_topic');
      }
    });

  // Жест для картки оригіналу
  const tapOriginal = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(250)
    .onEnd(() => {
      if (!isStarted) return;
      handleCommand('know');
    });

  const doubleTapOriginal = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .maxDuration(250)
    .onEnd(() => {
      if (!isStarted) return;
      handleCommand('repeat');
    });

  const originalGesture = Gesture.Exclusive(doubleTapOriginal, tapOriginal);

  // Жест для картки перекладу
  const tapTranslation = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      if (!isStarted) return;
      handleCommand('dont_know');
    });

  //   Колір
  const {colors, sizes, isDarkMode, getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(1);
  const tc = colors;

  const cTopBarBg = scheme.pageBg;
  const cTopBarOn = scheme.pageOn;

  const cStatusBarBg = scheme.pageBg;
  const cStatusBarOn = scheme.pageOn;
  const cPageBorderBg = scheme.pageBg;

  const cBotBarBg = scheme.pageBg;
  const cBotBarOn = scheme.pageOn;
  const cBotBarIconBgAct = scheme.iconTbBgAct;
  const cBotBarIconOnAct = scheme.iconTbOnAct;

  const cPageBg = scheme.pageBg; //Bg колір сторінки
  const cPageOn = scheme.pageOn;

  const cCardContainer = scheme.cardBg;
  const cCardBorder = scheme.cardBorder; //Bg колір сторінки
  const cCardHeadBg = scheme.cardBg;
  const cPageHeadOn = scheme.headerOn;

  const cModalBg = scheme.modalBg;
  const cModalOn = scheme.modalOn;

  const cOutputBg = scheme.inputBg;
  const cOutputBorder = scheme.border;
  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;
  const cBtnBorder = scheme.border;
  const cKnownText = tc.successOn;
  const cLoadText = tc.darkDM;
  const cErrorOn = tc.errorOn;
  const cTopicName = tc.headerOn;

  //   changeNavigationBarColor(cPageBorderBg, !isDarkMode); //колір Navigation Bar , true - світлі іконки
  //переніс в UseEffect
  // ✅ Navigation bar color — тільки при зміні теми або кольору
  useEffect(() => {
    changeNavigationBarColor(cPageBorderBg, !isDarkMode);
  }, [cPageBorderBg, isDarkMode]);

  const sPageHeadIcon = sizes.sPageHeadIcon;
  const sBtnFontSize = sizes.sBtnFontSm;

  const buttonColorStyle = {backgroundColor: cBtnBg, borderColor: cBtnBorder};
  const buttonTextStyle = {
    color: cBtnText,
    fontSize: sBtnFontSize,
    fontFamily: 'Poppins-Medium',
  };
  // Settings(налаштування вибору тем слів,знань,пауз,)
  const {settings, setSettings} = useContext(SettingsContext);
  // console.log('Words.js: settings=', settings);
  const delayOriginal = settings?.delayOriginal ?? 2000; // пауза після оригіналу
  const delayTranslation1 = settings?.delayTranslation1 ?? 1000; // пауза після 1-го перекладу
  const delayTranslation2 = settings?.delayTranslation2 ?? 1000; // пауза після повтору перекладу
  const delayVoiceCommand = settings?.delayVoiceCommand ?? 1000; // Затримка роспізнавання голосової команди
  const selectedTopics =
    embedded && lessonId ? lessonTopics : settings?.selectedTopics ?? []; // Всі теми/[3,5]-Тема 3,5
  const knowFilter = settings?.knowFilter ?? '*'; // '*', '0', або '1' — тимчасове значення
  const translateWord = settings?.translateWord ?? true; // показувати переклад
  const enableRepeatTranslation = settings?.enableRepeatTranslation ?? true; // повторювати переклад
  const stopBetweenTranslation = settings?.stopBetweenTranslation ?? false; // зупинка після перекладу
  const showImg = settings?.showImg ?? true; // показувати картинку слова
  const fromLanguage = settings?.fromLanguage ?? 'uk-UA'; //мова оригіналу
  const toLanguage = settings?.toLanguage ?? 'en-GB'; //мова перекладу
  const startOfWordList = settings?.startOfWordList ?? 'Початок списку слів'; //мова перекладу
  const endOfWordList = settings?.endOfWordList ?? 'Кінець списку слів'; //мова перекладу
  const lastWordIndex = settings?.lastWordIndex ?? 0; // індекс останнього слова
  const originalVoice = settings?.voiceByLanguage?.originalVoice ?? ''; // індекс голосу оригіналу
  const translateVoice1 = settings?.voiceByLanguage?.translateVoice1 ?? ''; // індекс голосу перекладу 1
  const translateVoice2 = settings?.voiceByLanguage?.translateVoice2 ?? ''; // індекс голосу перекладу 2
  const reverseOrder = settings?.reverseOrder ?? false; //для зміни послідовності відтворення (оигінал/переклад)
  const wordTypeFilter = embedded
    ? wordTypeFilterProp ?? []
    : settings?.wordTypeFilter ?? [];

  const buttonList = [
    {
      command: 'start',
      label: '↺ Почати',
      visible: !isRunning && !isStarted && wordData.length > 0,
    },
    {
      command: 'continue',
      label: '▶️ Продовжити',
      visible:
        lastWordIndex > -1 && !isRunning && !isStarted && wordData.length > 0,
    },
    {
      command: isRunning ? 'stop' : 'resume',
      label: isRunning ? '⛔ Стоп' : '▶️ Старт',
      visible: isStarted,
    },
    {
      command: 'repeat',
      label: '🔄 Повторити',
      visible: isStarted,
    },
  ];

  //   Для пульсації фону мікрофону
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  const pulseAnimation = useRef(null);
  const size = 80;
  const color = 'blue';
  const iconColor = 'blue';

  // 🔄 Завантаження слів з БД
  const loadWords = () => {
    if (!selectedTopics || selectedTopics.length === 0) {
      setWordData([]);
      setUntranslatedCount(0); // 👈 додаємо
      return;
    }

    openDatabase().transaction(txn => {
      let baseQuery = `
      FROM words
      JOIN topics ON words.topic_id = topics.id
      JOIN sections ON topics.section_id = sections.id
    `;

      const conditions = [];
      const params = [];

      // 🟢 Фільтр по темах
      const placeholders = selectedTopics.map(() => '?').join(',');
      conditions.push(`words.topic_id IN (${placeholders})`);
      params.push(...selectedTopics.map(id => Number(id)));

      // 🟢 Фільтр по know
      if (knowFilter === '0' || knowFilter === '1') {
        conditions.push(`words.know = ?`);
        params.push(parseInt(knowFilter, 10));
      }

      // 🟢 Фільтр по типах слів
      if (wordTypeFilter && wordTypeFilter.length > 0) {
        const typePlaceholders = wordTypeFilter.map(() => '?').join(',');
        conditions.push(`words.type IN (${typePlaceholders})`);
        params.push(...wordTypeFilter);
      }
      // Додаємо WHERE якщо є умови
      let whereClause =
        conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

      // 🔹 Запит для основних слів
      let query = `
      SELECT
        words.*,
        topics.name AS topic_name,
        topics.pn AS topic_pn
      ${baseQuery}
      ${whereClause}
      ORDER BY sections.pn ASC,topics.pn ASC, words.pn ASC, words.id ASC
    `;

      txn.executeSql(
        query,
        params,
        (_, res) => {
          const words = [];
          for (let i = 0; i < res.rows.length; i++) {
            words.push(res.rows.item(i));
          }
          setWordData(words);

          // Перевірка lastWordIndex
          const idx = findWordIndexById(words, lastWordIndex);
          if (idx === -1) {
            setSettings(prev => ({
              ...prev,
              lastWordIndex: -1,
            }));
          }
        },
        (_, error) => {
          console.log('❌ Помилка вибірки слів:', error);
        },
      );

      // 🔹 Додатковий COUNT для неперекладених
      let countQuery = `
      SELECT COUNT(*) as cnt
      ${baseQuery}
      ${whereClause} AND (words.translation IS NULL OR words.translation = '')
    `;

      txn.executeSql(countQuery, params, (_, res) => {
        const count = res.rows.item(0).cnt;
        setUntranslatedCount(count); // 👈 треба створити useState
        // console.log('🟡 Неперекладених:', count);
      });
    });
  };

  // 🎓 У режимі уроку підтягуємо теми з lesson_topics замість ручного вибору
  useEffect(() => {
    if (!embedded || !lessonId) return;
    openDatabase().transaction(tx => {
      tx.executeSql(
        'SELECT topic_id FROM lesson_topics WHERE lesson_id = ?',
        [lessonId],
        (_, res) => {
          const ids = [];
          for (let i = 0; i < res.rows.length; i++) {
            ids.push(res.rows.item(i).topic_id);
          }
          setLessonTopics(ids);
          setLessonTopicsLoaded(true);
        },
        (_, error) => {
          console.log('❌ Помилка читання lesson_topics:', error);
          setLessonTopicsLoaded(true);
        },
      );
    });
  }, [embedded, lessonId]);

  // ефект скидання плеєра при зміні вкладки (щоб автостарт коректно спрацьовував щоразу):
  useEffect(() => {
    if (!embedded) return;
    setIsStarted(false);
    setIsRunning(false);
    setWordIndex(0);
    setShowTranslation(false);
  }, [wordTypeFilter, embedded]);

  // Знайти індекс наступної теми
  const nextTopicIndex = () => {
    // console.log('words/nextTopic');
    if (!wordData || wordData.length === 0) return -1;

    const currentTopicId = wordData[wordIndex]?.topic_id;
    if (currentTopicId == null) return -1;

    for (let i = wordIndex + 1; i < wordData.length; i++) {
      if (wordData[i].topic_id !== currentTopicId) {
        return i; // перше слово іншої теми
      }
    }
    return -1; // немає наступної теми
  };

  //Перейти до наступної теми
  const nextTopic = () => {
    const nextTopicI = nextTopicIndex();
    if (nextTopicI !== -1) {
      setWordIndex(nextTopicI);
    } else {
      ToastAndroid.show(endOfWordList, ToastAndroid.LONG);
      speak(endOfWordList, fromLanguage);
      setVoiceCommand('stop'); //Скидання показу команди
      setIsRunning(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };
  //Перейти до попередньої теми
  const prevTopic = () => {
    if (!wordData || wordData.length === 0) return;

    const currentTopicId = wordData[wordIndex]?.topic_id;
    if (currentTopicId == null) return;

    for (let i = wordIndex - 1; i >= 0; i--) {
      if (wordData[i].topic_id !== currentTopicId) {
        // знайшли іншу тему — тепер знаходимо її перше слово
        const prevTopicId = wordData[i].topic_id;
        const firstIndex = wordData.findIndex(w => w.topic_id === prevTopicId);
        setWordIndex(firstIndex);
        return;
      }
    }
    // якщо не знайшли — початок списку
    ToastAndroid.show(startOfWordList, ToastAndroid.LONG);
    speak(startOfWordList, fromLanguage);
  };

  const getImageSource = () => {
    const word = wordData[wordIndex];

    if (!word || !word.img) {
      return {source: defaultImage, isDefault: true};
    }

    if (word.img.startsWith('http')) {
      return {source: {uri: word.img}, isDefault: false};
    }

    // Локальний файл — нативні асети Android (asset:/...), завжди .jpg
    return {source: {uri: `asset:/${word.img}.jpg`}, isDefault: false};
  };

  const imageData = getImageSource();

  // Повертає індекс слова у масиві wordData по id, або 0 якщо не знайдено
  function findWordIndexById(data, id) {
    return data.findIndex(item => item.id === id);
  }

  //Скидання показу команди
  const setVoiceCommand = cmd => {
    isVoiceCommandRef.current = cmd;
    setTimeout(() => {
      isVoiceCommandRef.current = '';
    }, 4000); //4 сек
  };

  //Всі Команди
  const handleCommand = command => {
    switch (command) {
      case 'start': // 🧠 Почати з 0
        if (wordData.length === 0) return;
        setVoiceCommand('start');
        setIsStarted(true);
        setIsRunning(true);
        setWordIndex(0);
        setShowTranslation(false);
        // setIsKnownEffect(2); // для ефекту "я знаю"
        // setSettings(prev => ({
        //   ...prev,
        //   lastWordIndex: wordData[wordIndex]?.id ?? -1, // якщо wordIndex валідний
        // }));
        break;
      case 'continue': //▶️ Продовжити
        if (wordData.length === 0) return;
        setVoiceCommand('continue');
        setIsStarted(true);
        setIsRunning(true);
        // console.log(
        //   'Words.js/handleCommand/start/continue/idx=',
        //   lastWordIndex,
        // );
        const idx = findWordIndexById(wordData, lastWordIndex);
        // console.log('Words.js/handleCommand/start/continue/idx=', idx);
        setWordIndex(idx > -1 ? idx : 0); // якщо не знайшли, почати з першого слова
        setShowTranslation(false);

        break;
      case 'exit': // 🔚Вийти
        if (!isStarted) return; //Вихід
        setVoiceCommand('exit'); //Скидання показу команди
        stopAll(); // ⛔ зупиняє: голос, цикл, таймери, пульсацію
        navigation.goBack();
        setSettings(prev => ({
          ...prev,
          lastWordIndex: wordData[wordIndex]?.id ?? -1, // якщо wordIndex валідний
        }));
        stopSpeak(); // викликаємо функцію переходу назад
        break;
      case 'to_begin': //   🧠 На початок
        if (!isStarted) return; //Вихід
        // isVoiceCommandRef.current = 'to_begin';
        setVoiceCommand('to_begin'); //Скидання показу команди
        setIsStarted(false);
        setIsRunning(false);
        setSettings(prev => ({
          ...prev,
          lastWordIndex: wordData[wordIndex]?.id ?? -1, // якщо wordIndex валідний
        }));
        // setWordIndex(0);
        setShowTranslation(false);
        stopSpeak(); // викликаємо функцію переходу назад
        break;

      case 'stop': // 🛑 Стоп
        if (!isStarted) return; //Вихід
        // isVoiceCommandRef.current = 'stop';
        setVoiceCommand('stop'); //Скидання показу команди
        if (timerRef.current) clearTimeout(timerRef.current); // Очистити таймер
        setIsRunning(false);
        stopSpeak(); // викликаємо функцію переходу назад

        break;

      case 'next': // ⏭️ Далі після Стоп
        if (!isStarted) return; //Вихід
        // isVoiceCommandRef.current = 'next';
        setVoiceCommand('next'); //Скидання показу команди
        setIsRunning(true);
        nextWord();
        break;

      case 'repeat':
        if (!isStarted) return;
        setVoiceCommand('repeat');
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowTranslation(false);
        setIsRunning(false); // спочатку вимикаємо
        setTimeout(() => {
          setIsRunning(true); // потім вмикаємо — useEffect спрацює
        }, 50);
        break;

      case 'back': // ⏭️ Назад iз stop
        if (!isStarted) return; //Вихід
        // isVoiceCommandRef.current = 'back';
        setVoiceCommand('back'); //Скидання показу команди
        setIsRunning(false);
        if (timerRef.current) clearTimeout(timerRef.current);
        backWord(); // викликаємо функцію переходу назад
        break;

      case 'know': // ✅ Знаю
        if (!isStarted) return; //Вихід
        // isVoiceCommandRef.current = 'know';
        setVoiceCommand('know'); //Скидання показу команди
        getCommandRelatedIndex(); //Функція визначення попереднє чи текуче слово
        updateWord(1); //Зміна в БД
        nextWord();
        break;

      case 'dont_know': // ❌ Не знаю
        if (!isStarted) return; //Вихід
        // isVoiceCommandRef.current = 'dont_know';
        setVoiceCommand('dont_know'); //Скидання показу команди
        getCommandRelatedIndex(); //Функція визначення попереднє чи текуче слово
        updateWord(0); //Зміна в БД
        break;
      case 'next_topic': // // наступна тема
        if (!isStarted) return; //Вихід
        setVoiceCommand('next_topic'); //Скидання показу команди
        setIsRunning(true);
        nextTopic();
        break;
      case 'prev_topic': // попередня тема
        if (!isStarted) return; //Вихід
        setVoiceCommand('prev_topic'); //Скидання показу команди
        setIsRunning(true);
        prevTopic(); //Попередня тема
        break;
      case 'resume': //▶️ Старт
        if (!isStarted) return;
        setVoiceCommand('resume');
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsRunning(true);
        setShowTranslation(false);
        break;

      default:
        console.log('handleCommand: невідома команда', command);
    }
  };
  /******************************** */
  // 🎓 Автозапуск у режимі уроку — одразу після завантаження слів
  useEffect(() => {
    if (embedded && !isStarted && wordData.length > 0) {
      handleCommand('start');
    }
  }, [embedded, wordData]);

  const updateWord = knowValue => {
    const index = lastKnowRef.current ? wordIndex - 1 : wordIndex;
    const word = wordData[index];
    // console.log('updateWord:', {index, word, knowValue});
    if (!word) return;

    openDatabase().transaction(tx => {
      tx.executeSql(
        'UPDATE words SET know = ? WHERE id = ?',
        [knowValue, word.id],
        () => console.log(`Оновлено текст ${word.id}: know = ${knowValue}`),
        (_, error) => console.log('Помилка оновлення:', error),
      );
    });
  };

  //== Допоміжні =======================
  //   Оновлена функція оцінки тривалості озвучення:
  const estimateSpeechDuration = text => {
    const words = text.trim().split(/\s+/).length;
    const baseDurationPerWord = 700; // базова тривалість на слово в мілісекундах
    const adjustmentFactor = 0.05; // коефіцієнт корекції для зменшення тривалості при збільшенні кількості слів

    // Обчислення скоригованої тривалості на слово
    const adjustedDurationPerWord =
      baseDurationPerWord * (1 - adjustmentFactor * Math.log10(words + 1));

    // Загальна оцінка тривалості
    return Math.max(words * adjustedDurationPerWord, 500); // мінімальна тривалість 500 мс
  };

  //Ф-ція визначення шрифта в полі виводу від к-сті слів
  const getFontSize = text => {
    if (!text) return 26;
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount >= 10) return 18;
    if (wordCount <= 3) return 34;
    return 22; // середнє
  };

  //Функція визначення попереднє чи текуче слово до якого треба віднести розпізнану головову команду(мінус затримка)
  // Скидання lastKnowRef.current = false;
  const getCommandRelatedIndex = () => {
    const now = Date.now();
    const t0 = wordStartTimeRef.current;
    const delta = now - t0;
    // const threshold = 2000; // 2 секунди

    if (delta < delayVoiceCommand) {
      // Встановлюємо true і запускаємо таймер скидання
      if (!lastKnowRef.current) {
        lastKnowRef.current = true;

        // Якщо раніше був таймер, очистимо його
        if (lastKnowTimerRef.current) {
          clearTimeout(lastKnowTimerRef.current);
        }

        lastKnowTimerRef.current = setTimeout(() => {
          lastKnowRef.current = false;
          lastKnowTimerRef.current = null;
          // Тут можна викликати функцію оновлення інтерфейсу, якщо треба
        }, delayVoiceCommand);
      }
    } else {
      // Якщо час перевищено - скидаємо в false і очищуємо таймер
      lastKnowRef.current = false;
      if (lastKnowTimerRef.current) {
        clearTimeout(lastKnowTimerRef.current);
        lastKnowTimerRef.current = null;
      }
    }
  };

  // Велика перша буква у виразі
  function capitalizeFirstLetter(str) {
    return str[0].toUpperCase() + str.slice(1);
  }

  //===  //Для пульсації фону мікрофона
  const startPulse = () => {
    // зупиняємо попередню
    pulseAnimation.current?.stop();

    // створюємо нову
    const newAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulseAnimation.current = newAnimation;
    newAnimation.start();
  };

  const stopPulse = () => {
    if (pulseAnimation.current) {
      pulseAnimation.current.stop();
      pulseAnimation.current = null; // важливо!
    }
  };
  //=====================

  // 🔊 Вимова
  const speak = (text, language, voiceId = null) => {
    console.log('speak:', {text, language, voiceId});
    Tts.stop();
    Tts.setDefaultLanguage(language);
    Tts.setDefaultPitch(1.0);
    Tts.setDefaultRate(0.4);
    if (voiceId) {
      Tts.setDefaultVoice(voiceId);
    }
    Tts.speak(text);
  };
  //== к допоміжні =======================

  //📥 Завантаження слів при зміні параметрів settings (electedTopics, knowFilter)
  useEffect(() => {
    if (selectedTopics && knowFilter) {
      loadWords(); // Викликайте функцію завантаження слів при зміні параметрів
    }
  }, [selectedTopics, knowFilter, wordTypeFilter]); // Залежності, при зміні яких буде викликано useEffect

  useEffect(() => {
    if (isStarted) loadWords(); // Викликайте функцію завантаження слів при зміні параметрів
  }, [isStarted]); // Залежності, при зміні яких буде викликано useEffect

  //== Цикл ==============================
  const stopSpeak = () => {
    // ToastAndroid.show('', ToastAndroid.LONG);
    speak('', fromLanguage);
  };
  const backWord = () => {
    setShowTranslation(false);
    if (wordIndex > 0) {
      setWordIndex(prev => prev - 1);
    } else {
      setIsRunning(false);
      ToastAndroid.show(startOfWordList, ToastAndroid.LONG); // ← додай цей рядок
      speak(startOfWordList, fromLanguage);
    }
  };

  const nextWord = () => {
    setShowTranslation(false);
    if (wordIndex + 1 < wordData.length) {
      setWordIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
      //   ToastAndroid.show('Кінець списку слів!', ToastAndroid.LONG);
      ToastAndroid.show(endOfWordList, ToastAndroid.LONG);
      speak(endOfWordList, fromLanguage);
    }
  };

  //***Сам цикл з катримками(новий з реверсом)
  useEffect(() => {
    if (!isRunning || wordData.length === 0 || wordIndex >= wordData.length)
      return;

    const current = wordData[wordIndex];
    wordStartTimeRef.current = Date.now();

    if (reverseOrder && translateWord) {
      // Реверс: спочатку переклад
      speak(current.translation, toLanguage, translateVoice1);
      const durationTranslation = estimateSpeechDuration(current.translation);
      timerRef.current = setTimeout(() => {
        setShowTranslation(true);
      }, durationTranslation + delayOriginal);
    } else {
      // Звичайний: спочатку оригінал
      speak(current.word, fromLanguage, originalVoice);
      const durationOriginal = estimateSpeechDuration(current.word);
      if (!translateWord) {
        timerRef.current = setTimeout(() => {
          if (!stopBetweenTranslation) nextWord();
          else setIsRunning(false);
        }, durationOriginal + delayOriginal);
      } else {
        timerRef.current = setTimeout(() => {
          setShowTranslation(true);
        }, durationOriginal + delayOriginal);
      }
    }

    return () => clearTimeout(timerRef.current);
  }, [
    wordIndex,
    isRunning,
    wordData,
    fromLanguage,
    toLanguage,
    originalVoice,
    translateWord,
    reverseOrder,
    translateVoice1,
  ]);

  // Озвучка перекладу з підстановкою голосу
  useEffect(() => {
    if (
      !isRunning ||
      !showTranslation ||
      wordData.length === 0 ||
      wordIndex >= wordData.length ||
      !translateWord
    )
      return;

    const current = wordData[wordIndex];

    if (reverseOrder) {
      // Реверс: showTranslation=true означає час озвучити оригінал
      speak(current.word, fromLanguage, originalVoice);
      const durationOriginal = estimateSpeechDuration(current.word);

      timerRef.current = setTimeout(() => {
        // Повтор перекладу
        if (enableRepeatTranslation) {
          speak(current.translation, toLanguage, translateVoice2);
          const durationTranslation = estimateSpeechDuration(
            current.translation,
          );
          timerRef.current = setTimeout(() => {
            if (!stopBetweenTranslation) nextWord();
            else setIsRunning(false);
          }, durationTranslation + delayTranslation2);
        } else {
          if (!stopBetweenTranslation) nextWord();
          else setIsRunning(false);
        }
      }, durationOriginal + delayTranslation1);
    } else {
      // Звичайний: озвучуємо переклад
      speak(current.translation, toLanguage, translateVoice1);
      const durationTranslation = estimateSpeechDuration(current.translation);

      timerRef.current = setTimeout(() => {
        if (enableRepeatTranslation) {
          speak(current.translation, toLanguage, translateVoice2);
          timerRef.current = setTimeout(() => {
            if (!stopBetweenTranslation) nextWord();
            else setIsRunning(false);
          }, durationTranslation + delayTranslation2);
        } else {
          if (!stopBetweenTranslation) nextWord();
          else setIsRunning(false);
        }
      }, durationTranslation + delayTranslation1);
    }

    return () => clearTimeout(timerRef.current);
  }, [
    showTranslation,
    isRunning,
    wordIndex,
    wordData,
    fromLanguage,
    toLanguage,
    translateWord,
    reverseOrder,
    enableRepeatTranslation,
    stopBetweenTranslation,
    delayTranslation1,
    delayTranslation2,
    originalVoice,
    translateVoice1,
    translateVoice2,
  ]);

  //== к цикл ==========================

  // для Voice --------------------------------------------------------
  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleVoice = useCallback(
    intent => {
      //   getCommandRelatedIndex(); //Функція визначення попереднє чи текуче слово
      switch (intent) {
        case 'to_begin':
          handleCommand('to_begin');
          break;
        case 'start':
          handleCommand('start');
          break;

        case 'continue':
          handleCommand('continue');
          break;
        case 'exit':
          handleCommand('exit');
          break;
        case 'stop':
          handleCommand('stop');
          break;
        case 'repeat':
          handleCommand('repeat');
          break;
        case 'back':
          handleCommand('back');
          break;
        case 'next':
          handleCommand('next');
          break;
        case 'know':
          handleCommand('know');
          break;
        case 'dont_know':
          handleCommand('dont_know');
          break;
        case 'next_topic':
          handleCommand('next_topic');
          break;
        case 'prev_topic':
          handleCommand('prev_topic');
          break;
        default:
          console.log(`Невідома команда: ${intent}`);
      }
    },
    [handleCommand],
  );

  //Голос(useVoskControl) !!! Має бути вкінці всіх процедур!!!
  const {
    isLoadModel, // Модель Завантажена
    record, // Запуск розпізнавання голосу
    stopVoice, // Зупинка розпізнавання
    isRecognizing, //розпізнавання запущене
    result, //Результат розпізнавання голосу
    setResult,
    commands = {commands},
    setCommands = {setCommands},
  } = useVoskControl(handleVoice, modalVisible);
  // -------------------------------
  //Запуск пульсації від isRecognizing-стану розпізнавання голосу
  //має бути після отримання isRecognizing з useVoskControl(
  useEffect(() => {
    if (isRecognizing) {
      startPulse();
    } else {
      stopPulse();
    }
  }, [isRecognizing]);

  //GPT «Назад у попереднж вікно»-виключити озвучку/ setIsRunning(false)
  const stopAll = () => {
    setIsRunning(false); // Зупиняє логіку
    clearTimeout(timerRef.current); // Зупиняє усі таймери
    Tts.stop(); // Зупиняє голос
    setShowTranslation(false); // Скидає показ перекладу (бажано)
    setIsStarted(true);
    stopPulse();
    stopVoice(); //Зупинка Голосу
  };

  useFocusEffect(
    useCallback(() => {
      if (isRecognizing) {
        startPulse();
      } else {
        stopPulse();
      }

      // У режимі уроку апаратну кнопку "Назад" обробляє LessonScreen —
      // тут нічого не реєструємо, щоб не конфліктувати.
      if (embedded) {
        return () => {};
      }

      const onBackPress = () => {
        stopAll();
        navigation.goBack();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => {
        backHandler.remove();
      };
    }, [isRecognizing, navigation, embedded]),
  );

  // ===============================================
  return (
    // обгортаємо весь екран в GestureHandlerRootView і додаємо GestureDetector для свайпів.
    <GestureHandlerRootView style={{flex: 1}}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          backgroundColor: cPageBorderBg,
        }}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={cStatusBarBg}
          color={cStatusBarOn}
        />
        {/*  */}
        <View
          style={[
            styles.pageContainer,
            {backgroundColor: cCardContainer, borderColor: cCardBorder},
          ]}>
          {/* Голова сторінки */}
          {/* Кнопка виходу */}
          {isStarted && !embedded && (
            <TouchableOpacity
              onPress={() => handleCommand('to_begin')}
              style={styles.exitButton}>
              <Text style={styles.exitButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          {!isStarted && !embedded && (
            // Шапка
            <View style={styles.header}>
              <TouchableOpacity onPress={handleExit}>
                <Ionicons name="arrow-back" size={22} color={cPageOn} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, {color: cPageOn}]}>
                Слухати
              </Text>
              {/* Налаштування */}
              <View style={styles.settingsRow}>
                <View style={styles.settingItem}>
                  <WordsHelpModal
                    pcBg={cModalBg}
                    pcOn={cModalOn}
                    colorIcon={cPageOn}
                    colorIconBg={cPageBg}
                  />
                </View>
              </View>
            </View>
          )}
          {/* Body of the page */}
          <View style={styles.bodyPageContainer}>
            {/*Показати  Voice Context(Список голосових команд)*/}
            {modalVisible && (
              <VoskCommandsModal
                onClose={handleCloseModal}
                isLoadModel={isLoadModel}
                isRecognizing={isRecognizing}
                record={record}
                stopVoice={stopVoice} //Для включення голосу в налаштуваннях
                result={result}
                setResult={setResult}
                commands={commands}
                setCommands={setCommands}
              />
            )}
            {/* Microphon */}
            <View
              style={[
                styles.micrRowContainer,
                isStarted && {maxHeight: 20, height: 20},
              ]}>
              <View
                style={{
                  flex: 2,
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'baseline', // 🔹 замість center
                  alignItems: 'center',
                  maxHeight: 20, // 🔹 збільшено
                }}>
                {isLoadModel ? (
                  <>
                    <Text
                      style={[
                        styles.loadText,
                        {
                          color: cLoadText,
                          includeFontPadding: false, // 🔹 забирає зайвий внутрішній відступ знизу
                          textAlignVertical: 'center', // 🔹 центрує текст по вертикалі
                          paddingBottom: 1, // 🔹 трішки піднімає текст, щоб не обрізався
                        },
                      ]}>
                      {/* Голос */}
                      {result}
                    </Text>
                    <Icon name={'arrow-right-bold'} size={24} color={'green'} />
                  </>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.loadText,
                        {
                          color: cLoadText,
                          includeFontPadding: false, // 🔹 забирає зайвий внутрішній відступ знизу
                          textAlignVertical: 'center', // 🔹 центрує текст по вертикалі
                          paddingBottom: 1, // 🔹 трішки піднімає текст, щоб не обрізався
                        },
                      ]}>
                      Голос
                    </Text>
                    <ActivityIndicator size="small" color="#00f" />
                  </>
                )}
              </View>

              {/* //Пульсація */}
              <View
                style={[
                  styles.containerAnimated,
                  isStarted && {maxHeight: 20, height: 20}, // зменшуємо висоту контейнера
                ]}>
                {/* 🔸 Додаємо динамічний розмір, який залежить від isStarted */}
                {(() => {
                  const micSize = isStarted ? size * 0.4 : size; // коли isStarted=true → розмір менший

                  return (
                    <>
                      <Animated.View
                        style={[
                          styles.pulse,
                          {
                            backgroundColor: color,
                            width: micSize,
                            height: micSize,
                            borderRadius: micSize / 2,
                            transform: [{scale}],
                            opacity,
                          },
                        ]}
                      />

                      <TouchableOpacity
                        disabled={!isLoadModel}
                        onPress={() => {
                          // Запуск(зупинка) розпізнавання голосу
                          isRecognizing ? stopVoice() : record();
                        }}
                        style={[
                          styles.iconWrapper,
                          {
                            backgroundColor: isLoadModel ? '#ff1' : 'grey',
                            width: micSize * 0.75,
                            height: micSize * 0.75,
                            borderRadius: (micSize * 0.75) / 2, // виправлено округлення
                          },
                        ]}>
                        {/* Мікрофон */}
                        {isRecognizing ? (
                          <FontAwesome
                            name="microphone"
                            color={iconColor}
                            size={micSize / 2}
                          />
                        ) : (
                          <FontAwesome
                            name="microphone-slash"
                            color={iconColor}
                            size={micSize / 2}
                          />
                        )}
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>

              <View style={{flex: 2, maxHeight: 40}}>
                {/* Розпізнана команда зправа від мікрофона */}
                <Text
                  style={[
                    styles.loadText,
                    {
                      color: cLoadText,
                      includeFontPadding: false, // 🔹 забирає зайвий внутрішній відступ знизу
                      textAlignVertical: 'center', // 🔹 центрує текст по вертикалі
                      paddingBottom: 1, // 🔹 трішки піднімає текст, щоб не обрізався
                    },
                  ]}>
                  {/* {result} */}
                  {/* {isVoiceCommand} */}
                  {isVoiceCommandRef.current}
                </Text>
              </View>
            </View>

            {/* Words */}
            {isStarted && (
              <View>
                <Text
                  style={{
                    paddingTop: 5,
                    paddingLeft: 20,
                    fontWeight: 400,
                    fontSize: 12,
                    color: cTopicName,
                  }}>
                  Тема:{' '}
                  {capitalizeFirstLetter(wordData[wordIndex]?.topic_name || '')}
                </Text>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 11,
                    opacity: 0.4,
                    color: cPageOn,
                    marginBottom: 0,
                    marginTop: 0,
                    lineHeight: 14,
                  }}>
                  ⌄ свайп — попередня тема ⌄
                </Text>
              </View>
            )}
            {/* <GestureDetector-для свайпів */}
            <GestureDetector gesture={panGesture}>
              <View style={[styles.wordsContainer, {flexDirection: flexDir}]}>
                {isStarted ? (
                  <WordsPlayer
                    wordData={wordData}
                    wordIndex={wordIndex}
                    showImg={showImg}
                    imageSource={imageData.source}
                    isDefault={imageData.isDefault}
                    getFontSize={getFontSize}
                    handleCommand={handleCommand}
                    showTranslation={showTranslation}
                    reverseOrder={reverseOrder}
                    translateWord={translateWord}
                    cOutputBg={cOutputBg}
                    cOutputBorder={cOutputBorder}
                    cPageOn={cPageOn}
                    cKnownText={cKnownText}
                  />
                ) : embedded ? (
                  lessonTopicsLoaded && wordData.length === 0 ? (
                    <View style={styles.emptyContentContainer}>
                      <Text
                        style={{
                          color: cPageOn,
                          textAlign: 'center',
                          paddingHorizontal: 20,
                        }}>
                        {lessonTopics.length === 0
                          ? "Контенту ще нема. Прив'яжіть теми в «Контент уроків»"
                          : 'Немає слів такого типу в цьому уроці'}
                      </Text>
                    </View>
                  ) : null
                ) : (
                  <WordsMenu
                    setModalVisible={setModalVisible}
                    setIsSettingsModal={setIsSettingsModal}
                    wordCount={wordData.length}
                    untranslatedCount={untranslatedCount}
                    translateWord={translateWord}
                    wordTypeFilter={wordTypeFilter}
                    cPageHeadOn={cPageHeadOn}
                    sPageHeadIcon={sPageHeadIcon}
                    cLoadText={cLoadText}
                    cErrorOn={cErrorOn}
                    cPageOn={cPageOn}
                  />
                )}
              </View>
            </GestureDetector>
            {isStarted && (
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  opacity: 0.4,
                  color: cPageOn,
                  marginBottom: 0,
                  marginTop: 0,
                  lineHeight: 14,
                }}>
                ⌃ свайп — наступна тема ⌃
              </Text>
            )}
            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {buttonList
                .filter(btn => btn.visible)
                .map(btn => (
                  <TouchableOpacity
                    key={btn.command}
                    style={[styles.button, buttonColorStyle]}
                    onPress={() => handleCommand(btn.command)}>
                    <Text style={buttonTextStyle}>{btn.label}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        </View>
        {/* {!isStarted && (
          <RBotBar
            pcBg={cBotBarBg}
            pcOn={cBotBarOn}
            pcIconBgAct={cBotBarIconBgAct}
            pcIconOnAct={cBotBarIconOnAct}
          />
        )} */}
        <ListenWordsSettingsModal
          isVisible={isSettingsModal}
          onClose={() => setIsSettingsModal(false)}
        />
      </View>
    </GestureHandlerRootView>
  );
};
export default Words;

const styles = StyleSheet.create({
  safeAreaInsetsStyle: {},
  pageContainer: {
    flex: 1,
    // paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 2,
    margin: '1%',

    // тінь для iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    // тінь для Android
    elevation: 6, // Тінь на Android
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },
  bodyPageContainer: {
    flex: 1,
    // justifyContent: 'space-around',
    justifyContent: 'space-between',
    // marginHorizontal: '2%',
  },
  startContaner: {
    flex: 1,
    marginTop: 5,
    textAlign: 'center',
    alignSelf: 'center',
    // alignItems: 'center',
    // margin:20,
  },
  wordsContainer: {
    flex: 1,
    justifyContent: 'center',
    // backgroundColor: '#ff1',
    // alignItems: 'center',
    // marginVertical: '1%',
    marginHorizontal: '1%',
    paddingVertical: '1%',
    paddingHorizontal: '1%',
    gap: 10,
  },
  wordImage: {
    width: '100%',
    height: '100%',
    // resizeMode: 'cover', // Заповнює весь контейнер і не вилазить(обрізає)
    resizeMode: 'contain', // Заповнює не весь контейнер і не вилазить(не обрізає)
    // resizeMode: 'none', // Заповнює контейнер і не вилазить
    borderRadius: 30,
  },
  wordTextContainer: {
    justifyContent: 'center',
    alignItems: 'center', // центрування
    borderWidth: 2,
    borderRadius: 30,
    overflow: 'hidden', // Щоб зображення не вилізало
  },
  wordText: {
    textAlign: 'center',
    fontSize: 26,
    fontFamily: 'Poppins-Regular ',
  },
  cardBadgeLeft: {
    position: 'absolute',
    top: 8,
    left: 12,
    fontSize: 18,
    zIndex: 10,
  },
  buttonsContainer: {
    // marginTop: 5,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    // gap: 5,
    // margin: 20,
  },
  button: {
    // marginTop: '2%',
    // marginHorizontal: '1%',
    marginTop: 5,
    marginHorizontal: 5,
    borderWidth: 2,
    borderRadius: 100,
    // paddingVertical: 2,
    paddingHorizontal: 10,
    alignItems: 'center',
    // gap: 20,
  },
  exitButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 100,
    padding: 6,
  },
  exitButtonText: {
    fontSize: 20,
    color: 'gray',
  },
  loadText: {
    // flexDirection: 'row',
    fontFamily: 'Poppins-Medium',
    fontWeight: 700,
    // alignItems: 'center',
    // alignItems: 'baseline', // Це вирівнює елементи по базовій лінії тексту, тож літера нижче не буде обрізана.
  },

  micrRowContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    // backgroundColor: '
  },
  containerAnimated: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  iconWrapper: {
    backgroundColor: '#ff1',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 1,
  },
  errorBox: {
    backgroundColor: 'red',
    padding: 10,
    alignItems: 'center',
  },
  //   Для віконечка знаю/не знаю
  markedWordContainer: {
    position: 'absolute',
    top: 30,
    width: '80%',
    minHeight: 100,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 8,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)', // легкий прозорий фон
    marginBottom: 8,
    // width: 280, // або "100%" якщо хочеш розтягнути
    width: '100%',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 8,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
