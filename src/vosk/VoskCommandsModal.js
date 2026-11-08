// VoskCommandsModal.js//Список голосових команд/Додає керуючі слова голосом
//Оптимізація рендеру
//Не переробив на 3-схеми(багато треба!!!) Але зробив змінні

import React, {useState, useEffect, useMemo, useContext} from 'react';
import {
  Modal,
  View,
  Text,
  SectionList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {ThemeContext} from '@/context/ThemeContext';

export default function VoskCommandsModal({
  onClose,
  isLoadModel, // Моделі Завантажена
  isRecognizing, //розпізнавання запущене
  record, // Запуск розпізнавання голосу
  stopVoice, // Зупинка розпізнавання
  result, //Результат розпізнавання голосу
  //   setResult, // Функція для оновлення результату розпізнавання голосу
  commands, // Список команд
  setCommands, // Функція для оновлення команд
}) {
  console.log('***VoskCommandsModal/isLoadModel=', isLoadModel);
  //   console.log('***VoskCommandsModal/result=', result);

  const [expandedSections, setExpandedSections] = useState({});
  const [addingWordFor, setAddingWordFor] = useState(null);
  const [newWord, setNewWord] = useState('');
  const [lastEditedSection, setLastEditedSection] = useState(null);
  //
  //   Колір
  const {sizes, getColorScheme} = useContext(ThemeContext);
  const indexScheme = 0;
  const scheme = getColorScheme(indexScheme);
  const cModalContainerBg = scheme.cardBg; //модадка
  const cModalTitle = scheme.titleOn; //в заголовку модалки
  const cIsModelLoad = 'green'; //в заголовку модалки
  const cNotModelLoad = 'gray'; //в заголовку модалки
  const cIconAngleDown = 'green'; //іконка стрілка вниз

  const cIconDelete = 'red'; //іконка випадаюче мен
  const cIconAdd = 'green'; //іконка випадаюче мен

  const cSectionContainerBg = scheme.headerBg; //Секлія меню(активна)

  const cSectionContainerOn = scheme.headerOn; //Секлія меню(активна)
  const cSectionContainerBgAct = scheme.headerBgAct; //Секлія меню(активна)
  const cSectionContainerOnAct = scheme.headerOnAct; //Секлія меню(активна)
  const cSectionItemBg = scheme.pageBg; //Секлія меню(активна)
  const cSectionItemOn = scheme.pageOn; //Секлія меню(активна)

  const cButtonBg = scheme.buttonBg; //Секлія меню(активна)
  const cButtonOn = scheme.buttonOn; //Секлія меню(активна)

  const cPopupBG = 'white'; //вікнo вводу команди
  const cWordHighlight = 'blue'; //заголовок вікна вводу команди
  const cTextInput = 'black'; // вікна вводу команди
  const cIconMicrophoneOn = 'green'; //Мікрофон у вікні вводу команди
  const cIconMicrophoneOff = 'gray'; //Мікрофон у вікні вводу команди
  //
  const iconSize = 28;
  const sBtnFontSize = sizes.sBtnFontSm;

  const toggleSection = title => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // GPT  4. ✅ Мемоізуй sections у useMemo
  const sections = useMemo(
    () =>
      Object.entries(commands).map(([key, words]) => ({
        title: key,
        data: expandedSections[key] ? words : [],
      })),
    [commands, expandedSections],
  );

  // Gpt now
  // 🔽 useMemo на верхньому рівні компонента:
  const allWords = useMemo(() => Object.values(commands).flat(), [commands]); //GPT() для handleAddWord
  const handleAddWord = () => {
    const trimmed = newWord.trim().toLowerCase();
    if (!trimmed) return;

    // Перевірити, чи слово вже є в будь-якій команді
    if (allWords.includes(trimmed)) {
      Alert.alert('Це слово вже існує в іншій команді.');
      return;
    }

    // Перевірити, чи вибрано секцію для додавання
    if (!addingWordFor) {
      Alert.alert('Не вибрано команду, до якої додати слово.');
      return;
    }

    // Перевірити, чи така секція існує
    if (!commands[addingWordFor]) {
      Alert.alert(`Команда '${addingWordFor}' не знайдена.`);
      return;
    }

    // Додати слово до відповідної секції
    setCommands(prev => ({
      ...prev,
      [addingWordFor]: [...(prev[addingWordFor] || []), trimmed],
    }));

    // Очистити поля
    setNewWord('');
    setAddingWordFor(null);
    setLastEditedSection(addingWordFor);
  };

  const handleDeleteWord = (command, word) => {
    Alert.alert('Видалити слово?', `"${word}" з команди ${command}`, [
      {
        text: 'Ні',
        style: 'cancel',
      },
      {
        text: 'Так',
        onPress: () => {
          setCommands(prev => ({
            ...prev,
            [command]: prev[command].filter(w => w !== word),
          }));
        },
      },
    ]);
  };

  // Щоб автоматично підставляти (голос) result у <TextInput> після stop()
  useEffect(() => {
    if (isRecognizing && result?.trim()) {
      setNewWord(result.trim());
    } else {
      setNewWord('Нове слово');
    }
  }, [isRecognizing, result]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}>
      {/* Затемнення */}
      <TouchableOpacity style={styles.centeredView} onPress={onClose} />
      <View style={[styles.modalView, {backgroundColor: cModalContainerBg}]}>
        <Text style={[styles.title, {color: cModalTitle}]}>
          Голосові команди
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: cSectionContainerOn,
            textAlign: 'center',
            marginBottom: 4,
          }}>
          Тап ▼ — розкрити команду • ➕ — додати слово • тап на слово — видалити
          {'\n'}
          Слова можна додавати голосом 🎙️ — налаштуйте під свій тембр
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 2,
            justifyContent: 'space-around',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            {/* Загрузка моделі  */}
            <Icon
              name={isLoadModel ? 'download' : 'upload'}
              size={24}
              color={isLoadModel ? cIsModelLoad : cNotModelLoad}
            />
            <Text style={{color: isLoadModel ? cIsModelLoad : cNotModelLoad}}>
              Голос
            </Text>
          </View>
        </View>

        {/*  */}
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item}-${index}`} //Gpt
          renderItem={({item, section}) => (
            <View
              style={[styles.itemContainer, {backgroundColor: cSectionItemBg}]}>
              <TouchableOpacity
                onPress={() => handleDeleteWord(section.title, item)}>
                <Text style={[styles.item, {color: cSectionItemOn}]}>
                  {item}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteWord(section.title, item)}>
                <AntDesign name={'delete'} size={24} color={cIconDelete} />
              </TouchableOpacity>
            </View>
          )}
          renderSectionHeader={({section: {title}}) => (
            <View
              style={[
                styles.sectionContainer,
                {
                  backgroundColor:
                    addingWordFor === title || lastEditedSection === title
                      ? cSectionContainerBgAct
                      : cSectionContainerBg, // або інший дефолтний колір
                },
              ]}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onLongPress={() => setAddingWordFor(title)}
                onPress={() => toggleSection(title)}>
                <FontAwesome
                  style={{
                    transform: expandedSections[title]
                      ? [{rotate: '180deg'}]
                      : [{rotate: '0deg'}],
                  }}
                  name={'angle-down'} //Стрілки
                  color={cIconAngleDown}
                  size={iconSize}
                />
                <Text
                  style={[
                    styles.sectionHeaderText,
                    {color: cSectionContainerOn},
                  ]}>
                  {title.toUpperCase()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setAddingWordFor(title)}>
                <MaterialIcons name={'add'} size={iconSize} color={cIconAdd} />
              </TouchableOpacity>
            </View>
          )}
        />
        <TouchableOpacity
          style={[styles.button, {backgroundColor: cButtonBg}]}
          onPress={onClose}>
          <Text
            style={[
              styles.buttonText,
              {fontSize: sBtnFontSize, color: cButtonOn},
            ]}>
            Закрити
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL для додавання нового слова */}
      <Modal
        transparent
        visible={addingWordFor !== null}
        animationType="fade"
        onRequestClose={() => {
          setNewWord('');
          setAddingWordFor(null);
        }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback
              onPress={() => {
                setNewWord('');
                setAddingWordFor(null);
              }}>
              <View style={styles.background} />
            </TouchableWithoutFeedback>

            <View style={[styles.popup, {backgroundColor: cPopupBG}]}>
              <Text style={styles.popupTitle}>
                Додати слово до команди:{' '}
                <Text style={(styles.wordHighlight, {color: cWordHighlight})}>
                  {addingWordFor}
                </Text>
              </Text>
              <TextInput
                placeholder="Нове слово"
                value={newWord}
                onChangeText={setNewWord}
                style={{borderWidth: 1, padding: 10, color: cTextInput}}
              />
              {/* //microphone */}
              <TouchableOpacity
                disabled={!isLoadModel}
                onPress={() => {
                  if (isRecognizing) {
                    stopVoice();
                    // setResult('');
                  } else {
                    setNewWord('');
                    // setResult('');
                    record();
                  }
                }}
                style={{gap: 10}}>
                <Icon
                  style={{marginVertical: 30, alignSelf: 'center'}}
                  name={isRecognizing ? 'microphone' : 'microphone-off'}
                  size={50}
                  color={isRecognizing ? cIconMicrophoneOn : cIconMicrophoneOff}
                />
              </TouchableOpacity>
              <View style={styles.popupButtons}>
                <TouchableOpacity
                  style={[styles.button, {backgroundColor: cButtonBg}]}
                  onPress={() => {
                    setNewWord('');
                    setAddingWordFor(null);
                  }}>
                  <Text
                    style={[
                      styles.buttonText,
                      {fontSize: sBtnFontSize, color: cButtonOn},
                    ]}>
                    Скасувати
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, {backgroundColor: cButtonBg}]}
                  onPress={handleAddWord}>
                  <Text
                    style={[
                      styles.buttonText,
                      {fontSize: sBtnFontSize, color: cButtonOn},
                    ]}>
                    Додати
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    // justifyContent: 'center',
    justifyContent: 'flex-end', //притискає до низу
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
    // додай:
    // minHeight: 200, // якщо треба мінімум
    height: '90%', // щоб не вилізала за екран
    marginBottom: 20, // щоб не прилипала прямо до краю
  },
  title: {
    alignSelf: 'center',
    fontSize: 18,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flex: 1,
    flexDirection: 'row',
    fontSize: 18,
    fontWeight: '600',
    gap: 5,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    padding: 2,
  },
  item: {
    paddingLeft: 20,
    fontSize: 16,
    paddingVertical: 2,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  popup: {
    marginHorizontal: 30,
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    elevation: 5,
  },
  popupTitle: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  wordHighlight: {
    fontWeight: 'bold',
    fontStyle: 'italic',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
    borderRadius: 5,
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  //
  sectionContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginVertical: 5,
    gap: 5,
  },
  sectionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 1,
    gap: 5,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  button: {
    marginTop: '2%',
    padding: 20,
    borderWidth: 2,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonTex: {
    // color: cBtnText,
    // fontSize: sBtnFontSize,
    fontFamily: 'Poppins-Medium',
  },
});
