// MenuScreen.js;
// MenuScreen.js
import React, {useEffect, useState, useContext} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
// import {version as appVersion} from '../../package.json';
import DeviceInfo from 'react-native-device-info';
import {ThemeContext} from '@/context/ThemeContext';
import RBotBar from '@/components/main/RBotBar';
import MyArrowBack from '@/components/main/MyArrowBack';

const MenuScreen = () => {
  const appVersion = DeviceInfo.getVersion(); // дасть "1.1.2"
  const navigation = useNavigation();
  const [latestVersion, setLatestVersion] = useState(appVersion);
  //   Колір
  const {isDarkMode, sizes, getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(1);

  const cStatusBarBg = scheme.pageBg;
  const cStatusBarOn = scheme.pageOn;
  const cHeadBg = scheme.headerBg;
  const cHeadOn = scheme.headerOn;

  const cPageBorderBg = scheme.cardBg;

  const cPageBg = scheme.pageBg;
  const cPageOn = scheme.pageOn;

  const cModalBg = scheme.modalBg;
  const cModalOn = scheme.modalOn;

  const cBotBarBg = scheme.pageBg;
  const cBotBarOn = scheme.pageOn;
  const cBotBarIconBgAct = scheme.iconTbBgAct;
  const cBotBarIconOnAct = scheme.iconTbOnAct;
  const cPageHeadBg = scheme.titleBg; //СтрілкаBG
  const cPageHeadText = scheme.titleOn;
  const sizeIcon = sizes.sBarIcon;
  const sizeBg = sizeIcon + 5;

  const updateApp = () => {
    const url =
      'https://github.com/didoshakra/rwords/releases/latest/download/rwords.apk';
    Linking.openURL(url).catch(() => {
      Alert.alert('Помилка', 'Не вдалося відкрити посилання на оновлення.');
    });
  };

  // ✅ Navigation bar color — тільки при зміні теми або кольору
  useEffect(() => {
    changeNavigationBarColor(cPageBg, isDarkMode);
  }, [cPageBg, isDarkMode]);
  //
  useEffect(() => {
    // Завантажуємо інформацію про останній реліз
    fetch('https://api.github.com/repos/didoshakra/rwords/releases/latest')
      .then(res => res.json())
      .then(data => {
        if (data.tag_name) {
          setLatestVersion(data.tag_name.replace('v', '')); // видаляємо 'v'
        }
      })
      .catch(() => {
        // можна проігнорувати помилку або показати Toast
      });
  }, []);

  const isUpdateAvailable = latestVersion !== appVersion;

  const menuGroups = [
    {
      title: 'Налаштування',
      items: [
        // {
        //   label: 'Загальні налаштування',
        //   icon: 'SettingsScreen',
        //   screen: 'SettingsScreen',
        // },
        {
          label: 'Колірні теми інтерфейсу',
          iconTag: MaterialIcons,
          icon: 'palette',
          screen: 'ColorSettings',
        },
        {
          label: 'Оновлення додатку',
          iconTag: MaterialIcons,
          icon: 'system-update',
          action: updateApp,
          note: isUpdateAvailable
            ? `Доступна v${latestVersion}`
            : `У вас остання версія v${latestVersion}`,
        },
      ],
    },
    {
      title: 'Головне',
      items: [
        {label: 'Home', iconTag: Entypo, icon: 'home', screen: 'Home'},
        {
          label: 'Перекладач',
          iconTag: MaterialIcons,
          icon: 'g-translate',
          screen: 'TranslatorScreen',
        },
        {
          label: 'Слухати',
          iconTag: MaterialIcons,
          icon: 'headphones',
          screen: 'Words',
        },
        {
          label: 'Сайт RWords ',
          iconTag: Ionicons,
          icon: 'globe',
          screen: 'AppWebView',
        },
        {
          label: 'Записник ',
          iconTag: Ionicons,
          icon: 'book',
          screen: 'NoteRecorderScreen',
        },
      ],
    },
    {
      title: 'Вивчення мов ',
      items: [
        {
          label: 'Списки слів і виразів',
          iconTag: MaterialIcons,
          icon: 'library-books',   
          screen: 'WordsListLevels',
        },
        {
          label: 'Правила англійської мови',
          iconTag: MaterialIcons,
          icon: 'library-books',
          screen: 'RulesListLevels',
        },
        {
          label: 'Навчання',
          iconTag: MaterialIcons,
            // icon: 'school',
            icon: 'auto-stories',
          screen: 'LearningHomeScreen',
        },
        // {
        //   label: 'Групи тем',
        //   iconTag: MaterialIcons,
        //   icon: 'category',
        //   screen: 'SectionsList',
        // },
        // {
        //   label: 'Теми слів та виразів ',
        //   iconTag: MaterialIcons,
        //   icon: 'category',
        //   screen: 'TopicsList',
        // },
        // {label: 'Слова та вирази', icon: 'library-books', screen: 'WordsList'},
      ],
    },
    {
      title: 'Записник',
      items: [
        {
          label: 'Нотатки',
          iconTag: MaterialIcons,
          icon: 'library-books',
          screen: 'NotesListLevels',
        },
      ],
    },

    {
      title: 'Інше',
      items: [
        {
          label: 'Про додаток',
          iconTag: MaterialIcons,
          icon: 'info',
          screen: 'AboutRWords',
        },
        // {label: 'Ще щось', icon: 'more-horiz', screen: 'SomethingElse'},
      ],
    },
  ];

  // ── Вихід з екрана ──
  const handleExit = () => {
    navigation.navigate('Home');
    return;
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      {/* <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} /> */}
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={cStatusBarBg}
        color={cStatusBarOn}
      />
      <View style={[styles.pageContainer, {backgroundColor: cPageBg}]}>
        <View style={[styles.pageHeadContainer, {backgroundColor: cPageBg}]}>
          {/* <TouchableOpacity style={{paddingLeft: 5}} onPress={handleExit}>
            <Ionicons name="arrow-back" size={22} color={cPageOn} />
          </TouchableOpacity> */}
          <MyArrowBack
            //   headText={'Home'}
            color={cPageHeadText}
            sizeIcon={sizeIcon}
          />
        </View>
        {/* <PageHeadRight colorIcon={cText} colorIconBg={cPageBg} sizeIcon={25} /> */}
        <ScrollView style={[styles.container, {backgroundColor: cPageBg}]}>
          <View
            style={[
              styles.header,
              {
                //   backgroundColor: cHeadBg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
            ]}>
            <View style={{width: 50}} />
            <Text style={[styles.headerTitle, {color: cHeadOn}]}>Меню</Text>
            <Text style={[styles.version, {color: cHeadOn}]}>
              v{appVersion}
            </Text>
            {/* <Text style={styles.version}>v{appVersion}</Text> */}
          </View>
          {menuGroups.map((group, index) => (
            <View key={index} style={styles.groupContainer}>
              <Text style={styles.groupTitle}>{group.title}</Text>

              {group.items.map((item, idx) => {
                const Tag = item.iconTag;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.menuItem}
                    onPress={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        navigation.navigate(item.screen);
                      }
                    }}>
                    <Tag
                      name={item.icon}
                      size={22}
                      color="#333"
                      style={styles.menuIcon}
                    />

                    <View style={{flexDirection: 'column'}}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      {item.note && (
                        <Text style={styles.note}>{item.note}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
      <RBotBar
        pcBg={cBotBarBg}
        pcOn={cBotBarOn}
        pcIconBgAct={cBotBarIconBgAct}
        pcIconOnAct={cBotBarIconOnAct}
        cModalBg={cModalBg}
        cModalOn={cModalOn}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: '2%',
    padding: '1%',
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    paddingHorizontal: 8, // або можна 8, 10 — в пікселях
    borderRadius: 15,
    // margin: '2%', //Для бардюра Bg
  },
  header: {
    padding: 20,
    margin: '2%',
    padding: '1%',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  version: {
    paddingHorizontal: 5,
    fontSize: 14,
    color: '#555',
  },
  groupContainer: {
    // marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    padding: 12,
    backgroundColor: '#F0F0F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  menuIcon: {
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    color: '#000',
  },
  note: {
    fontSize: 10,
    color: 'red',
    marginTop: 2,
  },
  pageHeadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageHeadRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 1,
    marginRight: 5,
  },
});

export default MenuScreen;
