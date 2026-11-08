// /scripts/generateImageMap.js://Оновлений код для react-native-sqlite-2:
//результит в /src/imageMap.js ← буде створено скриптом
import SQLite from 'react-native-sqlite-2';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'WordsDatabase.db'); // Заміни на свій шлях до БД

// Функція для створення imageMap
const generateImageMap = async () => {
  const db = SQLite.openDatabase(dbPath);

  const query = `
    SELECT words.img AS word_img, topics.img AS topic_img, sections.img AS section_img
    FROM words
    JOIN topics ON words.topic_id = topics.id
    JOIN sections ON topics.section_id = sections.id
  `;

  try {
    const result = await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          query,
          [],
          (_, {rows}) => resolve(rows),
          (_, err) => reject(err),
        );
      });
    });

    const outputLines = [];
    result._array.forEach(word => {
      if (word.section_img && word.topic_img && word.word_img) {
        const imgName = word.word_img.replace('.jpg', '').trim();
        const key = `${word.section_img}/${word.topic_img}/${imgName}`;
        const path = `./words/${word.section_img}/${word.topic_img}/${imgName}.jpg`;
        outputLines.push(`  "${key}": require("${path}"),`);
      }
    });

    // Створення файлу imageMap.js
    const outputPath = path.join(__dirname, 'imageMap.js');
    const outputData = `const imageMap = {\n${outputLines.join(
      '\n',
    )}\n};\nexport default imageMap;`;
    fs.writeFileSync(outputPath, outputData);
    console.log('imageMap.js успішно згенеровано');
  } catch (error) {
    console.error('Помилка при генерації imageMap:', error);
  }
};

generateImageMap();