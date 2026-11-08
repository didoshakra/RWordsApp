// db/lessons/lessonsActions.js
import {openDatabase} from '@/db/dbConfig';

// ===== Резолвінг по назві (не по хардкодженому id) =====

const resolveRuleId = ruleTitle => {
  return new Promise((resolve, reject) => {
    if (!ruleTitle) {
      resolve(null);
      return;
    }
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id FROM rules WHERE title = ? LIMIT 1',
        [ruleTitle],
        (_, results) => {
          if (results.rows.length > 0) resolve(results.rows.item(0).id);
          else {
            console.log(
              `⚠️ Правило не знайдено: "${ruleTitle}", rule_id = NULL`,
            );
            resolve(null);
          }
        },
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

// ===== Levels =====

export const getAllLevels = () => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM levels ORDER BY pn ASC',
        [],
        (_, results) => {
          const rows = [];
          for (let i = 0; i < results.rows.length; i++)
            rows.push(results.rows.item(i));
          resolve(rows);
        },
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

// ===== Lessons CRUD =====

export const insertLesson = async (levelId, pn, title, ruleTitle = null) => {
  const ruleId = await resolveRuleId(ruleTitle);

  const lessonId = await new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql(
          `INSERT INTO lessons (level_id, pn, title, rule_id, status)
           VALUES (?, ?, ?, ?, 'draft')`,
          [levelId, pn, title, ruleId],
          (_, results) => resolve(results.insertId),
        );
      },
      error => reject(error),
    );
  });

  return lessonId;
};

export const getLessonsByLevelId = levelId => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM lessons WHERE level_id = ? ORDER BY pn ASC',
        [levelId],
        (_, results) => {
          const lessons = [];
          for (let i = 0; i < results.rows.length; i++)
            lessons.push(results.rows.item(i));
          resolve(lessons);
        },
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

export const deleteLessons = ids => {
  return new Promise((resolve, reject) => {
    if (!ids || ids.length === 0) {
      resolve();
      return;
    }
    const idsString = ids.join(',');
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql(`DELETE FROM lessons WHERE id IN (${idsString})`);
      },
      error => reject(error),
      () => resolve(),
    );
  });
};

// ===== Прив'язка тем до уроку (lesson_topics) =====

export const addTopicToLesson = (lessonId, topicId, pn = 0) => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql(
          `INSERT OR IGNORE INTO lesson_topics (lesson_id, topic_id, pn) VALUES (?, ?, ?)`,
          [lessonId, topicId, pn],
        );
      },
      error => reject(error),
      () => resolve(),
    );
  });
};

export const getLessonTopics = lessonId => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT t.id AS topic_id, t.name AS topic_name, s.name AS section_name
         FROM lesson_topics lt
         JOIN topics t ON lt.topic_id = t.id
         JOIN sections s ON t.section_id = s.id
         WHERE lt.lesson_id = ?
         ORDER BY lt.pn, t.pn`,
        [lessonId],
        (_, results) => {
          const rows = [];
          for (let i = 0; i < results.rows.length; i++)
            rows.push(results.rows.item(i));
          resolve(rows);
        },
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

export const removeTopicFromLesson = (lessonId, topicId) => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql(
          'DELETE FROM lesson_topics WHERE lesson_id = ? AND topic_id = ?',
          [lessonId, topicId],
        );
      },
      error => reject(error),
      () => resolve(),
    );
  });
};

export const getAllTopicsGrouped = () => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT t.id AS topic_id, t.name AS topic_name, s.name AS section_name
         FROM topics t JOIN sections s ON t.section_id = s.id
         ORDER BY s.pn ASC, t.pn ASC`,
        [],
        (_, results) => {
          const rows = [];
          for (let i = 0; i < results.rows.length; i++)
            rows.push(results.rows.item(i));
          resolve(rows);
        },
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

// Слова уроку — через прив'язані теми (для кроку "Контент" і Dialogue)
export const getWordsByLesson = lessonId => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT w.* FROM words w
         JOIN lesson_topics lt ON w.topic_id = lt.topic_id
         WHERE lt.lesson_id = ?
         ORDER BY lt.pn, w.pn`,
        [lessonId],
        (_, results) => {
          const words = [];
          for (let i = 0; i < results.rows.length; i++)
            words.push(results.rows.item(i));
          resolve(words);
        },
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

// Слова конкретної теми (для попереднього перегляду при прив'язці)
export const getWordsByTopicId = topicId => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT id, word, translation, type FROM words WHERE topic_id = ? ORDER BY pn ASC',
        [topicId],
        (_, results) => {
          const rows = [];
          for (let i = 0; i < results.rows.length; i++) rows.push(results.rows.item(i));
          resolve(rows);
        },
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};
export const insertLevel = (name, pn = null) => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql(
          'SELECT MAX(pn) as maxPn FROM levels',
          [],
          (_, result) => {
            const maxPn = result.rows.item(0).maxPn;
            const newPn = pn != null ? pn : maxPn != null ? maxPn + 1 : 1;
            tx.executeSql(
              'INSERT INTO levels (name, pn) VALUES (?, ?)',
              [name, newPn],
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
      error => reject(error),
    );
  });
};

export const updateLevel = (id, name) => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql(
          'UPDATE levels SET name = ? WHERE id = ?',
          [name, id],
          (_, results) => resolve(results.rowsAffected > 0),
          (_, error) => {
            reject(error);
            return true;
          },
        );
      },
      error => reject(error),
    );
  });
};

export const getLessonsCountByLevelId = levelId => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT COUNT(*) as count FROM lessons WHERE level_id = ?',
        [levelId],
        (_, results) => resolve(results.rows.item(0).count),
        (_, error) => {
          reject(error);
          return true;
        },
      );
    });
  });
};

export const deleteLevel = id => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql('PRAGMA foreign_keys = ON;');
        tx.executeSql(
          'DELETE FROM levels WHERE id = ?',
          [id],
          (_, results) => resolve(results.rowsAffected > 0),
          (_, error) => {
            reject(error);
            return true;
          },
        );
      },
      error => reject(error),
    );
  });
};