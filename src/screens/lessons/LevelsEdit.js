// screens/LevelsEdit.js
// добав.
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
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useForm, Controller} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {useNavigation} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

import {ThemeContext} from '@/context/ThemeContext';
import MyArrowBack from '@/components/main/MyArrowBack';
import {updateLevel} from '@/db/lessons/lessonsActions';

const schema = yup.object().shape({
  name: yup.string().min(1, 'Мінімум 1 символ').required("Обов'язкове поле"),
});

const LevelsEdit = ({route}) => {
  const navigation = useNavigation();
  const {itemData} = route.params;

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

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {name: itemData.name, id: itemData.id},
  });

  const updateData = async data => {
    try {
      await updateLevel(data.id, data.name);
      ToastAndroid.show('Запис відредаговано!', ToastAndroid.SHORT);
      navigation.goBack();
    } catch (error) {
      console.log('LevelsEdit/updateData error:', error);
      Alert.alert(
        'Помилка',
        'Не вдалося оновити рівень (можливо, така назва вже є)',
      );
    }
  };

  const fieldLabels = {name: 'Назва рівня'};

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
            titleText={'Редагування рівня'}
          />
        </View>

        <View style={styles.bodyPageContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            {['name'].map(fieldName => (
              <View key={fieldName} style={{marginBottom: 10}}>
                <Controller
                  control={control}
                  name={fieldName}
                  render={({field: {onChange, onBlur, value}}) => (
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, {color: cLabelText}]}>
                        {fieldLabels[fieldName]}
                      </Text>
                      <TextInput
                        placeholder={`Введіть ${fieldName}`}
                        onBlur={onBlur}
                        onChangeText={onChange}
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

export default LevelsEdit;

const styles = StyleSheet.create({
  pageContainer: {flex: 1, borderRadius: 15, margin: '2%'},
  pageHeadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bodyPageContainer: {flex: 1, justifyContent: 'center'},
  inputContainer: {width: '90%', alignSelf: 'center', marginTop: 10},
  input: {height: 50, borderRadius: 10, borderWidth: 0.3, paddingLeft: 20},
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
  label: {gap: 20},
  inputError: {gap: 20, marginTop: 5},
});
