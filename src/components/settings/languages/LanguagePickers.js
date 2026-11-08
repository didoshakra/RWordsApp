//LanguagePickers.js//Всі Налаштування відтворення cлів

import React, {useState, useContext, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {SettingsContext} from '@/context/SettingsContext';
import {ThemeContext} from '@/context/ThemeContext';

export const languageItems = [
  {label: 'Англійська (США)', value: 'en-US'},
  {label: 'Англійська (Британська)', value: 'en-GB'},
  {label: 'Українська', value: 'uk-UA'},
  {label: 'Німецька', value: 'de-DE'},
  {label: 'Французька', value: 'fr-FR'},
  {label: 'Іспанська', value: 'es-ES'},
  {label: 'Італійська', value: 'it-IT'},
  {label: 'Польська', value: 'pl-PL'},
  {label: 'Португальська', value: 'pt-PT'},
  {label: 'Португальська (Бразилія)', value: 'pt-BR'},
  {label: 'Чеська', value: 'cs-CZ'},
  {label: 'Голландська (Нідерланди)', value: 'nl-NL'},
  {label: 'Шведська', value: 'sv-SE'},
  {label: 'Данська', value: 'da-DK'},
  {label: 'Фінська', value: 'fi-FI'},
  {label: 'Норвезька', value: 'nb-NO'},
];

// --- Вбудований пікер мов (без Modal) ---
export const LanguagePickers = ({
  fromLanguage,
  setFromLanguage,
  toLanguage,
  setToLanguage,
  cInputBg,
  cInputOn,
  cSectionHeadText,
  cModalViewBG,
}) => {
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  useEffect(() => {
    if (openFrom) setOpenTo(false);
  }, [openFrom]);
  useEffect(() => {
    if (openTo) setOpenFrom(false);
  }, [openTo]);

  return (
    <>
      <View style={styles.inputContainerCol}>
        <Text style={[styles.sectionHeadText, {color: cSectionHeadText}]}>
          Мова оригіналу:
        </Text>
        <DropDownPicker
          open={openFrom}
          setOpen={setOpenFrom}
          value={fromLanguage}
          setValue={setFromLanguage}
          items={languageItems}
          style={{backgroundColor: cInputBg}}
          placeholder="Оберіть мову"
          listMode="MODAL"
          modalTitle="Оберіть мову оригіналу"
          modalAnimationType="slide"
          closeAfterSelecting
          modalContentContainerStyle={{backgroundColor: cModalViewBG}}
          textStyle={{color: cInputOn}}
        />
      </View>
      <View style={styles.inputContainerCol}>
        <Text style={[styles.sectionHeadText, {color: cSectionHeadText}]}>
          Переклад на:
        </Text>
        <DropDownPicker
          open={openTo}
          setOpen={setOpenTo}
          value={toLanguage}
          setValue={setToLanguage}
          items={languageItems}
          style={{backgroundColor: cInputBg}}
          placeholder="Оберіть мову"
          listMode="MODAL"
          modalTitle="Оберіть мову перекладу"
          modalAnimationType="slide"
          closeAfterSelecting
          modalContentContainerStyle={{backgroundColor: cModalViewBG}}
          textStyle={{color: cInputOn}}
        />
      </View>
    </>
  );
};


const styles = StyleSheet.create({
  sectionHeadText: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  inputContainer: {
    maxHeight: '80%',
    maxWidth: '80%',
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
});
