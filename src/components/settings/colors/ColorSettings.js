/* eslint-disable react-native/no-inline-styles */
//Початкова
//ColorSettings.js //До розділення//FlatList замість ScrollView/ Без map
// Анімація //https://www.youtube.com/watch?v=5fxeYd5vFDo&ab_channel=EngineerCodewala
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useContext} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar

import MyArrowBack from '@/components/main/MyArrowBack';
import { ThemeContext } from '@/context/ThemeContext';
import ThemeSwitcher from '@/components/main/ThemeSwitcher';
import ColorSettingDropList from './ColorSettingDropList';
import RTopBar from '@/components/main/RTopBar';
import RBotBar from '@/components/main/RBotBar';
import ModelColors from './ModelColors';
import ModelsSection from './ModelsSection';

export default function ColorSettings() {
  const [screenSize, setScreenSize] = useState(Dimensions.get('window'));

  useEffect(() => {
    const updateSize = () => setScreenSize(Dimensions.get('window'));
    const subscription = Dimensions.addEventListener('change', updateSize);
    return () => subscription?.remove();
  }, []);

  //   Колір
  const {colors, getColorScheme, sizes, isDarkMode} = useContext(ThemeContext);
  // colors
  const tc = colors;
  const indexScheme = 0;
  const scheme = getColorScheme(indexScheme);
  const cPageBorderBg = scheme.cardBg;
  const cStatusBarBg = scheme.cardBg;
  const cPageHeadBg = scheme.titleBg; //СтрілкаBG
  const cPageHeadText = scheme.titleOn;
  const cPageBg = scheme.pageBg; //Bg колір сторінки

  //   const cPageBg = tcctBg;
  const cTopBarBg = scheme.cardBg;
  //   const cTopBarBg = scheme.pageBg;
  const cTopBarOn = scheme.iconTbOn;
  const cBotBar = scheme.cardBg;
  const cBotBarIconBgAct = scheme.cardBg;
  const cThemesHead = scheme.headerBg;
  const cThemesHeadTex = scheme.headerOn;
  const cPagePaletsBg = tc.cBgW;
  //   const cPagePaletsBg = '#FF1';
  //   changeNavigationBarColor(cPageBorderBg, !isDarkMode); //колір Navigation Bar , true - світлі іконки
  // ✅ Navigation bar color — тільки при зміні теми або кольору
  useEffect(() => {
    changeNavigationBarColor(cPageBorderBg, !isDarkMode);
  }, [cPageBorderBg, isDarkMode]);
  //
  const sizeIcon = sizes.sBarIcon;
  const sizeBg = sizeIcon + 5;

  return (
    <SafeAreaView style={{flex: 1}}>
      <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} />
      <RTopBar pcBg={cTopBarBg} pcOn={cTopBarOn} />
      {/* Page */}
      <View style={[styles.pageContainer, {backgroundColor: cPageBorderBg}]}>
        <View
          style={[styles.pageHeadContainer, {backgroundColor: cPageHeadBg}]}>
          <MyArrowBack
            // headText={'toHome'}
            color={cPageHeadText}
            sizeIcon={sizeIcon}
          />
          <View style={styles.pageHeadRight}>
            <TouchableOpacity
              // onPress={() => navigation.goBack()}
              style={[
                styles.iconContainer,
                {
                  //   backgroundColor: cPageHeadBg,
                  height: sizeIcon,
                  width: sizeIcon,
                  borderRadius: sizeBg / 2,
                },
              ]}>
              <Ionicons name={'search'} color={cPageHeadText} size={sizeIcon} />
            </TouchableOpacity>
            {/*  */}
          </View>
        </View>

        {/*  */}
        <View style={{flex: 1, backgroundColor: cPageBg}}>
          {/* Вибір тем */}
          <View style={[styles.themesHead, {backgroundColor: cThemesHead}]}>
            <Text style={[styles.themesHeadText, {color: cThemesHeadTex}]}>
              Виберіть колір 👉
            </Text>

            {/* Випадаючий список кольорів */}
            <ColorSettingDropList />
          </View>
          <ThemeSwitcher variant={1} />
          {/* Загальна сторінка шаблонів*/}
          <View
            style={{
              flex: 1,
              padding: 3,
              backgroundColor: cPagePaletsBg,
            }}>
            <Text
              style={[
                styles.themesHeadText,
                {marginTop: 10, color: cPageHeadText},
              ]}>
              Шаблони екранів
            </Text>
            <FlatList
              //   data={[{id: 'colorsn'}, {id: 'colors'}, {id: 'list'}]} // Масив компонентів
              data={[{id: 'colors'}, {id: 'list'}]} // Масив компонентів
              keyExtractor={item => item.id}
              renderItem={({item}) => {
                switch (item.id) {
                  case 'colors':
                    return __DEV__ ? <ModelColors /> : null;
                  case 'list':
                    return <ModelsSection />;
                  default:
                    return null;
                }
              }}
              nestedScrollEnabled={true}
            />
          </View>
        </View>
      </View>
      <RBotBar pcBg={cBotBar} pcIconBgAct={cBotBarIconBgAct} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    paddingHorizontal: 8, // або можна 8, 10 — в пікселях
    borderRadius: 15,
    // margin: '2%', //Для бардюра Bg
  },
  pageHeadContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 56,
  paddingHorizontal: 12,
},
  pageHeadRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 1,
    marginRight: 5,
  },
  themesHead: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 25,
    gap: 5,
  },
  themesHeadText: {
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'center',
    fontFamily: 'Poppins-Bold',
  },
});
