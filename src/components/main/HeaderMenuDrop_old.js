//HeaderMenuDrop.js ///GPT-закриває черезBackShadow/до Ref
// HeaderMenuDrop з використанням Modal для правильного затемнення і анімації появи меню.

import React, {useState, useContext, useRef} from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  StyleSheet,
  Easing,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ThemeContext} from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';

const menuData = [
  {
    id: 1,
    head: 'Кольори',
    navi: 'ColorSettings',
    iconTag: Ionicons,
    iconName: 'color-palette',
  },
  {
    id: 2,
    head: 'Слова',
    navi: 'WordsList',
    iconTag: Entypo,
    iconName: 'list',
  },
  {
    id: 3,
    head: 'Теми',
    navi: 'TopicsList',
    iconTag: Entypo,
    iconName: 'list',
  },
  {
    id: 4,
    head: 'Групи тем',
    navi: 'SectionsList',
    iconTag: Entypo,
    iconName: 'list',
  },
];

const HeaderMenuDrop = ({
  pcBg = 'transparent',
  pcOn = 'gray',
  menuPosition = {top: 70, right: 30}, //меню позиціонується за допомогою стилів menuPosition,
}) => {
  const navigation = useNavigation();
  const [activeItem, setActiveItem] = useState(1);
  const {sizes, getColorScheme} = useContext(ThemeContext);
  const indexScheme = 0;
  const scheme = getColorScheme(indexScheme);
  const showContainerBg = scheme.itemBg;
  const showContainerBorder = scheme.border;
  const cItemBg = scheme.itemBg;
  const cItemOn = scheme.itemOn;
  const cItemBgAct = scheme.itemBgAct;
  const cItemOnAct = scheme.itemOnAct;
  const cHeadIcon = pcOn;
  const sizeIcon = sizes.sBarIcon;

  const [showContent, setShowContent] = useState(false);
  const animatedList = useRef(new Animated.Value(0)).current;

  // Анімація відкриття меню
  const animatedListIn = easing => {
    animatedList.setValue(0);
    Animated.timing(animatedList, {
      toValue: 1,
      duration: 300,
      easing,
      useNativeDriver: false,
    }).start();
  };

  // Анімація закриття меню
  const animatedListOut = (easing, cb) => {
    Animated.timing(animatedList, {
      toValue: 0,
      duration: 300,
      easing,
      useNativeDriver: false,
    }).start(() => {
      if (cb) cb();
    });
  };

  const size0 = 180; //Висота меню
  const size = animatedList.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size0],
  });

  const animatedListStyle = [
    {
      width: 200,
      height: size,
    },
  ];

  // Головна ф-ція закриття меню
  const handleClose = () => {
    animatedListOut(Easing.linear, () => setShowContent(false));
  };

  // Коли showContent стає true — запускаємо анімацію меню із затримкою
  React.useEffect(() => {
    if (showContent) {
      // Коротка затримка, щоб Modal встиг відрендеритись поверх усього UI
      setTimeout(() => {
        animatedListIn(Easing.linear);
      }, 15);
    }
  }, [showContent]);

  return (
    <View>
      {/* Кнопка відкриття/закриття */}
      <Pressable
        onPress={() => {
          setShowContent(true);
        }}>
        <Ionicons name={'settings'} color={cHeadIcon} size={sizeIcon} />
      </Pressable>

      {/* Модалка з BackShadow + меню */}
      <Modal
        visible={showContent}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent>
        {/* BackShadow */}
        <Pressable style={styles.backShadow} onPress={handleClose} />
        {/* Анімоване меню */}
        <View
          style={[
            styles.menuContainer,
            menuPosition,
            {
              backgroundColor: showContainerBg,
              borderColor: showContainerBorder,
            },
          ]}>
          <Animated.View style={animatedListStyle}>
            <View>
              {menuData.map(item => {
                const Tag = item.iconTag;
                return (
                  <Pressable
                    style={[
                      styles.itemContainer,
                      {
                        backgroundColor:
                          activeItem === item.id ? cItemBgAct : cItemBg,
                      },
                    ]}
                    key={item.id}
                    onPress={() => {
                      setActiveItem(item.id);
                      handleClose();
                      setTimeout(() => {
                        navigation.navigate(item.navi);
                      }, 300);
                    }}>
                    <Tag
                      name={item.iconName}
                      color={activeItem === item.id ? cItemOnAct : cItemOn}
                      size={30}
                    />
                    <Text
                      style={[
                        styles.itemText,
                        {
                          color: activeItem === item.id ? cItemOnAct : cItemOn,
                        },
                      ]}>
                      {item.head}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};
export default HeaderMenuDrop;

const styles = StyleSheet.create({
  backShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 1,
  },
  menuContainer: {
    position: 'absolute',
    zIndex: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 2,
    gap: 10,
    flexWrap: 'nowrap',
  },
  itemText: {
    fontSize: 18,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'left',
    padding: 1,
  },
});