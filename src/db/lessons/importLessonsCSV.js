// db/lessons/importLessonsCSV.js
//
// Формат файлу (аналог importCSV для слів, тільки один рівень
// ієрархії замість двох):
//
// *A1
// Урок 1: Я і особиста інформація;Займенники: особові
// Урок 2: Мій розпорядок дня;Дієслово: часи
// Урок 3: Кольори та речі;
// *A2
// ...
//
// Перший рядок файлу — назва рівня (з "*" або без, як і перший
// рядок секції в importCSV для слів). "*Назва" посеред файлу —
// перемикає на новий рівень. Кожен рядок уроку: title;ruleTitle
// (ruleTitle можна лишити порожнім).
//
// Ідемпотентно: урок з тією самою назвою в тому самому рівні
// не додається вдруге (перевірка перед INSERT) — щоб повторний
// імпорт того самого файлу не плодив дублі (як колись сталось
// із seedAllLessons()).
import RNFS from 'react-native-fs';
import {pick} from '@react-native-documents/picker';

import {openDatabase} from '@/db/dbConfig';
import {insertLesson} from './lessonsActions';

const selectFile = async () => {
  const res = await pick({allowMultiSelection: false, type: '*/*'});
  const file = res?.[0];
  if (!file) return null;
  file.path = file.uri.replace('file://', '');
  return file;
};

// Знаходить level_id по назві, або створює новий рівень
const resolveOrCreateLevelId = levelName => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id FROM levels WHERE name = ? LIMIT 1',
        [levelName],
        (_, res) => {
          if (res.rows.length > 0) {
            resolve(res.rows.item(0).id);
            return;
          }
          tx.executeSql(
            'SELECT COALESCE(MAX(pn), 0) + 1 AS nextPn FROM levels',
            [],
            (_, pnRes) => {
              const nextPn = pnRes.rows.item(0).nextPn;
              tx.executeSql(
                'INSERT INTO levels (name, pn) VALUES (?, ?)',
                [levelName, nextPn],
                (_, insertRes) => resolve(insertRes.insertId),
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

const nextLessonPn = levelId => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT COALESCE(MAX(pn), 0) + 1 AS nextPn FROM lessons WHERE level_id = ?',
        [levelId],
        (_, res) => resolve(res.rows.item(0).nextPn),
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

const lessonExists = (levelId, title) => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id FROM lessons WHERE level_id = ? AND title = ? LIMIT 1',
        [levelId, title],
        (_, res) => resolve(res.rows.length > 0),
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

// Текст файлу -> [{levelName, lessons: [{title, ruleTitle}]}]
function parseLessonsCSV(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('//'));

  const levels = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('*')) {
      const name = line.substring(1).trim();
      current = {levelName: name, lessons: []};
      levels.push(current);
    } else if (!current) {
      // Перший рядок файлу без "*" — теж назва рівня
      current = {levelName: line, lessons: []};
      levels.push(current);
    } else {
      const parts = line.split(';').map(s => s.trim());
      const title = parts[0];
      if (!title) continue;
      const ruleTitle = parts[1] || null;
      current.lessons.push({title, ruleTitle});
    }
  }
  return levels;
}

export const importLessonsCSV = async () => {
  const file = await selectFile();
  if (!file) throw new Error('Файл не вибрано');

  const content = await RNFS.readFile(file.path, 'utf8');
  const levels = parseLessonsCSV(content);

  let importedCount = 0;
  let skippedCount = 0;

  for (const levelBlock of levels) {
    const levelId = await resolveOrCreateLevelId(levelBlock.levelName);
    for (const lesson of levelBlock.lessons) {
      const exists = await lessonExists(levelId, lesson.title);
      if (exists) {
        skippedCount++;
        continue;
      }
      const pn = await nextLessonPn(levelId);
      await insertLesson(levelId, pn, lesson.title, lesson.ruleTitle);
      importedCount++;
    }
  }

  return {importedCount, skippedCount};
};
