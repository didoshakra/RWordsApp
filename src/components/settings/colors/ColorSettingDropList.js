//ColorSettingDropList.js //FlatList замість ScrollView/ Без map
// Анімація //https://www.youtube.com/watch?v=5fxeYd5vFDo&ab_channel=EngineerCodewala

import {
  FlatList,
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useAnimatedValue,
  Easing,
  Dimensions,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useContext} from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// const DATA = [
//   //https://tailwindcolor.com/
//   {id: 1, name: 'slate', colBg: '#f1f5f9', colTxt: '#64748b'},
//   {id: 2, name: 'gray', colBg: '#e5e7eb', colTxt: '#6b7280'},
//   {id: 3, name: 'zinc', colBg: '#e4e4e7', colTxt: '#52525b'},
//   {id: 4, name: 'neutral', colBg: '#e5e5e5', colTxt: '#737373'},
//   {id: 5, name: 'stone', colBg: '#e7e5e4', colTxt: '#57534e'},
//   {id: 6, name: 'rose', colBg: '#fecdd3', colTxt: '#e11d48'},
//   {id: 7, name: 'pink', colBg: '#fbcfe8', colTxt: '#db2777'},
//   {id: 8, name: 'fuchsia', colBg: '#f5d0fe', colTxt: '#C026D3'},
//   {id: 9, name: 'purple', colBg: '#e9d5ff', colTxt: '#9333ea'},
//   {id: 10, name: 'violet', colBg: '#ddd6fe', colTxt: '#7c3aed'},
//   {id: 11, name: 'indigo', colBg: '#c7d2fe', colTxt: '#4F46E5'},
//   {id: 12, name: 'blue', colBg: '#bfdbfe', colTxt: '#2563EB'},
//   {id: 13, name: 'sky', colBg: '#bae6fd', colTxt: '#0284c7'},
//   {id: 14, name: 'cyan', colBg: '#a5f3fc', colTxt: '#0891b2'},
//   {id: 15, name: 'teal', colBg: '#99f6e4', colTxt: '#0D9488'},
//   {id: 16, name: 'emerald', colBg: '#a7f3d0', colTxt: '#059669'},
//   {id: 17, name: 'green', colBg: '#bbf7d0', colTxt: '#16a34a'},
//   {id: 18, name: 'lime', colBg: '#d9f99d', colTxt: '#65a30d'},
//   {id: 19, name: 'yellow', colBg: '#fef08a', colTxt: '#ca8a04'},
//   {id: 20, name: 'amber', colBg: '#fde68a', colTxt: '#d97706'},
//   {id: 21, name: 'orange', colBg: '#fed7aa', colTxt: '#ea580c'},
//   {id: 22, name: 'red', colBg: '#fecaca', colTxt: '#dc2626'},
// ];
//
const DATA = [
  //materialui scheme //https://materialui.co/colors*/
  {id: 1, name: 'Red', colBg: '#EF5350', colTxt: '#FFEBEE'},
  {id: 2, name: 'Pink', colBg: '#EC407A', colTxt: '#FCE4EC'},
  {id: 3, name: 'Purple', colBg: '#AB47BC', colTxt: '#F3E5F5'},
  {id: 4, name: 'DeepPurple', colBg: '#7E57C2', colTxt: '#EDE7F6'},
  {id: 5, name: 'Indigo', colBg: '#5C6BC0', colTxt: '#E8EAF6'},
  {id: 6, name: 'Blue', colBg: '#42A5F5', colTxt: '#E3F2FD'},
  {id: 7, name: 'LightBlue', colBg: '#29B6F6', colTxt: '#E1F5FE'},
  {id: 8, name: 'Cyan', colBg: '#26C6DA', colTxt: '#E0F7FA'},
  {id: 9, name: 'Teal', colBg: '#26A69A', colTxt: '#E0F2F1'},
  {id: 10, name: 'Green', colBg: '#66BB6A', colTxt: '#E8F5E9'},
  {id: 11, name: 'LightGreen', colBg: '#9CCC65', colTxt: '#F1F8E9'},
  {id: 12, name: 'Lime', colBg: '#D4E157', colTxt: '#827717'},
  {id: 13, name: 'Yellow', colBg: '#FFEE58', colTxt: '#F57F17'},
  {id: 14, name: 'Amber', colBg: '#FFA726', colTxt: '#FFF8E1'},
  {id: 15, name: 'Orange', colBg: '#FF9800', colTxt: '#FFF3E0'},
  {id: 16, name: 'DeepOrange', colBg: '#FF7043', colTxt: '#FBE9E7'},
  {id: 17, name: 'Brown', colBg: '#8D6E63', colTxt: '#EFEBE9'},
  {id: 18, name: 'Grey', colBg: '#BDBDBD', colTxt: '#212121'},
  {id: 19, name: 'BlueGrey', colBg: '#78909C', colTxt: '#ECEFF1'},
];

export default function ColorSettingDropList() {
  const [showContent, setShowContent] = useState(false);
  const [dimensions, setDimensions] = useState({
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen'),
  });
  //   Колір
  const {colors, colTheme, changeTheme} = useContext(ThemeContext);
  const iconSize = 32;

  //   const cListHeaderBg = colors.ctBg2;
  const cListHeaderBg = colors.cT5;
  const cListHeaderBorder = colors.ctBorder1;
  const cListHeaderText = colors.cT0;
  //https://reactnative.dev/docs/easing  //Easing реалізує загальні функції полегшення.
  const animatedList = useAnimatedValue(0);

  const animatedListIn = easing => {
    animatedList.setValue(0);
    Animated.timing(animatedList, {
      toValue: 1,
      duration: 1000,
      easing,
      useNativeDriver: false,
    }).start();
  };
  const animatedListOut = easing => {
    animatedList.setValue(1);
    Animated.timing(animatedList, {
      toValue: 0,
      duration: 1000,
      easing,
      useNativeDriver: false,
    }).start();
  };

  const size = animatedList.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 750],
  });

  const animatedListStyle = [
    {
      animatedList,
      //   width: size,
      width: '100%',
      height: size,
      //   height: 100, //По щирині(фіксована висота)
    },
  ];

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({window, screen}) => {
        setDimensions({window, screen});
      },
    );
    return () => subscription?.remove();
  });
  const heightW = dimensions.screen.height;
  const widthW = dimensions.screen.width;
  //   const heightColList = heightW * 0.55;
  const heightColList = widthW > heightW ? heightW - 260 : heightW - 310;

  return (
    // {/* colorList */}
    <View style={styles.colorListSection}>
      {/* Header */}

      <TouchableOpacity
        activeOpacity={1}
        style={[
          styles.colorListHead,
          {
            backgroundColor: cListHeaderBg,
            borderColor: cListHeaderBorder,
          },
        ]}
        onPress={() => {
          setShowContent(!showContent);
          if (!showContent) {
            animatedListIn(Easing.linear);
          } else {
            animatedListOut(Easing.linear);
          }
        }}>
        <Text style={[styles.colorListHeadText, {color: cListHeaderText}]}>
          {colTheme}
        </Text>
        {/* Стрілка */}
        {/* <Animated.View style={{transform: [{rotateZ: arrowTransform}]}}>
                </Animated.View> */}
        <FontAwesome
          style={{
            transform: showContent ? [{rotate: '180deg'}] : [{rotate: '0deg'}],
          }}
          name={'angle-down'}
          color={cListHeaderText}
          size={iconSize}
        />
      </TouchableOpacity>

      {/* Випадаючий список  */}
      <View style={styles.colorListContainer}>
        <Animated.View style={animatedListStyle}>
          {/* <ColorList /> */}
          <View style={{height: heightColList}}>
            <FlatList
              data={DATA}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => {
                    setShowContent(!showContent);
                    if (!showContent) {
                      animatedListIn(Easing.linear);
                    } else {
                      animatedListOut(Easing.linear);
                    }
                    changeTheme(item.name);
                  }}
                  style={[
                    styles.colorListItemStyle,
                    {backgroundColor: item.colBg},
                  ]}>
                  <Text
                    style={[styles.colorListItemText, {color: item.colTxt}]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              idExtractor={item => item.id}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  colorListSection: {
    width: '50%',
    // gap:  15,
  },
  colorListHeadText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  colorListHead: {
    // width: '100%',
    // height: 40,
    // alignSelf: 'center',//по горизонталі
    // marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 8,
    gap: 5,
  },
  colorListContainer: {
    flex: 1,
    position: 'absolute',
    zIndex: 20,
    right: 0,
    top: 40,
    width: '100%',
    // margin: 2,
    alignSelf: 'center',
    overflow: 'hidden',
  },

  colorListItemStyle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 40,
    margin: 1,
    paddingLeft: 20,
    // padding: 10,
  },
  colorListItemText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
