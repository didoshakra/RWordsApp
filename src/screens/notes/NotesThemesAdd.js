//NotesThemesAdd.js/ Додавання теми (note_themes) — для нотаток
// Аналог ToipicsAdd.js, але без поля img (note_themes: id, pn, section_id, name)
// Picker вантажить список груп з note_section (не sections!)

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
import {Picker} from '@react-native-picker/picker';

import {ThemeContext} from '@/context/ThemeContext';
import MyArrowBack from '@/components/main/MyArrowBack';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {getAllNoteSections, createNoteTheme} from '@/db/notes/noteActions';

const schema = yup.object().shape({
  section_id: yup
    .number()
    .typeError('Оберіть групу')
    .min(1, 'Оберіть групу')
    .required('Обовʼязкове поле'),
  name: yup.string().min(1, 'Мінімум 1 символ').required("Обов'язкове поле"),
});

const NotesThemesAdd = () => {
  const navigation = useNavigation();

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

  useEffect(() => {
    changeNavigationBarColor(cPageBorderBg, !isDarkMode);
  }, [cPageBorderBg, isDarkMode]);
  const sPageHeadIcon = sizes.sPageHeadIcon;
  const sBtnFontSize = sizes.sBtnFontLg;

  const [sections, setSections] = useState([]);

  // Завантаження списку груп з note_section
  useEffect(() => {
    getAllNoteSections()
      .then(setSections)
      .catch(error =>
        console.log('Помилка при завантаженні note_section:', error),
      );
  }, []);

  const addTheme = async data => {
    if (!data || !data.name || !data.section_id) {
      console.log('Помилка: не всі поля заповнені');
      return;
    }
    try {
      await createNoteTheme(data.section_id, data.name);
      ToastAndroid.show('Запис додано!', ToastAndroid.SHORT);
      navigation.goBack();
    } catch (error) {
      console.log('Помилка додавання note_themes:', error);
      ToastAndroid.show('Запис не додано!', ToastAndroid.SHORT);
    }
  };

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {section_id: '', name: ''},
  });

  const fieldLabels = {
    section_id: 'Група',
    name: 'Назва теми',
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: cPageBorderBg}}>
      <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} />
      <View style={[styles.pageContainer, {backgroundColor: cPageBg}]}>
        <View
          style={[styles.pageHeadContainer, {backgroundColor: cPageHeadBg}]}>
          <MyArrowBack
            color={cPageHeadText}
            colorIconBg={cPageHeadBg}
            sizeIcon={sPageHeadIcon}
            titleText={'Додавання теми'}
          />
        </View>

        <View style={styles.bodyPageContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            {/* Вибір групи через Picker */}
            <View style={{marginBottom: 10}}>
              <Controller
                control={control}
                name="section_id"
                render={({field: {onChange, value}}) => (
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, {color: cLabelText}]}>
                      {fieldLabels.section_id}
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
                        dropdownIconColor={cInputText}
                        style={{color: cInputText}}>
                        <Picker.Item label="Оберіть групу" value="" />
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

            {/* name */}
            <View style={{marginBottom: 10}}>
              <Controller
                control={control}
                name="name"
                render={({field: {onChange, onBlur, value}}) => (
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, {color: cLabelText}]}>
                      {fieldLabels.name}
                    </Text>
                    <TextInput
                      placeholder={'Введіть назву теми'}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value != null ? String(value) : ''}
                      style={[
                        styles.input,
                        {backgroundColor: cInputBg, color: cInputText},
                      ]}
                    />
                    {errors.name && (
                      <Text
                        style={[
                          styles.inputError,
                          {color: 'red', fontSize: 12},
                        ]}>
                        {errors.name.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={handleSubmit(addTheme)}
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

export default NotesThemesAdd;

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
