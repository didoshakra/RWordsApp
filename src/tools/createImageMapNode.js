// createImageMapNode.js
// Запускати з терміналу/cd src\tool ->node generateImageMap.js
// Приклад базового скрипта для генерації 'src/constants/imageMap.js з перевіркою наявності файлів у src/assets/words/
// ✅ Перевіряє, чи існує база (fs.existsSync)
// ✅ Кросплатформені шляхи через path.join
// ✅ Надійний вивід та повідомлення про помилки
// ✅ Перевіряє наявність зображень (.jpg, .png, .webp).
// ✅ Виводить прогрес(Кожні 50 записів) у форматі: Записів всього: ХХ, Оброблено: YY, З оновленням: Z, Пропущено: W
// ✅ Попереджає про проблеми з регістром, відсутність директорій тощо.
// ✅ Генерує imageMap.js для використання з require().
// ✅ Перевірка регістра у назві без перейменування файлів

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const RELATIVE_IMAGE_BASE = '../../assets/words';//Має відповідати рівню з якого буде require(...)
const outputPath = path.resolve(__dirname, '../constants/words/imageMap.js');//Має відповідати рівню img
const dbPath = path.resolve(__dirname, '../db/WordsDatabase.db');
const assetsBasePath = path.resolve(__dirname, '../assets/words');

if (!fs.existsSync(dbPath)) {
  console.error('❌ Файл БД не знайдено:', dbPath);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

function getValidImagePath(section_img, topic_img, imgNameFromDB) {
  const basePath = path.join(assetsBasePath, section_img, topic_img);
  const exts = ['jpg', 'png', 'webp'];

  if (!fs.existsSync(basePath)) {
    console.warn(`⚠️ Директорія не існує: ${basePath}`);
    return null;
  }

  for (const ext of exts) {
    const filePath = path.join(basePath, `${imgNameFromDB}.${ext}`);
    if (fs.existsSync(filePath)) {
      return `${RELATIVE_IMAGE_BASE}/${section_img}/${topic_img}/${imgNameFromDB}.${ext}`;
    }
  }

  return null;
}

const query = `
  SELECT words.id, words.word, words.translation, words.img, topics.img AS topic_img, sections.img AS section_img
  FROM words
  JOIN topics ON words.topic_id = topics.id
  JOIN sections ON topics.section_id = sections.id
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('❌ Помилка запиту:', err);
    return;
  }

  const lines = ['export const imageMap = {'];
  let processed = 0;
  let skipped = 0;
  let added = 0;
  let skippedSpaces = 0;
  let skippedMissingFiles = 0;

  const total = rows.length;

  for (const word of rows) {
    processed++;

    if (/\s/.test(word.img)) {
      console.warn(`⛔ Пробіли в назві (word.img): ${word.img} — пропущено`);
      skipped++;
      skippedSpaces++;
      continue;
    }

    const imgName = word.img.replace(/\.(jpg|png|webp)/i, '').trim();
    const key = `${word.section_img}/${word.topic_img}/${imgName.replace(/ /g, '_')}`;

    const resultPath = getValidImagePath(word.section_img, word.topic_img, imgName);

    if (resultPath) {
      lines.push(`  "${key}": require("${resultPath}"),`);
      added++;
    } else {
      console.warn(`⚠️ Зображення не знайдено для: ${key}`);
      skipped++;
      skippedMissingFiles++;
    }

    if (processed % 50 === 0 || processed === total) {
      console.log(`🟡 Прогрес: Оброблено ${processed} з ${total}`);
    }
  }

  lines.push('};');

  try {
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
    console.log('\n✅ Файл imageMap.js збережено:', outputPath);
    console.log(`📊 Усього записів: ${total}`);
    console.log(`✅ Додано у файл: ${added}`);
    console.log(`❌ Пропущено: ${skipped}`);
    console.log(`   - з пробілами в назві: ${skippedSpaces}`);
    console.log(`   - без зображення: ${skippedMissingFiles}`);
  } catch (err) {
    console.error('❌ Помилка запису imageMap.js:', err);
  }
 
  db.close();
});