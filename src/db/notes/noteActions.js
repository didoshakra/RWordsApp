// db/notes/noteActions.js
//
// react-native-sqlite-2 працює через callback-based транзакції:
//   db.transaction(tx => tx.executeSql(sql, params, onSuccess, onError))
// Тут це обгорнуто в проміси, щоб решта коду (NoteRecorderScreen,
// SectionAdd/Edit, ThemesAdd/Edit) могла просто await-ити.
// Підключення (openDatabase) — спільне з dbConfig.js.
import {openDatabase} from '@/db/dbConfig';

// ─── Низькорівнева проміс-обгортка над executeSql ──────────────────────────
const runSql = (sql, params = []) => {
  const db = openDatabase();
  return new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          sql,
          params,
          (_, results) => resolve(results),
          (_, error) => {
            reject(error);
            return false; // не відкочувати всю транзакцію без потреби
          },
        );
      },
      error => reject(error),
    );
  });
};

// ─── Section: "сьогодні" як ключ (формат YYYY-MM-DD, локальна дата) ─────────
const todayKey = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Повертає id групи на сьогодні, створюючи її за потреби.
export const getOrCreateTodaySection = async () => {
  const name = todayKey();
  await runSql('INSERT OR IGNORE INTO note_section (name) VALUES (?);', [name]);
  const results = await runSql('SELECT id FROM note_section WHERE name = ?;', [
    name,
  ]);
  return results.rows.item(0).id;
};

// ─── Section (note_section) — ручне додавання/редагування ──────────────────
export const getAllNoteSections = async () => {
  const results = await runSql(
    'SELECT * FROM note_section ORDER BY name ASC;',
  );
  const sections = [];
  for (let i = 0; i < results.rows.length; i++)
    sections.push(results.rows.item(i));
  return sections;
};

export const createNoteSection = async name => {
  const maxPnResult = await runSql('SELECT MAX(pn) as maxPn FROM note_section;');
  const maxPn = maxPnResult.rows.item(0).maxPn;
  const newPn = maxPn != null ? maxPn + 1 : 1;

  const results = await runSql(
    'INSERT INTO note_section (name, pn) VALUES (?, ?);',
    [name.trim(), newPn],
  );
  return results.insertId;
};

export const updateNoteSection = async (sectionId, name) => {
  await runSql('UPDATE note_section SET name = ? WHERE id = ?;', [
    name.trim(),
    sectionId,
  ]);
};

export const deleteNoteSection = async sectionId => {
  await runSql('DELETE FROM note_section WHERE id = ?;', [sectionId]);
};

// ─── Theme ──────────────────────────────────────────────────────────────
export const createNoteTheme = async (sectionId, themeName) => {
  const maxPnResult = await runSql(
    'SELECT MAX(pn) as maxPn FROM note_themes WHERE section_id = ?;',
    [sectionId],
  );
  const maxPn = maxPnResult.rows.item(0).maxPn;
  const newPn = maxPn != null ? maxPn + 1 : 1;

  const results = await runSql(
    'INSERT INTO note_themes (section_id, name, pn) VALUES (?, ?, ?);',
    [sectionId, themeName.trim(), newPn],
  );
  return results.insertId;
};

// Редагування теми: перейменування та/або перенесення в іншу групу.
// Якщо sectionId змінюється, pn НЕ перераховується під нову групу —
// за потреби відсортуй/переіндексуй через onSavePn у списку.
export const updateNoteTheme = async (themeId, sectionId, name) => {
  await runSql(
    'UPDATE note_themes SET section_id = ?, name = ? WHERE id = ?;',
    [sectionId, name.trim(), themeId],
  );
};

export const deleteNoteTheme = async themeId => {
  await runSql('DELETE FROM note_themes WHERE id = ?;', [themeId]);
};

export const getThemeById = async themeId => {
  const results = await runSql('SELECT * FROM note_themes WHERE id = ?;', [
    themeId,
  ]);
  return results.rows.length ? results.rows.item(0) : null;
};

export const getThemesBySection = async sectionId => {
  const results = await runSql(
    'SELECT * FROM note_themes WHERE section_id = ? ORDER BY pn  ASC;',
    [sectionId],
  );
  const themes = [];
  for (let i = 0; i < results.rows.length; i++)
    themes.push(results.rows.item(i));
  return themes;
};

export const getLatestThemeBySection = async sectionId => {
  const results = await runSql(
    'SELECT * FROM note_themes WHERE section_id = ? ORDER BY pn DESC LIMIT 1;',
    [sectionId],
  );
  return results.rows.length ? results.rows.item(0) : null;
};

// ─── Notes ──────────────────────────────────────────────────────────────
export const addNote = async (themeId, text) => {
  const maxPnResult = await runSql(
    'SELECT MAX(pn) as maxPn FROM notes WHERE theme_id = ?;',
    [themeId],
  );
  const maxPn = maxPnResult.rows.item(0).maxPn;
  const newPn = maxPn != null ? maxPn + 1 : 1;

  const results = await runSql(
    'INSERT INTO notes (theme_id, text, pn) VALUES (?, ?, ?);',
    [themeId, text.trim(), newPn],
  );
  return results.insertId;
};

export const updateNote = async (noteId, text) => {
  await runSql('UPDATE notes SET text = ? WHERE id = ?;', [
    text.trim(),
    noteId,
  ]);
};

export const deleteNote = async noteId => {
  await runSql('DELETE FROM notes WHERE id = ?;', [noteId]);
};

export const getNotesByTheme = async themeId => {
  const results = await runSql(
    'SELECT * FROM notes WHERE theme_id = ? ORDER BY pn  ASC;',
    [themeId],
  );
  const notes = [];
  for (let i = 0; i < results.rows.length; i++)
    notes.push(results.rows.item(i));
  return notes;
};

export const updateNotesPn = async reindexedNotes => {
  for (const note of reindexedNotes) {
    await runSql('UPDATE notes SET pn = ? WHERE id = ?;', [note.pn, note.id]);
  }
};
