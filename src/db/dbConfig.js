// dbConfig.js//db.transaction
import SQLite from 'react-native-sqlite-2';
import RNFS from 'react-native-fs';
import {Platform} from 'react-native';

let db = null;
const DB_NAME = 'WordsDatabase.db';
const dbPath = `${RNFS.DocumentDirectoryPath}/${DB_NAME}`;

// === ВІДКРИТТЯ БАЗИ ДАНИХ ===
const openDatabase = () => {
  if (!db) {
    db = SQLite.openDatabase(DB_NAME, '1.0', '', 1);
    db.transaction(tx => {
      tx.executeSql(
        'PRAGMA foreign_keys = ON;',
        [],
        () => console.log('Foreign key constraints enabled'),
        (_, err) => console.log('Foreign key error:', err),
      );
    });
    console.log('Базу даних відкрито');
  }
  return db;
};

// === ПОВТОРНЕ ВІДКРИТТЯ (після видалення) ===
const reopenDatabase = () => {
  db = null;
  return openDatabase();
};

// === ІНІЦІАЛІЗАЦІЯ БАЗИ ДАНИХ ===
// Схема створюється з нуля (без міграцій): для зміни схеми — resetDatabase().
const initializeDatabase = () => {
  const db = openDatabase();
  db.transaction(tx => {
    // idweb — id запису на сайті (Postgres). NULL = запис створено локально.
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        link TEXT DEFAULT '',
        idweb INTEGER,
        pn INTEGER DEFAULT 0,
        name TEXT
      )
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idweb INTEGER,
        pn INTEGER DEFAULT 0,
        name TEXT,
        section_id INTEGER,
        link TEXT DEFAULT '',
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
      )
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idweb INTEGER,
        pn INTEGER DEFAULT 0,
        topic_id INTEGER,
        word TEXT,
        translation TEXT DEFAULT '',
        know INTEGER DEFAULT 0,
        img TEXT DEFAULT '',
        group_key TEXT DEFAULT '',
        type TEXT DEFAULT '',
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
      )
    `);

    // Унікальні індекси на idweb (NULL для локальних записів дозволено)
    ['sections', 'topics', 'words'].forEach(table => {
      tx.executeSql(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_idweb ON ${table}(idweb)`,
      );
    });

    // Індекс для швидкого COUNT(*) по topic_id
    tx.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_words_topic_id ON words(topic_id)
    `);

    console.log('Таблиці sections, topics, words створені (якщо не існували)');
  });
};

// === ВИДАЛЕННЯ ТАБЛИЦІ ===
const dropTable = tableName => {
  const db = openDatabase();
  db.transaction(tx => {
    tx.executeSql(
      `DROP TABLE IF EXISTS ${tableName}`,
      [],
      () => console.log(`Таблиця ${tableName} видалена`),
      (_, err) => console.log(`Помилка видалення таблиці ${tableName}:`, err),
    );
  });
};

// === ВИДАЛЕННЯ БАЗИ ДАНИХ ===
const deleteDatabase = async () => {
  //   const dbPath = `${RNFS.DocumentDirectoryPath}/${DB_NAME}`;
  try {
    const exists = await RNFS.exists(dbPath);
    if (exists) {
      await RNFS.unlink(dbPath);
      console.log('Базу даних видалено');
    } else {
      console.log('Файл бази даних не існує');
    }
    db = null;
  } catch (error) {
    console.log('Помилка при видаленні бази даних:', error);
  }
};

// === СКИНУТИ БАЗУ ДАНИХ ===
const resetDatabase = async () => {
  try {
    await deleteDatabase();

    // const dbPath = `${RNFS.DocumentDirectoryPath}/${DB_NAME}`;
    const exists = await RNFS.exists(dbPath);
    if (exists) {
      console.log('❌ База даних не була видалена!');
      return;
    }

    console.log('✅ Базу даних видалено, починаємо відновлення...');
    reopenDatabase();
    initializeDatabase();
    console.log('✅ База даних відновлена та ініціалізована');
  } catch (error) {
    console.log('❌ Помилка при скиданні бази даних:', error);
  }
};

// === КОПІЮВАННЯ З assets → внутрішня директорія ===
const copyDbFromAssets = async () => {
  if (__DEV__) return;
  //   const dbPath = `${RNFS.DocumentDirectoryPath}/${DB_NAME}`;
  const exists = await RNFS.exists(dbPath);
  if (exists) {
    console.log('База вже існує, копіювання не потрібне');
    return;
  }

  try {
    const sourcePath =
      Platform.OS === 'android' ? DB_NAME : `${RNFS.MainBundlePath}/${DB_NAME}`;

    await RNFS.copyFileAssets(sourcePath, dbPath);
    console.log('Базу скопійовано з assets до внутрішньої директорії');
  } catch (err) {
    console.log('Помилка копіювання з assets:', err);
  }
};

// === Перевірка існування БД і таблиці ===
export const databaseExists = async () => {
  try {
    // 1️⃣ Перевіряємо, чи існує файл БД
    const fileExists = await RNFS.exists(dbPath);
    if (!fileExists) {
      console.log('❌ Файл БД не знайдено:', dbPath);
      return false;
    }

    // 2️⃣ Файл є, але перевіримо хоча б мінімальну таблицю (без створення файлу)
    // Для цього відкриваємо DB в read-only режимі
    return new Promise(resolve => {
      const SQLite = require('react-native-sqlite-2'); // або SQLite із dbConfig
      const db = SQLite.openDatabase(
        {name: DB_NAME, location: 'default', readOnly: true}, // важливо readOnly
        () => {
          db.transaction(tx => {
            tx.executeSql(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='words';",
              [],
              (tx, results) => resolve(results.rows.length > 0),
              () => resolve(false),
            );
          });
        },
        err => {
          console.log('❌ Не вдалося відкрити БД у read-only:', err);
          resolve(false);
        },
      );
    });
  } catch (e) {
    console.log('❌ Помилка перевірки БД:', e);
    return false;
  }
};

// === КОПІЮВАННЯ З DocumentDirectoryPath → Download ===
const copyDatabaseToDownload = async () => {
  //   const dbPath = `${RNFS.DocumentDirectoryPath}/${DB_NAME}`;
  const targetPath = `${RNFS.DownloadDirectoryPath}/${DB_NAME}`;
  try {
    const dbExists = await RNFS.exists(dbPath);
    if (!dbExists) {
      console.log('⚠️ Файл БД для копіювання не знайдено:', dbPath);
      return;
    }

    const exists = await RNFS.exists(targetPath);
    if (exists) {
      await RNFS.unlink(targetPath);
      console.log('🗑️ Старий файл видалено');
    }

    await RNFS.copyFile(dbPath, targetPath);
    console.log('✅ БД скопійовано в Download');
  } catch (e) {
    console.log('❌ Помилка копіювання БД:', e);
  }
};

// === КОПІЮВАННЯ З Download → внутрішня директорія ===
const copyDatabaseFromDownload = async () => {
  const sourcePath = `${RNFS.DownloadDirectoryPath}/${DB_NAME}`;
  const targetPath = `/data/user/0/com.<name_your_package>/databases/${DB_NAME}`;

  try {
    const sourceExists = await RNFS.exists(sourcePath);
    if (!sourceExists) {
      console.log('⚠️ Файл БД у Download не знайдено. Копіювання скасовано.');
      return;
    }

    const fileInfo = await RNFS.stat(sourcePath);
    if (fileInfo.size === 0) {
      console.log('⚠️ Файл БД порожній. Копіювання скасовано.');
      return;
    }

    await RNFS.copyFile(sourcePath, targetPath);
    console.log('✅ БД скопійовано з Download у DocumentDirectoryPath');
  } catch (e) {
    console.log('❌ Помилка копіювання БД:', e);
  }
};

// === ЕКСПОРТ ===
export {
  openDatabase,
  reopenDatabase,
  initializeDatabase,
  dropTable,
  deleteDatabase,
  resetDatabase,
  copyDbFromAssets,
  copyDatabaseToDownload,
  copyDatabaseFromDownload,
};
