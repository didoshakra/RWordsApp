***2025.04.26/RN"0.79.1".//sqlite-2
//2025.05.20/Глобальна переробка схеми
// До VoskControl.js -> VoskContext.js
------------------------------------------
0.Новий проект RN"0.79.1"
1.Перехід на JS
2.Щоб працювали абсолютні імпорти в React Native, потрібно внести зміни ще в такі місця
3.Навігація:
4.async-storage(запамятовує стан у файл на мобілці)+navigation-bar-color(колірсамого нижнього рядка)
5.перехід на іконки з https://oblador.github.io/react-native-vector-icons/
6.Для форм edit/add/@hookform/resolvers yup
7. Для імпорту з .csv(txt)/documents/picker;fs;permissions;papaparse
8. Для Settings/модальне вікно вибору (мови/...)picker/picker
9.SQLite/sqlite-storage(старе)
10.Для text-to-spich\ native-tts
11.spich-to-text\@picovoice/rhino-react-native
12.spich-to-text(Vosk)
13.SQLite/ Перехід з react-native-sqlite-storage(старе) на react-native-sqlite-2(нове)
14. dbConfig.js  скидання(вилучення ЮД і створення таблиць)/в APP.js //СКИНУТИ БАЗУ ДАНИХ
    Замість всюди db.transaction → openDatabase().transaction
--------------------------------------------------------------------
1.Перехід на JS
    Вилучити: tsconfig.json,App.ts->js/
            package.json видалити всі: typescript @tsconfig/react-native @types/react @types/react-native
            delete node_modules-> npm install

2.Щоб працювали абсолютні імпорти в React Native, потрібно внести зміни ще в такі місця
    jsconfig.json:{
        "compilerOptions": {
            "baseUrl": ".",
            "paths": {
            "@/*": ["src/*"]
            }
        }
    }
    -----
    //Встанови пакети:
 npm install --save-dev @react-native/babel-preset
 npm install --save-dev babel-plugin-module-resolver
    babel.config.js:
    module.exports = {
        presets: ['module:@react-native/babel-preset'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./src'],
                    alias: {
                        '@': './src',
                    },
                },
            ],
        ],
    };
---
3.Навігація:
 npm install @react-navigation/native @react-navigation/native-stack
 npm install react-native-screens react-native-safe-area-context
 cd ios
 pod install
 cd ..
---
4.async-storage(запамятовує стан у файл на мобілці)+navigation-bar-color(колірсамого нижнього рядка)
 npm install @react-native-async-storage/async-storage react-native-navigation-bar-color
 npm install
---
5.перехід на іконки з https://oblador.github.io/react-native-vector-icons/
 npm install react-native-vector-icons
    *** Edit android/app/build.gradle and add:
        apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
---
6.Для форм edit/add/@hookform/resolvers yup
 npm install @hookform/resolvers yup
---
7.Для імпорту з .csv(txt)/documents/picker;fs;permissions;papaparse
 npm install @react-native-documents/picker //графічний вибір файлу(новий)
 npm install react-native-fs //файлова система
 npm install @react-native-permissions//Запит дозволів на доступ до файлів
 npm install papaparse        // Для визначення (;) в файлах
---
8.Для Settings/модальне вікно вибору (мови/...)picker/picker
 npm install  @react-native-picker/picker
---
9.SQLite/sqlite-storage(старе)
 npm install  react-native-sqlite-storage
---
10. Для text-to-spich\ native-tts
 npm install react-native-tts
---
11.spich-to-text\@picovoice/rhino-react-native
 npm install @picovoice/rhino-react-native
   -Додати дозвіл на місрофон в:\android\app\src\main\AndroidManifest.xml
        <uses-permission android:name="android.permission.RECORD_AUDIO" />
    -в\android\app\src\main\додати->\assets\picovoice і покласти туди файли
    commands_en_android_v3_0_0.rhn-голосові команди
    Voice-start_en_android_v3_0_0.ppn - головове включення мікрофона(не зробив  )
---
12.spich-to-text(Vosk)
    -Встановлюємо Vosk:
 npm install react-native-vosk
 npx pod-install # тільки якщо iOS, можна пропустити
    -Додаємо дозвіл в AndroidManifest.xml:
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    -Скачуємо українську модель:
        Офіційна маленька модель Vosk для укр: Потрібна: vosk-model-small-uk-v3 (~50 МБ)
        Розпаковуєш і кладеш в проєкт, наприклад в папку assets/models/uk/
    ***перейменував українську модель в model-uk-uk і загрузило(правда довго)
---
***2025.05.04
13.SQLite/ Перехід з react-native-sqlite-storage(старе) на react-native-sqlite-2(нове)
 1. Встановити нову бібліотеку:
  npm uninstall react-native-sqlite-storage
  npm install react-native-sqlite-2
 2.Замінити імпорт у своєму коді:
  import SQLite from 'react-native-sqlite-storage'; на
  import SQLite from 'react-native-sqlite-2';
 3. Перевірити відкриття бази:
  const db = SQLite.openDatabase('your_db_name.db', '1.0', '', 1);

  ---
***2025.05.10
- Добавив поле назви картинки і папки картинки img у Words і Topics
- Добавив таблицю Sections для групування тем
  ---
***2025.05.12
- Групове видалення з таблиць з перевіркою у TopicsList і (ON DELETE CASCADE)
14. Нове dbConfig.js  Централізованого створення і таблиць/в APP.js //СКИНУТИ БАЗУ ДАНИХ
    Замість db.transaction → openDatabase().transaction
  ---
***2025.05.17
15. 1.- при імпорті з csv поле img замість пробілу-> велика буква
    2. (05.25)копіювання БД з:(tools/BuildingModal.js)
        -проекту в Download(для imageMap.js)/copyDatabaseToDownload
        -з Download в проект/copyDatabaseFromDownload
    3. toolsDB.js: createImageMapNode.js Генерує imageMap.js для динамічного відображення картинокre quire() у word.js
    - Запускати з терміналу/cd src\tool ->node generateImageMap.js
-----------------------------------------------------------------------
***2025.05.20
16. Глобальна переробка схеми кольорів
    - 3-схеми для кожного UI
---
***2025.05.31
17. Запамятовувати голосових команд користувача в AsyncStorage

***2025.06.06
18. Переміщення DraggableFlatList(без групування)
    npm install react-native-reanimated react-native-gesture-handler
     Бібліотекf: DraggableFlatList
    2. Налаштувати babel.config.js для react-native-reanimated
    Імпорт у App.js або index.js
    Перевір, що найперший рядок у App.js або index.js — це:
    import 'react-native-reanimated';//Має бути на самому верху, навіть до react.

***2025.06.09
19. Групування з переміщенням  DraggableFlatList
    Бібліотеки: NestableScrollContainer, NestableDraggableFlatList,

***2025.08.09/
20. Імпорт слів зсайту/нема поля ipweb-ip з таблиць сайту(щоб не путатись)
=============================================================
***2025.08.23/
21. Імпорт слів зсайту/добавив у таблиці words,topics,sections полt ipweb-ip з таблиць сайту(щоб не путатись)

***2025.08.24/
22. Зміна меню в ButBar
    - Оновлення додатку/з перевіркою версії

***2025.09.30
npm install react-native-device-info //Версії app

***2025.10.05//копія
    --в //App.js - є рядок перенесення

***2026.03.29
    ListenWordsSettingsModal.js//Налаштування відтворення cлів
        добавив Потрібен переклад:'✅' : '❌'
    Words.js
        Не показує переклад і деякі кнопки
        🎯 Без перекладу

***2026.04.02
    TableViewLevelsLevels.js Добавлено Записати звук

***2026.04.07
    Ось покроковий план, щоб ваш код "побачив" RHVoice:
    1. Оновіть AndroidManifest.xml
        Відкрийте файл android/app/src/main/AndroidManifest.xml і додайте цей блок перед тегом <application>:
        XML
        <queries>
            <intent>
                <action android:name="android.intent.action.TTS_SERVICE" />
            </intent>
        </queries>
        Після цієї зміни обов'язково перезберіть додаток (npx react-native run-android).

            2. Виправте логіку завантаження голосів
            Оскільки на пристрої тепер два двигуни (Google та RHVoice), вам потрібно або перемкнутися на потрібний, або отримати голоси з обох.
                Спробуйте такий варіант коду:
                JavaScript
                useEffect(() => {
                const loadVoices = async () => {
                    try {
                    // Для Android 12 важливо дочекатися ініціалізації
                    await Tts.getInitStatus();

                    // Перевіряємо, які двигуни бачить система
                    const engines = await Tts.engines();
                    const rhVoice = engines.find(e => e.name.includes('rhvoice'));

                    if (rhVoice) {
                        // Примусово встановлюємо RHVoice, щоб побачити Анатолія та Маріанну
                        await Tts.setDefaultEngine(rhVoice.name);
                    }

                    const voices = await Tts.voices();
                    // Фільтруємо за мовою (uk) та ігноруємо не встановлені
                    const filtered = voices.filter(v =>
                        v.language.startsWith('uk') && !v.notInstalled
                    );

                    setAvailableVoices(filtered);
                    console.log("Знайдені голоси:", filtered);
                    } catch (e) {
                    console.error("Помилка при завантаженні голосів:", e);
                    }
                };

                loadVoices();
                }, []);

    Добавив очвучку через Azure
        Встановити buffer: npm install buffer
        Додати імпорт на початку файлу: import { Buffer } from 'buffer';
        Вставити ваші ключі Azure у функцію azureSpeak.
    Тест голосу Azure
    Щоб почути голос Azure безпосередньо у вікні налаштувань, нам потрібно встановити бібліотеку для програвання звуку. Найкращий варіант для вашого випадку (програвання коротких фрагментів) — це react-native-sound.
        npm install react-native-sound

***2026.05.24 v2.0.0// Зміна БД/dbConfig.js
    Два нових поля в кінці words для групування виразів і речень по слову:
        group_key TEXT DEFAULT ''
        type TEXT DEFAULT ''
    - новий importCSV



***2026.05.28 v2.2.0//
    - реверсний імпорт
    - реверсний переклад
    - нове переміщеня рядків
    - в 3-х рівневому екрані ф-ції всіх рівнів(ad/del/edit)
    - розділені налащтування відтворення і списків слів
    - ф-ція імпорту з тексту з розділенням по реченнях