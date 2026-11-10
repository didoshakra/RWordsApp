// LearningHomeScreen.js
//
// Точка входу в розділ "Навчання". За задумом — мінімалістичний
// екран: одна велика кнопка "Продовжити" + менші пункти меню.
// Без прогрес-бару (поки нема таблиці прогресу по кроках уроку).
//
// Активні зараз: "Правила" (route RulesListLevels) і "Слова" (route Words).
// Неактивні (сірі, disabled) — чекають на LessonScreen/LessonsListScreen/
// AIDialogueScreen, яких ще нема. Коли ці екрани будуть готові —
// просто прибрати disabled/onPress-заглушку з відповідного пункту.
import React, {useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ToastAndroid,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {ThemeContext} from '@/context/ThemeContext';
import {SettingsContext} from '@/context/SettingsContext';

const NOT_READY_MSG = 'Ще не готово';

const LearningHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {colors, sizes, isDarkMode, getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(1);
  const tc = colors;

  const cPageBorderBg = scheme.pageBg;
  const cStatusBarBg = scheme.pageBg;
  const cCardContainer = scheme.cardBg;
  const cCardBorder = scheme.cardBorder;
  const cPageOn = scheme.pageOn;
  const cPageHeadOn = scheme.headerOn;
  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;
  const cBtnBorder = scheme.border;

  const {settings, setSettings} = useContext(SettingsContext);
  const currentLessonId = settings?.currentLessonId || null;

  const handleExit = () => {
    navigation.navigate('Home');
  };

  const handleContinue = () => {
    if (currentLessonId) {
      navigation.navigate('LessonScreen', {lessonId: currentLessonId});
    } else {
      navigation.navigate('LessonsListScreen');
    }
  };

  const notReady = () => {
    ToastAndroid.show(NOT_READY_MSG, ToastAndroid.SHORT);
  };

  // ── Менші пункти меню ──
  const menuItems = [
    // {
    //   id: 'new',
    //   label: 'Новий урок',
    //   icon: 'add-circle-outline',
    //   iconTag: Ionicons,
    //   active: true,
    //   onPress: () => navigation.navigate('LessonsListScreen'),
    // },
    {
      id: 'lessons',
      label: 'Уроки',
      icon: 'format-list-bulleted',
      iconTag: MaterialIcons,
      active: true,
      onPress: () => navigation.navigate('LessonsListScreen'),
    },
    {
      id: 'rules',
      label: 'Правила',
      icon: 'menu-book',
      iconTag: MaterialIcons,
      active: true,
      onPress: () => navigation.navigate('RulesListLevels'),
    },
    {
      id: 'words',
      label: 'Слова',
      icon: 'headphones',
      iconTag: MaterialIcons,
      active: true,
      onPress: () => navigation.navigate('Words'),
    },
    {
      id: 'ai_chat',
      label: 'Вільний діалог',
      icon: 'chatbubble-ellipses-outline',
      iconTag: Ionicons,
      active: true,
      onPress: () => navigation.navigate('FreeDialogueScreen'),
    },
    {
      id: 'lesson_topics_admin',
      label: 'Контент уроків',
      icon: 'library-books',
      iconTag: MaterialIcons,
      active: true,
      onPress: () => navigation.navigate('LessonLevelsScreen'),
    },
  ];

    return (
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          backgroundColor: cPageBorderBg,
        }}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={cStatusBarBg}
        />
        <View
          style={[
            styles.pageContainer,
            {backgroundColor: cCardContainer, borderColor: cCardBorder},
          ]}>
          {/* Шапка */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleExit}>
              <Ionicons name="arrow-back" size={22} color={cPageOn} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, {color: cPageOn}]}>Навчання</Text>
            <View style={{width: 22}} />
          </View>
          {/* Велика кнопка "Продовжити" */}
          <View style={styles.mainButtonWrap}>
            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleContinue}
              activeOpacity={0.8}>
              <Text style={[styles.mainButtonText, {color: cPageOn}]}>
                {currentLessonId
                  ? `Продовжити урок №${currentLessonId}`
                  : 'Почати навчання'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.menuGrid}>
            {menuItems.map(item => {
              const Tag = item.iconTag;
              return (
                <TouchableOpacity
                  key={item.id}
                  disabled={!item.active}
                  onPress={item.onPress}
                  style={[
                    styles.menuItem,
                    {borderColor: cBtnBorder, backgroundColor: cBtnBg},
                    !item.active && styles.menuItemDisabled,
                  ]}
                  activeOpacity={0.8}>
                  <Tag
                    name={item.icon}
                    size={sizes.sPageHeadIcon ?? 22}
                    color={item.active ? cPageHeadOn : '#999'}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      {color: item.active ? cBtnText : '#999'},
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
};

export default LearningHomeScreen;

// Велика кнопка поки завжди disabled-вигляд (LessonScreen ще нема).
// Коли з'явиться — прибрати цю функцію і виклик buttonDisabledStyle().

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 2,
    margin: '1%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },
  mainButtonWrap: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  mainButton: {
    width: '100%',
    paddingVertical: 22,
    borderRadius: 20,
    backgroundColor: '#ffd11a',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
  },
  menuItem: {
    width: '47%',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
});
