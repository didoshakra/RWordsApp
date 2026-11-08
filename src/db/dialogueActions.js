// db/dialogueActions.js

import { openDatabase } from './dbConfig';

// Формат дати: "Діалоги ДД.ММ.РРРР"
const getTodayTopicName = () => {
  const now = new Date();
  const dd   = String(now.getDate()).padStart(2, '0');
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `Діалоги ${dd}.${mm}.${yyyy}`;
};

// Знаходить або створює секцію "Діалоги" + тему "Діалоги ДД.ММ.РРРР"
// Повертає Promise<topicId>
const getOrCreateDialogueTopic = () => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    const sectionName = 'Діалоги';
    const topicName   = getTodayTopicName();

    db.transaction(tx => {
      // 1. Шукаємо секцію "Діалоги"
      tx.executeSql(
        'SELECT id FROM sections WHERE name = ? LIMIT 1',
        [sectionName],
        (_, { rows }) => {
          if (rows.length > 0) {
            // Секція є — шукаємо тему
            const sectionId = rows.item(0).id;
            findOrCreateTopic(tx, sectionId, topicName, resolve, reject);
          } else {
            // Секції немає — створюємо
            tx.executeSql(
              'SELECT MAX(pn) as maxPn FROM sections',
              [],
              (_, res) => {
                const pn = (res.rows.item(0).maxPn || 0) + 1;
                tx.executeSql(
                  'INSERT INTO sections (name, img, pn) VALUES (?, ?, ?)',
                  [sectionName, 'other', pn],
                  (_, insertRes) => {
                    const sectionId = insertRes.insertId;
                    findOrCreateTopic(tx, sectionId, topicName, resolve, reject);
                  },
                  (_, err) => { reject(err); return true; },
                );
              },
              (_, err) => { reject(err); return true; },
            );
          }
        },
        (_, err) => { reject(err); return true; },
      );
    });
  });
};

const findOrCreateTopic = (tx, sectionId, topicName, resolve, reject) => {
  // Шукаємо тему по назві і секції
  tx.executeSql(
    'SELECT id FROM topics WHERE name = ? AND section_id = ? LIMIT 1',
    [topicName, sectionId],
    (_, { rows }) => {
      if (rows.length > 0) {
        resolve(rows.item(0).id);
      } else {
        // Створюємо тему
        tx.executeSql(
          'SELECT MAX(pn) as maxPn FROM topics WHERE section_id = ?',
          [sectionId],
          (_, res) => {
            const pn = (res.rows.item(0).maxPn || 0) + 1;
            tx.executeSql(
              'INSERT INTO topics (name, img, section_id, pn) VALUES (?, ?, ?, ?)',
              [topicName, 'other', sectionId, pn],
              (_, insertRes) => resolve(insertRes.insertId),
              (_, err) => { reject(err); return true; },
            );
          },
          (_, err) => { reject(err); return true; },
        );
      }
    },
    (_, err) => { reject(err); return true; },
  );
};

// Основна функція — зберегти діалог в SQLite
// word = оригінал (укр.), translation = переклад (англ.)
export const saveDialogueToSQLite = (original, translation) => {
  return new Promise(async (resolve, reject) => {
    try {
      const topicId = await getOrCreateDialogueTopic();
      const db = openDatabase();

      db.transaction(tx => {
        tx.executeSql(
          'SELECT MAX(pn) as maxPn FROM words WHERE topic_id = ?',
          [topicId],
          (_, res) => {
            const pn = (res.rows.item(0).maxPn || 0) + 1;
            tx.executeSql(
              `INSERT INTO words (topic_id, word, translation, know, img, group_key, type, pn)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [topicId, original.trim(), translation.trim(), 0, '', '', 'dialogue', pn],
              (_, insertRes) => resolve(insertRes.insertId),
              (_, err) => { reject(err); return true; },
            );
          },
          (_, err) => { reject(err); return true; },
        );
      });
    } catch (err) {
      reject(err);
    }
  });
};
