//BuildingMenuDrop.js ///GPT-закриває черезBackShadow/до Ref

import React, {useState, useContext} from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  StyleSheet,
  Easing,
  useAnimatedValue,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {ThemeContext} from '../../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import BackShadow from '@/components/main/BackShadow';

const menuData = [
  {
    id: 1,
    head: 'DraggableListScreen',
    navi: 'DraggableListScreen',
    iconTag: Entypo,
    iconName: 'list',
  },
];

// export default function WordsMenuDrop() {
const BuildingMenuDrop = ({pcBg = 'transparent', pcOn = 'gray'}) => {
  const navigation = useNavigation();
  //   const [dropMenuOpen, setDropMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(1);

  // Кольори
  //   const {colors, sizes} = useContext(ThemeContext);
  const {sizes, getColorScheme} = useContext(ThemeContext);
  const indexScheme = 0;
  const scheme = getColorScheme(indexScheme);
  //   const tc = colors;
  const showContainerBg = scheme.itemBg;
  const showContainerBorder = scheme.border;
  const cItemBg = scheme.itemBg;
  const cItemOn = scheme.itemOn;
  const cItemBgAct = scheme.itemBgAct;
  const cItemOnAct = scheme.itemOnAct;
  const cItemIcon = scheme.buttonOn;
  const cHeadIcon = pcOn;

  //
  const sizeIcon = sizes.sBarIcon;

  //https://reactnative.dev/docs/easing  //Easing реалізує загальні функції полегшення.
  const [showContent, setShowContent] = useState(false);
  const animatedList = useAnimatedValue(0);

  //   const animatedOpacity = animatedList.interpolate({
  //     inputRange: [0, 1],
  //     outputRange: [0, 1], // Прозорість від 0 до 1
  //   });

  const animatedListIn = easing => {
    animatedList.setValue(0);
    Animated.timing(animatedList, {
      toValue: 1,
      duration: 300,
      easing,
      useNativeDriver: false,
    }).start();
  };
  const animatedListOut = easing => {
    animatedList.setValue(1);
    Animated.timing(animatedList, {
      toValue: 0,
      duration: 300,
      easing,
      useNativeDriver: false,
    }).start();
  };

  const size0 = 230; //Висота меню
  const size = animatedList.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size0], // Наприклад, 150px висота
  });

  const animatedListStyle = [
    {
      //   opacity: animatedOpacity,
      animatedList,
      width: 200, //обовязково бо перенос вниз
      height: size, //size-по анімаці по висоті height: size,
      //   height: 100, //По щирині(фіксована висота)
      //   width: size, //size- анімація по ширині width: size,
      //   alignSelf: 'stretch', // Не працює
      //   maxWidth: 400, // Не працює
    },
  ];
  return (
    //
    <View>
      {/*Затемнення екрану */}
      {showContent && (
        // <BackShadow setOpen={setShowContent} pRight={-10} pTop={-10} />
        <BackShadow
          onPress={() => {
            setShowContent(false);
            animatedListOut(Easing.linear);
          }}
          pRight={-20}
          pTop={-20}
        />
      )}
      {/* Анімоване меню */}
      <View
        style={[
          styles.menuContainer,
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
                    // setDropMenuOpen(false);
                    setActiveItem(item.id);
                    setShowContent(false);
                    animatedListOut(Easing.linear); // Запускаємо анімацію закриття
                    // Робимо затримку перед переходом, щоб меню встигло закритися
                    setTimeout(() => {
                      navigation.navigate(item.navi);
                    }, 300); // 300 - це час завершення анімації
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

      {/* Кнопка відкриття/закриття */}
      <Pressable
        onPress={() => {
          setShowContent(!showContent);
          if (!showContent) {
            animatedListIn(Easing.linear);
          } else {
            animatedListOut(Easing.linear);
          }
        }}>
        <Entypo
          name={'dots-three-vertical'}
          color={cHeadIcon}
          size={sizeIcon}
        />
      </Pressable>
    </View>
  );
};
export default BuildingMenuDrop;

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    position: 'absolute',
    zIndex: 20,
    top: 30,
    right: 10,
    borderRadius: 10,
    overflow: 'hidden', // Запобігає просочуванню контенту за межі
  },
  listContainer: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden', // Запобігає просочуванню контенту за межі
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
