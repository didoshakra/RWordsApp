//App.js
// Порядок дій для чистої бази:
// Видаліть застосунок з пристрою або очистіть його дані.
// Поставте RESET_ALL = true, розкоментуйте потрібне заповнення і запустіть.
// Коли в консолі з'являться повідомлення про створені таблиці, поверніть RESET_ALL = false. Інакше база скидатиметься при кожному запуску.
// Розкоментовувати seedAllRules() і граматичні слова разом із clearGrammarWords() варто лише тоді, коли в базі вже є секції, інакше rulesSeedGrammarA1Full() сама створить секцію «Граматика A1» і теми. Це нормально, але слова з'являться в базі ще до імпорту з сайту.

import {GestureHandlerRootView} from 'react-native-gesture-handler'; //Для переміщення і групування
import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// import AsyncStorage from '@react-native-async-storage/async-storage';

import RootStack from '@/navigation/RootStack.js';
import {ThemeProvider} from '@/context/ThemeContext.js';
import {SettingsProvider} from '@/context/SettingsContext';
import {
  //   databaseExists,
  resetDatabase,
  copyDbFromAssets,
  initializeDatabase,
  //   copyDatabaseToDownload,
} from '@/db/dbConfig';
import {initializeNotesSchema} from '@/db/notes/initNotesSchema';
import {initializeRulesSchema} from '@/db/rules/initRulesSchema';
// import {clearGrammarWords} from '@/db/rules/rulesWordsActions';
// import {rulesSeedGrammarA1Full} from '@/db/rules/rulesWordsSeedGrammarA1';
// import {seedAllRules} from '@/db/rules/seedRules';
import {initializeLessonsSchema} from '@/db/lessons/initLessonsSchema';

// ⚠️ true — ПОВНЕ СКИДАННЯ БАЗИ при запуску (видаляє файл і створює всі таблиці з нуля).
// Після одного запуску обов'язково поверніть false, інакше база скидатиметься щоразу!
const RESET_ALL = true;

export default function App() {
  useEffect(() => {
    const init = async () => {
      if (RESET_ALL) {
        // === ПОВНЕ СКИДАННЯ: усі таблиці створюються по черзі ===
        await resetDatabase(); // видаляє файл БД і створює sections / topics / words
        initializeNotesSchema(); // note_section, note_themes, notes
        initializeRulesSchema(); // rules
        await initializeLessonsSchema(); // levels, lessons, lesson_topics (після rules через FK)

        // --- ЗАПОВНЕННЯ ДАНИМИ — розкоментуйте потрібне за потребою ---
        // await seedAllRules(); // заповнює таблицю rules правилами
        // await clearGrammarWords(); // видаляє з words ТІЛЬКИ слова секції "Граматика A1"
        // await rulesSeedGrammarA1Full(); // заповнює words прикладами для секції "Граматика A1"
      } else {
        // === ЗВИЧАЙНИЙ СТАРТ ===
        // БД встановлюється на пристрій (якщо БД уже є — не чіпає)
        await copyDbFromAssets(); // спочатку копіюємо готову БД з assets (тільки в релізі)
        initializeDatabase(); // потім створюємо таблиці, якщо їх ще нема
      }
    };
    init();
  }, []);

  // === КОПІЮВАННЯ З DocumentDirectoryPath → Download ===Нова БД для реліз
  // useEffect(() => {
  //   copyDatabaseToDownload();
  // }, []);

  // // === ПЕРЕВІРКА ІСНУВАННЯ БАЗИ ДАНИХ ===
  // useEffect(() => {
  //   const checkDB = async () => {
  //     const exists = await databaseExists();
  //     console.log('App.js/DB exists:', exists);
  //     if (!exists) {
  //       if (__DEV__) {
  //         Alert.alert('База даних відсутня', 'Створити нову БД?', [
  //           {text: 'Ні', onPress: () => BackHandler.exitApp()},
  //           {text: 'Так', onPress: () => resetDatabase()},
  //         ]);
  //       } else {
  //         resetDatabase();
  //       }
  //     }
  //   };
  //   checkDB();
  // }, []);

  //   //очистити AsyncStorage
  //     useEffect(() => {
  //       AsyncStorage.removeItem('settings');
  //       AsyncStorage.removeItem('voiceCommands');
  //     }, []);

  // //   === ТЕСТ AsyncStorage ===
  //   useEffect(() => {
  //     const testStorage = async () => {
  //       try {
  //         console.log('=== AsyncStorage TEST START ===');

  //         // Записуємо тестове значення
  //         await AsyncStorage.setItem('testKey', '123');
  //         console.log('Значення записано');

  //         // Зчитуємо відразу після запису
  //         const val1 = await AsyncStorage.getItem('testKey');
  //         console.log('Значення після запису:', val1);

  //         // Через 5 секунд читаємо ще раз (симуляція перезапуску)
  //         setTimeout(async () => {
  //           const val2 = await AsyncStorage.getItem('testKey');
  //           console.log('Значення через 5 секунд:', val2);
  //         }, 5000);
  //       } catch (e) {
  //         console.warn('Помилка AsyncStorage:', e);
  //       }
  //     };

  //     testStorage();
  //   }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SettingsProvider>
            <NavigationContainer>
              <RootStack />
            </NavigationContainer>
          </SettingsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
