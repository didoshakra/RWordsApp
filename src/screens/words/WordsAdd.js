//WordAdd.js/ GPT/yup-hookform-useForm/Робоча/{[..., 'know'].map
// 3-схеми
//pn
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  ToastAndroid,
  ScrollView,
  Modal,
  Button,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {useNavigation} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar

import {ThemeContext} from '../../context/ThemeContext';
import MyArrowBack from '../../components/main/MyArrowBack';

import {handleSQLError} from '../../db/dbUtils';
import {openDatabase} from '../../db/dbConfig';

const schema = yup.object().shape({
  topic_id: yup
    .number()
    .typeError('Має бути числом')
    .min(1, 'Мінімальне значення: 1')
    .required('Обовʼязкове поле'),
  word: yup.string().min(1, 'Мінімум 1 символ').required("Обов'язкове поле"),
  translation: yup.string(),
  group_key: yup.string().notRequired(),
  type: yup.string().notRequired(),
  img: yup.string().notRequired(),
  // .min(1, 'Мінімум 1 символ')
  // .required("Обов'язкове поле"),
});

// export default function WordAdd() {
const WordAdd = () => {
  const navigation = useNavigation();
  const [showModal, setShowModal] = useState(false); //Для topics_id
  const [topicName, setTopicName] = useState(''); //Для topics_id

  //   Колір
  const {sizes, getColorScheme, isDarkMode} = useContext(ThemeContext);
  const indexScheme = 0;
  const scheme = getColorScheme(indexScheme);
  const cPageBorderBg = scheme.cardBg;
  const cStatusBarBg = scheme.pageBg;
  const cPageHeadBg = scheme.pageBg;
  const cPageHeadText = scheme.pageOn;
  const cPageBg = scheme.pageBg; //Bg колір сторінки
  const cInputBg = scheme.inputBg;
  const cInputText = scheme.inputOn;
  const cLabelText = scheme.pageOn;
  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;
  //   changeNavigationBarColor(cPageBorderBg, !isDarkMode); //колір Navigation Bar , true - світлі іконки
  // ✅ Navigation bar color — тільки при зміні теми або кольору
  useEffect(() => {
    changeNavigationBarColor(cPageBorderBg, !isDarkMode);
  }, [cPageBorderBg, isDarkMode]);
  //
  const sPageHeadIcon = sizes.sPageHeadIcon;
  const sBtnFontSize = sizes.sBtnFontLg;

  //useForm
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      topic_id: '',
      word: '',
      translation: '',
      group_key: '',
      type: '',
      img: '',
    },
  });

    //Додавання pn в кожну тему
  const addWord = data => {
    console.log('WordAdd/addWord/data:', data);
    if (!data || !data.word) {
      console.log('Помилка: не всі дані передані', data);
      return;
    }

    const {word, translation = ''} = data;
    const topic_id = data.topic_id || 1;

    openDatabase().transaction(tx => {
      tx.executeSql('PRAGMA foreign_keys = ON;'); // 🔐 Увімкнення зовнішніх ключів

      // Перевірка, чи існує topic_id в таблиці topics
      tx.executeSql(
        'SELECT COUNT(*) as count FROM topics WHERE id = ?',
        [topic_id],
        (_, {rows}) => {
          const count = rows.item(0).count;

          if (count === 0) {
            ToastAndroid.show('Тема не знайдена!', ToastAndroid.SHORT);
            return;
          }

          // Якщо тема існує — шукаємо max(pn) для цієї теми
          tx.executeSql(
            'SELECT MAX(pn) as maxPn FROM words WHERE topic_id = ?',
            [topic_id],
            (_, result) => {
              const maxPn = result.rows.item(0).maxPn;
              const newPn = maxPn != null ? maxPn + 1 : 1;

              // Додаємо слово з pn
              tx.executeSql(
                'INSERT INTO words (topic_id, word, translation, know, group_key, type, img, pn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                  topic_id,
                  word,
                  translation,
                  0,
                  data.group_key || '',
                  data.type || '',
                  data.img || '',
                  newPn,
                ],
                (_, results) => {
                  if (results.rowsAffected > 0) {
                    ToastAndroid.show('Запис додано!', ToastAndroid.SHORT);
                    // navigation.navigate('WordsList');
                    navigation.goBack();
                  } else {
                    ToastAndroid.show('Запис не додано!', ToastAndroid.SHORT);
                  }
                },
                (_, error) => {
                  console.log('SQL Error (insert):', error);
                  handleSQLError(error, 'додавання в таблицю words');
                  return true;
                },
              );
            },
            (_, error) => {
              console.log('SQL Error (maxPn):', error);
              handleSQLError(error, 'отримання max pn для words');
              return true;
            },
          );
        },
        (_, error) => {
          console.log('SQL Error (topic check):', error);
          handleSQLError(error, 'перевірка наявності теми');
          return true;
        },
      );
    });
  };

  //Назви полів вводу
  const fieldLabels = {
    topic_id: 'Тема',
    word: 'Слово',
    translation: 'Переклад',
    know: 'Рівень знання',
    group_key: 'Група',
    type: 'Тип',
    img: 'Зображення',
  };

  // Для topics_id
  const fetchSectionsWithTopics = setData => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT
           s.id as section_id,
           s.name as section_name,
           t.id as topic_id,
           t.name as topic_name
         FROM sections s
         LEFT JOIN topics t ON s.id = t.section_id
         ORDER BY s.pn, s.id, t.pn, t.id`,
        [],
        (_, {rows}) => {
          const raw = rows._array;
          const grouped = raw.reduce((acc, row) => {
            const {section_id, section_name, topic_id, topic_name} = row;
            if (!acc[section_id]) acc[section_id] = {section_name, topics: []};
            if (topic_id) acc[section_id].topics.push({topic_id, topic_name});
            return acc;
          }, {});
          setData(Object.values(grouped));
        },
        (_, e) => console.log('Помилка вибірки topics:', e),
      );
    });
  };

  const TopicSelectorModal = ({visible, onClose, onSelect}) => {
    const [sections, setSections] = useState([]);

    useEffect(() => {
      if (visible) fetchSectionsWithTopics(setSections);
    }, [visible]);
    console.log('WordAdd /TopicSelectorModal/sections', sections);

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: '#000000aa',
            justifyContent: 'center',
          }}>
          <View
            style={{
              margin: 20,
              backgroundColor: 'white',
              borderRadius: 10,
              padding: 20,
            }}>
            <ScrollView>
              {sections.map((sec, idx) => (
                <View key={idx} style={{marginBottom: 15}}>
                  <Text style={{fontWeight: 'bold', fontSize: 16}}>
                    {sec.section_name}
                  </Text>
                  {sec.topics.map(topic => (
                    <TouchableOpacity
                      key={topic.topic_id}
                      onPress={() => {
                        onSelect(topic.topic_id);
                        setTopicName(topic.topic_name);
                        onClose();
                      }}
                      style={{paddingVertical: 8}}>
                      <Text style={{fontSize: 14}}>{topic.topic_name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
            <Button title="Закрити" onPress={onClose} />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <SafeAreaView style={{flex: 1, backgroundColor: cPageBorderBg}}>
      <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} />
      <View style={[styles.pageContainer, {backgroundColor: cPageBg}]}>
        <View
          style={[styles.pageHeadContainer, {backgroundColor: cPageHeadBg}]}>
          <MyArrowBack
            // headText={'toWordsList'}
            // back={'WordsList'}//Якщо нема то повернеться в попереднє вікно
            color={cPageHeadText}
            colorIconBg={cPageHeadBg}
            sizeIcon={sPageHeadIcon}
            titleText={'Слова додати'}
          />
        </View>

        <View style={styles.bodyPageContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            {/* ✅ Інтерактивний вибір topic_id */}
            <Controller
              control={control}
              name="topic_id"
              render={({field: {value, onChange}}) => (
                <View style={{marginBottom: 10}}>
                  <Text style={[styles.label, {color: cLabelText}]}>
                    {fieldLabels['topic_id']}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.inputContainer,
                      {backgroundColor: cInputBg, padding: 10, borderRadius: 5},
                    ]}
                    onPress={() => setShowModal(true)}>
                    <Text style={{color: cInputText}}>
                      {value ? `${value}: ${topicName}` : 'Виберіть тему'}
                    </Text>
                  </TouchableOpacity>
                  {errors.topic_id && (
                    <Text style={{color: 'red'}}>
                      {errors.topic_id.message}
                    </Text>
                  )}
                  {/* Модалка */}
                  <TopicSelectorModal
                    visible={showModal}
                    onClose={() => setShowModal(false)}
                    onSelect={selectedId => {
                      onChange(selectedId);
                      setShowModal(false);
                    }}
                  />
                </View>
              )}
            />

            {/* Інші поля: word, translation */}
            {['word', 'translation', 'group_key', 'type', 'img'].map(field => (
              <View key={field} style={{marginBottom: 10}}>
                <Controller
                  control={control}
                  name={field}
                  render={({field: {onChange, onBlur, value}}) => (
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, {color: cLabelText}]}>
                        {fieldLabels[field]}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {color: cInputText, backgroundColor: cInputBg},
                        ]}
                        placeholder={`Введіть ${field}`}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                      {errors[field] && (
                        <Text style={{color: 'red'}}>
                          {errors[field].message}
                        </Text>
                      )}
                    </View>
                  )}
                />
              </View>
            ))}

            {/* Кнопка */}
            <TouchableOpacity
              onPress={handleSubmit(addWord)}
              style={[styles.submitBtn, {backgroundColor: cBtnBg}]}>
              <Text style={{color: cBtnText, fontSize: sBtnFontSize}}>
                Додати запис
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};
export default WordAdd;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    // justifyContent: 'center',
    borderRadius: 15,
    margin: '2%',
  },
  pageHeadContainer: {
    // height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bodyPageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
    // backgroundColor: '#ff1',
  },
  input: {
    height: 50,
    borderRadius: 10,
    borderWidth: 0.3,
    paddingLeft: 20,
  },
  submitBtn: {
    backgroundColor: 'purple',
    width: '80%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 30,
    alignSelf: 'center',
    marginBottom: 10,
  },
  label: {
    gap: 20,
  },
});
