//SettingsContext.js
//Налаштування зберігаються і завантажууться із AsyncStorage

import React, {createContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import defaultVoskCommands from '@/vosk/defaultVoskCommands';

export const SettingsContext = createContext();

const defaultSettings = {
  delayOriginal: 2000, // пауза після оригіналу
  delayTranslation1: 1000, // пауза після 1-го перекладу
  delayTranslation2: 1000, // пауза після повтору перекладу
  delayVoiceCommand: 1000, // Затримка роспізнавання голосової команди (для  знаю/не знаю)
  //   selectedTopics: ['*'], // Всі теми/[3,5]-Тема 3,5
  selectedTopics: [], // /[3,5]
  knowFilter: '*', // '*', '0', або '1' — тимчасове значення
  voiceNet: true, // переклад з інтернету чи автономно
  translateWord: true, // показувати переклад
  enableRepeatTranslation: true, // повторювати переклад
  stopBetweenTranslation: false, // зупинка після перекладу
  showImg: true, // показувати картинку слова
  fromLanguage: 'uk-UA', //мова оригіналу
  toLanguage: 'en-GB', //мова перекладу
  lastWordIndex: 0, // index останнього слова що слухалось
  reverseOrder: false, //для зміни послідовності відтворення (оигінал/переклад)
  reversImportCSV: false, // ← додати
  reversTranslate: false, // ← додати
  wordTypeFilter: [], // порожній = всі типи
  currentLessonId: 0, //останній(поточний) урок
  // --- ДОДАЄМО НАЛАШТУВАННЯ AZURE СЮДИ ---
  azureBreak: 1000, // пауза між рядками/частинами(в мс)
  azureVoice: 'uk-UA-OstapNeural',
  azureRate: '0%',
  azurePitch: '0%',
  // ---------------------------------------
  voiceByLanguage: {
    originalVoice: 'uk-ua-x-hfd-local', //жін'uk-UA': 'voiceId'
    translateVoice1: 'en-gb-x-rjs-local', //чол 'en-GB': 'voiceId'
    translateVoice2: 'en-gb-x-gbg-local', //жін 'en-GB': 'voiceId'
  },
};

export const SettingsProvider = ({children}) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [voiceCommands, setVoiceCommands] = useState(defaultVoskCommands);

  // Завантаження з AsyncStorage
  useEffect(() => {
    const load = async () => {
      try {
        // await AsyncStorage.removeItem('settings'); //Очищення settings ← тимчасово, видалити після
        const s = await AsyncStorage.getItem('settings');
        const c = await AsyncStorage.getItem('voiceCommands');

        if (s) {
          const parsedSettings = JSON.parse(s);
          setSettings({...defaultSettings, ...(parsedSettings || {})});
        }

        if (c) {
          const parsedCommands = JSON.parse(c);
          setVoiceCommands({...defaultVoskCommands, ...(parsedCommands || {})});
        }
      } catch (e) {
        console.warn('Помилка завантаження з AsyncStorage:', e);
        setSettings(defaultSettings);
        setVoiceCommands(defaultVoskCommands);
      }
    };
    load();
  }, []);

  // Збереження
  useEffect(() => {
    console.log('SettingsContext saving', settings.lastWordIndex);
    AsyncStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    AsyncStorage.setItem('voiceCommands', JSON.stringify(voiceCommands));
  }, [voiceCommands]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,
        voiceCommands,
        setVoiceCommands,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};
