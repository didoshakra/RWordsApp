// NotesAdd.js
// Додавання нотатки (notes) до вже існуючої теми (note_themes).
// За зразком WordAdd.js, але під схему note_section/note_themes/notes.
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
import changeNavigationBarColor from 'react-native-navigation-bar-color';

import {ThemeContext} from '@/context/ThemeContext';
import MyArrowBack from '@/components/main/MyArrowBack';

import {openDatabase} from '@/db/dbConfig';
import {addNote} from '@/db/notes/noteActions';

const schema = yup.object().shape({
  theme_id: yup
    .number()
    .typeError('Оберіть тему')
    .min(1, 'Оберіть тему')
    .required('Обовʼязкове поле'),
  text: yup.string().min(1, 'Мінімум 1 символ').required("Обов'язкове поле"),
});

const NotesAdd = () => {
  const navigation = useNavigation();
  const [showModal, setShowModal] = useState(false);
  const [themeName, setThemeName] = useState('');

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

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      theme_id: '',
      text: '',
    },
  });

  // Додавання нотатки в обрану тему
  const addNoteRecord = async data => {
    if (!data || !data.text || !data.theme_id) {
      console.log('NotesAdd/addNoteRecord: не всі дані передані', data);
      return;
    }
    try {
      await addNote(data.theme_id, data.text);
      ToastAndroid.show('Нотатку додано!', ToastAndroid.SHORT);
      navigation.goBack();
    } catch (e) {
      console.log('NotesAdd/addNoteRecord помилка:', e);
      ToastAndroid.show('Помилка додавання', ToastAndroid.SHORT);
    }
  };

  const fieldLabels = {
    theme_id: 'Тема',
    text: 'Текст нотатки',
  };

  // Групи+теми для вибору (note_section + note_themes)
  const fetchSectionsWithThemes = setData => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        `SELECT
           s.id as section_id,
           s.name as section_name,
           t.id as theme_id,
           t.name as theme_name
         FROM note_section s
         LEFT JOIN note_themes t ON s.id = t.section_id
         ORDER BY s.name, t.name`,
        [],
        (_, {rows}) => {
          const raw = rows._array;
          const grouped = raw.reduce((acc, row) => {
            const {section_id, section_name, theme_id, theme_name} = row;
            if (!acc[section_id]) acc[section_id] = {section_name, themes: []};
            if (theme_id) acc[section_id].themes.push({theme_id, theme_name});
            return acc;
          }, {});
          setData(Object.values(grouped));
        },
        (_, e) => console.log('NotesAdd: помилка вибірки тем:', e),
      );
    });
  };

  const ThemeSelectorModal = ({visible, onClose, onSelect}) => {
    const [sections, setSections] = useState([]);

    useEffect(() => {
      if (visible) fetchSectionsWithThemes(setSections);
    }, [visible]);

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
              {sections.length === 0 && (
                <Text style={{fontSize: 14}}>
                  Груп із темами ще нема. Створіть тему через екран нотаток.
                </Text>
              )}
              {sections.map((sec, idx) => (
                <View key={idx} style={{marginBottom: 15}}>
                  <Text style={{fontWeight: 'bold', fontSize: 16}}>
                    {sec.section_name}
                  </Text>
                  {sec.themes.map(theme => (
                    <TouchableOpacity
                      key={theme.theme_id}
                      onPress={() => {
                        onSelect(theme.theme_id);
                        setThemeName(theme.theme_name);
                        onClose();
                      }}
                      style={{paddingVertical: 8}}>
                      <Text style={{fontSize: 14}}>{theme.theme_name}</Text>
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
    <SafeAreaView style={{flex: 1, backgroundColor: cPageBorderBg}}>
      <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} />
      <View style={[styles.pageContainer, {backgroundColor: cPageBg}]}>
        <View
          style={[styles.pageHeadContainer, {backgroundColor: cPageHeadBg}]}>
          <MyArrowBack
            color={cPageHeadText}
            colorIconBg={cPageHeadBg}
            sizeIcon={sPageHeadIcon}
            titleText={'Нотатку додати'}
          />
        </View>

        <View style={styles.bodyPageContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            {/* Вибір теми */}
            <Controller
              control={control}
              name="theme_id"
              render={({field: {value, onChange}}) => (
                <View style={{marginBottom: 10}}>
                  <Text style={[styles.label, {color: cLabelText}]}>
                    {fieldLabels['theme_id']}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.inputContainer,
                      {backgroundColor: cInputBg, padding: 10, borderRadius: 5},
                    ]}
                    onPress={() => setShowModal(true)}>
                    <Text style={{color: cInputText}}>
                      {value ? `${themeName}` : 'Виберіть тему'}
                    </Text>
                  </TouchableOpacity>
                  {errors.theme_id && (
                    <Text style={{color: 'red'}}>
                      {errors.theme_id.message}
                    </Text>
                  )}
                  <ThemeSelectorModal
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

            {/* Текст нотатки */}
            <Controller
              control={control}
              name="text"
              render={({field: {onChange, onBlur, value}}) => (
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, {color: cLabelText}]}>
                    {fieldLabels['text']}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.multilineInput,
                      {color: cInputText, backgroundColor: cInputBg},
                    ]}
                    placeholder="Введіть текст нотатки"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                  />
                  {errors.text && (
                    <Text style={{color: 'red'}}>{errors.text.message}</Text>
                  )}
                </View>
              )}
            />

            <TouchableOpacity
              onPress={handleSubmit(addNoteRecord)}
              style={[styles.submitBtn, {backgroundColor: cBtnBg}]}>
              <Text style={{color: cBtnText, fontSize: sBtnFontSize}}>
                Додати нотатку
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NotesAdd;

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
  multilineInput: {height: 120, paddingTop: 12, textAlignVertical: 'top'},
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
