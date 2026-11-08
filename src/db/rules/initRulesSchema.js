// db/rules/initRulesSchema.js
//
// Той самий підхід, що й у initNotesSchema.js: спільне з'єднання
// (openDatabase з ../../dbConfig), таблиця повністю окрема від
// sections/topics/words. Викликати один раз поруч з initializeDatabase()
// та initializeNotesSchema() при старті застосунку.
//
// Свідомо ОДНА пласка таблиця, без rule_section/rule_themes:
// на 27 записів ділити зараз нема на що — секція й тема виходили
// рівно по 1 рядку і не додавали жодного реального групування,
// тільки зайві JOIN-и. Якщо колись з'явиться реальний поділ на
// категорії (наприклад "Граматика" / "Лексика") — додати
// `section_id` через ALTER TABLE на 27 рядках займе секунди,
// це не той випадок, де варто ускладнювати наперед.
//
// Дані (сід) винесені окремо в seedRules.js -> seedAllRules().
// Цей файл відповідає тільки за схему.
import {openDatabase} from '@/db/dbConfig';

export const initializeRulesSchema = () => {
  console.log('initializeRulesSchema()');
  const db = openDatabase();  
  db.transaction(
    tx => {
      // Видаляє таблицю rules ПОВНІСТЮ
      tx.executeSql(`DROP TABLE IF EXISTS rules`);
      //   Створення (ЯКЩО НЕМА)
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pn INTEGER DEFAULT 0,
          title TEXT DEFAULT '',
          content_json TEXT DEFAULT '',
          priority INTEGER DEFAULT 0
        )
      `);
    },

    error => {
      console.log('❌ Помилка транзакції (rules):', error);
    },

    () => {
      console.log('✅ Таблиця rules та індекс успішно створені.');
    },
  );
};
