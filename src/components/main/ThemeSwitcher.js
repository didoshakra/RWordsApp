/* eslint-disable react-native/no-inline-styles */
//ThemeSwitcher.js

import {
  Appearance,
  TouchableOpacity,
  View,
  Switch,
  Text,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import React, {useContext} from 'react';

import {ThemeContext} from '@/context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ThemeSwitcher({
  variant,
  pcBg = 'transparent',
  pcOn = 'gray',
}) {
  const variant1 = variant;
  const isDarkMode = useColorScheme() === 'dark';
  const nevTheme = isDarkMode ? 'light' : 'dark';
  //   console.log('*ThemeSwitcher/nevTheme=', nevTheme);
  const {colors, sizes} = useContext(ThemeContext);
  const tc = colors;
  //   const cIcon = tc.ctIcon;
  const cIcon = pcOn;
  const cText = tc.ctOnBg;
  const fText = 14;
  const iconSize = sizes.sBarIcon;

  const toggleTheme = () => {
    Appearance.setColorScheme(nevTheme);
  };

  return (
    <View style={styles.container}>
      {variant1 == 1 ? (
        <View style={{flexDirection: 'row'}}>
          <Switch
            style={{color: cIcon}}
            value={isDarkMode}
            onChange={() => toggleTheme()}
          />
          <Text style={{fontSize: fText, color: cText}}>lith/dark</Text>
        </View>
      ) : (
        <View className="flex-row self-center justify-center">
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => toggleTheme()}
            // onPress={() => Appearance.setColorScheme(nevTheme)}
            //   toggleColorScheme(isDarkMode === 'light' ? 'dark' : 'light')
            className="flex-row items-center justify-center">
            {isDarkMode ? (
              <Ionicons name={'sunny'} color={cIcon} size={iconSize} />
            ) : (
              <Ionicons name={'moon'} color={cIcon} size={iconSize} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 35,
    height: 40,
    // paddingHorizontal: 10,
  },
  iconContainer: {
    padding: 2,
    borderRadius: '100%',
  },
});
