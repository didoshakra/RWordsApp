//WordsListLevels.js//<FlatList з TableView
//3-и рівні(3-масиви)
//Запис озвучки нет- працює але >3 записів вже помилка+ індикатор

import React, {useContext, useState, useEffect, useRef} from 'react';
import {AZURE_KEY} from '@/config/secrets';

import {
  View,
  StyleSheet,
  StatusBar,
  ToastAndroid,
  Alert,
  ActivityIndicator,
  Text,
  Modal,
  //   useWindowDimensions,
  //   Dimensions,
  Platform,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar
import RNFS from 'react-native-fs'; //Для імпорту з SVG
import Tts from 'react-native-tts-export';

import {pick} from '@react-native-documents/picker'; //Для імпорту з SVG
import {Buffer} from 'buffer'; // Для озвучки Azure

import {ThemeContext} from '@/context/ThemeContext';
import {SettingsContext} from '@/context/SettingsContext';
import MyArrowBack from '@/components/main/MyArrowBack';
import TableViewLevels from '@/components/tables/TableViewLevels';
import WordsListLevelsHelpModal from './WordsListLevelsHelpModal';
import LanguageSettingsModal from '@/components/settings/languages/LanguageSettingsModal';
import AppWebView from '@/components/web/AppWebView'; //Для  імпорту даних на сайт

import {openDatabase} from '@/db/dbConfig';
import {handleSQLError} from '@/db/dbUtils';

const WordsListLevels = () => {
  //   const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false); //Стан завантаження
  const [tData, setTData] = useState([]);
  const [tTopics, setTTopics] = useState([]);
  const [tSections, setTSections] = useState([]);
  //   const changedPnRef = useRef(false); //Для контролю зміни pn
  const navigation = useNavigation();
  const [translate, setTranslate] = useState(false); //Чи перекладено
  const [translatedCount, setTranslatedCount] = useState(0); //Для індикатора перкладу
  const [totalWords, setTotalWords] = useState(0);
  // ref для актуального лічильника (щоб Alert показував правильне число навіть при зупинці)
  const translatedCountRef = useRef(0);
  const stopRequested = useRef(false);
  const {settings} = useContext(SettingsContext); //Для мови перекладу
  const fromLanguage = settings?.fromLanguage ?? 'uk-UA'; //мова оригіналу
  const toLanguage = settings?.toLanguage ?? 'en-GB'; //мова перекладу
  //   console.log('WordsListLevels/toLanguage:', fromLanguage);
  //   console.log('WordsListLevels/toLanguage:', toLanguage);
  const [importedWordsCount, setImportedWordsCount] = useState(0); //для імпорту
  // Експорт даних на сайт
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState(null);
  // --- НАЛАШТУВАННЯ AZURE ---

  //   Колір
  const {sizes, getColorScheme, isDarkMode} = useContext(ThemeContext);
  const indexScheme = 0;
  const scheme = getColorScheme(indexScheme);
  const cPageBorderBg = scheme.cardBg;
  const cStatusBarBg = scheme.pageBg;
  const cPageHeadBg = scheme.pageBg; //СтрілкаBG
  const cPageHeadText = scheme.pageOn;
  const cPageBg = scheme.pageBg; //Bg колір сторінки
  const cModalBg = scheme.modalBg;
  const cModalOn = scheme.modalOn;
  const sPageHeadIcon = sizes.sPageHeadIcon;
  //   changeNavigationBarColor(cPageBorderBg, !isDarkMode); //колір Navigation Bar , true - світлі іконки
  // ✅ Navigation bar color — тільки при зміні теми або кольору

  useEffect(() => {
    changeNavigationBarColor(cPageBorderBg, !isDarkMode);
  }, [cPageBorderBg, isDarkMode]);
  //
  useEffect(() => {
    if (importedWordsCount > 0) {
      loadSections();
      loadTopics();
      loadWords(); // перерендер після імпорту
    }
  }, [importedWordsCount]);

  // Loads
  useFocusEffect(
    React.useCallback(() => {
      loadSections();
    }, []),
  );
  useFocusEffect(
    React.useCallback(() => {
      loadTopics();
      //   console.log('TopicList/loadTopics()/tData=', tData);
    }, []),
  );
  useFocusEffect(
    React.useCallback(() => {
      loadWords();
    }, []),
  );

  const loadSections = () => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        'SELECT * FROM sections ORDER BY Sections.pn ASC',
        [],
        (_, results) => {
          //   console.log(
          //     'SectionsList/loadSections/Кількість отриманих записів:',
          //     results.rows.length,
          //   );
          let temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          // console.log('Отримані записи:', temp);
          //   setSections(temp);
          setTSections(temp);
        },
        (_, error) => console.log('Помилка SELECT:', error),
      );
    });
  };

  const loadTopics = () => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        `SELECT Topics.*, Sections.name AS section_name, Sections.pn AS section_pn, IFNULL(SUM(Words.know), 0) AS know_sum, COUNT(Words.id) AS words_count, CASE WHEN COUNT(Words.id) = 0 THEN 0
                    ELSE ROUND(100.0 * SUM(Words.know) / COUNT(Words.id), 1)
                    END AS know_percent
                FROM Topics JOIN Sections ON Topics.section_id = Sections.id LEFT JOIN Words ON Words.topic_id = Topics.id
                GROUP BY Topics.id
                ORDER BY Sections.pn ASC, Topics.pn ASC`,
        [],
        (_, results) => {
          //   console.log(
          //     'TopicsList/loadTopics/Кількість отриманих записів:',
          //     results.rows.length,
          //   );
          let temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          setTTopics(temp);
        },
        (_, error) => {
          console.log('Помилка SELECT:', error);
          return false;
        },
      );
    });
  };

  // з Sections.pn + Words.pn
  const loadWords = () => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        `SELECT Words.*,
                Topics.name AS topic_name,
                Topics.pn AS topic_pn,
                Sections.name AS section_name,
                Sections.pn AS section_pn
         FROM Words
         JOIN Topics ON Words.topic_id = Topics.id
         JOIN Sections ON Topics.section_id = Sections.id
         ORDER BY Sections.pn ASC, Topics.pn ASC, Words.pn ASC`, // ← правильно
        //  ORDER BY (Sections.pn + Topics.pn + Words.id) ASC`, // або DESC
        [],
        (_, results) => {
          //   console.log(
          //     'WordsListLevels/loadWords/Кількість отриманих записів:',
          //     results.rows.length,
          //   );
          let temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          //   setWords(temp);
          //   console.log('loadWors/temp:', temp);
          setTData(temp);
        },
        (_, error) => {
          console.log('Помилка SELECT:', error);
          return false;
        },
      );
    });
  };

  // === Запис ToAudio =======================================
  // --- ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ РОЗБИТТЯ ТА AZURE ---

  const splitTextIntoChunks = (text, limit) => {
    const words = text.trim().split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += limit) {
      chunks.push(words.slice(i, i + limit).join(' '));
    }
    return chunks;
  };

  const saveSelectedToAudio = async ids => {
    if (ids.length === 0) {
      ToastAndroid.show('Нічого не вибрано!', ToastAndroid.SHORT);
      return;
    }

    // --- КОНСТАНТИ (Щоб нічого не ламалось) ---
    const vVoice = 'uk-UA-OstapNeural';
    const vRate = '0%';
    const vPitch = '0%';
    const vBreak = '1000ms'; // Пауза між абзацами

    // Внутрішня функція запиту до Azure
    const processAzureCall = async (text, path) => {
      const url = `https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1`;

      // Екрануємо символи & < >, щоб XML не "падав"
      const cleanText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Шукаємо дві похилі риски з пробілом і міняємо на паузу
      const formattedText = cleanText.replace(
        /\/\/ /g,
        `<break time='${vBreak}'/>`,
      );

      const ssml = `
      <speak version='1.0' xml:lang='uk-UA'>
        <voice xml:lang='uk-UA' name='${vVoice}'>
          <prosody rate='${vRate}' pitch='${vPitch}'>
            ${formattedText}
          </prosody>
        </voice>
      </speak>`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        },
        body: ssml,
      });

      if (!response.ok) throw new Error(`Azure Error: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      await RNFS.writeFile(
        path,
        Buffer.from(arrayBuffer).toString('base64'),
        'base64',
      );
    };

    const executeSaving = async (isNet, mode) => {
      if (typeof setLoading === 'function') setLoading(true);

      try {
        const selectedChapters = tData.filter(item => ids.includes(item.id));
        const destDir = RNFS.ExternalDirectoryPath;
        const d = new Date();
        const dateStr =
          d.getFullYear() +
          String(d.getMonth() + 1).padStart(2, '0') +
          String(d.getDate()).padStart(2, '0') +
          '_' +
          String(d.getHours()).padStart(2, '0') +
          String(d.getMinutes()).padStart(2, '0');

        const currentLimit = isNet ? 1100 : 600;

        if (mode === 'single') {
          // РЕЖИМ: ОДНИМ ФАЙЛОМ
          const fullText = selectedChapters.map(c => c.word.trim()).join('\n');
          const chunks = splitTextIntoChunks(fullText, currentLimit);

          const firstPn = selectedChapters[0].pn;
          const lastPn = selectedChapters[selectedChapters.length - 1].pn;
          const methodPrefix = isNet ? 'N' : 'L';
          const s = selectedChapters[0].section_pn;
          const t = selectedChapters[0].topic_pn;

          for (let i = 0; i < chunks.length; i++) {
            const suffix = chunks.length > 1 ? `_p${i + 1}` : '_p1';
            const fileName = `${methodPrefix}s${s}t${t}w${firstPn}_w${lastPn}_${dateStr}${suffix}`;
            const destPath = `${destDir}/${fileName}.${isNet ? 'mp3' : 'wav'}`;

            if (isNet) {
              await processAzureCall(chunks[i], destPath);
            } else {
              const cached = await Tts.export(chunks[i], {
                filename: fileName,
                overwrite: true,
              });
              await RNFS.copyFile(cached, destPath);
            }
          }
          Alert.alert('Завершено', `Записано частин: ${chunks.length}`);
        } else {
          // РЕЖИМ: ОКРЕМІ ФАЙЛИ (ПО ГЛАВАХ)
          let totalCreatedFiles = 0;
          for (const item of selectedChapters) {
            const chunks = splitTextIntoChunks(item.word, currentLimit);
            for (let j = 0; j < chunks.length; j++) {
              const suffix = chunks.length > 1 ? `p${j + 1}` : '';
              const baseName = `s${item.section_pn}t${item.topic_pn}w${item.pn}${suffix}`;
              const destPath = `${destDir}/${baseName}.${
                isNet ? 'mp3' : 'wav'
              }`;

              if (isNet) {
                await processAzureCall(chunks[j], destPath);
              } else {
                const cached = await Tts.export(chunks[j], {
                  filename: baseName,
                  overwrite: true,
                });
                await RNFS.copyFile(cached, destPath);
              }
              totalCreatedFiles++;
            }
          }
          Alert.alert(
            'Готово',
            `Збережено окремих файлів: ${totalCreatedFiles}`,
          );
        }
      } catch (error) {
        Alert.alert('Помилка', error.message);
      } finally {
        if (typeof setLoading === 'function') setLoading(false);
      }
    };

    // --- МЕНЮ (ПОВЕРНУТО ЯК БУЛО) ---
    Alert.alert('Джерело', 'Оберіть метод озвучки:', [
      {
        text: 'Azure (Мережа)',
        onPress: () => {
          Alert.alert('Формат', 'Як зберегти результат?', [
            {text: 'Окремі файли', onPress: () => executeSaving(true, 'split')},
            {
              text: 'Одним файлом',
              onPress: () => executeSaving(true, 'single'),
            },
          ]);
        },
      },
      {
        text: 'RHVoice (Локально)',
        onPress: () => {
          Alert.alert('Формат', 'Як зберегти результат?', [
            {
              text: 'Окремі файли',
              onPress: () => executeSaving(false, 'split'),
            },
            {
              text: 'Одним файлом',
              onPress: () => executeSaving(false, 'single'),
            },
          ]);
        },
      },
    ]);
  };
  /////////////////////////////////////////////////////////////////////////
  // Функція для виклику діалогового вікна перед вилученням
  const confirmDeleteRecord = ids => {
    // console.log('WordsListLevels/confirmDeleteRecord:', ids);
    Alert.alert(
      'Підтвердження видалення', // Заголовок діалогу
      'Ви дійсно хочете видалити цей запис?', // Текст діалогу
      [
        {
          text: 'Ні', // Кнопка скасування
          onPress: () => console.log('Видалення скасовано'),
          style: 'cancel',
        },
        {
          text: 'Так', // Кнопка підтвердження
          //   onPress: () => deleteRecord(id),
          onPress: () => deleteRecord(ids),
        },
      ],
      {cancelable: false}, // Вікно не можна закрити натисканням поза ним
    );
  };

  // Видалення теми
  const confirmDeleteTopic = topic => {
    Alert.alert('Видалити тему?', `"${topic.name}"`, [
      {text: 'Скасувати', style: 'cancel'},
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: () => {
          openDatabase().transaction(tx => {
            tx.executeSql(
              'SELECT COUNT(*) as count FROM words WHERE topic_id = ?',
              [topic.id],
              (_, {rows}) => {
                const count = rows.item(0).count;
                const msg =
                  count > 0
                    ? `${count} слів будуть видалені разом з темою. Продовжити?`
                    : 'Тема порожня. Видалити?';
                Alert.alert('Підтвердження', msg, [
                  {text: 'Скасувати', style: 'cancel'},
                  {
                    text: 'Видалити',
                    style: 'destructive',
                    onPress: () => {
                      openDatabase().transaction(tx2 => {
                        tx2.executeSql('PRAGMA foreign_keys = ON;');
                        tx2.executeSql(
                          'DELETE FROM topics WHERE id = ?',
                          [topic.id],
                          () => {
                            loadTopics();
                            loadWords();
                          },
                          (_, error) => {
                            console.log('Помилка:', error);
                            return true;
                          },
                        );
                      });
                    },
                  },
                ]);
              },
            );
          });
        },
      },
    ]);
  };

  // Видалення секції
  const confirmDeleteSection = section => {
    Alert.alert('Видалити секцію?', `"${section.name}"`, [
      {text: 'Скасувати', style: 'cancel'},
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: () => {
          openDatabase().transaction(tx => {
            tx.executeSql(
              'SELECT COUNT(*) as count FROM topics WHERE section_id = ?',
              [section.id],
              (_, {rows}) => {
                const count = rows.item(0).count;
                const msg =
                  count > 0
                    ? `${count} тем і всі їх слова будуть видалені. Продовжити?`
                    : 'Секція порожня. Видалити?';
                Alert.alert('Підтвердження', msg, [
                  {text: 'Скасувати', style: 'cancel'},
                  {
                    text: 'Видалити',
                    style: 'destructive',
                    onPress: () => {
                      openDatabase().transaction(tx2 => {
                        tx2.executeSql('PRAGMA foreign_keys = ON;');
                        tx2.executeSql(
                          'DELETE FROM sections WHERE id = ?',
                          [section.id],
                          () => {
                            loadSections();
                            loadTopics();
                            loadWords();
                          },
                          (_, error) => {
                            console.log('Помилка:', error);
                            return true;
                          },
                        );
                      });
                    },
                  },
                ]);
              },
            );
          });
        },
      },
    ]);
  };

  // Функція для виклику діалогового вікна перед вилученням
  const deleteRecord = ids => {
    // console.log('WordfListdeleteRecord/ids:', ids);
    if (ids.length === 0) return; // Якщо масив порожній, не робимо запит

    // Створюємо рядок id для SQL-запиту (наприклад: '1,2,3,5')
    const idsString = ids.join(',');

    openDatabase().transaction(tx => {
      tx.executeSql(
        `DELETE FROM words WHERE id IN (${idsString})`,
        [],
        (_, results) => {
          if (results.rowsAffected > 0) {
            ToastAndroid.show('Запис видалено!', ToastAndroid.SHORT);
            loadWords(); // Оновлення списку після видалення
          } else {
            ToastAndroid.show('Запис не знайдено', ToastAndroid.SHORT);
          }
        },
        (_, error) => {
          console.log('SQL Error:', error); // Лог в консоль для розробника
          handleSQLError(error, 'видалення з таблиці topics');
          return true; // Зупиняємо подальшу обробку помилки
        },
      );
    });
  };

  // GPT/25/05/04
  const selectFile = async () => {
    const res = await pick({
      allowMultiSelection: false,
      type: '*/*',
    });

    const file = res?.[0];
    if (!file) return null;

    file.path = file.uri.replace('file://', ''); // додаємо поле 'path'
    return file;
  };

  //importCSV
  // на початку рядка → коментар, ігнорується
  // 1-й рядок, або початок рядка з ** → секція (section.name, section.imgЇ+||'other')
  // 2-й рядок, або початок рядка з * → перша тема (topic.name, topic.img||'other')
  // Решта рядків → слова Формат: word;group_key;type;translation;img)
  //group_key-це привязка до слова(група)
  //type:word/phrase/
  // * на початку рядка → нова тема
  // img для слова за замовчуванням = ''
  const importCSV = async () => {
    const reversImportCSV = settings?.reversImportCSV ?? false; // ← додати
    if (reversImportCSV) {
      const confirmed = await new Promise(resolve =>
        Alert.alert(
          '⚠️ Реверсний імпорт',
          'Увімкнено реверсний імпорт: колонка "слово" → переклад, "переклад" → слово.',
          [
            {text: 'Скасувати', onPress: () => resolve(false), style: 'cancel'},
            {text: 'Продовжити', onPress: () => resolve(true)},
          ],
        ),
      );
      if (!confirmed) return;
    }
    try {
      const file = await selectFile();
      if (!file) {
        Alert.alert('Помилка', 'Файл не вибрано!');
        return;
      }

      const fileContent = await RNFS.readFile(file.path, 'utf8');
      const lines = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        Alert.alert('Помилка', 'Файл має містити мінімум секцію і тему!');
        return;
      }

      // --- 1. Парсимо секцію ---
      let sectionLineIdx = 0;
      while (lines[sectionLineIdx].startsWith('//')) sectionLineIdx++;

      // --- 2. Перша секція ---
      let currentSectionName;
      const firstSectionLine = lines[sectionLineIdx].startsWith('**')
        ? lines[sectionLineIdx].substring(2).trim()
        : lines[sectionLineIdx].trim();
      [currentSectionName] = firstSectionLine.split(';').map(s => s.trim());

      // --- 3. Парсимо першу тему ---
      let topicLineIdx = sectionLineIdx + 1;
      while (lines[topicLineIdx].startsWith('//')) topicLineIdx++;
      const firstTopicLine = lines[topicLineIdx].startsWith('*')
        ? lines[topicLineIdx].substring(1).trim()
        : lines[topicLineIdx].trim();
      const [firstTopicName, firstTopicLink] = firstTopicLine
        .split(';')
        .map(s => s.trim());

      // sections — масив секцій з темами
      let sections = [
        {
          name: currentSectionName,
          topics: [
            {name: firstTopicName, link: firstTopicLink || '', words: []},
          ],
        },
      ];
      let currentSection = sections[0];
      let currentTopic = currentSection.topics[0];

      // --- 4. Парсимо решту рядків ---
      for (let i = topicLineIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.startsWith('//')) continue;

        if (line.startsWith('**')) {
          const sectionLine = line.substring(2).trim();
          const [secName] = sectionLine.split(';').map(s => s.trim());
          currentSection = {name: secName, topics: []};
          sections.push(currentSection);
          currentTopic = null;
        } else if (line.startsWith('*')) {
          // нова тема
          const topicLine = line.substring(1).trim();
          const [topicName, topicLink] = topicLine
            .split(';')
            .map(s => s.trim());
          currentTopic = {name: topicName, link: topicLink || '', words: []};
          currentSection.topics.push(currentTopic);
        } else {
          // Формат: word;group_key;type;translation;img
          const parts = line.split(';').map(s => s.trim()); // ← забули цей рядок!
          const rawWord = parts[0];
          if (!rawWord) continue;
          //   const word = reversImportCSV ? '' : rawWord;
          //   const translation = reversImportCSV ? rawWord : parts[3] || '';
          const word = reversImportCSV ? parts[3] || '' : rawWord;
          const translation = reversImportCSV ? rawWord : parts[3] || '';
          const wordCount = rawWord.trim().split(/\s+/).length;
          const group_key = parts[1] || (wordCount === 1 ? rawWord : '');
          const type = parts[2] || (wordCount === 1 ? 'word' : 'phrase');
          const img = parts[4] || '';
          currentTopic.words.push({word, group_key, type, translation, img});
        }
      }

      // --- 5. Запис у БД ---
      const db = openDatabase();
      db.transaction(tx => {
        let localImportedWordsCount = 0;
        let sectionIdx = 0;

        function nextSection() {
          if (sectionIdx >= sections.length) {
            setTimeout(() => {
              Alert.alert(
                '✅ Успіх',
                `Імпортовано ${localImportedWordsCount} слів.`,
              );
            }, 500);
            setImportedWordsCount(prev => prev + 1); // ← замість loadWords()
            return;
          }

          const section = sections[sectionIdx];
          tx.executeSql(
            'SELECT id FROM sections WHERE name = ?',
            [section.name],
            (_, sectionResult) => {
              let sectionId;
              if (sectionResult.rows.length > 0) {
                sectionId = sectionResult.rows.item(0).id;
                proceedWithTopics(tx, sectionId, section.topics, () => {
                  sectionIdx++;
                  nextSection();
                });
              } else {
                tx.executeSql(
                  'SELECT MAX(pn) as maxPn FROM sections',
                  [],
                  (_, maxResult) => {
                    const maxPn = maxResult.rows.item(0).maxPn;
                    const newPn = maxPn != null ? maxPn + 1 : 1;
                    tx.executeSql(
                      'INSERT INTO sections (name, pn) VALUES (?, ?)',
                      [section.name, newPn],
                      (_, insertResult) => {
                        sectionId = insertResult.insertId;
                        proceedWithTopics(tx, sectionId, section.topics, () => {
                          sectionIdx++;
                          nextSection();
                        });
                      },
                      err => Alert.alert('Помилка', 'Не вдалося додати секцію'),
                    );
                  },
                  err =>
                    Alert.alert('Помилка', 'Не вдалося отримати pn секції'),
                );
              }
            },
            err => Alert.alert('Помилка', 'Не вдалося перевірити секцію'),
          );
        }

        function proceedWithTopics(tx, sectionId, topics, onDone) {
          let topicIdx = 0;

          function nextTopic() {
            if (topicIdx >= topics.length) {
              onDone();
              return;
            }

            const topic = topics[topicIdx];
            tx.executeSql(
              'SELECT id FROM topics WHERE name = ? AND section_id = ?',
              [topic.name, sectionId],
              (_, topicResult) => {
                let topicId;
                if (topicResult.rows.length > 0) {
                  topicId = topicResult.rows.item(0).id;
                  insertWords(tx, topicId, topic.words, () => {
                    topicIdx++;
                    nextTopic();
                  });
                } else {
                  tx.executeSql(
                    'SELECT MAX(pn) as maxPn FROM topics WHERE section_id = ?',
                    [sectionId],
                    (_, maxResult) => {
                      const maxPn = maxResult.rows.item(0).maxPn;
                      const newPn = maxPn != null ? maxPn + 1 : 1;
                      tx.executeSql(
                        'INSERT INTO topics (name, section_id, pn, link) VALUES (?, ?, ?, ?)',
                        [topic.name, sectionId, newPn, topic.link || ''],
                        (_, insertResult) => {
                          topicId = insertResult.insertId;
                          insertWords(tx, topicId, topic.words, () => {
                            topicIdx++;
                            nextTopic();
                          });
                        },
                        err => Alert.alert('Помилка', 'Не вдалося додати тему'),
                      );
                    },
                    err =>
                      Alert.alert('Помилка', 'Не вдалося отримати pn теми'),
                  );
                }
              },
              err => Alert.alert('Помилка', 'Не вдалося перевірити тему'),
            );
          }

          nextTopic();
        }

        function insertWords(tx, topicId, words, cb) {
          if (!words || !words.length) return cb();
          tx.executeSql(
            'SELECT MAX(pn) as maxPn FROM words WHERE topic_id = ?',
            [topicId],
            (_, maxResult) => {
              let pn = maxResult.rows.item(0).maxPn || 0;
              let wordIdx = 0;

              function nextWord() {
                if (wordIdx >= words.length) return cb();
                const {word, group_key, type, translation, img} =
                  words[wordIdx];
                tx.executeSql(
                  'SELECT id FROM words WHERE (CASE WHEN ? = 1 THEN translation ELSE word END) = ? AND topic_id = ?',
                  [
                    reversImportCSV ? 1 : 0,
                    reversImportCSV ? translation : word,
                    topicId,
                  ],
                  (_, wordResult) => {
                    if (wordResult.rows.length === 0) {
                      pn++;
                      tx.executeSql(
                        'INSERT INTO words (word, group_key, type, translation, img, topic_id, pn) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [word, group_key, type, translation, img, topicId, pn],
                        () => {
                          localImportedWordsCount++;
                          wordIdx++;
                          nextWord();
                        },
                        err => {
                          wordIdx++;
                          nextWord();
                        },
                      );
                    } else {
                      wordIdx++;
                      nextWord();
                    }
                  },
                  err => {
                    wordIdx++;
                    nextWord();
                  },
                );
              }
              nextWord();
            },
            err => cb(),
          );
        }

        nextSection();
      });
    } catch (error) {
      Alert.alert('Помилка', 'Не вдалося імпортувати файл');
    }
  };

  //   Кінець імпорту

  // Функція для перекладу всіх або вибраних слів (ids може бути порожнім)
  const translateAllWords = ids => {
    stopRequested.current = false;
    // setTranslate(true);
    setTranslatedCount(0);
    translatedCountRef.current = 0;
    setTotalWords(0);

    const db = openDatabase();

    // 1) Спочатку питаємо: перекладати всі чи лише вибрані (коли ids не пустий)
    if (ids && ids.length > 0) {
      Alert.alert(
        'Що перекладати?',
        '',
        [
          {text: 'Перекладати всі', onPress: () => runQuery(false)}, // false = всі
          {text: 'Перекладати вибрані', onPress: () => runQuery(true)}, // true  = тільки ids
          {
            text: 'Відмінити',
            style: 'cancel',
            onPress: () => setTranslate(false),
          },
        ],
        {cancelable: true},
      );
    } else {
      Alert.alert(
        'Підтвердження',
        'Будуть перекладені всі слова з бази.',
        [
          {text: 'Перекладати всі', onPress: () => runQuery(false)},
          {
            text: 'Відмінити',
            style: 'cancel',
            onPress: () => setTranslate(false),
          },
        ],
        {cancelable: true},
      );
    }

    // 2) Отримуємо список слів згідно вибору та вирішуємо, що саме перекладати
    function runQuery(onlySelected) {
      let q = 'SELECT id, word, translation FROM words';
      let p = [];

      if (onlySelected && ids && ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        q += ` WHERE id IN (${placeholders})`;
        p = ids;
      }

      db.transaction(tx => {
        tx.executeSql(
          q,
          p,
          (_, results) => {
            const allWords = [];
            const untranslatedWords = [];

            const reversTranslate = settings?.reversTranslate ?? false;

            for (let i = 0; i < results.rows.length; i++) {
              const item = results.rows.item(i);
              allWords.push(item);
              // перевіряємо поле яке є джерелом для перекладу
              const sourceText = reversTranslate ? item.translation : item.word;
              const targetText = reversTranslate ? item.word : item.translation;
              if (!targetText?.trim()) untranslatedWords.push(item);
            }

            const total = allWords.length;
            const missing = untranslatedWords.length;

            if (total === 0) {
              setTranslate(false);
              Alert.alert(
                'Порожньо',
                'Не знайдено жодного слова для перекладу.',
              );
              return;
            }

            // Всі вже мають переклад — пропонуємо переписати або відмінити
            if (missing === 0) {
              Alert.alert(
                'Усі перекладені',
                'Усі вибрані слова вже мають переклад. Перекласти повторно (перезаписати переклади)?',
                [
                  {
                    text: 'Ні',
                    style: 'cancel',
                    onPress: () => setTranslate(false),
                  },
                  {
                    text: 'Так',
                    onPress: () => {
                      setTranslate(true); // <-- включаємо індикатор тут
                      setTimeout(() => startTranslation(allWords), 0);
                    },
                  },
                ],
                {cancelable: true},
              );
              return;
            }

            // Частина перекладена — пропонуємо два варіанти
            if (missing < total) {
              Alert.alert(
                'Частина вже перекладена',
                `Неперекладених: ${missing} із ${total}. Що робимо?`,
                [
                  {
                    text: 'Лише неперекладені',
                    onPress: () => {
                      setTranslate(true); // <-- включаємо індикатор тут
                      setTimeout(() => startTranslation(untranslatedWords), 0);
                    },
                  },
                  {
                    text: 'Усі (перезаписати)',
                    onPress: () => {
                      setTranslate(true); // <-- включаємо індикатор тут
                      setTimeout(() => startTranslation(allWords), 0);
                    },
                  },
                  {
                    text: 'Відмінити',
                    style: 'cancel',
                    onPress: () => setTranslate(false),
                  },
                ],
                {cancelable: true},
              );
              return;
            }

            // Жодного перекладеного ще немає — просто перекладаємо всі з вибірки
            setTranslate(true);
            startTranslation(untranslatedWords);
          },
          err => {
            setTranslate(false);
            Alert.alert('Помилка', 'Не вдалося завантажити слова з БД.');
          },
        );
      });
    }
  };

  const startTranslation = wordsToTranslate => {
    const reversTranslate = settings?.reversTranslate ?? false;
    const from = reversTranslate ? toLanguage : fromLanguage;
    const to = reversTranslate ? fromLanguage : toLanguage;

    setTotalWords(wordsToTranslate.length);

    if (wordsToTranslate.length === 0) {
      setTranslate(false);
      return;
    }

    let currentIndex = 0;
    const db = openDatabase();

    const processNext = () => {
      if (stopRequested.current) {
        setTranslate(false);
        Alert.alert(
          'Зупинено',
          `Зупинено на ${translatedCountRef.current} із ${wordsToTranslate.length} слів.`,
        );
        loadWords && loadWords();
        return;
      }

      if (currentIndex >= wordsToTranslate.length) {
        setTranslate(false);
        ToastAndroid.show('Усі слова перекладено!', ToastAndroid.LONG);
        Alert.alert(
          'Успіх',
          `Перекладено: ${translatedCountRef.current} із ${wordsToTranslate.length}`,
        );
        loadWords && loadWords();
        return;
      }

      const item = wordsToTranslate[currentIndex];
      const textToTranslate = reversTranslate ? item.translation : item.word;

      if (!textToTranslate?.trim()) {
        currentIndex++;
        setTimeout(processNext, 100);
        return;
      }

      const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        textToTranslate,
      )}&langpair=${from}|${to}`;

      fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
          const translated = data?.responseData?.translatedText ?? '';
          const cleaned = translated.replace(/(^-+)|(-+$)/g, '').trim();

          db.transaction(tx2 => {
            tx2.executeSql(
              reversTranslate
                ? 'UPDATE words SET word = ? WHERE id = ?'
                : 'UPDATE words SET translation = ? WHERE id = ?',
              [cleaned, item.id],
              () => {
                setTranslatedCount(prev => prev + 1);
                translatedCountRef.current += 1;
                currentIndex++;
                setTimeout(processNext, 400);
              },
              () => {
                currentIndex++;
                setTimeout(processNext, 400);
              },
            );
          });
        })
        .catch(() => {
          currentIndex++;
          setTimeout(processNext, 400);
        });
    };

    processNext();
  };

  const handleTranslate = async ids => {
    if (!translate) {
      const reversTranslate = settings?.reversTranslate ?? false;

      if (reversTranslate) {
        const confirmed = await new Promise(resolve =>
          Alert.alert(
            '⚠️ Реверсний переклад',
            'Увімкнено реверсний переклад: "переклад" → "слово".',
            [
              {
                text: 'Скасувати',
                onPress: () => resolve(false),
                style: 'cancel',
              },
              {text: 'Продовжити', onPress: () => resolve(true)},
            ],
          ),
        );
        if (!confirmed) return;
      }

      translateAllWords(ids);
    } else {
      stopRequested.current = true;
      setTranslate(false);
    }
  };

  // Оновлення pn в БД
  function updateWordsPn(tData, onSuccess) {
    if (!Array.isArray(tData)) {
      console.error('updateWordsPn: tData is not an array', tData);
      return;
    }
    openDatabase().transaction(
      tx => {
        tData.forEach(item => {
          tx.executeSql(
            'UPDATE Words SET pn = ? WHERE id = ?',
            [item.pn, item.id],
            (_, result) => {
              console.log(`Оновлено topic id=${item.id} → pn=${item.pn}`);
            },
            (_, error) => {
              console.error('Помилка оновлення pn:', error);
              return false;
            },
          );
        });
      },
      error => {
        console.error('Помилка транзакції:', error);
      },
      () => {
        console.log('Оновлення pn завершено успішно.');
        onSuccess?.(); // <- ВАЖЛИВО
      },
    );
  }
  // handleExport-експорт даних на сайт(кнопка)
  const handleExport = ids => {
    Alert.alert(
      'Експорт на сайт',
      `Буде експортовано ${ids.length} записів. Підтвердити?`,
      [
        {text: 'Відмінити', style: 'cancel'},
        {text: 'Підтвердити', onPress: () => exportWordsToSite(ids)},
      ],
      {cancelable: true},
    );
  };
  // exportWordsToSite- експорт даних на сайт.
  const exportWordsToSite = ids => {
    const db = openDatabase();
    const placeholders = ids.map(() => '?').join(',');
    const q = `
    SELECT
      w.id, w.word, w.translation, w.know, w.img, w.group_key, w.type,
      w.topic_id, t.name AS topic_name,
      t.section_id, s.name AS section_name
    FROM words w
    LEFT JOIN topics t ON w.topic_id = t.id
    LEFT JOIN sections s ON t.section_id = s.id
    WHERE w.id IN (${placeholders})
  `;

    db.transaction(tx => {
      tx.executeSql(
        q,
        ids,
        (_, results) => {
          const words = [];
          for (let i = 0; i < results.rows.length; i++) {
            words.push(results.rows.item(i));
          }
          const topicName = getExportTopicName(words);
          setExportData({words, topicName});
          setShowExport(true);
        },
        () => Alert.alert('Помилка', 'Не вдалося завантажити слова.'),
      );
    });
  };

  const getExportTopicName = words => {
    const date = new Date().toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const topicIds = [...new Set(words.map(w => w.topic_id))];
    const sectionIds = [...new Set(words.map(w => w.section_id))];
    if (topicIds.length === 1)
      return `${words[0].topic_name ?? 'Список'} ${date}`;
    if (sectionIds.length === 1)
      return `${words[0].section_name ?? 'Секція'} ${date}`;
    return `Мікс ${date}`;
  };
  //*************************************************************** */
  const columns = [
    {
      label: '№w',
      accessor: 'pn',
      type: 'integer',
      width: 50,
      styleCell: {alignItems: 'center'},
      //   styleCellText: {color: 'green'},
    },
    {
      label: 'Зн',
      accessor: 'know',
      //   type: 'boolean',
      type: 'know',
      width: 40,
      styleCell: {alignItems: 'center'},
      styleCellText: {color: 'red'},
    },
    {
      label: 'Слова / вирази',
      accessor: 'word',
      type: 'text',
      width: 400,
      //   style: {backgroundColor: '#fff1'},
      //   styleCell: {alignItems: 'center'},
      //   styleCellText: {fontWeight: 'bold'},
      styleCellText: {fontWeight: 600},
    },
    {label: 'Переклад', accessor: 'translation', type: 'text', width: 400},
    {label: 'Група', accessor: 'group_key', type: 'text', width: 150},
    {label: 'Тип', accessor: 'type', type: 'text', width: 150},
    {label: 'Файл img', accessor: 'img', type: 'text', width: 150},
  ];

  //   console.log('WordsListLevels/words:', words);

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <SafeAreaView style={{flex: 1, backgroundColor: cPageBorderBg}}>
      <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} />
      <View style={[styles.pageContainer, {backgroundColor: cPageBg}]}>
        {/* Голова сторінки */}
        <View
          style={[styles.pageHeadContainer, {backgroundColor: cPageHeadBg}]}>
          <MyArrowBack
            // headText={'toHome'}
            // back={'Home'}
            color={cPageHeadText}
            colorIconBg={cPageHeadBg}
            sizeIcon={sPageHeadIcon}
            titleText={'Список слів'}
          />
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <LanguageSettingsModal pcBg={cModalBg} pcOn={cModalOn} />
            <WordsListLevelsHelpModal pcBg={cModalBg} pcOn={cModalOn} />
          </View>
        </View>
        {/* Body of the page */}
        {/* Індикатор перекладу */}
        {translate && (
          <View className="items-center mt-4">
            <ActivityIndicator size="large" color="#00f" />
            <Text className="mt-2 text-lg">Перекладаємо слова...</Text>
            <Text className="text-sm">
              Перекладено: {translatedCount} / {totalWords}
            </Text>
          </View>
        )}
        {/*  */}
        <TableViewLevels
          loading={loading} // Передаємо стан
          data={tData} // слова
          onRefresh={loadWords} //Оновлення data
          dataLevel1={tTopics} // теми
          dataLevel2={tSections} // секції
          setData={setTData}
          onSavePn={updateWordsPn}
          columns={columns}
          title={'Групи/Теми/Слова'}
          indexScheme={indexScheme} //колір
          onAdd={() => {
            navigation.navigate('WordsAdd');
          }}
          onEdit={activeRow => {
            console.log('WordsListLevels.js/onEdit={/ item=', activeRow);
            navigation.navigate('WordsEdit', {
              itemData: activeRow, // передаємо весь об'єкт item
            });
          }}
          onDelete={confirmDeleteRecord} // передаємо лише id
          onImport={importCSV}
          onTranslate={handleTranslate}
          onExportWordsToSite={handleExport}
          onSaveToAudio={saveSelectedToAudio}
          onImportText={() =>
            navigation.navigate('ImportText', {sections: tSections})
          }
          translate={translate} //Чи перекладено для зміни кнопки
          sectionId={'topic_id'} //🔒 Прив’язка переміщення до певного значення поля
          sectionName={'topic_name'} //Назва секції
          beforeSectionName={'Тема'} // Назва перед: назвою секції
          sortField={'pn'} //поле для порядку
          //
          onAddTopic={() => navigation.navigate('TopicsAdd')}
          onEditTopic={topic =>
            navigation.navigate('TopicsEdit', {itemData: topic})
          }
          onDeleteTopic={confirmDeleteTopic}
          onAddSection={() => navigation.navigate('SectionsAdd')}
          onEditSection={section =>
            navigation.navigate('SectionsEdit', {itemData: section})
          }
          onDeleteSection={confirmDeleteSection}
        />
      </View>
      {/* для експорту даних на сайт */}
      <Modal visible={showExport} animationType="slide">
        <AppWebView
          selectedWords={exportData?.words}
          topicName={exportData?.topicName}
          onClose={() => {
            setShowExport(false);
            setExportData(null);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default WordsListLevels;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    paddingHorizontal: 8, // або можна 8, 10 — в пікселях
    borderRadius: 15,
    margin: '2%', //Для бардюра Bg
  },
  pageHeadContainer: {
    // height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // gap: 8,
  },
});
