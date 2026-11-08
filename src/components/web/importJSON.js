// scr/components/web/importJSON.js
//idweb/ключовим має бути idweb/pn=MAX(pn)+1
import {Alert} from 'react-native';
import {openDatabase} from '../../db/dbConfig';

export const importJSON = payload => {
  const db = openDatabase();

  db.transaction(
    tx => {
      const sectionMap = {};
      const topicMap = {};
      let importedWordsCount = 0;

      // --- Функції послідовного імпорту ---
      function importSections(sectionIdx = 0) {
        if (sectionIdx >= payload.sections.length) {
          importTopics(); // переходимо до тем
          return;
        }

        const section = payload.sections[sectionIdx];
        tx.executeSql(
          'SELECT id FROM sections WHERE idweb = ?',
          [section.id],
          (_, result) => {
            if (result.rows.length > 0) {
              sectionMap[section.id] = result.rows.item(0).id;
              importSections(sectionIdx + 1);
            } else {
              tx.executeSql(
                'INSERT INTO sections (idweb, name, pn, link) VALUES (?, ?, ?, ?)',
                [section.id, section.name, 0, section.link || ''],
                (_, insertResult) => {
                  sectionMap[section.id] = insertResult.insertId;
                  importSections(sectionIdx + 1);
                },
              );
            }
          },
        );
      }

      function importTopics(topicIdx = 0) {
        if (topicIdx >= payload.topics.length) {
          importWords(); // переходимо до слів
          return;
        }

        const topic = payload.topics[topicIdx];
        const sectionId = sectionMap[topic.section_id] || null;

        tx.executeSql(
          'SELECT id FROM topics WHERE idweb = ?',
          [topic.id],
          (_, result) => {
            if (result.rows.length > 0) {
              topicMap[topic.id] = result.rows.item(0).id;
              importTopics(topicIdx + 1);
            } else {
              tx.executeSql(
                'INSERT INTO topics (idweb, name, section_id, pn, link) VALUES (?, ?, ?, ?, ?)',
                [topic.id, topic.name, sectionId, 0, topic.link || ''],
                (_, insertResult) => {
                  topicMap[topic.id] = insertResult.insertId;
                  importTopics(topicIdx + 1);
                },
              );
            }
          },
        );
      }

      function importWords(wordIdx = 0) {
        if (wordIdx >= payload.words.length) {
          setTimeout(() => {
            Alert.alert('✅ Успіх', `Імпортовано ${importedWordsCount} слів`);
          }, 500);
          return;
        }

        const word = payload.words[wordIdx];
        const topicId = topicMap[word.topic_id] || null;

        if (!topicId) {
          wordIdx++;
          importWords(wordIdx);
          return;
        }

        tx.executeSql(
          'SELECT id FROM words WHERE idweb = ?',
          [word.id],
          (_, result) => {
            if (result.rows.length > 0) {
              importWords(wordIdx + 1);
            } else {
              tx.executeSql(
                'INSERT INTO words (idweb, word, translation, img, group_key, type, topic_id, pn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  word.id,
                  word.word,
                  word.translation || '',
                  word.img || '',
                  word.group_key || '',
                  word.type || '',
                  topicId,
                  0,
                ],
                () => {
                  importedWordsCount++;
                  importWords(wordIdx + 1);
                },
              );
            }
          },
        );
      }

      // --- Починаємо імпорт ---
      importSections();
    },
    error => {
      console.error('Помилка імпорту JSON:', error);
      Alert.alert('Помилка', 'Не вдалося імпортувати JSON');
    },
  );
};
