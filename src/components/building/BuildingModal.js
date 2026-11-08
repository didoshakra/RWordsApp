//BuldingModal.js//Операції розробника.
// copyDatabaseFromDownload-
// copyDatabaseToDownload-для створення createImageMapNode.js-для динамічних картинок
// resetDatabase-не працюєзвідсіля треьа з App.js

import React, {useState, useContext} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  //   Pressable,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  resetDatabase,
  copyDatabaseToDownload,
  copyDatabaseFromDownload,
} from '@/db/dbConfig';

import {ThemeContext} from '@/context/ThemeContext';

const BuldingModal = ({pcBg = 'transparent', pcOn = 'gray'}) => {
  const [isBuldingModal, setIsBuldingModal] = useState(false);
  //   Колір
  const {sizes, getColorScheme} = useContext(ThemeContext);
  const indexScheme = 0;
  const scheme = getColorScheme(indexScheme);
  const cPageHeadText = scheme.pageOn;
  const cModalViewBG = scheme.modalBg;
  const cModalViewBorder = scheme.border;
  const cBtnBg = scheme.buttonBg;
  const cBtnBorder = scheme.buttonBorder;
  const cBtnText = scheme.buttonOn;
  const cIcon = scheme.buttonOn;
  const cHeadIcon = pcOn;
  //
  const iconSize = sizes.sIcon;

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isBuldingModal}
        onRequestClose={() => {
          setIsBuldingModal(false);
        }}>
        {/* Затемнення */}
        <TouchableOpacity
          style={styles.centeredView}
          onPress={() => {
            setIsBuldingModal(false);
          }} //
        />

        <View
          style={[
            styles.modalView,
            {backgroundColor: cModalViewBG, borderColor: cModalViewBorder},
          ]}>
          <Text style={[styles.modalText, {color: cPageHeadText}]}>
            Операції розробника.
          </Text>

          {/* copyDatabaseToDownload */}
          <View style={[styles.buttonsContainer]}>
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: cBtnBg, borderColor: cBtnBorder},
              ]}
              onPress={() => {
                copyDatabaseToDownload();
              }} //
            >
              <AntDesign name="save" color={cIcon} size={20} />
              <Text style={[styles.btnText, {color: cBtnText}]}>
                copy DB з проекту в Download
              </Text>
            </TouchableOpacity>
          </View>

          {/* copyDatabaseFromDownload */}
          <View style={[styles.buttonsContainer]}>
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: cBtnBg, borderColor: cBtnBorder},
              ]}
              onPress={() => {
                copyDatabaseFromDownload();
              }} //
            >
              <AntDesign name="save" color={cIcon} size={20} />
              <Text style={[styles.btnText, {color: cBtnText}]}>
                copyDB з Download в проект
              </Text>
            </TouchableOpacity>
          </View>

          {/* resetDatabase */}
          <View style={[styles.buttonsContainer]}>
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: cBtnBg, borderColor: cBtnBorder},
              ]}
              onPress={() => {
                resetDatabase();
              }}>
              <AntDesign name="database" color={cIcon} size={20} />
              <Text style={[styles.btnText, {color: 'yellow'}]}>
                ❌🔁 resetDatabase !!!
              </Text>
            </TouchableOpacity>
          </View>

          {/*Закрити  */}
          <View style={[styles.buttonsContainer]}>
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: cBtnBg, borderColor: cBtnBorder},
              ]}
              onPress={() => {
                setIsBuldingModal(false);
              }} //
            >
              <AntDesign name="close" color={cIcon} size={20} />
              <Text style={[styles.btnText, {color: cBtnText}]}>
                Закрити вікно
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/*  */}
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => {
          setIsBuldingModal(!isBuldingModal);
        }}>
        <Ionicons name={'settings'} color={cHeadIcon} size={iconSize} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    // justifyContent: 'center',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalView: {
    width: 350,
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'center',
  },
  modalText: {
    marginBottom: 5,
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginVertical: 5,
    // marginBottom: 10,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 16,
    gap: 10,
  },
  btnText: {
    fontFamily: 'Poppins-SemiBold',
  },
});

export default BuldingModal;
