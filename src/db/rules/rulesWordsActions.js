// db/rules/rulesWordsActions.js
//
// CRUD-логіка для слів-прикладів граматичних правил (words) — за тим
// самим Promise-патерном, що й rulesActions.js/lessonsActions.js.
//
// Ці слова живуть у ЗВИЧАЙНІЙ таблиці words (10к+ записів), просто
// прив'язані через topic_id до окремої секції "Граматика A1", яка не
// перетинається з темами Оксфорда. Зв'язок з конкретними уроками
// (lesson_words) — окремий, пізніший крок, НЕ робимо тут.
import {openDatabase} from '@/db/dbConfig';

const GRAMMAR_SECTION_NAME = 'Граматика A1';


// Видаляє ТІЛЬКИ слова секції "Граматика A1" — не чіпає жодного
// іншого слова в words (10к+ реальних слів користувача лишаються
// недоторканими). Викликати перед повторним seedGrammarA1*(), якщо
// потрібно перезалити контент без дублів.
export const clearGrammarWords = () => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql(`
          DELETE FROM words WHERE topic_id IN (
            SELECT topics.id FROM topics
            JOIN sections ON topics.section_id = sections.id
            WHERE sections.name = 'Граматика A1'
          )
        `);
      },
      error => reject(error),
      () => {
        console.log('✅ clearGrammarWords: слова секції "Граматика A1" видалено');
        resolve();
      },
    );
  });
};

// =====================================================================
// Підготовка структури: секція + теми (по одній на кожне правило,
// що потребує word/phrase/sentence контенту). Викликати ОДИН РАЗ
// перед першим сідуванням слів (ensureGrammarTopics є ідемпотентною —
// повторний виклик не створює дублів завдяки перевірці існування).
// =====================================================================

const getOrCreateSection = () => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id FROM sections WHERE name = ? LIMIT 1',
        [GRAMMAR_SECTION_NAME],
        (_, results) => {
          if (results.rows.length > 0) {
            resolve(results.rows.item(0).id);
            return;
          }
          // Секції нема — створюємо, pn = MAX(pn)+1, як у rulesActions.js
          tx.executeSql(
            'SELECT COALESCE(MAX(pn), -1) + 1 AS nextPn FROM sections',
            [],
            (_, pnResults) => {
              const nextPn = pnResults.rows.item(0).nextPn;
              tx.executeSql(
                'INSERT INTO sections (pn, name) VALUES (?, ?)',
                [nextPn, GRAMMAR_SECTION_NAME],
                (_, insertResult) => resolve(insertResult.insertId),
                (_, error) => {
                  reject(error);
                  return true;
                },
              );
            },
            (_, error) => {
              reject(error);
              return true;
            },
          );
        },
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

const getOrCreateTopic = (sectionId, topicName) => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id FROM topics WHERE section_id = ? AND name = ? LIMIT 1',
        [sectionId, topicName],
        (_, results) => {
          if (results.rows.length > 0) {
            resolve(results.rows.item(0).id);
            return;
          }
          tx.executeSql(
            'SELECT COALESCE(MAX(pn), -1) + 1 AS nextPn FROM topics WHERE section_id = ?',
            [sectionId],
            (_, pnResults) => {
              const nextPn = pnResults.rows.item(0).nextPn;
              tx.executeSql(
                'INSERT INTO topics (pn, name, section_id) VALUES (?, ?, ?)',
                [nextPn, topicName, sectionId],
                (_, insertResult) => resolve(insertResult.insertId),
                (_, error) => {
                  reject(error);
                  return true;
                },
              );
            },
            (_, error) => {
              reject(error);
              return true;
            },
          );
        },
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

// Список правил, для яких потрібна тема в "Граматика A1" — узгоджений
// список 21 правила (виключає 6, що обходяться тільки таблицею rules).
export const GRAMMAR_TOPIC_NAMES = [
  'Речення: будова',
  'Дієслово: форми (початкова, минула, третя, -ing)',
  'Дієслово: питання і заперечення з do/does/did',
  'Дієслово: часи',
  'Дієслово: модальні',
  'Дієслово: пасивний стан',
  'Займенники: присвійні',
  'Займенники: зворотні',
  'Займенники: вказівні',
  'Займенники: неозначені',
  'Займенники: кількісні',
  'Прийменники: місця',
  'Слова: питальні',
  'Слова: маркери часу',
  'Речення: умовні',
  'Прикметники: ступені порівняння',
  'Прислівники',
  'Сполучники',
  'Іменник: відмінки',
  'Іменник: неправильна множина',
  'Прийменники: інші',
];

// Створює секцію "Граматика A1" і всі 21 тему (якщо ще не існують).
// Повертає {sectionId, topicIdByName: {назва: id}}
export const ensureGrammarTopics = async () => {
  const sectionId = await getOrCreateSection();
  const topicIdByName = {};
  for (const topicName of GRAMMAR_TOPIC_NAMES) {
    topicIdByName[topicName] = await getOrCreateTopic(sectionId, topicName);
  }
  console.log(
    '✅ ensureGrammarTopics: секція та',
    GRAMMAR_TOPIC_NAMES.length,
    'тем готові',
  );
  return {sectionId, topicIdByName};
};

// =====================================================================
// Вставка одного слова (word/phrase/sentence) — вимагає вже готовий
// topicId (беремо з topicIdByName, отриманого через ensureGrammarTopics)
// =====================================================================

export const insertRuleWord = (topicId, word, translation, type, groupKey) => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT COALESCE(MAX(pn), -1) + 1 AS nextPn FROM words WHERE topic_id = ?',
        [topicId],
        (_, results) => {
          const nextPn = results.rows.item(0).nextPn;
          tx.executeSql(
            `INSERT INTO words (pn, topic_id, word, translation, type, group_key)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nextPn, topicId, word, translation, type, groupKey],
            () => resolve(),
            (_, error) => {
              reject(error);
              return true;
            },
          );
        },
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};
