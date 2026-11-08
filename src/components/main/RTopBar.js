//RTopBar.js
import React from 'react';
import {StyleSheet, View, TouchableOpacity} from 'react-native';

// import DrawerSwitcher from './DrawerSwitcher';
// import HeaderMenuDrop from './HeaderMenuDrop';
import ThemeSwitcher from './ThemeSwitcher';
import BuildingModal from '@/components/building/BuildingModal';
import BuildingMenuDrop from '@/components/building/BuildingMenuDrop';
import HomeHelpModal from '@/screens/HomeHelpModal';

export default function RTopBar(props) {
    const pcBg = props.pcBg||'transparent'; // колір передається від батька(Screen) вже з урахуванням isDarkMode
    const pcOn = props.pcOn||'gray'; // колір передається від батька(Screen) вже з урахуванням isDarkMode
    const cModalBg = props.modalBg||'white';
    const cModalOn = props.modalOn||'black';
  return (
    <View
      style={[
        styles.container,
        {backgroundColor: pcBg}, //pcBg- колір передається від батька(Screen) вже з урахуванням isDarkMode
      ]}>
      {/* <DrawerSwitcher /> */}

      <View style={styles.rightContainer}>
        <ThemeSwitcher variant={0} pcBg={pcBg} pcOn={pcOn} />
        {/*  */}
        {/* <HeaderMenuDrop pcBg={pcBg} pcOn={pcOn} /> */}
        {/*  */}
        <HomeHelpModal pcBg={pcBg} pcOn={pcOn} />
        {/* BuildingModal */}
        {__DEV__ && <BuildingModal pcBg={pcBg} pcOn={pcOn} />}
        {/* BuildingMenuDrop */}
        {__DEV__ && <BuildingMenuDrop pcBg={pcBg} pcOn={pcOn} />}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
    height: 40,
    paddingHorizontal: 10,
  },
  rightContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    // paddingHorizontal:30,
    gap: 5,
  },
});
