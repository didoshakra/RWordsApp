//WordsHelpModal.js//Операції розробника.

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

// const WordsHelpModal = ({pcBg = 'transparent', pcOn = 'gray'}) => {
const WordsHelpModal = props => {
  const [isWordsHelpModal, setIsWordsHelpModal] = useState(false);
  //   Колір
  const cIcon = props.colorIcon || 'gray'; // колір іконки
  const cIconBg = props.colorIconBg || 'transparent';
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
  const cHeadIcon = props.pcOn;

  //
  const sizeIcon = sizes.sIcon;
  const sizeBg = sizeIcon + 5;

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isWordsHelpModal}
        onRequestClose={() => {
          setIsWordsHelpModal(false);
        }}>
        {/* Затемнення */}
        <TouchableOpacity
          style={styles.centeredView}
          onPress={() => {
            setIsWordsHelpModal(false);
          }} //
        />

        <View
          style={[
            styles.modalView,
            {backgroundColor: cModalBG, borderColor: cModalBorder},
          ]}>
          <Text style={[styles.modalHeadText, {color: cPageHeadText}]}>
            Опис вікна "Слухати".
          </Text>
          <ScrollView style={styles.scrollContainer}>
            {/* або height: '70%' */}
            <Text style={[styles.modalText, {color: cModalOn}]}>
              Вікно <Text style={{fontWeight: 'bold'}}>"Слухати "</Text>{' '}
              складається з 2-ох частин:
              {'\n'}
              <Text style={{fontWeight: 'bold'}}>
                {' '}
                1. Налаштування
                {'\n'} 2. Прослуховування
                {'\n\n'}🔼 У верху екрана{' '}
              </Text>
              <Text style={{fontWeight: 'bold'}}>"Налаштування"</Text> ви бачите
              навігаційний рядок, що містить:
              {'\n\n'}
              🔙 <Text style={{fontWeight: 'bold'}}>Стрілка зліва</Text> –
              повернення до вікна{' '}
              <Text style={{fontStyle: 'italic'}}>Home</Text>.{'\n\n'}
              {/* 🎤{' '}
                            {/*  */}
              🔇 Під навігаційним рядком розміщено мікрофон і напис{' '}
              <Text style={{fontStyle: 'italic'}}>"Не слухаю"</Text>. Це
              означає, що мікрофон вимкнений. Щоб активувати голосове керування,
              натисніть на мікрофон🎙️.
              {'\n\n'}📋 Нижче розташовані кнопки(рядки) налаштування голосових
              команд і режимів прослуховування.
              {'\n\n'}
              <Text style={{fontWeight: 'bold'}}>🎤 Голосові команди</Text> –
              відкриває вікно{' '}
              <Text style={{fontStyle: 'italic'}}>
                налаштувань голосових команд
              </Text>
              , де ви можете:
              {'\n'}• налаштувати існуючі голосові команди;
              {'\n'}• додати нові команди шляхом голосового вводу – це покращить
              розпізнавання саме вашого голосу.
              {'\n\n'}⚙️{' '}
              <Text style={{fontWeight: 'bold'}}>Режими прослуховування</Text> –
              відкриває вікно{' '}
              <Text style={{fontStyle: 'italic'}}>Режими прослуховування</Text>,
              де ви можете:
              {'\n'}• встановити параметри циклічного відтворення (затримка,
              повторення, зупинка після перекладу);
              {'\n'}• показувати/приховувати зображення до слів;
              {'\n'}• вибрати мову оригіналу та мову перекладу;
              {'\n'}• обрати теми слів і змінити їхню послідовність перетягуючи
              рядки вверх/вниз утримуючи за іконку ☰ зправа;
              {'\n'}• обрати тип знань слів:{' '}
              <Text style={{fontStyle: 'italic'}}>
                "всі", "ЗНАЮ", "НЕ ЗНАЮ"
              </Text>
              {/*  */}
              {'\n\n'} ∨ Нижче розташовані рядки режимів вибору тем і знань слів
              {'\n'}🎯 Ще інформаційні рядки, які відображають обрані вами
              параметри налаштування
              {'\n\n'}▶️ В самому низу розміщені кнопки: {'\n'}
              <Text style={{fontWeight: 'bold'}}>↺ "З початку"</Text>, яка
              запускає процес відтворення і голосового супроводу слів з початку
              списку.
              {'\n'}
              <Text style={{fontWeight: 'bold'}}>▶️ " Продовжити"</Text>, яка
              запускає процес відтворення і голосового супроводу слів з того
              слова яке прослуховувалось останнім якщо воно є в поточному
              списку.
              {'\n\n'}🎙️ Після запуску відкривається частина прослуховування:
              {'\n\n'}
              <Text style={{fontWeight: 'bold'}}>👆 Жести (свайпи):</Text>
              {'\n'}• Свайп вліво – перехід до наступного слова;
              {'\n'}• Свайп вправо – повернення до попереднього;
              {'\n'}• Свайп вгору – перехід до попередньої теми;
              {'\n'}• Свайп вниз – перехід до наступної теми.
              {'\n\n'}
              <Text style={{fontWeight: 'bold'}}>👆 Картки:</Text>
              {'\n'}• Тап на картку оригіналу ✅ – позначає слово як відоме;
              {'\n'}• Тап на картку перекладу ❌ – позначає слово як невідоме.
              {'\n\n'}
              <Text style={{fontWeight: 'bold'}}>🔘 Кнопки:</Text>
              {'\n'}• <Text style={{fontWeight: 'bold'}}>⛔ "Стоп"</Text> –
              призупиняє автоматичний цикл;
              {'\n'}• <Text style={{fontWeight: 'bold'}}>▶️ "Старт"</Text> –
              відновлює цикл з поточного слова;
              {'\n'}• <Text style={{fontWeight: 'bold'}}>🔄 "Повторити"</Text> –
              повторює озвучку поточного слова;
              {'\n'}• <Text style={{fontWeight: 'bold'}}>✕</Text> – вихід з
              прослуховування з запам'ятовуванням останнього слова.
              {'\n\n'}
              {/*  */}
              <Text style={{fontWeight: 'bold'}}>
                🗣️ 2.Прослуховування/оцінка слів
              </Text>
              {'\n'}• Прослуховуйте слова й оцінюйте свої знання.
              {'\n'}• Для прослуховування(навігації по списку) використовуйте
              голосові команди або кнопки
              {'\n'}• Використовуйте голосові команди або кнопки "Знаю" / "Не
              знаю" для оцінки своїх знань .{'\n\n'}
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
                setIsWordsHelpModal(false);
              }} //
            >
              <AntDesign name="close" color={cBtnText} size={20} />
              <Text style={[styles.btnText, {color: cBtnText}]}>
                Закрити вікно
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/*  */}
      {/* <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => {
          setIsWordsHelpModal(!isWordsHelpModal);
        }}>
        <Entypo name={'help'} color={cIcon} size={sizeIcon} />
      </TouchableOpacity> */}
      <TouchableOpacity
        onPress={() => setIsWordsHelpModal(true)}
        style={[
          styles.iconContainer,
          {
            backgroundColor: cIconBg,
            height: sizeBg,
            width: sizeBg,
            borderRadius: sizeBg / 2,
          },
        ]}>
        <Entypo name={'help'} color={cIcon} size={sizeIcon} />
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WordsHelpModal;
