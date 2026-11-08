/* eslint-disable react-native/no-inline-styles */
//ModelList.js//<FlatList GPT

import React, {useContext, useState, useEffect} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, FlatList} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Foundation from 'react-native-vector-icons/Foundation';

import {ThemeContext} from '@/context/ThemeContext';

const modelData = [
  {id: 1, nz: 1, word: 'Hello', translation: 'привіт', know: true},
  {
    id: 2,
    nz: 1,
    word: 'Hello Peter',
    translation: 'привіт Петро',
    know: true,
  },
  {
    id: 3,
    nz: 1,
    word: "і'm going",
    translation: 'я йду',

    know: true,
  },
];

export default function ModelList1() {
  const [dropMenuOpen, setDropMenuOpen] = useState(false);
  const [activeItemId, setActItemId] = useState(1);
  const [activeButtonId, setActButtonId] = useState(0);
  //   Колір
  const {colors, getColorScheme, sizes} = useContext(ThemeContext);
  const tc = colors;
  const scheme = getColorScheme(1);

  const cPageBg = scheme.pageBg; //Bg колір сторінки
  const cPageBorder = scheme.pageBorder;
  const cCardBg = scheme.cardBg;
  const cCardBorder = scheme.cardBorder;

  const cTableTitleText = scheme.titleOn;
  const cTableHeadText = scheme.headerOn;
  const cTableHeadBg = scheme.headerBg;

  const cItemBg = scheme.inputBg;
  const cItemText = scheme.inputOn;
  const cItemBgAct = scheme.activeBg;
  const cItemTextAct = scheme.activeOn;
  const cBorder = scheme.border;

  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;
  const cBtnBorder = scheme.buttonBorder;
  const cBtnBg1 = scheme.buttonBg;
  const cBtnText1 = scheme.buttonOn;
  const cBtnBorder1 = scheme.buttonBorder;
  const cBtnBgAct = scheme.buttonBgAct;
  const cBtnTextAct = scheme.buttonOnAct;

  const cIconOn = scheme.iconTbOn;
  const cIconBgAct = scheme.iconTbBgAct;
  const cIconOnAct = scheme.iconTbOnAct;

  const iconSize = sizes.sBarIcon;
  //
  return (
    <View
      style={[
        styles.pageContainer,
        {backgroundColor: cPageBg, borderColor: cPageBorder},
      ]}>
      <Text
        style={{
          textAlignVertical: 'center',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 16,
          color: cTableHeadText,
        }}>
        Колірна схема 2
      </Text>
      <View
        style={[
          styles.cardContainer,
          {backgroundColor: cCardBg, borderColor: cCardBorder},
        ]}>
        <Text
          style={{
            textAlignVertical: 'center',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: 16,
            color: cTableTitleText,
          }}>
          Слова
        </Text>
        {/* Table */}
        <View style={[styles.tableContainer, {borderColor: cBorder}]}>
          {/* Head table*/}
          <View
            style={[
              styles.rowsContainer,
              {backgroundColor: cTableHeadBg, borderColor: cBorder},
            ]}>
            {/* <View style={{flex: 1, backgroundColor: cTableHeadBg}}> */}
            <View style={styles.itemFl1}>
              <Text style={[styles.titleText, {color: cTableHeadText}]}>
                id
              </Text>
            </View>
            <View style={styles.itemFl1}>
              <Text style={[styles.titleText, {color: cTableHeadText}]}>
                nz
              </Text>
            </View>
            <View style={styles.itemFl4}>
              <Text style={[styles.titleText, {color: cTableHeadText}]}>
                Вираз
              </Text>
            </View>
            <View style={styles.itemFl4}>
              <Text style={[styles.titleText, {color: cTableHeadText}]}>
                Переклад
              </Text>
            </View>

            <View style={styles.itemFl1}>
              <Text style={[styles.titleText, {color: cTableHeadText}]}>+</Text>
            </View>
          </View>

          {/* Rows */}
          <FlatList
            // style={{flex: 1, maxHeight: 300}}
            style={{flex: 1}}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            data={modelData}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <TouchableOpacity
                onLongPress={() => setDropMenuOpen(!dropMenuOpen)}
                onPress={() => setActItemId(item.id)}
                style={[
                  styles.rowsContainer,
                  {
                    borderColor: cBorder,
                    backgroundColor:
                      activeItemId === item.id ? cItemBgAct : cItemBg,
                  },
                ]}>
                <View style={styles.itemFl1}>
                  <Text
                    style={[
                      styles.rowsText,
                      styles.texCenter,
                      {
                        color:
                          activeItemId === item.id ? cItemTextAct : cItemText,
                      },
                    ]}>
                    {item.id}
                  </Text>
                </View>
                <View style={styles.itemFl1}>
                  <Text
                    style={[
                      styles.rowsText,
                      styles.texCenter,
                      {
                        color:
                          activeItemId === item.id ? cItemTextAct : cItemText,
                      },
                    ]}>
                    {item.nz}
                  </Text>
                </View>
                <View style={styles.itemFl4}>
                  <Text
                    style={[
                      styles.rowsText,
                      {
                        color:
                          activeItemId === item.id ? cItemTextAct : cItemText,
                      },
                    ]}>
                    {item.word}
                  </Text>
                </View>
                <View style={styles.itemFl4}>
                  <Text
                    style={[
                      styles.rowsText,
                      {
                        color:
                          activeItemId === item.id ? cItemTextAct : cItemText,
                      },
                    ]}>
                    {item.translation}
                  </Text>
                </View>
                <View style={styles.itemFl1}>
                  <Text
                    style={[
                      styles.rowsText,
                      styles.texCenter,
                      {
                        color:
                          activeItemId === item.id ? cItemTextAct : cItemText,
                      },
                    ]}>
                    {item.know ? '+' : '-'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
        {/* Buttons */}
        <View style={[styles.buttonsContainer]}>
          <TouchableOpacity
            onPress={() => setActButtonId(0)}
            style={[
              styles.button,
              //   {backgroundColor:'red'}
              {
                backgroundColor: activeButtonId === 0 ? cBtnBgAct : cBtnBg,
                borderColor: cBtnBorder,
              },
            ]}>
            <Entypo
              name="add-to-list"
              color={activeButtonId === 0 ? cBtnTextAct : cBtnText}
              size={16}
            />
            <Text
              style={[
                styles.buttonText,
                {
                  color: activeButtonId === 0 ? cBtnTextAct : cBtnText,
                },
              ]}>
              BtnBg3
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActButtonId(1)}
            style={[
              styles.button,
              {
                backgroundColor: activeButtonId === 1 ? cBtnBgAct : cBtnBg1,
                borderColor: cBtnBorder1,
              },
            ]}>
            <Feather
              name="edit"
              color={activeButtonId === 1 ? cBtnTextAct : cBtnText1}
              size={16}
            />
            <Text
              style={[
                styles.buttonText,
                {
                  color: activeButtonId === 1 ? cBtnTextAct : cBtnText1,
                },
              ]}>
              BtnBg1
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.iconContainer}>
        <View style={[styles.iconItem, {backgroundColor: 'transparent'}]}>
          <Entypo name={'home'} color={cIconOn} size={iconSize} />
          <Text style={[styles.iconItemText, {color: cIconOn}]}>houm</Text>
        </View>

        <View style={[styles.iconItem, {backgroundColor: cIconBgAct}]}>
          <Foundation name={'book'} color={cIconOnAct} size={iconSize} />
          <Text style={[styles.iconItemText, {color: cIconOnAct}]}>words</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    marginTop: 10,
    padding: 5,
    borderRadius: 15,
    borderWidth: 2,
    // тінь для iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    // тінь для Android
    elevation: 6, // Тінь на Android
    // margin: 2,
  },
  cardContainer: {
    padding: 20,
    margin: 15,
    borderRadius: 15,
    borderWidth: 2,
    // тінь для iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    // тінь для Android
    elevation: 6, // Тінь на Android
  },
  headContainer: {
    // height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableContainer: {
    // flex: 1, //!!! Без цього не працює скрол
    marginBottom: 10,
    borderTopWidth: 1,
    // borderColor: 'red',
  },
  rowsContainer: {
    flexDirection: 'row',
    padding: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    // borderWidth: 1,
    // borderColor:'red',
    flexWrap: 'nowrap',
    gap: 1,
  },
  itemFl1: {
    flex: 1,
  },
  itemFl4: {
    flex: 5,
  },
  titleText: {
    textAlign: 'center',
    fontSize: 14,
  },
  rowsText: {
    fontSize: 12,
  },
  texCenter: {
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 100,
    paddingVertical: 1,
    paddingHorizontal: 10,
    gap: 2,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  iconContainer: {
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    // width: '100%',
    height: 60,
    paddingHorizontal: 10,
    zIndex: 1,
    gap: 10,
  },
  iconItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 10,
  },
  iconItemText: {
    fontSize: 10,
  },
});
