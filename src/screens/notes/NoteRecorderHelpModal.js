// NoteRecorderHelpModal.js
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

const NoteRecorderHelpModal = ({pcBg = 'transparent', pcOn = 'gray'}) => {
  const [isNoteHelpModal, setIsNoteHelpModal] = useState(false);

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
        visible={isNoteHelpModal}
        onRequestClose={() => {
          setIsNoteHelpModal(false);
        }}>
        <TouchableOpacity
          style={styles.centeredView}
          onPress={() => {
            setIsNoteHelpModal(false);
          }}
        />

        <View
          style={[
            styles.modalView,
            {backgroundColor: cModalBG, borderColor: cModalBorder},
          ]}>
          <Text style={[styles.modalHeadText, {color: cPageHeadText}]}>
            Голосові нотатки
          </Text>
          <ScrollView style={styles.scrollContainer}>
            <Text style={[styles.modalText, {color: cModalOn}]}>
              🔷{' '}
              <Text style={{fontWeight: 'bold'}}>
                Диктування нотаток голосом, згруповані по темах і днях.
              </Text>
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
              <Text style={{fontWeight: 'bold'}}>Заголовок зверху</Text> — назва
              поточної теми, клік відкриває вибір теми (список тем за сьогодні +
              «Нова тема»).{'\n\n'}
              🎙️ <Text style={{fontWeight: 'bold'}}>іконка в шапці</Text> —
              вмикає/вимикає авто-розпізнавання (авто-зупинка запису після паузи
              в мовленні).{'\n\n'}
              ⚙️ <Text style={{fontWeight: 'bold'}}>Налаштування</Text> —
              авто-розпізнавання, тривалість паузи перед розпізнаванням.
            </Text>

            <Text
              style={[
                styles.modalText,
                {color: cModalOn, fontWeight: 'bold', marginVertical: 8},
              ]}>
              🔄 Робочий процес:
            </Text>

            <Text style={[styles.modalText, {color: cModalOn}]}>
              {'  '}Перший запис у сесії без теми = назва теми (підтверджується
              кнопкою «Це тема»).{'\n\n'}
              {'  '}Далі кожен запис = окремий пункт нотатки, додається в
              список.{'\n\n'}
              {'  '}В авто-режимі пункти зберігаються одразу без підтвердження,
              мікрофон сам продовжує слухати наступний.
              {'\n\n'}
              {'  '}Кожен пункт у списку можна редагувати (олівець) або видалити
              (кошик).
            </Text>
          </ScrollView>

          <View style={[styles.buttonsContainer]}>
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: cBtnBg, borderColor: cBtnBorder},
              ]}
              onPress={() => {
                setIsNoteHelpModal(false);
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
          setIsNoteHelpModal(!isNoteHelpModal);
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

export default NoteRecorderHelpModal;
