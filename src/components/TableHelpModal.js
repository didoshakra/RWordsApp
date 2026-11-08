//TableHelpModal.js//Операції розробника.

import React, {useState, useContext} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  //   Pressable,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';

import {ThemeContext} from '@/context/ThemeContext';

const TableHelpModal = ({pcBg = 'transparent', pcOn = 'gray'}) => {
  const [isTableHelpModal, setIsTableHelpModal] = useState(false);
  //   Колір
  const {sizes, getColorScheme} = useContext(ThemeContext);
  const indexScheme = 0;
  const scheme = getColorScheme(indexScheme);
  const cPageHeadText = scheme.headerOn;
  const cModalOn = scheme.modalOn;
  const cModalBG = scheme.modalBg;
  const cModalBorder = scheme.border;
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
        visible={isTableHelpModal}
        onRequestClose={() => {
          setIsTableHelpModal(false);
        }}>
        {/* Затемнення */}
        <TouchableOpacity
          style={styles.centeredView}
          onPress={() => {
            setIsTableHelpModal(false);
          }} //
        />

        <View
          style={[
            styles.modalView,
            {backgroundColor: cModalBG, borderColor: cModalBorder},
          ]}>
          <Text style={[styles.modalHeadText, {color: cPageHeadText}]}>
            Робота з таблицями.
          </Text>

          <ScrollView style={styles.scrollContainer}>
            {/* або height: '70%' */}
            <Text style={[styles.modalText, {color: cModalOn}]}>
              Ви можете виконувати наступні операції з таблицею:{'\n\n'}
              1. 📤 **Переміщення рядків**.{'\n'}
              Відмітьте рядок → з’явиться кнопка "Перемістити рядок". Натисніть
              її — з’явиться віконце зі стрілками. Перемістіть рядок і натисніть
              "Готово".{'\n\n'}
              2. 📏 **Зміна ширини стовпців**.{'\n'}
              Натисніть на праву межу стовпця → з’являться кнопки "+" і "-".
              Змінюйте ширину, орієнтуючись на значення в пікселях. Натисніть
              "Готово".{'\n\n'}
              3. ➕ **Додавання рядків**.{'\n'}
              Натисніть "Додати рядок", введіть дані у новому екрані.{'\n\n'}
              4. ✏️ **Редагування рядків**.{'\n'}
              Відмітьте рядок → натисніть "Редагувати рядок", змініть дані.
              {'\n\n'}
              5. 🗑 **Видалення рядка**.{'\n'}
              Відмітьте рядок → натисніть "Видалити", підтвердьте видалення.
              {'\n\n'}
              6. 🗑 **Видалення кількох рядків**.{'\n'}
              Відмітьте потрібні рядки → натисніть "Видалити", підтвердьте
              видалення.{'\n\n'}
              7. 🚫 **Зняття виділення**.{'\n'}
              Натисніть кнопку "Зняти виділення".
            </Text>
          </ScrollView>

          {/*Закрити  */}
          <View style={[styles.buttonsContainer]}>
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: cBtnBg, borderColor: cBtnBorder},
              ]}
              onPress={() => {
                setIsTableHelpModal(false);
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
          setIsTableHelpModal(!isTableHelpModal);
        }}>
        <Entypo name={'settings'} color={cHeadIcon} size={iconSize} />
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
    width: '90%',
    // width: 350,
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'center',
  },
  modalHeadText: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  modalText: {
    marginBottom: 5,
    fontSize: 12,
    fontWeight: 500,
  },
  scrollContainer: {
    height: '80%',
    // maxHeight: 300,
    width: '100%',
    marginBottom: 10,
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

export default TableHelpModal;
