//RBotBar.js // GPT
import React, {useContext} from 'react';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Foundation from 'react-native-vector-icons/Foundation';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {ThemeContext} from '@/context/ThemeContext';

export default function RBotBar({
  pcBg = 'transparent',
  pcOn = 'gray',
  pcIconBgAct = 'transparent',
  pcIconOnAct = 'gray',
}) {
  const navigation = useNavigation();
  const route = useRoute(); // Отримуємо активний маршрут
  const {sizes, getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(1);

  // Колір активної та неактивної іконки

  const cItemText = scheme.iconTbOn;
  const cItemTextAct = scheme.iconTbOnAct;
  const cIcon = scheme.iconTbOn;
  const cIconAct = scheme.iconTbOnAct;
  const cItemBgAct = scheme.iconTbBgAct;

  const iconSize = sizes.sBarIcon;

  const iconsData = [
    // {id: 1, head: 'Головна', navi: 'Home', iconTag: Entypo, iconName: 'home'},

    {
      id: 1,
      head: 'Записник',
      navi: 'NoteRecorderScreen',
      iconTag: MaterialIcons,
      iconName: 'book',
    },
    {
      id: 2,
      head: 'Переклад',
      navi: 'TranslatorScreen',
      iconTag: MaterialIcons,
      iconName: 'g-translate',
      //   iconName: 'translate',
    },
    // {
    //   id: 3,
    //   head: 'Слухати',
    //   navi: 'Words',
    //   iconTag: MaterialIcons,
    //   iconName: 'headphones',
    //   //   iconTag: Foundation,
    //   //   iconName: 'book',
    // },
    {
      id: 3,
      head: 'Навчання',
      navi: 'LearningHomeScreen',
      iconTag: MaterialIcons,
      iconName: 'auto-stories',
      //   iconTag: Foundation,
      //   iconName: 'book',
    },
    {
      id: 4,
      head: 'wwwRW',
      navi: 'AppWebView',
      iconTag: Ionicons,
      iconName: 'globe',
      //   iconTag: FontAwesome,
      //   iconName: 'user',
    },
    {
      id: 5,
      head: 'меню',
      navi: 'MenuScreen',
      iconTag: Entypo,
      iconName: 'menu',
    },
  ];

  return (
    <View style={[styles.container, {backgroundColor: pcBg}]}>
      {iconsData.map(item => {
        const isActive = route.name === item.navi;
        const Tag = item.iconTag;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => navigation.navigate(item.navi)}
            style={[
              styles.item,
              {backgroundColor: isActive ? cItemBgAct : 'transparent'},
            ]}>
            <Tag
              name={item.iconName}
              color={isActive ? cIconAct : cIcon}
              size={iconSize}
            />
            <Text
              style={[
                styles.itemText,
                {color: isActive ? cItemTextAct : cItemText},
              ]}>
              {item.head}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // width: '100%',
    height: 60,
    paddingHorizontal: 2,
    zIndex: 1,
    gap: 1,
    // opacity: 0.6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderRadius: 30,
    // maxWidth: 80,
    // backgroundColor: 'red',
    // opacity: 0.7,
  },
  itemText: {
    fontSize: 10,
  },
});
