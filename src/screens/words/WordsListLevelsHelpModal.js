//WordsListLevelsHelpModal.js//20260601***обника.


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

const WordsListHelpModal = ({pcBg = 'transparent', pcOn = 'gray'}) => {
  const [isWordsListHelpModal, setIsWordsListHelpModal] = useState(false);
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
        visible={isWordsListHelpModal}
        onRequestClose={() => {
          setIsWordsListHelpModal(false);
        }}>
        {/* Затемнення */}
        <TouchableOpacity
          style={styles.centeredView}
          onPress={() => {
            setIsWordsListHelpModal(false);
          }} //
        />

        <View
          style={[
            styles.modalView,
            {backgroundColor: cModalBG, borderColor: cModalBorder},
          ]}>
          <Text style={[styles.modalHeadText, {color: cPageHeadText}]}>
            Робота з екраном "Список слів".
          </Text>

          <ScrollView style={styles.scrollContainer}>
            <Text style={[styles.modalText, {color: cModalOn}]}>
              {'  '}Додаткові можливості екрану "Список слів":{'\n\n'}
              {'1. 📂 '}
              <Text style={{fontWeight: 'bold'}}>Імпорт з CSV</Text>
              {'\n'}Імпортує слова з файлу .csv. Формат: перший рядок — секція
              (**назва), другий — тема (*назва), далі рядки:
              слово;група;тип;переклад;img.{'\n'}
              🔄 Реверсний імпорт (в налаштуваннях) — колонка "слово" стає
              перекладом і навпаки.{'\n\n'}
              {'2. 📋 '}
              <Text style={{fontWeight: 'bold'}}>Імпорт тексту</Text>
              {'\n'}Вставте будь-який текст — він автоматично розбивається на
              окремі речення. Ви можете переглянути і видалити зайві речення
              перед імпортом. Кожне речення зберігається як окремий рядок у
              вибраній темі.{'\n\n'}
              {'3. 🌐 '}
              <Text style={{fontWeight: 'bold'}}>Переклад</Text>
              {'\n'}Перекладає вибрані або всі слова. Мова перекладу задається в
              налаштуваннях (іконка 🌐 вгорі праворуч).{'\n'}
              🔄 Реверсний переклад (в налаштуваннях) — перекладає поле
              "переклад" → "слово".{'\n\n'}
              {'4. 🔀 '}
              <Text style={{fontWeight: 'bold'}}>Переміщення рядків</Text>
              {'\n'}Відмітьте один рядок і натисніть "Перемістити". Кнопки
              Вгору/Вниз переміщують групу рядків (з однаковим group_key) в
              межах теми. Зміни зберігаються тільки по кнопці "Готово".{'\n\n'}
              {'5. ✏️ '}
              <Text style={{fontWeight: 'bold'}}>Дії з темами і секціями</Text>
              {'\n'}Довгий тап на рядку теми або секції відкриває меню: Додати /
              Редагувати / Видалити. При видаленні теми видаляються всі її
              слова, при видаленні секції — всі теми і слова.{'\n\n'}
              {'6. 🎵 '}
              <Text style={{fontWeight: 'bold'}}>Запис озвучки</Text>
              {'\n'}Відмітьте рядки і натисніть "Записати звук". Підтримується
              локальна (RHVoice) і мережева (Azure) озвучка, запис окремими
              файлами або одним файлом.
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
                setIsWordsListHelpModal(false);
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
          setIsWordsListHelpModal(!isWordsListHelpModal);
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

export default WordsListHelpModal;
