//StatTopBar.js

import {StatusBar,useColorScheme} from 'react-native';
import React from 'react';
import RTopBar from './RTopBar';

export default function StatTopBar({pcBg = 'transparent', pcOn = 'gray'}) {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={pcBg}
        color={pcOn}
      />
      <RTopBar pcBg={pcBg} pcOn={pcOn} />
    </>
  );
}
