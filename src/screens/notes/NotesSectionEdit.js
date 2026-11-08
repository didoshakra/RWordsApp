//NotesSectionEdit.js/ Редагування групи (note_section) — для нотаток
// Отримує itemData через route.params (передається з NotesListLevels.js: onEditSection)

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
import {useNavigation, useRoute} from '@react-navigation/native';
import {ThemeContext} from '@/context/ThemeContext';
import MyArrowBack from '@/components/main/MyArrowBack';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

import {updateNoteSection} from '@/db/notes/noteActions';

const schema = yup.object().shape({
  name: yup.string().min(1, 'Мінімум 1 символ').required("Обов'язкове поле"),
});

const NotesSectionEdit = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const itemData = route.params?.itemData; // {id, pn, name}

  //   Колір
  const {sizes, getColorScheme, isDarkMode} = useContext(ThemeContext);
  const indexScheme = 2;
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
  const sPageHeadIcon = sizes.sPageHeadIcon;
  const sBtnFontSize = sizes.sBtnFontLg;

  useEffect(() => {
    changeNavigationBarColor(cPageBorderBg, !isDarkMode);
  }, [cPageBorderBg, isDarkMode]);

  const updateData = async data => {
    if (!itemData || !itemData.id) {
      console.log('Помилка: немає itemData.id для редагування');
      return;
    }
    if (!data || !data.name) {
      console.log('Помилка: data або data.name не визначені');
      return;
    }
    try {
      await updateNoteSection(itemData.id, data.name);
      ToastAndroid.show('Запис оновлено!', ToastAndroid.SHORT);
      navigation.goBack();
    } catch (error) {
      console.log('Помилка оновлення note_section:', error);
      ToastAndroid.show('Запис не оновлено!', ToastAndroid.SHORT);
    }
  };

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {name: itemData?.name || ''},
  });

  const fieldLabels = {
    name: 'Назва групи',
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
            titleText={'Редагування групи'}
          />
        </View>
        <View style={styles.bodyPageContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
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
                      placeholder={'Введіть назву групи'}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value ? value.toString() : ''}
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
            onPress={handleSubmit(updateData)}
            style={[styles.submitBtn, {backgroundColor: cBtnBg}]}>
            <Text
              style={[
                styles.btnText,
                {color: cBtnText, fontSize: sBtnFontSize},
              ]}>
              Зберегти зміни
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NotesSectionEdit;

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
