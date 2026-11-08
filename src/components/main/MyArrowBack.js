//MyArrowBack

import {StyleSheet, TouchableOpacity, View, Text} from 'react-native';
import React, {useContext} from 'react';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import AntDesign from 'react-native-vector-icons/AntDesign';
import {ThemeContext} from '../../context/ThemeContext';

export default function MyArrowBack({
  headText,
  color,
  colorIconBg,
  back,
  titleText,
  callBack,
}) {
  const navigation = useNavigation();
  const {sizes} = useContext(ThemeContext);
  const sizeIcon = sizes.sBarIcon;
  const sPageHeadFont = sizes.sPageHeadFont;
  const sPageHeadTitleFont = sizes.sPageHeadTitleFont;

  const hText = headText || '';
  //Для обводки іконки(поки ні)
  //   const sizeIconBg = sizeIcon + 5;
  const styleButton = {
    // backgroundColor: colorIconBg,
    // height: sizeIconBg,
    // width: sizeIconBg,
    // borderRadius: sizeIconBg / 2,
  };

  return (
    <View style={styles.headLeft}>
      <TouchableOpacity
        style={[styles.backButton, styleButton]}
        onPress={() => {
            back ? navigation.replace(back) : navigation.goBack();
        //   back ? navigation.navigate(back) : navigation.goBack();
          callBack && callBack();
        }}>
        <Ionicons name={'arrow-back-outline'} color={color} size={sizeIcon} />
        <Text style={[styles.text, {color: color, fontSize: sPageHeadFont}]}>
          {hText}
        </Text>
      </TouchableOpacity>
      <Text
        style={[
          styles.pageHeadTitleText,
          {fontSize: sPageHeadTitleFont, color: color},
        ]}>
        {titleText}
      </Text>
      <Text>{''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10, //відступ стрілки
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageHeadTitleText: {
    textAlign: 'center',
    fontWeight: 'semibold',
  },
});
