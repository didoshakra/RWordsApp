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
import {Picker} from '@react-native-picker/picker';// ✅ ЗМІНА: імпорт Picker

import {ThemeContext} from '../../context/ThemeContext';
import MyArrowBack from '../../components/main/MyArrowBack';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
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

const ToipicsAdd = () => {
  const navigation = useNavigation();
  //   const [sectionName, setSectionName] = useState(''); //Для section_id

  const {sizes, getColorScheme, isDarkMode} = useContext(ThemeContext);
  const indexScheme = 1;
  const scheme = getColorScheme(indexScheme);
  const cPageBorderBg = scheme.cardBg;
  const cStatusBarBg = scheme.pageBg;
  const cPageHeadBg = scheme.pageBg;
  const cPageHeadText = scheme.pageOn;
  const cPageBg = scheme.pageBg;
  const cInputBg = scheme.inputBg;
  const cInputText = scheme.inputOn;
  const cLabelText = scheme.pageOn;
  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;
  //   changeNavigationBarColor(cPageBorderBg, !isDarkMode);
  // ✅ Navigation bar color — тільки при зміні теми або кольору
  useEffect(() => {
    changeNavigationBarColor(cPageBorderBg, !isDarkMode);
  }, [cPageBorderBg, isDarkMode]);
  const sPageHeadIcon = sizes.sPageHeadIcon;
  const sBtnFontSize = sizes.sBtnFontLg;

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

  //призначення порядкового номера pn (як max(pn) + 1
  const addTopic = data => {
    if (!data || !data.name) return;
    const section_id = data.section_id || 1;
    const name = data.name;
    const link = data.link || '';

    openDatabase().transaction(tx => {
      tx.executeSql('PRAGMA foreign_keys = ON;');
      tx.executeSql(
        'SELECT COUNT(*) AS count FROM sections WHERE id = ?',
        [section_id],
        (_, {rows}) => {
          const count = rows.item(0).count;
          if (count > 0) {
            tx.executeSql(
              'SELECT MAX(pn) as maxPn FROM topics WHERE section_id = ?',
              [section_id],
              (_, result) => {
                const maxPn = result.rows.item(0).maxPn;
                const newPn = maxPn != null ? maxPn + 1 : 1;
                tx.executeSql(
                  'INSERT INTO topics (section_id, name, pn, link) VALUES (?, ?, ?, ?)',
                  [section_id, name, newPn, link],
                  (_, results) => {
                    if (results.rowsAffected > 0) {
                      ToastAndroid.show('Запис додано!', ToastAndroid.SHORT);
                      navigation.goBack();
                    } else {
                      ToastAndroid.show('Запис не додано!', ToastAndroid.SHORT);
                    }
                  },
                  (_, error) => {
                    handleSQLError(error, 'додавання до таблиці topics');
                    return true;
                  },
                );
              },
              (_, error) => {
                handleSQLError(error, 'отримання max pn для topics');
                return true;
              },
            );
          } else {
            ToastAndroid.show('Вибрана секція не існує!', ToastAndroid.SHORT);
          }
        },
        (_, error) => {
          console.log('Помилка при перевірці секції:', error);
          return true;
        },
      );
    });
  };

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {section_id: 1, name: '', link: ''},
  });

  const fieldLabels = {
    section_id: 'ID: секція',
    name: 'Назва теми',
    link: 'Посилання (URL)',
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: cPageBorderBg}}>
      <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} />
      <View style={[styles.pageContainer, {backgroundColor: cPageBg}]}>
        <View
          style={[styles.pageHeadContainer, {backgroundColor: cPageHeadBg}]}>
          <MyArrowBack
            // headText={'toTopicsList'}
            // back={'TopicsList'} //Якщо нема то повернеться в попереднє вікно
            color={cPageHeadText}
            colorIconBg={cPageHeadBg}
            sizeIcon={sPageHeadIcon}
            titleText={'Додавання тем'}
          />
        </View>

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

            {/* name та 'link' - звичайні input-и */}
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

          <TouchableOpacity
            onPress={handleSubmit(addTopic)}
            style={[styles.submitBtn, {backgroundColor: cBtnBg}]}>
            <Text
              style={[
                styles.btnText,
                {color: cBtnText, fontSize: sBtnFontSize},
              ]}>
              Додати запис
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ToipicsAdd;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    borderRadius: 15,
    margin: '2%',
  },
  pageHeadContainer: {
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
  },
  input: {
    height: 50,
    borderRadius: 10,
    borderWidth: 0.3,
    paddingLeft: 20,
  },
  submitBtn: {
    width: '80%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    alignSelf: 'center',
    marginBottom: 10,
  },
  label: {
    gap: 20,
  },
  inputError: {
    gap: 20,
    marginTop: 5,
  },
});
