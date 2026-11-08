// TranslatorLanguageModal.js
// Легкий модал вибору мов для екрану "Перекладач".
// Без Azure-голосів/Rate/Pitch/Break — тільки From/To мова (базова пара).
// Базові мови живуть у SettingsContext, тому компонент не тримає їх стан сам —
// приймає поточні значення + готовий текст для чіпа, і повертає новий стан через onSave.

import React, {useState, useContext, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ToastAndroid,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

import {ThemeContext} from '@/context/ThemeContext';
import {LanguagePickers} from '@/components/settings/languages/LanguagePickers'

/**
 * Props:
 * - fromLanguage: string   — поточна базова мова оригіналу (напр. 'uk-UA')
 * - toLanguage: string     — поточна базова мова перекладу (напр. 'en-GB')
 * - displayLabel: string   — готовий текст для чіпа (напр. "укр. → англ.")
 * - onSave: (newFrom: string, newTo: string) => void
 */
const TranslatorLanguageModal = ({
  fromLanguage,
  toLanguage,
  displayLabel,
  onSave,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const {getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(0);

  const cPageHeadText = scheme.pageOn;
  const cModalViewBG = scheme.modalBg;
  const cModalViewBorder = scheme.border;
  const cSectionHeadText = scheme.modalOn;
  const cInputBg = scheme.inputBg;
  const cInputOn = scheme.inputOn;
  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;

  // Чернетковий стан — щоб зміни в дропдаунах не застосовувались,
  // поки користувач не натисне "Зберегти"
  const [draftFrom, setDraftFrom] = useState(fromLanguage);
  const [draftTo, setDraftTo] = useState(toLanguage);

  // Синхронізуємо чернетку, якщо базові мови змінились ззовні (напр. з іншого екрану)
  useEffect(() => {
    if (!isVisible) {
      setDraftFrom(fromLanguage);
      setDraftTo(toLanguage);
    }
  }, [fromLanguage, toLanguage, isVisible]);

  const handleSave = () => {
    onSave?.(draftFrom, draftTo);
    setIsVisible(false);
    ToastAndroid.show('Мови оновлено', ToastAndroid.SHORT);
  };

  return (
    <View>
      <Modal visible={isVisible} animationType="slide" transparent={true}>
        <TouchableOpacity
          style={styles.centeredView}
          onPress={() => setIsVisible(false)}
        />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={[
              styles.modalView,
              {backgroundColor: cModalViewBG, borderColor: cModalViewBorder},
            ]}>
            <Text style={[styles.modalHeadText, {color: cPageHeadText}]}>
              Мови перекладу
            </Text>

            <LanguagePickers
              fromLanguage={draftFrom}
              setFromLanguage={setDraftFrom}
              toLanguage={draftTo}
              setToLanguage={setDraftTo}
              cInputBg={cInputBg}
              cInputOn={cInputOn}
              cSectionHeadText={cSectionHeadText}
              cModalViewBG={cModalViewBG}
            />

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: cBtnBg}]}
                onPress={handleSave}>
                <AntDesign name="save" color={cBtnText} size={20} />
                <Text style={{color: cBtnText}}>Зберегти</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, {backgroundColor: cBtnBg}]}
                onPress={() => setIsVisible(false)}>
                <AntDesign name="close" color={cBtnText} size={20} />
                <Text style={{color: cBtnText}}>Вийти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Чіп мов — вставляється в новий рядок під шапкою екрану перекладача */}
      <TouchableOpacity onPress={() => setIsVisible(true)} style={styles.chip}>
        <Text style={[styles.chipText, {color: cSectionHeadText}]}>
          {displayLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {flex: 1, backgroundColor: 'rgba(0,0,0,0.3)'},
  modalView: {
    width: '90%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 20,
  },
  modalHeadText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    paddingVertical: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 50,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TranslatorLanguageModal;
