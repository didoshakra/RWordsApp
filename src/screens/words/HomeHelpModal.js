//HomeHelpModal.js//Операції розробника.

import React, {useState, useContext} from 'react';
// import {name as appName, version as appVersion} from '../../package.json'; // <-- тут імпорт версіїimport
import DeviceInfo from 'react-native-device-info';
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

const HomeHelpModal = ({pcBg = 'transparent', pcOn = 'gray'}) => {
  const appVersion = DeviceInfo.getVersion(); // дасть "1.1.2"
  const [isHomeHelpModal, setIsHomeHelpModal] = useState(false);
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
  const cButtonIcon = scheme.buttonOn;
  const cIcon = pcOn;

  //
  const iconSize = sizes.sIcon;

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isHomeHelpModal}
        onRequestClose={() => {
          setIsHomeHelpModal(false);
        }}>
        {/* Затемнення */}
        <TouchableOpacity
          style={styles.centeredView}
          onPress={() => {
            setIsHomeHelpModal(false);
          }} //
        />

        <View
          style={[
            styles.modalView,
            {backgroundColor: cModalBG, borderColor: cModalBorder},
          ]}>
          <Text style={[styles.modalHeadText, {color: cPageHeadText}]}>
            Загальний опис "RWords" v.{appVersion}
          </Text>
          <ScrollView style={styles.scrollContainer}>
            <Text style={[styles.modalText, {color: cModalOn}]}>
              {'  '}Це загальний опис застосунку. Детальніші описи є у вікні
              Меню → "Про RWords" і у підказках ❓ кожного екрану.
            </Text>

            {/* --- Вступ --- */}
            <Text style={[styles.modalText, {color: cModalOn}]}>
              🔷{' '}
              <Text style={{fontWeight: 'bold'}}>
                RWords — мобільний застосунок на Android для вивчення іноземних
                слів і фраз.
              </Text>
              {'\n'}
              {'  '}Прослуховуйте слова, вирази та речення з перекладом.
              Оцінюйте свої знання кнопками або голосом «Знаю» / «Не знаю» — це
              дозволяє формувати персональні списки і виключати вже відомі слова
              з відтворення.
            </Text>

            {/* --- Екрани --- */}
            <Text
              style={[
                styles.modalText,
                {color: cModalOn, fontWeight: 'bold', marginVertical: 8},
              ]}>
              🧭 Застосунок має чотири основні кнопки навігації внизу екрана:
            </Text>

            <Text style={[styles.modalText, {color: cModalOn}]}>
              <Text style={{fontWeight: 'bold'}}>
                1. 🏠 Home — Титульний екран
              </Text>
              {'\n'}• ❓ Загальний опис застосунку
              {'\n'}• 🌙/🌞 Перемикання світлої і темної теми
              {'\n\n'}
              <Text style={{fontWeight: 'bold'}}>
                2. 🎧 Слухати — Головний екран
              </Text>
              {'\n'}
              {'  '}Складається з двох частин:{'\n'}
              {'  '}У 1-й частині налаштовуйте:{'\n'}
              {'  '}• 🎤 голосові команди{'\n'}
              {'  '}• ⚙️ режими і параметри відтворення{'\n'}
              {'  '}• 📋 теми для прослуховування{'\n'}
              {'  '}• 🎓 фільтр по знаннях (Знаю / Не знаю / Всі){'\n'}
              {'  '}• ↺ з початку або продовжити з останнього слова{'\n'}
              {'  '}У 2-й частині:{'\n'}
              {'  '}• слухайте і оцінюйте знання кнопками або голосом{'\n'}
              {'  '}• керуйте відтворенням: далі, назад, повторити, наступна
              тема{'\n\n'}
              <Text style={{fontWeight: 'bold'}}>
                3. 🌐 wwwRWords — Сайт RWords
              </Text>
              {'\n'}
              {'  '}Перехід на сайт для завантаження нових списків слів і
              керування контентом.{'\n\n'}
              <Text style={{fontWeight: 'bold'}}>4. ☰ Меню</Text>
              {'\n'}
              {'  '}⚙️ <Text style={{fontWeight: 'bold'}}>Налаштування:</Text>
              {'\n'}
              {'  '}• Загальні налаштування відтворення{'\n'}
              {'  '}• Налаштування мов (оригінал, переклад, озвучка){'\n'}
              {'  '}• Реверсний імпорт і реверсний переклад{'\n'}
              {'  '}• Колірні теми інтерфейсу{'\n'}
              {'  '}• Оновлення додатку{'\n\n'}
              {'  '}📖 <Text style={{fontWeight: 'bold'}}>Довідники:</Text>
              {'\n'}
              {'  '}• <Text style={{fontWeight: 'bold'}}>Групи/Теми/Слова</Text>{' '}
              — 3-рівневий перегляд і керування словами. Додавання, редагування,
              видалення, переміщення рядків і груп, імпорт CSV, імпорт тексту,
              переклад, запис озвучки. Довгий тап на темі або секції відкриває
              меню дій.{'\n'}
              {'  '}• <Text style={{fontWeight: 'bold'}}>Теми</Text> — перегляд
              тем з % і к-стю знайомих слів{'\n'}
              {'  '}• <Text style={{fontWeight: 'bold'}}>Групи тем</Text> —
              керування секціями
            </Text>

            {/* --- Загальні елементи --- */}
            <Text style={[styles.modalText, {color: cModalOn}]}>
              🧩{' '}
              <Text style={{fontWeight: 'bold'}}>
                Загальні елементи інтерфейсу:
              </Text>
              {'\n'}• 🔙 Стрілка зліва — повернення до попереднього екрана{'\n'}
              • 🌙/🌞 Іконка теми — перемикання світлої і темної теми{'\n'}• ❓
              Іконка підказки — опис поточного екрана{'\n'}• 🔻 Нижня панель —
              навігація і основні дії
            </Text>

            {/* --- Дані --- */}
            <Text style={[styles.modalText, {color: cModalOn}]}>
              🔊{'  '}Застосунок має вбудовані базові списки слів. Додатково
              завантажуйте нові теми з сайту RWords або імпортуйте власні CSV
              файли чи текст прямо в довіднику "Групи/Теми/Слова".
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
                setIsHomeHelpModal(false);
              }} //
            >
              <AntDesign name="close" color={cButtonIcon} size={20} />
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
          setIsHomeHelpModal(!isHomeHelpModal);
        }}>
        <Entypo name={'help'} color={cIcon} size={iconSize} />
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
    fontWeight: '500',
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

export default HomeHelpModal;
