//TopicsEdit.js/ GPT/yup-hookform-useForm/Робоча{['name'].map
// 3-схеми

import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  ToastAndroid,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {useNavigation} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar
import {Picker} from '@react-native-picker/picker'; // ✅ ЗМІНА: імпорт Picker

import {ThemeContext} from '../../context/ThemeContext';
import MyArrowBack from '../../components/main/MyArrowBack';

import {openDatabase} from '../../db/dbConfig';
import {handleSQLError} from '../../db/dbUtils';

const schema = yup.object().shape({
  section_id: yup
    .number()
    .typeError('Має бути числом')
    .min(1, 'Мінімальне значення: 1')
    .required('Обовʼязкове поле'),
  name: yup.string().min(1, 'Мінімум 1 символ').required("Обов'язкове поле"),
  link: yup.string().notRequired(),
});

// export default function TopicsEdit({route}) {
const TopicsEdit = ({route}) => {
  //   Колір
  const {sizes, getColorScheme, isDarkMode} = useContext(ThemeContext);
  const indexScheme = 1;
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
  //

  const navigation = useNavigation();
  const {itemData} = route.params;
  //   console.log('TopicsEdit/itemData:', itemData); // Перевірка itemData
  //   console.log('TopicsEdit/Початок'); // Перевірка лога
  const [sections, setSections] = useState([]);

  // ✅ ЗМІНА: Завантаження списку секцій
  useEffect(() => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        'SELECT id, name FROM sections',
        [],
        (_, {rows}) => {
          const result = [];
          for (let i = 0; i < rows.length; i++) {
            result.push(rows.item(i));
          }
          setSections(result);
        },
        (_, error) => {
          console.log('Помилка при завантаженні секцій:', error);
          return true;
        },
      );
    });
  }, []);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      section_id: itemData.section_id,
      link: itemData.link,
      name: itemData.name,
      id: itemData.id,
    },
  });

  // updateData
  const updateData = data => {
    openDatabase().transaction(tx => {
      // Отримуємо поточний section_id теми
      tx.executeSql(
        'SELECT section_id FROM topics WHERE id = ?',
        [data.id],
        (_, {rows}) => {
          const currentSectionId = rows.item(0).section_id;

          if (Number(currentSectionId) !== Number(data.section_id)) {
            // Секція змінилась — беремо MAX(pn) нової секції
            tx.executeSql(
              'SELECT MAX(pn) as maxPn FROM topics WHERE section_id = ?',
              [data.section_id],
              (_, result) => {
                const maxPn = result.rows.item(0).maxPn;
                const newPn = maxPn != null ? maxPn + 1 : 1;

                tx.executeSql(
                  'UPDATE topics SET name=?, link=?, section_id=?, pn=? WHERE id=?',
                  [data.name, data.link, data.section_id, newPn, data.id],
                  (_, results) => {
                    if (results.rowsAffected > 0) {
                      ToastAndroid.show(
                        'Запис відредаговано!',
                        ToastAndroid.SHORT,
                      );
                      navigation.goBack();
                    }
                  },
                  (_, error) => {
                    handleSQLError(error, 'оновлення topics');
                    return true;
                  },
                );
              },
            );
          } else {
            // Секція не змінилась — pn не чіпаємо
            tx.executeSql(
              'UPDATE topics SET name=?, link=?, section_id=? WHERE id=?',
              [data.name, data.link, data.section_id, data.id],
              (_, results) => {
                if (results.rowsAffected > 0) {
                  ToastAndroid.show('Запис відредаговано!', ToastAndroid.SHORT);
                  navigation.goBack();
                }
              },
              (_, error) => {
                handleSQLError(error, 'оновлення topics');
                return true;
              },
            );
          }
        },
      );
    });
  };

  //Назви полів вводу
  const fieldLabels = {
    section_id: 'ID секції',
    name: 'Назва теми',
    link: 'Посилання (URL)',
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: cPageBorderBg}}>
      <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} />
      {/* Page pageContainer-Задає псевдобардюр (cPageBorderBg) і відступи в сторінці*/}
      <View style={[styles.pageContainer, {backgroundColor: cPageBg}]}>
        {/* Голова сторінки */}
        <View
          style={[styles.pageHeadContainer, {backgroundColor: cPageHeadBg}]}>
          <MyArrowBack
            // headText={'toTopicsList'}
            // back={'TopicsList'} //Якщо нема то повернеться в попереднє вікно
            color={cPageHeadText}
            colorIconBg={cPageHeadBg}
            sizeIcon={sPageHeadIcon}
            titleText={'Редагування тем'}
          />
        </View>
        {/* Body of the page */}
        <View style={styles.bodyPageContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            {/* ✅ ЗМІНА: Вивід section_id через Picker */}
            <View style={{marginBottom: 10}}>
              <Controller
                control={control}
                name="section_id"
                render={({field: {onChange, value}}) => (
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, {color: cLabelText}]}>
                      {fieldLabels['section_id']}
                    </Text>
                    <View
                      style={{
                        borderWidth: 0.3,
                        borderRadius: 10,
                        backgroundColor: cInputBg,
                      }}>
                      <Picker
                        selectedValue={value}
                        onValueChange={itemValue => onChange(itemValue)}
                        //   setSectionName(topic.section.name);
                        dropdownIconColor={cInputText}
                        style={{color: cInputText}}>
                        <Picker.Item label="Оберіть секцію" value="" />
                        {sections.map(section => (
                          <Picker.Item
                            key={section.id}
                            label={`${section.id}: ${section.name}`}
                            value={section.id}
                          />
                        ))}
                      </Picker>
                    </View>
                    {errors.section_id && (
                      <Text style={[styles.inputError, {color: 'red'}]}>
                        {errors.section_id.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* name та link - звичайні input-и */}
            {['name', 'link'].map(fieldName => (
              <View key={fieldName} style={{marginBottom: 10}}>
                <Controller
                  control={control}
                  name={fieldName}
                  render={({field: {onChange, onBlur, value}}) => (
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, {color: cLabelText}]}>
                        {fieldLabels[fieldName] || fieldName}
                      </Text>
                      <TextInput
                        placeholder={`Введіть ${fieldName}`}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        // value={value ? value.toString() : ''}
                        value={value != null ? String(value) : ''}
                        style={[
                          styles.input,
                          {backgroundColor: cInputBg, color: cInputText},
                        ]}
                      />
                      {errors[fieldName] && (
                        <Text
                          style={[
                            styles.inputError,
                            {color: 'red', fontSize: 12},
                          ]}>
                          {errors[fieldName].message}
                        </Text>
                      )}
                    </View>
                  )}
                />
              </View>
            ))}
          </ScrollView>
          {/* Кнопка */}
          <TouchableOpacity
            onPress={handleSubmit(updateData)}
            style={[styles.submitBtn, {backgroundColor: cBtnBg}]}>
            <Text style={{color: cBtnText, fontSize: sBtnFontSize}}>
              Редагувати запис
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
export default TopicsEdit;

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
    // marginHorizontal: '2%',
  },
  inputContainer: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
  },
  input: {
    height: 50,
    borderRadius: 10,
    borderWidth: 0.3,
    paddingLeft: 20,
  },
  inputError: {
    width: '80%',
    alignSelf: 'center',
    paddingLeft: 20,
    // marginTop: 20,
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
