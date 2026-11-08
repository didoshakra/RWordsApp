// db/rules/rulesActions.js
//
// Аналог noteActions.js, але для пласкої таблиці rules.
// Тут же — парсер простого текстового формату таблиці (розділювач "|"),
// щоб не змушувати вручну писати JSON у формі Додавання/Редагування.
import {openDatabase} from '@/db/dbConfig';

// =====================================================================
// Текст ("Час | Формула\nPresent Simple | Підмет + ...") <-> {columns, rows}
// =====================================================================

// Перший непорожній рядок — заголовки колонок, решта — рядки даних.
// Кидає Error з людяним поясненням, якщо кількість комірок не збігається.
export function parseRuleTableText(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    throw new Error(
      'Потрібен рядок заголовків і хоча б один рядок даних, розділені "|"',
    );
  }

  const columns = lines[0].split('|').map(c => c.trim());
  const rows = lines.slice(1).map(line => {
    const cells = line.split('|').map(c => c.trim());
    if (cells.length !== columns.length) {
      throw new Error(
        `Рядок "${line}" має ${cells.length} комірок, а заголовок — ${columns.length}. Порахуй "|" ще раз.`,
      );
    }
    return cells;
  });

  return {columns, rows};
}

// Зворотна дія — для попереднього заповнення форми при редагуванні.
export function stringifyRuleTableText(content) {
  const lines = [content.columns.join(' | ')];
  content.rows.forEach(row => lines.push(row.join(' | ')));
  return lines.join('\n');
}

// =====================================================================
// CRUD — усі функції повертають Promise, як noteActions
// =====================================================================

export const insertRule = (title, tableText) => {
  return new Promise((resolve, reject) => {
    let content;
    try {
      content = parseRuleTableText(tableText);
    } catch (e) {
      reject(e);
      return;
    }

    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT COALESCE(MAX(pn), -1) + 1 AS nextPn FROM rules',
        [],
        (_, results) => {
          const nextPn = results.rows.item(0).nextPn;
          tx.executeSql(
            'INSERT INTO rules (pn, title, content_json) VALUES (?, ?, ?)',
            [nextPn, title, JSON.stringify(content)],
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

export const updateRule = (id, title, tableText) => {
  return new Promise((resolve, reject) => {
    let content;
    try {
      content = parseRuleTableText(tableText);
    } catch (e) {
      reject(e);
      return;
    }

    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql('UPDATE rules SET title = ?, content_json = ? WHERE id = ?', [
          title,
          JSON.stringify(content),
          id,
        ]);
      },
      error => reject(error),
      () => resolve(),
    );
  });
};

export const deleteRules = ids => {
  return new Promise((resolve, reject) => {
    if (!ids || ids.length === 0) {
      resolve();
      return;
    }
    const idsString = ids.join(',');
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql(`DELETE FROM rules WHERE id IN (${idsString})`);
      },
      error => reject(error),
      () => resolve(),
    );
  });
};

export const toggleRulePriority = (id, value) => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(
      tx => {
        tx.executeSql('UPDATE rules SET priority = ? WHERE id = ?', [
          value ? 1 : 0,
          id,
        ]);
      },
      error => reject(error),
      () => resolve(),
    );
  });
};

// Той самий "reindexed" масив, що будує moveSelectedRow у TableViewLevels
export const updateRulesPn = reindexed => {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.transaction(
      tx => {
        reindexed.forEach(r => {
          tx.executeSql('UPDATE rules SET pn = ? WHERE id = ?', [r.pn, r.id]);
        });
      },
      error => reject(error),
      () => resolve(),
    );
  });
};
