//ModelColors.js

import {View, Text, useColorScheme, StyleSheet} from 'react-native';
import React from 'react';
import {useContext} from 'react';
import Entypo from 'react-native-vector-icons/Entypo';
import Foundation from 'react-native-vector-icons/Foundation';
import { ThemeContext } from '@/context/ThemeContext';

export default function ModelColors() {
  //   Колір
  const {colors, getColorScheme, sizes} = useContext(ThemeContext);
  const tc = colors;
  const scheme0 = getColorScheme(0);
  const scheme1 = getColorScheme(1);
  const scheme2 = getColorScheme(2);

  const cModelPage = scheme0.pageBg;
  const cSectionText = scheme0.headerOn;

  const cCardBgO = scheme0.cardBg;
  const cCardBor0 = scheme0.cardBor;

  const cCardBg1 = scheme1.cardBg;
  const cCardBorLig1 = scheme1.cardBorLig;

  const Border0 = scheme0.border;
  const Border1 = scheme1.border; //   const cIconBg0 = scheme0.iconTbBg;
  const Border2 = scheme2.border;

  console.log('cT5:', tc.cT5); // точно такий самий?
  console.log('cBg5:', tc.cBg5);

  return (
    <View style={[styles.modelPage, {backgroundColor: cModelPage}]}>
      <Text style={[styles.text, {color: cSectionText}]}>
        Основні пари корьорів
      </Text>
      {/*  backgroundColor-колірні пари / Border1 і cIconOn0-по темах */}
      {/* colorsItemContainer */}
      <View
        style={[
          styles.colorsItemContainer,
          {backgroundColor: cCardBgO, borderColor: cCardBor0},
        ]}>
        {/*сW/cD*/}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBgW, //Колір
              borderColor: Border0, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOnW}]}>bgW/D</Text>
        </View>
        {/*сBg0/8  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg, //Колір
              borderColor: Border1, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn}]}>Bg/8</Text>
        </View>
        {/*сBg1/9  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg1, //Колір
              borderColor: Border2, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn1}]}>Bg1/9</Text>
        </View>
        {/*сBg2/9  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg2, //Колір
              borderColor: Border0, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn2}]}>Bg2/9</Text>
        </View>
        {/*сBg3/9  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg3, //Колір
              borderColor: Border1, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn3}]}>Bg3/9</Text>
        </View>
      </View>
      {/* colorsItemContainer*/}
      <View
        style={[
          styles.colorsItemContainer,
          {backgroundColor: cCardBg1, borderColor: cCardBorLig1},
        ]}>
        {/*сBg4/18  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg4, //Колір
              borderColor: Border2, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn4}]}>Bg4/18</Text>
        </View>
        {/*сBg5/0  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg5, //Колір
              // backgroundColor: tc.cT5, //Колір
              borderColor: Border0, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn5}]}>Bg5/0</Text>
        </View>
        {/*сBg6/0  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg6, //Колір
              borderColor: Border1, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn6}]}>Bg6/0</Text>
        </View>
        {/*сBg7/cOn7-2  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg7, //Колір
              borderColor: Border2, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn7}]}>Bg7/0</Text>
        </View>
        {/*сBg8/cOn8-0  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg8, //Колір
              borderColor: Border0, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn8}]}>Bg8/0</Text>
        </View>
      </View>

      {/*colorsItemContainer */}
      <View
        style={[
          styles.colorsItemContainer,
          {backgroundColor: cCardBg1, borderColor: cCardBorLig1},
        ]}>
        {/*сBg9/0  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg9, //Колір
              borderColor: Border1, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn9}]}>Bg9/0</Text>
        </View>
        {/*сBg10/9  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg10, //Колір
              borderColor: Border2, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn10}]}>Bg10/9</Text>
        </View>
        {/*сBg11/8  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg11, //Колір
              borderColor: Border0, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn11}]}>Bg11/8</Text>
        </View>
        {/*сBg12/cOn12-1  */}
        <View
          style={[
            styles.modelItem,
            {
              backgroundColor: tc.cBg12, //Колір
              borderColor: Border1, //Тема
            },
          ]}>
          <Text style={[styles.modelText, {color: tc.cOn12}]}>Bg12/0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modelPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  colorsItemContainer: {
    marginTop: 2,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    padding: 5,
    borderWidth: 2,
    borderRadius: 10,
    gap: 2,
  },
  // GPT
  page: {
    flex: 1,
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,

    borderRadius: 16,

    // тінь для iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    // тінь для Android
    elevation: 6, // Тінь на Android
  },
  card: {
    flex: 1,
    marginTop: 2,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,

    borderRadius: 16,
    // тінь для iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,

    // тінь для Android
    elevation: 5,
  },
  text: {
    fontSize: 14,
    color: '#333',
  },
  //
  modelItem: {
    marginBottom: 2,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '19%',
    borderWidth: 2,
    borderRadius: 15,
  },

  modelText: {
    fontSize: 12,
    // textAlignVertical: 'center',
    // fontWeight: 'bold',
  },
  iconContainer: {
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // width: '100%',
    height: 60,
    paddingHorizontal: 10,
    zIndex: 1,
    gap: 10,
    // opacity: 0.6,
  },
  iconItem: {
    // flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 10,
    // backgroundColor: 'red',
    // opacity: 0.7,
  },
  iconItemText: {
    fontSize: 10,
  },
});
