//SectionsEdit.js/ GPT/yup-hookform-useForm/Робоча{['name'].map
// 3-схеми

import React, {useContext, useEffect} from 'react';
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

import {ThemeContext} from '../../context/ThemeContext';
import MyArrowBack from '../../components/main/MyArrowBack';

import {openDatabase} from '@/db/dbConfig';
import {handleSQLError} from '@/db/dbUtils';

const schema = yup.object().shape({
  name: yup.string().min(1, 'Мінімум 1 символ').required("Обов'язкове поле"),
  link: yup.string(), // необов'язкове
});

const SectionsEdit = ({route}) => {
  //   Колір
  const {sizes, getColorScheme, isDarkMode} = useContext(ThemeContext);
  const indexScheme = 2;
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

  const navigation = useNavigation();
  const {itemData} = route.params;
  console.log('SectionsEdit/itemData:', itemData); // Перевірка itemData
  console.log('SectionsEdit/Початок'); // Перевірка лога

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: itemData.name,
      link: itemData.link || '',
      id: itemData.id,
    },
  });

  const updateData = data => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        'UPDATE sections SET name=?, link=? WHERE id=?',
        [data.name, data.link || '', data.id],
        (_, results) => {
          if (results.rowsAffected > 0) {
            ToastAndroid.show('Запис відредаговано!', ToastAndroid.SHORT);
            navigation.goBack();
          } else {
            ToastAndroid.show('Помилка оновлення!', ToastAndroid.SHORT);
          }
        },
        (_, error) => {
          handleSQLError(error, 'оновлення в таблиці sections');
          return true;
        },
      );
    });
  };

  //Назви полів вводу
  const fieldLabels = {
    name: 'Назва секції',
    link: 'Посилання (необов’язково)',
  };

  //Підказки в полях вводу
  const fieldPlaceholders = {
    name: 'Введіть назву секції',
    link: 'Введіть посилання',
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
            // headText={'toSectionsList'}
            // back={'SectionsList'} //Якщо нема то повернеться в попереднє вікно
            color={cPageHeadText}
            colorIconBg={cPageHeadBg}
            sizeIcon={sPageHeadIcon}
            titleText={'Редагування секцій'}
          />
        </View>
        {/* Body of the page */}
        <View style={styles.bodyPageContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            // Якщо контент менший за екран, але ти хочеш, щоб він був по центру
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            {/* inputs */}
            {['name', 'link'].map(field => (
              <View key={field} style={{marginBottom: 10}}>
                <Controller
                  control={control}
                  name={field}
                  render={({field: {onChange, onBlur, value}}) => (
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, {color: cLabelText}]}>
                        {fieldLabels?.[field] || field}
                      </Text>
                      <TextInput
                        placeholder={fieldPlaceholders?.[field] || field}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value ? value.toString() : ''} // Переводимо число в рядок, якщо необхідно
                        autoCapitalize={field === 'link' ? 'none' : 'sentences'}
                        style={[
                          styles.input,
                          {backgroundColor: cInputBg, color: cInputText},
                        ]}
                      />
                      {errors[field] && (
                        <Text
                          style={[
                            styles.inputError,
                            {color: 'red', fontSize: 12},
                          ]}>
                          {errors[field].message}
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
export default SectionsEdit;

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
