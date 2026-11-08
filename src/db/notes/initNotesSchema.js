// db/notes/initNotesSchema.js
//
// Підключення до БД — спільне (openDatabase з ../../dbConfig), а самі таблиці
// нотаток повністю окремі від sections/topics/words. Викликати цю функцію
// один раз поруч з initializeDatabase() при старті застосунку.
import {openDatabase} from '@/db/dbConfig';

export const initializeNotesSchema = () => {
  console.log('initializeNotesSchema()');
  const db = openDatabase();
  db.transaction(
    tx => {
      //   Видалення
      tx.executeSql(`DROP TABLE IF EXISTS notes`);
      tx.executeSql(`DROP TABLE IF EXISTS note_themes`);
      tx.executeSql(`DROP TABLE IF EXISTS note_section`); // якщо така таблиця вже випадково існує
      //   Створення (ЯКЩО НЕМА)
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS note_section (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pn INTEGER DEFAULT 0,
          name TEXT UNIQUE DEFAULT ''
        )
      `);

      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS note_themes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pn INTEGER DEFAULT 0,
          section_id INTEGER NOT NULL,
          name TEXT DEFAULT '',
          FOREIGN KEY (section_id) REFERENCES note_section(id) ON DELETE CASCADE
        )
      `);

      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pn INTEGER DEFAULT 0,
          theme_id INTEGER NOT NULL,
          text TEXT DEFAULT '',
          FOREIGN KEY (theme_id) REFERENCES note_themes(id) ON DELETE CASCADE
        )
      `);

      tx.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_notes_theme_id
        ON notes(theme_id)
      `);

      tx.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_note_themes_section_id
        ON note_themes(section_id)
      `);
    },

    error => {
      console.log('❌ Помилка транзакції:', error);
    },

    () => {
      console.log('✅ Таблиці та індекси успішно створені.');
    },
  );
};
