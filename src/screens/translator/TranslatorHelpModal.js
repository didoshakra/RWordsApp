// TranslatorHelpModal.js
import React, {useState, useContext} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';

import {ThemeContext} from '@/context/ThemeContext';

const TranslatorHelpModal = ({pcBg = 'transparent', pcOn = 'gray'}) => {
  const [isTranslatorHelpModal, setIsTranslatorHelpModal] = useState(false);

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
  const cButtonIcon = scheme.buttonOn;
  const cIcon = pcOn;

  const iconSize = sizes.sIcon;

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isTranslatorHelpModal}
        onRequestClose={() => {
          setIsTranslatorHelpModal(false);
        }}>
        <TouchableOpacity
          style={styles.centeredView}
          onPress={() => {
            setIsTranslatorHelpModal(false);
          }}
        />

        <View
          style={[
            styles.modalView,
            {backgroundColor: cModalBG, borderColor: cModalBorder},
          ]}>
          <Text style={[styles.modalHeadText, {color: cPageHeadText}]}>
            Перекладач голосом
          </Text>
          <ScrollView style={styles.scrollContainer}>
            <Text style={[styles.modalText, {color: cModalOn}]}>
              🔷{' '}
              <Text style={{fontWeight: 'bold'}}>
                Записує вашу мову, розпізнає текст і перекладає на іншу мову.
              </Text>
              {'\n'}
              {'  '}Може одразу озвучити переклад.
            </Text>

            <Text
              style={[
                styles.modalText,
                {color: cModalOn, fontWeight: 'bold', marginVertical: 8},
              ]}>
              🧩 Основні елементи:
            </Text>

            <Text style={[styles.modalText, {color: cModalOn}]}>
              🎙️ <Text style={{fontWeight: 'bold'}}>Мікрофон</Text> —
              почати/зупинити запис.{'\n\n'}
              <Text style={{fontWeight: 'bold'}}>Заголовок зверху</Text> —
              показує напрямок перекладу (напр. укр. → англ.), клік перемикає
              реверсний режим (міняє мову місцями).{'\n\n'}
              🎙️ <Text style={{fontWeight: 'bold'}}>іконка в шапці</Text> —
              вмикає/вимикає авто-розпізнавання (авто-зупинка запису після паузи
              в мовленні).{'\n\n'}
              🔊 <Text style={{fontWeight: 'bold'}}>іконка в шапці</Text> —
              вмикає/вимикає автоозвучення перекладу.{'\n\n'}
              ⚙️ <Text style={{fontWeight: 'bold'}}>Налаштування</Text> —
              реверсний переклад, авто-озвучення, авто-розпізнавання, тривалість
              паузи перед розпізнаванням.
            </Text>

            <Text
              style={[
                styles.modalText,
                {color: cModalOn, fontWeight: 'bold', marginVertical: 8},
              ]}>
              🔄 Робочий процес:
            </Text>

            <Text style={[styles.modalText, {color: cModalOn}]}>
              {'  '}Авто-режим: сказали фразу → пауза → авто-зупинка →
              авто-переклад → (за бажанням) озвучка.{'\n\n'}
              {'  '}Ручний режим: сказали/ввели текст → з'явиться кнопка
              «Перекласти» → тиснете вручну.{'\n\n'}
              {'  '}Текст оригіналу завжди можна редагувати — при зміні кнопка
              «Перекласти» з'являється знову.{'\n\n'}
              {'  '}Після перекладу — кнопки «Зберегти» (в історію діалогів) і
              «Видалити».
            </Text>
          </ScrollView>

          <View style={[styles.buttonsContainer]}>
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: cBtnBg, borderColor: cBtnBorder},
              ]}
              onPress={() => {
                setIsTranslatorHelpModal(false);
              }}>
              <AntDesign name="close" color={cButtonIcon} size={20} />
              <Text style={[styles.btnText, {color: cBtnText}]}>
                Закрити вікно
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => {
          setIsTranslatorHelpModal(!isTranslatorHelpModal);
        }}>
        <Entypo name={'help'} color={cIcon} size={iconSize} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalView: {
    width: '90%',
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
    fontWeight: '500',
  },
  scrollContainer: {
    height: '80%',
    width: '100%',
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginVertical: 5,
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

export default TranslatorHelpModal;
