/* eslint-disable react-native/no-inline-styles */
//Home.js

import {
  StyleSheet,
  View,
  StatusBar,
  Image,
  useWindowDimensions,
  Linking,
  Alert,
} from 'react-native';
import React, {useContext, useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar

import {ThemeContext} from '@/context/ThemeContext';
import RBotBar from '@/components/main/RBotBar';
import RTopBar from '@/components/main/RTopBar';
import logo from '@/assets/images/Sun_KozakGrow_1080.png';
import logoRa from '@/assets/images/SunMan_RW.png';
import DeviceInfo from 'react-native-device-info'; //

const Home = () => {
  const appVersion = DeviceInfo.getVersion(); // дасть "1.1.2"
  const {height, width} = useWindowDimensions();
  const isLandscape = width > height;
  //   Колір
  const {isDarkMode, getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(1);

  const cStatusBarBg = scheme.pageBg;
  const cStatusBarOn = scheme.pageOn;
  const cTopBarBg = scheme.pageBg;
  const cTopBarOn = scheme.pageOn;

  const cPageBg = scheme.pageBg;

  const cModalBg = scheme.modalBg;
  const cModalOn = scheme.modalOn;

  const cBotBarBg = scheme.pageBg;
  const cBotBarOn = scheme.pageOn;
  const cBotBarIconBgAct = scheme.iconTbBgAct;
  const cBotBarIconOnAct = scheme.iconTbOnAct;

  const heightRa = isLandscape ? '40%' : '20%';
  const widthRa = isLandscape ? '20%' : '40%';
  const heightLogo = isLandscape ? '98%' : '60%';
  const widthLogo = isLandscape ? '40%' : '98%';
  const bottomLogo = isLandscape ? 120 : -20;

  //   console.log('Home/isDarkMode=', isDarkMode);
  //   changeNavigationBarColor(cPageBg, isDarkMode); //колір Navigation Bar , true - світлі іконки

  // ✅ Navigation bar color — тільки при зміні теми або кольору
  useEffect(() => {
    changeNavigationBarColor(cPageBg, isDarkMode);
  }, [cPageBg, isDarkMode]);

  //   Для перевікки  останньої версії додатку на GitHub
  useEffect(() => {
    fetch('https://api.github.com/repos/didoshakra/rwords/releases/latest')
      .then(res => res.json())
      .then(data => {
        if (data.tag_name && data.tag_name.replace('v', '') !== appVersion) {
          Alert.alert(
            'Доступне оновлення',
            `Нова версія ${data.tag_name} доступна для завантаження`,
            [{text: 'Оновити', onPress: updateApp}, {text: 'Пізніше'}],
          );
        }
      });
  }, []);
  const updateApp = () => {
    const url =
      'https://github.com/didoshakra/rwords/releases/latest/download/rwords.apk';
    Linking.openURL(url).catch(() => {
      Alert.alert('Помилка', 'Не вдалося відкрити посилання на оновлення.');
    });
  };

  return (
    // SafeAreaView з react-native-safe-area-context//безпечні зони на iOS і Android
    <SafeAreaView style={{flex: 1}}>
      {/* <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} /> */}
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={cStatusBarBg}
        color={cStatusBarOn}
      />
      <RTopBar pcBg={cTopBarBg} pcOn={cTopBarOn} />
      {/*  */}
      <View style={{flex: 1, backgroundColor: cPageBg}}>
        <Image
          source={logoRa}
          style={[styles.logoRa, {height: heightRa, width: widthRa}]}
        />
        <Image
          source={logo}
          style={[
            styles.logo,
            {
              height: heightLogo,
              width: widthLogo,
              bottom: bottomLogo,
              backgroundColor: cPageBg,
            }
          ]}
        />
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
export default Home;

const styles = StyleSheet.create({
  logoRa: {
    alignItems: 'flex-start',
    left: 10,
    gap: '2%',
    resizeMode: 'contain', //пропорції(по мін. розміру)
    // resizeMode: 'stretch', //рознягнути
  },
  logo: {
    alignSelf: 'center',
    resizeMode: 'contain', //пропорції(по мін. розміру)
    bottom: 40,
    // resizeMode: 'stretch', //рознягнути
  },
});
