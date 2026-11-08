//ThemeContextjs
//Кольори тем зберігаються і завантажууться із AsyncStorage
//2025.05.21/3-х схеми кольорів

import React, {createContext, useState, useEffect, useMemo} from 'react';
import {useColorScheme} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();
const ThemeProvider = ({children}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const changeTheme = props => {
    setColTheme(props);
  };

  // ******************
  const [colTheme, setColTheme] = useState('Teal');
  //   *** materialui scheme //https://materialui.co/colors*/
  const allPaths = {
    Red: require('../styles/themes/mui/red_mui'),
    Pink: require('../styles/themes/mui/pink_mui'),
    Purple: require('../styles/themes/mui/purple_mui'),
    DeepPurple: require('../styles/themes/mui/deep_purple_mui'),
    Indigo: require('../styles/themes/mui/indigo_mui'),
    Blue: require('../styles/themes/mui/blue_mui'),
    LightBlue: require('../styles/themes/mui/light_blue_mui'),
    Cyan: require('../styles/themes/mui/cyan_mui'),
    Teal: require('../styles/themes/mui/teal_mui'),
    Green: require('../styles/themes/mui/green_mui'),
    LightGreen: require('../styles/themes/mui/light_green_mui'),
    Lime: require('../styles/themes/mui/lime_mui'),
    Yellow: require('../styles/themes/mui/yellow_mui'),
    Amber: require('../styles/themes/mui/amber_mui'),
    Orange: require('../styles/themes/mui/orange_mui'),
    DeepOrange: require('../styles/themes/mui/deep_orange_mui'),
    Brown: require('../styles/themes/mui/brown_mui'),
    Grey: require('../styles/themes/mui/grey_mui'),
    BlueGrey: require('../styles/themes/mui/blue_grey_mui'),
  };

  //*** Tailwind scheme */
  //   const allPaths = {
  //     slate: require('../styles/themes/tailwind/slate'),
  //     gray: require('../styles/themes/tailwind/gray'),
  //     zinc: require('../styles/themes/tailwind/zinc'),
  //     neutral: require('../styles/themes/tailwind/neutral'),
  //     stone: require('../styles/themes/tailwind/stone'),
  //     rose: require('../styles/themes/tailwind/rose'),
  //     pink: require('../styles/themes/tailwind/pink'),
  //     fuchsia: require('../styles/themes/tailwind/fuchsia'),
  //     purple: require('../styles/themes/tailwind/purple'),
  //     violet: require('../styles/themes/tailwind/violet'),
  //     indigo: require('../styles/themes/tailwind/indigo'),
  //     blue: require('../styles/themes/tailwind/blue'),
  //     sky: require('../styles/themes/tailwind/sky'),
  //     cyan: require('../styles/themes/tailwind/cyan'),
  //     teal: require('../styles/themes/tailwind/teal'),
  //     emerald: require('../styles/themes/tailwind/emerald'),
  //     green: require('../styles/themes/tailwind/green'),
  //     lime: require('../styles/themes/tailwind/lime'),
  //     yellow: require('../styles/themes/tailwind/yellow'),
  //     amber: require('../styles/themes/tailwind/amber'),
  //     orange: require('../styles/themes/tailwind/orange'),
  //     red: require('../styles/themes/tailwind/red'),
  //   };

  // ******************

  // GPT-Зберігання colTheme між сесіями
  // Завантаження теми з AsyncStorage при запуску
  useEffect(() => {
    AsyncStorage.getItem('colTheme').then(value => {
      if (value) {
        setColTheme(value);
      }
    });
  }, []);

  // Збереження теми при зміні
  useEffect(() => {
    AsyncStorage.setItem('colTheme', colTheme);
  }, [colTheme]);

  // Схема по замовчуванню /* Cyan_mui*/:
  const themeDefault = [
    '#E0F7FA', //0
    '#B2EBF2',
    '#80DEEA',
    '#4DD0E1',
    '#26C6DA',
    '#00BCD4',
    '#00ACC1',
    '#0097A7',
    '#00838F', //8
    '#006064', //9
    '#FF7A00', //10-Akcent
    '#13FD3C', //11-Akcent1
    '#0037DB', //12-Secondery/Легкий фон
  ];

  //Кешування завантаженої(пточної) theme
  //   const theme = useMemo(() => allPaths[colTheme], [colTheme]);
  const theme = useMemo(() => {
    const loadedTheme = allPaths[colTheme];
    return loadedTheme || themeDefault;
  }, [colTheme]);

  const darkScheme = [
    '#5A6B82', //13- світліший холодний сірий (замість #52607A, трохи яскравіший, щоб краще виглядав як фон)
    '#3E516C', //14- середній холодний сірий (замість #3B4A66, щоб краще плавно переходило)
    '#292929', //15- темний сірий (замінює #252525, більш нейтральний темний тон)
    '#1F1F1F', //16- дуже темний сірий (трохи світліший за #1E1E1E для балансу)
    '#0B101F', //17- глибокий темно-синій, майже чорний (замість #0A0F1E, щоб додати холодний відтінок)
    '#FFFFFF', //18- білий
  ];

  // Обєднання тем
  const unTheme = [...theme, ...darkScheme]; //Обєднаний масив тем
  // -----

  //** */ вибираємо колір,аба об'єкт кольорів схеми заданої індексом/якщо не задене імя то видасть об'єкт кольорів
  const getColorScheme = (index = 0, nameColor) => {
    index = index > 2 ? 2 : index; // обмеження(поверне 2)
    // console.log('ThemeContext/index', index);

    //Набір колірних схемп для UI
    const map = {
      // Основний фон
      topBarBg: !isDarkMode ? [0, 1, 2] : [13, 14, 15],
      topBarOn: !isDarkMode ? [8, 9, 12] : [1, 2, 4],

      bottomBarBg: !isDarkMode ? [0, 1, 2] : [13, 14, 15],
      bottomBarOn: !isDarkMode ? [8, 9, 12] : [1, 2, 4],

      // Іконки(topBarbottomBar)
      iconTbBg: !isDarkMode ? [0, 1, 2] : [13, 14, 15],
      iconTbOn: !isDarkMode ? [7, 8, 9] : [0, 1, 2],
      iconTbBgAct: !isDarkMode ? [1, 0, 1] : [4, 5, 6],
      iconTbOnAct: !isDarkMode ? [7, 8, 9] : [0, 0, 0],
      iconTbBorder: !isDarkMode ? [4, 5, 6] : [9, 10, 11],

      tabBarBg: !isDarkMode ? [0, 1, 2] : [13, 14, 15],
      tabBarOn: !isDarkMode ? [7, 12, 9] : [0, 1, 4],

      // *** Площини
      pageBg: !isDarkMode ? [0, 1, 2] : [14, 15, 16],
      pageOn: !isDarkMode ? [8, 9, 9] : [1, 2, 4],
      pageBorder: !isDarkMode ? [1, 2, 3] : [15, 16, 17],
      pageBorderLight: !isDarkMode ? [0, 0, 1] : [13, 14, 15],

      cardBg: !isDarkMode ? [1, 2, 3] : [14, 15, 16],
      cardOn: !isDarkMode ? [8, 9, 9] : [0, 1, 1], //[10, 11, 12] : [1, 3, 4],
      cardBorder: !isDarkMode ? [2, 3, 4] : [15, 16, 17],
      cardBorderLight: !isDarkMode ? [0, 1, 2] : [13, 14, 15],

      //   Modal
      modalBg: !isDarkMode ? [18, 0, 1] : [15, 16, 17],
      modalOn: !isDarkMode ? [8, 9, 9] : [1, 2, 11],
      //   modalOn: !isDarkMode ? [8, 10, 12] : [8, 10, 11],

      // Випадаючі меню/
      droopMeneBg: !isDarkMode ? [1, 2, 3] : [13, 14, 14],
      droopMeneOn: !isDarkMode ? [8, 9, 9] : [1, 2, 4],

      // Загорловок сторінки(таблиці)
      titleBg: !isDarkMode ? [2, 3, 4] : [13, 14, 14],
      titleOn: !isDarkMode ? [10, 10, 10] : [10, 10, 10],

      //Назва шапки чогось(таблиці)
      headerBg: !isDarkMode ? [3, 4, 5] : [3, 4, 5],
      headerOn: !isDarkMode ? [11, 11, 11] : [11, 11, 11],
      headerBgAct: !isDarkMode ? [4, 5, 6] : [4, 5, 6],
      headerOnAct: !isDarkMode ? [8, 9, 0] : [8, 9, 0],

      //Елементи таблиці/меню
      sectionBg: !isDarkMode ? [2, 3, 4] : [2, 3, 4], //Як pageBg
      sectionOn: !isDarkMode ? [9, 9, 9] : [9, 9, 9],
      level1Bg: !isDarkMode ? [1, 2, 3] : [2, 3, 4], //Як pageBg
      level1On: !isDarkMode ? [9, 9, 9] : [9, 9, 9],
      itemBg: !isDarkMode ? [18, 0, 1] : [18, 0, 1], //Як pageBg
      itemOn: !isDarkMode ? [9, 9, 9] : [9, 9, 9],
      itemBgAct: !isDarkMode ? [0, 1, 2] : [0, 1, 2], //Як pageBg
      itemOnAct: !isDarkMode ? [8, 9, 18] : [8, 9, 18],

      // Спеціальні елементи

      // Ввід(input/меню/таблицфі
      inputBg: !isDarkMode ? [18, 0, 1] : [13, 13, 13],
      inputOn: !isDarkMode ? [8, 9, 14] : [1, 2, 4],
      inputBorder: !isDarkMode ? [5, 6, 7] : [14, 14, 14], //??
      inputBgAct: !isDarkMode ? [2, 3, 4] : [2, 3, 4],
      inputOnAct: !isDarkMode ? [8, 9, 0] : [8, 9, 14],

      // Кнопки
      buttonBg: !isDarkMode ? [6, 7, 8] : [9, 10, 11],
      buttonOn: !isDarkMode ? [0, 0, 1] : [1, 2, 3],
      buttonBgAct: !isDarkMode ? [4, 5, 6] : [15, 16, 17],
      buttonOnAct: !isDarkMode ? [12, 0, 1] : [1, 2, 9],
      buttonBorder: !isDarkMode ? [4, 5, 6] : [9, 10, 11],

      //   activeBg: !isDarkMode ? [6, 7, 8] : [15, 16, 17],
      activeBg: !isDarkMode ? [3, 4, 5] : [3, 4, 5],
      activeOn: !isDarkMode ? [0, 1, 2] : [0, 1, 2],
      //   activeOn: !isDarkMode ? [0, 1, 11] : [10, 11, 12],

      // Обводки ???
      border: !isDarkMode ? [5, 6, 7] : [14, 14, 14], //??
      focusBorer: !isDarkMode ? [6, 7, 8] : [13, 14, 14], //??
      outline: !isDarkMode ? [7, 8, 9] : [13, 14, 15], //??
    };

    if (nameColor) {
      const colorArray = map[nameColor];
      if (!colorArray) {
        console.warn(`Color name "${nameColor}" не знайдено.`);
        return null;
      }
      return unTheme[colorArray[index]];
    }

    // Якщо nameColor не передано — повертаємо всі кольори
    const result = {};
    for (const key in map) {
      result[key] = unTheme[map[key][index]];
    }
    return result;
  };
  //** */

  //   ************************************************************
  //old
  const getContrastTextColor = (bgColor, colBlack, colWhite) => {
    // Видаляємо # якщо колір у форматі HEX
    const hex = bgColor.replace('#', '');

    // Розбиваємо HEX на червоний, зелений і синій
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Обчислюємо відносну яскравість (luminance)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Повертаємо темний або світлий текст
    // return luminance > 0.5 ? '#111111' : '#FFFFFF'; // Темний або світлий текст
    return luminance > 0.75 ? colBlack : colWhite; // Темний або світлий текст
  };

  //
  const BgD0 = '#52607A'; //GPT #5A6A85
  const BgD = '#0A0F1E'; //(GPT-глибокий чорний)
  const Bg1D = '#1E1E1E'; //(GPT-темно-сірий)
  const Bg2D = '#252525'; //GPT-Surface (фон карток, модальних вікон)
  const Bg3D = '#3B4A66'; //GPT #3B4A66
  //
  const White = '#FFFFFF';
  const Gray = '#212121';
  const cTh0 = theme[0] || '#E0F7FA'; //Background: Фоновий колір для всього екрану.
  const cTh1 = theme[1] || '#B2EBF2';
  const cTh2 = theme[2] || '#80DEEA';
  const cTh3 = theme[3] || '#4DD0E1';
  const cTh4 = theme[4] || '#26C6DA';
  const cTh5 = theme[5] || '#00BCD4';
  const cTh6 = theme[6] || '#00ACC1';
  const cTh7 = theme[7] || '#0097A7'; //Primary: Це основний колір для вашого інтерфейсу (кнопки, заголовки).
  const cTh8 = theme[8] || '#00838F';
  const cTh9 = theme[9] || '#006064';
  const cTh10 = theme[10] || '#FF7A00'; // Accent:Complementary/ Акцентів(іконок чи виділених елементів).
  const cTh11 = theme[11] || '#FFAE00'; //Triad1Lite:Surface/ Легкий фон для карток, модальних вікон.
  const cTh12 = theme[12] || '#FF1300'; //Triad2 Secondary: Це акцентний колір для менш важливих елементів.
  //
  const cBgW = !isDarkMode ? White : BgD0;
  const cBg = !isDarkMode ? cTh0 : BgD;
  const cBg1 = !isDarkMode ? cTh1 : Bg1D;
  const cBg2 = !isDarkMode ? cTh3 : Bg2D;
  const cBg3 = !isDarkMode ? cTh6 : cTh10; //Head/Row-Active
  const cBg4 = !isDarkMode ? cTh8 : cTh4; //Btn/
  const cBg5 = !isDarkMode ? cTh9 : cTh11; //Btn1/
  const cBgComA = !isDarkMode ? cTh10 : cTh12; //Accent:Complementary/
  const cBgSecL = !isDarkMode ? cTh11 : Bg3D; //Triad-Lite(Secondary)/
  const cBgSecA = !isDarkMode ? cTh12 : Bg3D; //Triad1(Secondary)/

  const OnBgW = !isDarkMode ? Gray : White;
  const OnBg = getContrastTextColor(cBg, cTh9, White);
  const OnBg1 = getContrastTextColor(cBg1, cTh9, White);
  const OnBg2 = getContrastTextColor(cBg2, cTh9, White);
  const OnBg3 = getContrastTextColor(cBg3, cTh9, White); //Card
  const OnBg4 = getContrastTextColor(cBg4, cTh9, White); //Card1
  const OnBg5 = getContrastTextColor(cBg5, cTh9, White); //Btn
  const OnBgComA = getContrastTextColor(cBgComA, cTh9, White); //Btn1
  const OnBgSecL = getContrastTextColor(cBgSecL, cTh9, White); //Btn1
  const OnBgSecA = getContrastTextColor(cBgSecA, cTh9, White); //Btn1

  const cOnBgW = OnBgW;
  const cOnBg = OnBg;
  const cOnBg1 = OnBg1;
  const cOnBg2 = OnBg2;
  const cOnBg3 = OnBg3; //Card
  const cOnBg4 = OnBg4; //Card1
  const cOnBg5 = OnBg5; //Btn
  const cOnBgComA = OnBgComA; //Btn1
  const cOnBgSecL = OnBgSecL;
  const cOnBgSecA = OnBgSecA;
  //--k old

  const colors = {
    ctBarStyle: isDarkMode ? 'light-content' : 'dark-content',
    ctIsDarkMode: isDarkMode ? true : false,

    // (Нове 3- екрани)
    //-- Загальні одиночнікольори--Поки не використовував
    cT0: unTheme[0],
    cT1: unTheme[1],
    cT2: unTheme[2],
    cT3: unTheme[3],
    cT4: unTheme[4],
    cT5: unTheme[5],
    cT6: unTheme[6],
    cT7: unTheme[7],
    cT8: unTheme[8],
    cT9: unTheme[9],
    cT10: unTheme[10],
    cT11: unTheme[11],
    cT12: unTheme[12],
    cT13: unTheme[13], //'#5A6B82', // світліший холодний сірий
    cT14: unTheme[14], //'#3E516C', // середній холодний сірий
    cT15: unTheme[15], //'#292929', // темний сірий (замінює #252525, більш нейтральний темний тон)
    cT16: unTheme[16], //'#1F1F1F', // дуже темний сірий (трохи світліший за #1E1E1E для балансу)
    cT17: unTheme[17], //'#0B101F', // глибокий темно-синій, майже чорний
    cT18: unTheme[18], //'#FFFFFF', // білий

    //=== Колірні пари без схема
    //---без назв
    cBgW: !isDarkMode ? unTheme[18] : unTheme[17],
    cBg: !isDarkMode ? unTheme[0] : unTheme[13],
    cBg1: !isDarkMode ? unTheme[1] : unTheme[14],
    cBg2: !isDarkMode ? unTheme[2] : unTheme[15],
    cBg3: !isDarkMode ? unTheme[3] : unTheme[16], //Head/Row-Active
    cBg4: !isDarkMode ? unTheme[4] : unTheme[17], //Btn/
    cBg5: !isDarkMode ? unTheme[5] : unTheme[13], //Btn1/
    cBg6: !isDarkMode ? unTheme[6] : unTheme[14], //Btn1/
    cBg7: !isDarkMode ? unTheme[7] : unTheme[15], //Btn1/
    cBg8: !isDarkMode ? unTheme[8] : unTheme[16], //Btn1/
    cBg9: !isDarkMode ? unTheme[9] : unTheme[17], //Btn1/
    cBg10: !isDarkMode ? unTheme[10] : unTheme[10], //Accent:Complementary/
    cBg11: !isDarkMode ? unTheme[11] : unTheme[11], //Triad-Lite(Secondary)/
    cBg12: !isDarkMode ? unTheme[12] : unTheme[12], //Triad1(Secondary)/
    //
    cOnW: !isDarkMode ? unTheme[17] : unTheme[18],
    cOn: !isDarkMode ? unTheme[8] : unTheme[0],
    cOn1: !isDarkMode ? unTheme[9] : unTheme[0],
    cOn2: !isDarkMode ? unTheme[9] : unTheme[1],
    cOn3: !isDarkMode ? unTheme[9] : unTheme[1], //Head/Row-Active
    cOn4: !isDarkMode ? unTheme[18] : unTheme[2], //Btn/
    cOn5: !isDarkMode ? unTheme[0] : unTheme[2], //Btn1/
    cOn6: !isDarkMode ? unTheme[0] : unTheme[3], //Btn1/
    cOn7: !isDarkMode ? unTheme[0] : unTheme[3], //Btn1/
    cOn8: !isDarkMode ? unTheme[0] : unTheme[4], //Btn1/
    cOn9: !isDarkMode ? unTheme[0] : unTheme[4], //Btn1/
    cOn10: !isDarkMode ? unTheme[0] : unTheme[0], //Accent:Complementary/
    cOn11: !isDarkMode ? unTheme[0] : unTheme[0], //Triad-Lite(Secondary)/
    cOn12: !isDarkMode ? unTheme[0] : unTheme[0], //Triad1(Secondary)/

    //--- з назвами
    whiteDM: !isDarkMode ? '#FFFFFF' : '#292929', //Біле/чорне
    darkDM: !isDarkMode ? '#292929' : '#FFFFFF', //чорне/біле

    errorBG: !isDarkMode ? '#FDEAEA' : '#2B1F1F',
    errorOn: !isDarkMode ? '#B00020' : '#FF8A80',

    successBG: !isDarkMode ? '#EAF7EB' : '#1C2B1C',
    successOn: !isDarkMode ? '#388E3C' : '#69F0AE',
    // ctIInfo: !isDarkMode ? '#138611':'#13ff11'  ,

    warningBg: !isDarkMode ? '#FFF9E5' : '#2F2A1A',
    warningOn: !isDarkMode ? '#FBC02D' : '#FFD740',

    infoBg: !isDarkMode ? '#E3F2FD' : '#122631',
    infoOn: !isDarkMode ? '#0288D1' : '#80D8FF',

    link: '#1E90FF',
    eclipBg: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)',
    //***********                                  */
    //--old Загальні--// Поки не використовував
    ctWhite: '#FFFFFF',
    ctGrey: '#212121',
    ctTh0: cTh0,
    ctTh1: cTh1,
    ctTh2: cTh2,
    ctTh3: cTh2,
    ctTh4: cTh4,
    ctTh5: cTh5,
    ctTh6: cTh6,
    ctTh7: cTh7,
    ctTh8: cTh8,
    ctTh9: cTh9,
    ctTh10: cTh10,
    ctTh11: cTh11,
    ctTh12: cTh12,

    // Text
    ctOnBgW: cOnBgW,
    ctOnBg: cOnBg,
    ctOnBg1: cOnBg1,
    ctOnBg2: cOnBg2,
    ctOnBg3: cOnBg3, //Card
    ctOnBg4: cOnBg4, //Card1
    ctOnBg5: cOnBg5,
    ctOnBg6: cOnBgComA,
    ctOnBg7: cOnBgSecL,
    ctOnBg8: cOnBgSecA,

    //input
    ctBgInput: cBg,
    ctOnInput: cOnBg,

    //Act
    ctOnBgAct: cOnBgSecL,
    ctBgActSL: cBgSecL,

    ctBgAct1: cBg3,
    ctOnBgAct1: cOnBg3,

    //Btn
    ctBtnBg: cBg5,
    ctBtnBgCA: cBgComA,
    ctBtnText: cOnBg5,
    ctBtnText1: cOnBgComA,
    ctBtnBgActCA: cBgComA,
    ctBtnTextAct: cOnBgComA,
    //
    ctPageHeadTitleText: OnBgSecA,

    //Modal
    ctModalBg: cBgSecL,
    ctModalText: cOnBgSecL,

    //Border
    ctBorder: !isDarkMode ? cTh5 : cTh10,
    ctBorder1: !isDarkMode ? cTh7 : cTh10,

    //--- iconT /Table,Form,Card,
    ctIcon: !isDarkMode ? cTh9 : cTh1,
    ctIconAct: cTh8,
    ctIcOnBgAct: cTh8,
    ctIcon1: cTh12,
    ctIconAct1: cTh11,
    ctIcOnBgAct1: cTh10,

    //
    // ctLink: '#1E90FF',
    // ctInfMsg: '#8c92f8',
    // ctErrMsg: '#f21e08',
    // ctEclipBg: 'rgba(36, 12, 12, 0.3)', //Затемнення екрану
    ctIInfo: !isDarkMode ? '#13ff11' : '#138611',
  };

  const sizes = {
    xxs: 10, //-12-найменший розмір, для допоміжного чи пояснювального тексту
    xs: 12, //Caption-дрібний текст/малі Кнопки
    sm: 14, //body-кнопки і основний текст
    md: 16, //18-Subheading/Підзаголовок/Велика кнопка
    lg: 20, //Title заголовки, що акцентують увагу (20–24pt).
    xl: 24, //Заголовок
    xxl: 28, //Display – дуже великі заголовки або титульні тексти, для сильного візуального ефекту (28pt і більше).
    //
    sIcon: 20,
    sBarIcon: 24,
    sPageHeadIcon: 24,
    //
    sPageHeadFont: 12,
    sPageHeadTitleFont: 14,
    sPageTitleFont: 18,
    sBtnFontSm: 14,
    sBtnFontMd: 16,
    sBtnFontLg: 18,
    //
  };

  return (
    <ThemeContext.Provider
      value={{
        colTheme,
        changeTheme,
        colors,
        sizes,
        isDarkMode,
        getColorScheme, // вибираєколір(об'єкт)схеми по індексу(якщо не задене імя то видасть об'єкт)
      }}>
      {children}
    </ThemeContext.Provider>
  );
};

export {ThemeContext, ThemeProvider};
