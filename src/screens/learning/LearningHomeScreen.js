// src/screens/learning/LearningHomeScreen.js
//
// Точка входу в розділ "Навчання". Без уроків: дві великі картки.
//   1. Правила      -> route RulesListLevels
//   2. Вчити слова  -> route Words (слухай і оцінюй: знаю / не знаю)
import React, {useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {ThemeContext} from '@/context/ThemeContext';

const ACCENT_BG = '#ffd11a'; // жовтий акцент для головної дії
const ACCENT_ON = '#1a1a1a'; // темний текст, щоб читався в обох темах

const LearningHomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {isDarkMode, getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(1);

  const cPageBorderBg = scheme.pageBg;
  const cStatusBarBg = scheme.pageBg;
  const cCardContainer = scheme.cardBg;
  const cCardBorder = scheme.cardBorder;
  const cPageOn = scheme.pageOn;
  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;
  const cBtnBorder = scheme.border;

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
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            accessibilityRole="button"
            accessibilityLabel="Назад"
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="arrow-back" size={22} color={cPageOn} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: cPageOn}]}>Навчання</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Дві великі картки */}
        <View style={styles.cards}>
          <TouchableOpacity
            style={[
              styles.card,
              {backgroundColor: cBtnBg, borderColor: cBtnBorder},
            ]}
            onPress={() => navigation.navigate('RulesListLevels')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Правила. Граматика з прикладами">
            <MaterialIcons name="menu-book" size={52} color={cBtnText} />
            <Text style={[styles.cardTitle, {color: cBtnText}]}>Правила</Text>
            <Text style={[styles.cardSub, {color: cBtnText}]}>
              граматика з прикладами
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.card,
              styles.cardAccent,
              {backgroundColor: ACCENT_BG, borderColor: cBtnBorder},
            ]}
            onPress={() => navigation.navigate('Words')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Вчити слова. Слухай і оцінюй: знаю або не знаю">
            <MaterialIcons name="headphones" size={52} color={ACCENT_ON} />
            <Text style={[styles.cardTitle, {color: ACCENT_ON}]}>
              Вчити слова
            </Text>
            <Text style={[styles.cardSub, {color: ACCENT_ON}]}>
              слухай і оцінюй: знаю / не знаю
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LearningHomeScreen;

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
  headerSpacer: {width: 22},
  cards: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 14,
  },
  card: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  cardAccent: {
    // акцентна картка виглядає трохи виразніше
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    opacity: 0.85,
  },
});
