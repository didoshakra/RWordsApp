// db/lessons/initLessonsSchema.js
import {openDatabase} from '@/db/dbConfig';

export const initializeLessonsSchema = () => {
  console.log('initializeLessonsSchema()');
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql(`DROP TABLE IF EXISTS lesson_topics`);
        tx.executeSql(`DROP TABLE IF EXISTS lessons`);
        tx.executeSql(`DROP TABLE IF EXISTS levels`);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS levels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pn INTEGER DEFAULT 0,
            name TEXT UNIQUE DEFAULT ''
          )
        `);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS lessons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pn INTEGER DEFAULT 0,
            title TEXT DEFAULT '',
            rule_id INTEGER,
            level_id INTEGER,
            status TEXT DEFAULT 'draft',
            FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
            FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE SET NULL
          )
        `);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS lesson_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lesson_id INTEGER,
            topic_id INTEGER,
            pn INTEGER DEFAULT 0,
            FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
            FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
            UNIQUE(lesson_id, topic_id)
          )
        `);

        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_lesson_topics_lesson_id ON lesson_topics(lesson_id)`,
        );
        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_lessons_level_id ON lessons(level_id)`,
        );
      },
      error => {
        console.log('❌ Помилка транзакції (lessons):', error);
        reject(error);
      },
      () => {
        console.log(
          '✅ Таблиці levels, lessons, lesson_topics та індекси успішно створені.',
        );
        resolve();
      },
    );
  });
};
