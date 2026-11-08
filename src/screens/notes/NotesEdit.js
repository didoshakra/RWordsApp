// NotesEdit.js
// Редагування тексту нотатки (notes.text). Тему тут не змінюємо —
// переміщення між темами робиться окремо через "Перемістити" в TableViewLevels.
import React, {useState, useContext, useEffect} from 'react';
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
import {useNavigation, useRoute} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

import {ThemeContext} from '@/context/ThemeContext';
import MyArrowBack from '@/components/main/MyArrowBack';
import {updateNote} from '@/db/notes/noteActions';

const NotesEdit = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const itemData = route?.params?.itemData;

  const [text, setText] = useState(itemData?.text ?? '');
  const [error, setError] = useState('');

  const {sizes, getColorScheme, isDarkMode} = useContext(ThemeContext);
  const indexScheme = 0;
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

  if (!itemData) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: cPageBorderBg}}>
        <View style={[styles.pageContainer, {backgroundColor: cPageBg}]}>
          <Text style={{padding: 20, color: cLabelText}}>
            Немає даних для редагування.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const saveNote = async () => {
    const clean = text.trim();
    if (!clean) {
      setError("Обов'язкове поле");
      return;
    }
    try {
      await updateNote(itemData.id, clean);
      ToastAndroid.show('Збережено!', ToastAndroid.SHORT);
      navigation.goBack();
    } catch (e) {
      console.log('NotesEdit/saveNote помилка:', e);
      ToastAndroid.show('Помилка збереження', ToastAndroid.SHORT);
    }
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
            titleText={'Нотатку редагувати'}
          />
        </View>

        <View style={styles.bodyPageContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            {(itemData.theme_name || itemData.section_name) && (
              <Text style={[styles.themeHint, {color: cLabelText}]}>
                {itemData.section_name ? `${itemData.section_name} / ` : ''}
                {itemData.theme_name ?? ''}
              </Text>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.label, {color: cLabelText}]}>
                Текст нотатки
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  {color: cInputText, backgroundColor: cInputBg},
                ]}
                value={text}
                onChangeText={t => {
                  setText(t);
                  if (error) setError('');
                }}
                multiline
                autoFocus
              />
              {error !== '' && <Text style={{color: 'red'}}>{error}</Text>}
            </View>

            <TouchableOpacity
              onPress={saveNote}
              style={[styles.submitBtn, {backgroundColor: cBtnBg}]}>
              <Text style={{color: cBtnText, fontSize: sBtnFontSize}}>
                Зберегти
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NotesEdit;

const styles = StyleSheet.create({
  pageContainer: {flex: 1, borderRadius: 15, margin: '2%'},
  pageHeadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bodyPageContainer: {flex: 1, justifyContent: 'center'},
  themeHint: {
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
    fontSize: 13,
    opacity: 0.7,
  },
  inputContainer: {width: '90%', alignSelf: 'center', marginTop: 10},
  input: {height: 50, borderRadius: 10, borderWidth: 0.3, paddingLeft: 20},
  multilineInput: {height: 140, paddingTop: 12, textAlignVertical: 'top'},
  submitBtn: {
    backgroundColor: 'purple',
    width: '80%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  label: {gap: 20},
});
