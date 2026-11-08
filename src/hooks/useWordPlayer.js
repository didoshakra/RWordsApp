// useWordPlayer.js
// Хук циклічного відтворення слів з перекладом.
// Використовується в Words.js і TableViewLevels.js

import {useState, useEffect, useRef, useCallback} from 'react';
import {ToastAndroid} from 'react-native';
import Tts from 'react-native-tts-export';

/**
 * @param {object[]} wordData       — масив слів для відтворення
 * @param {object}   settings       — об'єкт налаштувань з SettingsContext
 * @param {object}   [options]
 * @param {number}   [options.initialIndex=0]   — індекс з якого стартувати
 * @param {boolean}  [options.saveLastIndex]     — чи зберігати lastWordIndex у settings (тільки Words.js)
 * @param {Function} [options.onEnd]             — колбек після завершення списку
 */
export function useWordPlayer(wordData, settings, options = {}) {
  const {initialIndex = 0, onEnd} = options;

  // ── Налаштування ──────────────────────────────────────────────
  const delayOriginal = settings?.delayOriginal ?? 2000;
  const delayTranslation1 = settings?.delayTranslation1 ?? 1000;
  const delayTranslation2 = settings?.delayTranslation2 ?? 1000;
  const translateWord = settings?.translateWord ?? true;
  const enableRepeatTranslation = settings?.enableRepeatTranslation ?? true;
  const stopBetweenTranslation = settings?.stopBetweenTranslation ?? false;
  const fromLanguage = settings?.fromLanguage ?? 'uk-UA';
  const toLanguage = settings?.toLanguage ?? 'en-GB';
  const startOfWordList = settings?.startOfWordList ?? 'Початок списку слів';
  const endOfWordList = settings?.endOfWordList ?? 'Кінець списку слів';
  const originalVoice = settings?.voiceByLanguage?.originalVoice ?? '';
  const translateVoice1 = settings?.voiceByLanguage?.translateVoice1 ?? '';
  const translateVoice2 = settings?.voiceByLanguage?.translateVoice2 ?? '';
  const reverseOrder = settings?.reverseOrder ?? false;

  // ── Стан ──────────────────────────────────────────────────────
  const [wordIndex, setWordIndex] = useState(initialIndex);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────
  const timerRef = useRef(null);
  const wordStartTimeRef = useRef(null);

  // ── Helpers ───────────────────────────────────────────────────
  const speak = useCallback((text, language, voiceId = null) => {
    Tts.stop();
    Tts.setDefaultLanguage(language);
    Tts.setDefaultPitch(1.0);
    Tts.setDefaultRate(0.4);
    if (voiceId) Tts.setDefaultVoice(voiceId);
    Tts.speak(text);
  }, []);

  const stopSpeak = useCallback(() => {
    speak('', fromLanguage);
  }, [speak, fromLanguage]);

  const estimateSpeechDuration = useCallback(text => {
    const words = text.trim().split(/\s+/).length;
    const baseDurationPerWord = 700;
    const adjustmentFactor = 0.05;
    const adjusted =
      baseDurationPerWord * (1 - adjustmentFactor * Math.log10(words + 1));
    return Math.max(words * adjusted, 500);
  }, []);

  // ── Навігація по словах ───────────────────────────────────────
  const nextWord = useCallback(() => {
    setShowTranslation(false);
    if (wordIndex + 1 < wordData.length) {
      setWordIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
      ToastAndroid.show(endOfWordList, ToastAndroid.LONG);
      speak(endOfWordList, fromLanguage);
      onEnd?.();
    }
  }, [wordIndex, wordData, endOfWordList, fromLanguage, speak, onEnd]);

  const backWord = useCallback(() => {
    setShowTranslation(false);
    if (wordIndex > 0) {
      setWordIndex(prev => prev - 1);
    } else {
      setIsRunning(false);
      ToastAndroid.show(startOfWordList, ToastAndroid.LONG);
      speak(startOfWordList, fromLanguage);
    }
  }, [wordIndex, startOfWordList, fromLanguage, speak]);

  // Знайти індекс наступної теми
  const nextTopicIndex = useCallback(() => {
    if (!wordData || wordData.length === 0) return -1;
    const currentTopicId = wordData[wordIndex]?.topic_id;
    if (currentTopicId == null) return -1;
    for (let i = wordIndex + 1; i < wordData.length; i++) {
      if (wordData[i].topic_id !== currentTopicId) return i;
    }
    return -1;
  }, [wordData, wordIndex]);

  const nextTopic = useCallback(() => {
    const idx = nextTopicIndex();
    if (idx !== -1) {
      setWordIndex(idx);
    } else {
      ToastAndroid.show(endOfWordList, ToastAndroid.LONG);
      speak(endOfWordList, fromLanguage);
      setIsRunning(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [nextTopicIndex, endOfWordList, fromLanguage, speak]);

  const prevTopic = useCallback(() => {
    if (!wordData || wordData.length === 0) return;
    const currentTopicId = wordData[wordIndex]?.topic_id;
    if (currentTopicId == null) return;
    for (let i = wordIndex - 1; i >= 0; i--) {
      if (wordData[i].topic_id !== currentTopicId) {
        const prevTopicId = wordData[i].topic_id;
        const firstIndex = wordData.findIndex(w => w.topic_id === prevTopicId);
        setWordIndex(firstIndex);
        return;
      }
    }
    ToastAndroid.show(startOfWordList, ToastAndroid.LONG);
    speak(startOfWordList, fromLanguage);
  }, [wordData, wordIndex, startOfWordList, fromLanguage, speak]);

  // ── Команди плеєра ────────────────────────────────────────────
  /**
   * Команди: 'start' | 'stop' | 'resume' | 'repeat' |
   *          'next' | 'back' | 'next_topic' | 'prev_topic' | 'reset'
   */
  const playerCommand = useCallback(
    command => {
      switch (command) {
        case 'start':
          if (!wordData.length) return;
          setIsStarted(true);
          setIsRunning(true);
          setWordIndex(0);
          setShowTranslation(false);
          break;

        case 'stop':
          if (timerRef.current) clearTimeout(timerRef.current);
          setIsRunning(false);
          stopSpeak();
          break;

        case 'resume':
          if (timerRef.current) clearTimeout(timerRef.current);
          setIsRunning(true);
          setShowTranslation(false);
          break;

        case 'repeat':
          if (timerRef.current) clearTimeout(timerRef.current);
          setShowTranslation(false);
          setIsRunning(false);
          setTimeout(() => setIsRunning(true), 50);
          break;

        case 'next':
          setIsRunning(true);
          nextWord();
          break;

        case 'back':
          setIsRunning(false);
          if (timerRef.current) clearTimeout(timerRef.current);
          backWord();
          break;

        case 'next_topic':
          setIsRunning(true);
          nextTopic();
          break;

        case 'prev_topic':
          setIsRunning(true);
          prevTopic();
          break;

        // Повний скид (вихід з режиму відтворення)
        case 'reset':
          if (timerRef.current) clearTimeout(timerRef.current);
          Tts.stop();
          setIsStarted(false);
          setIsRunning(false);
          setShowTranslation(false);
          setWordIndex(0);
          break;

        default:
          console.log('useWordPlayer: невідома команда', command);
      }
    },
    [wordData, stopSpeak, nextWord, backWord, nextTopic, prevTopic],
  );

  // ── Цикл: озвучка оригіналу ───────────────────────────────────
  useEffect(() => {
    if (!isRunning || !wordData.length || wordIndex >= wordData.length) return;

    const current = wordData[wordIndex];
    wordStartTimeRef.current = Date.now();

    if (reverseOrder && translateWord) {
      speak(current.translation, toLanguage, translateVoice1);
      const dur = estimateSpeechDuration(current.translation);
      timerRef.current = setTimeout(
        () => setShowTranslation(true),
        dur + delayOriginal,
      );
    } else {
      speak(current.word, fromLanguage, originalVoice);
      const dur = estimateSpeechDuration(current.word);
      if (!translateWord) {
        timerRef.current = setTimeout(() => {
          if (!stopBetweenTranslation) nextWord();
          else setIsRunning(false);
        }, dur + delayOriginal);
      } else {
        timerRef.current = setTimeout(
          () => setShowTranslation(true),
          dur + delayOriginal,
        );
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
    translateVoice1,
    translateWord,
    reverseOrder,
  ]);

  // ── Цикл: озвучка перекладу ───────────────────────────────────
  useEffect(() => {
    if (
      !isRunning ||
      !showTranslation ||
      !wordData.length ||
      wordIndex >= wordData.length ||
      !translateWord
    )
      return;

    const current = wordData[wordIndex];

    if (reverseOrder) {
      speak(current.word, fromLanguage, originalVoice);
      const dur = estimateSpeechDuration(current.word);
      timerRef.current = setTimeout(() => {
        if (enableRepeatTranslation) {
          speak(current.translation, toLanguage, translateVoice2);
          const dur2 = estimateSpeechDuration(current.translation);
          timerRef.current = setTimeout(() => {
            if (!stopBetweenTranslation) nextWord();
            else setIsRunning(false);
          }, dur2 + delayTranslation2);
        } else {
          if (!stopBetweenTranslation) nextWord();
          else setIsRunning(false);
        }
      }, dur + delayTranslation1);
    } else {
      speak(current.translation, toLanguage, translateVoice1);
      const dur = estimateSpeechDuration(current.translation);
      timerRef.current = setTimeout(() => {
        if (enableRepeatTranslation) {
          speak(current.translation, toLanguage, translateVoice2);
          timerRef.current = setTimeout(() => {
            if (!stopBetweenTranslation) nextWord();
            else setIsRunning(false);
          }, dur + delayTranslation2);
        } else {
          if (!stopBetweenTranslation) nextWord();
          else setIsRunning(false);
        }
      }, dur + delayTranslation1);
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

  // ── Публічний API ──────────────────────────────────────────────
  return {
    // Стан
    wordIndex,
    setWordIndex,
    showTranslation,
    setShowTranslation,
    isStarted,
    setIsStarted,
    isRunning,
    setIsRunning,
    // Поточне слово (зручність)
    currentWord: wordData[wordIndex] ?? null,
    // Команди
    playerCommand,
    // Утиліти (потрібні для UI в Words.js)
    speak,
    stopSpeak,
    wordStartTimeRef,
    timerRef,
  };
}
