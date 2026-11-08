//components/settings/listen_words/ListenWordsSettingsModal.js
//Всі налаштування відтворення cлів (паузи + мови) крім для запису слів(воно в списку слів???)
// Modal
import React, {useState, useContext, useRef, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Tts from 'react-native-tts-export';

import {openDatabase} from '@/db/dbConfig';
import {SettingsContext, ALL_WORD_TYPES} from '@/context/SettingsContext';
import {ThemeContext} from '@/context/ThemeContext';
import TopicsModal from '../../../screens/words/TopicsModal';
import KnowFilterModal from './KnowFilterModal';
// ↓ імпортуємо замість дублювання
import {LanguagePickers} from '../languages/LanguagePickers';

const ListenWordsSettingsModal = ({isVisible, onClose}) => {
  const {settings, setSettings} = useContext(SettingsContext);
  const original = useRef(false);
  const translation1 = useRef(false);
  const translation2 = useRef(false);
  const voiceCommand = useRef(false);
  const startOfWordListRef = useRef(false);
  const endOfWordListRef = useRef(false);

  const {getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(0);
  const cPageHeadText = scheme.pageOn;
  const cModalViewBG = scheme.modalBg;
  const cModalViewBorder = scheme.border;
  const cSectionHeadText = scheme.modalOn;
  const cInputBg = scheme.inputBg;
  const cInputOn = scheme.inputOn;
  const cBtnBg = scheme.buttonBg;
  const cBtnBorder = scheme.buttonBorder;
  const cBtnText = scheme.buttonOn;
  const cIcon = scheme.buttonOn;

  const [delayOriginal, setDelayOriginal] = useState(
    settings?.delayOriginal ?? 2000,
  );
  const [tempDelayOriginal, setTempDelayOriginal] = useState(delayOriginal);
  const [delayTranslation1, setDelayTranslation1] = useState(
    settings?.delayTranslation1 ?? 0,
  );
  const [tempDelayTranslation1, setTempDelayTranslation1] =
    useState(delayTranslation1);
  const [delayTranslation2, setDelayTranslation2] = useState(
    settings?.delayTranslation2 ?? 1000,
  );
  const [tempDelayTranslation2, setTempDelayTranslation2] =
    useState(delayTranslation2);
  const [delayVoiceCommand, setDelayVoiceCommand] = useState(
    settings?.delayVoiceCommand ?? 1000,
  );
  const [tempDelayVoiceCommand, setTempDelayVoiceCommand] =
    useState(delayVoiceCommand);
  const [startOfWordList, setStartOfWordList] = useState(
    settings?.startOfWordList ?? 'Початок списку слів',
  );
  const [tempStartOfWordList, setTempStartOfWordList] =
    useState(startOfWordList);
  const [endOfWordList, setEndOfWordList] = useState(
    settings?.endOfWordList ?? 'Кінець списку слів',
  );
  const [tempEndOfWordList, setTempEndOfWordList] = useState(endOfWordList);
  const [knowFilter, setKnowFilter] = useState(settings?.knowFilter ?? '*');
  const [translateWord, setTranslateWord] = useState(
    settings?.translateWord ?? true,
  );
  const [enableRepeatTranslation, setEnableRepeatTranslation] = useState(
    settings?.enableRepeatTranslation ?? true,
  );
  const [stopBetweenTranslation, setStopBetweenTranslation] = useState(
    settings?.stopBetweenTranslation ?? true,
  );
  const [showImg, setShowImg] = useState(settings?.showImg ?? true);

  // ↓ стейти мов тут — передаємо в LanguagePickers
  const [fromLanguage, setFromLanguage] = useState(
    settings?.fromLanguage ?? 'uk-UA',
  );
  const [toLanguage, setToLanguage] = useState(settings?.toLanguage ?? 'en-GB');

  const [availableVoices, setAvailableVoices] = useState([]);
  const [origVoice, setOrigVoice] = useState(
    settings.voiceByLanguage?.originalVoice ?? '',
  );
  const [transVoice1, setTransVoice1] = useState(
    settings.voiceByLanguage?.translateVoice1 ?? '',
  );
  const [transVoice2, setTransVoice2] = useState(
    settings.voiceByLanguage?.translateVoice2 ?? '',
  );
  const [openOrigVoice, setOpenOrigVoice] = useState(false);
  const [openTrans1Voice, setOpenTrans1Voice] = useState(false);
  const [openTrans2Voice, setOpenTrans2Voice] = useState(false);
  const [reverseOrder, setReverseOrder] = useState(
    settings?.reverseOrder ?? false,
  );

  const [wordTypeFilter, setWordTypeFilter] = useState(
    settings?.wordTypeFilter ?? [],
  );

  const [availableTypes, setAvailableTypes] = useState([]);

  const hasChanges =
    tempDelayOriginal !== settings.delayOriginal ||
    tempDelayTranslation1 !== settings.delayTranslation1 ||
    tempDelayTranslation2 !== settings.delayTranslation2 ||
    tempDelayVoiceCommand !== settings.delayVoiceCommand ||
    tempStartOfWordList !== settings.startOfWordList ||
    tempEndOfWordList !== settings.endOfWordList ||
    knowFilter !== settings.knowFilter ||
    translateWord !== settings.translateWord ||
    enableRepeatTranslation !== settings.enableRepeatTranslation ||
    stopBetweenTranslation !== settings.stopBetweenTranslation ||
    showImg !== settings.showImg ||
    fromLanguage !== settings.fromLanguage ||
    toLanguage !== settings.toLanguage ||
    reverseOrder !== settings.reverseOrder ||
    JSON.stringify(wordTypeFilter) !==
      JSON.stringify(settings.wordTypeFilter) ||
    origVoice !== settings.voiceByLanguage?.originalVoice ||
    transVoice1 !== settings.voiceByLanguage?.translateVoice1 ||
    transVoice2 !== settings.voiceByLanguage?.translateVoice2;

  //  Для витягування типів
  useEffect(() => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        'SELECT DISTINCT type FROM words WHERE type IS NOT NULL AND type != "" ORDER BY type ASC',
        [],
        (_, results) => {
          const types = [];
          for (let i = 0; i < results.rows.length; i++) {
            types.push(results.rows.item(i).type);
          }
          setAvailableTypes(types);
        },
        (_, error) => console.log('Помилка завантаження типів:', error),
      );
    });
  }, []);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        await Tts.getInitStatus();
        // const engines = await Tts.engines();
        // const rhVoice = engines.find(e => e.name.includes('rhvoice'));
        // if (rhVoice) await Tts.setDefaultEngine(rhVoice.name);
        const voices = await Tts.voices();
        console.log('Кількість голосів:', voices.length);
        console.log('Всі голоси:', JSON.stringify(voices, null, 2));
        // const filtered = voices.filter(
        //   v => v.language.startsWith('uk') && !v.notInstalled,
        // );
        const filtered = voices.filter(v => !v.notInstalled);
        setAvailableVoices(filtered);
        setAvailableVoices(filtered);
      } catch (e) {
        console.error('Помилка при завантаженні голосів:', e);
      }
    };
    loadVoices();
  }, []);

  useEffect(() => {
    if (openOrigVoice) {
      setOpenTrans1Voice(false);
      setOpenTrans2Voice(false);
    }
  }, [openOrigVoice]);
  useEffect(() => {
    if (openTrans1Voice) {
      setOpenOrigVoice(false);
      setOpenTrans2Voice(false);
    }
  }, [openTrans1Voice]);
  useEffect(() => {
    if (openTrans2Voice) {
      setOpenOrigVoice(false);
      setOpenTrans1Voice(false);
    }
  }, [openTrans2Voice]);

  const playTest = voiceId => {
    Tts.stop();
    Tts.setDefaultVoice(voiceId);
    Tts.speak('Тест голосу');
  };

  const handleSave = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      delayOriginal: tempDelayOriginal,
      delayTranslation1: tempDelayTranslation1,
      delayTranslation2: tempDelayTranslation2,
      delayVoiceCommand: tempDelayVoiceCommand,
      startOfWordList: tempStartOfWordList,
      endOfWordList: tempEndOfWordList,
      knowFilter,
      translateWord,
      enableRepeatTranslation,
      stopBetweenTranslation,
      showImg,
      fromLanguage,
      toLanguage,
      wordTypeFilter,
      voiceByLanguage: {
        originalVoice: origVoice,
        translateVoice1: transVoice1,
        translateVoice2: transVoice2,
      },
      reverseOrder,
    }));
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableOpacity
        style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.3)'}}
        onPress={onClose}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={[
            styles.modalView,
            {backgroundColor: cModalViewBG, borderColor: cModalViewBorder},
          ]}>
          <Text style={[styles.modalHeadText, {color: cPageHeadText}]}>
            Налаштування
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={{flex: 1}}>
            <View style={styles.settingsContainer}>
              {/* Паузи */}
              {[
                {
                  label: 'Пауза після слова (ms):',
                  temp: tempDelayOriginal,
                  setTemp: setTempDelayOriginal,
                  confirmed: delayOriginal,
                  setConfirmed: setDelayOriginal,
                  ref: original,
                },
                {
                  label: 'Пауза після перекладу1 (ms):',
                  temp: tempDelayTranslation1,
                  setTemp: setTempDelayTranslation1,
                  confirmed: delayTranslation1,
                  setConfirmed: setDelayTranslation1,
                  ref: translation1,
                },
                {
                  label: 'Пауза після перекладу2 (ms):',
                  temp: tempDelayTranslation2,
                  setTemp: setTempDelayTranslation2,
                  confirmed: delayTranslation2,
                  setConfirmed: setDelayTranslation2,
                  ref: translation2,
                },
                {
                  label: 'Затримка голосу (ms):',
                  temp: tempDelayVoiceCommand,
                  setTemp: setTempDelayVoiceCommand,
                  confirmed: delayVoiceCommand,
                  setConfirmed: setDelayVoiceCommand,
                  ref: voiceCommand,
                },
              ].map(({label, temp, setTemp, confirmed, setConfirmed, ref}) => (
                <View key={label} style={styles.inputContainer}>
                  <Text
                    style={[styles.sectionHeadText, {color: cSectionHeadText}]}>
                    {label}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {backgroundColor: cInputBg, color: cInputOn},
                    ]}
                    keyboardType="numeric"
                    value={temp.toString()}
                    onChangeText={text => setTemp(Number(text))}
                    onFocus={() => (ref.current = true)}
                    onSubmitEditing={() => {
                      setConfirmed(temp);
                      ref.current = false;
                    }}
                    onBlur={() => {
                      if (!ref.current) return;
                      setTemp(confirmed);
                      ref.current = false;
                    }}
                    returnKeyType="done"
                  />
                </View>
              ))}

              {/* Текстові поля */}
              {[
                {
                  label: 'Вираз для озвучки початку списку:',
                  temp: tempStartOfWordList,
                  setTemp: setTempStartOfWordList,
                  confirmed: startOfWordList,
                  setConfirmed: setStartOfWordList,
                  ref: startOfWordListRef,
                },
                {
                  label: 'Вираз для озвучки кінця списку:',
                  temp: tempEndOfWordList,
                  setTemp: setTempEndOfWordList,
                  confirmed: endOfWordList,
                  setConfirmed: setEndOfWordList,
                  ref: endOfWordListRef,
                },
              ].map(({label, temp, setTemp, confirmed, setConfirmed, ref}) => (
                <View key={label} style={styles.inputContainerCol}>
                  <Text
                    style={[styles.sectionHeadText, {color: cSectionHeadText}]}>
                    {label}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {backgroundColor: cInputBg, color: cInputOn},
                    ]}
                    value={temp}
                    onChangeText={setTemp}
                    onFocus={() => (ref.current = true)}
                    onSubmitEditing={() => {
                      setConfirmed(temp);
                      ref.current = false;
                    }}
                    onBlur={() => {
                      if (!ref.current) return;
                      setTemp(confirmed);
                      ref.current = false;
                    }}
                    returnKeyType="done"
                  />
                </View>
              ))}

              <View style={styles.inputContainer}>
                <TopicsModal headerColor={cSectionHeadText} />
              </View>
              <KnowFilterModal headerColor={cSectionHeadText} />
              {/* Фільтр типів слів */}
              <View style={styles.inputContainerCol}>
                <Text
                  style={[styles.sectionHeadText, {color: cSectionHeadText}]}>
                  Типи слів:
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 4,
                  }}>
                  {/* Кнопка "Всі" */}
                  <TouchableOpacity
                    onPress={() => setWordTypeFilter([])}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: cBtnBorder,
                      backgroundColor:
                        wordTypeFilter.length === 0 ? cBtnBg : 'transparent',
                    }}>
                    <Text
                      style={{
                        color:
                          wordTypeFilter.length === 0
                            ? cBtnText
                            : cSectionHeadText,
                      }}>
                      Всі
                    </Text>
                  </TouchableOpacity>

                  {/* Динамічні типи з БД */}
                  {availableTypes.map(type => {
                    const isSelected = wordTypeFilter.includes(type);
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() =>
                          setWordTypeFilter(prev =>
                            isSelected
                              ? prev.filter(t => t !== type)
                              : [...prev, type],
                          )
                        }
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: cBtnBorder,
                          backgroundColor: isSelected ? cBtnBg : 'transparent',
                        }}>
                        <Text
                          style={{
                            color: isSelected ? cBtnText : cSectionHeadText,
                          }}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Перемикачі */}
              {[
                {
                  label: 'Показувати переклад:',
                  value: translateWord,
                  onChange: setTranslateWord,
                  text: translateWord ? '✅' : '❌',
                },
                {
                  label: 'Повторювати переклад:',
                  value: enableRepeatTranslation,
                  onChange: setEnableRepeatTranslation,
                  text: enableRepeatTranslation ? '✅' : '❌',
                },
                {
                  label: 'Зупиняти після перекладу:',
                  value: stopBetweenTranslation,
                  onChange: setStopBetweenTranslation,
                  text: stopBetweenTranslation ? '✅' : '❌',
                },
                {
                  label: 'Показувати картинку:',
                  value: showImg,
                  onChange: setShowImg,
                  text: showImg ? '✅' : '❌',
                },
                {
                  label: 'Порядок: Переклад→Оригінал',
                  value: reverseOrder,
                  onChange: setReverseOrder,
                  text: reverseOrder ? '✅' : '❌',
                },
              ].map(({label, value, onChange, text}) => (
                <View key={label} style={styles.inputContainer}>
                  <Text
                    style={[styles.sectionHeadText, {color: cSectionHeadText}]}>
                    {label}
                  </Text>
                  <View style={styles.switchContainer}>
                    <Switch value={value} onValueChange={onChange} />
                    <Text>{text}</Text>
                  </View>
                </View>
              ))}

              {/* ↓ Замість дубльованого коду — імпортований компонент */}
              <LanguagePickers
                fromLanguage={fromLanguage}
                setFromLanguage={setFromLanguage}
                toLanguage={toLanguage}
                setToLanguage={setToLanguage}
                cInputBg={cInputBg}
                cInputOn={cInputOn}
                cSectionHeadText={cSectionHeadText}
                cModalViewBG={cModalViewBG}
              />

              {/* Голоси */}
              {[
                {
                  label: `Голос(Оригінал)(${fromLanguage}):`,
                  lang: fromLanguage,
                  open: openOrigVoice,
                  setOpen: setOpenOrigVoice,
                  value: origVoice,
                  setValue: setOrigVoice,
                  modalTitle: 'Оберіть голос оригіналу',
                },
                {
                  label: `Голос(Переклад1)(${toLanguage}):`,
                  lang: toLanguage,
                  open: openTrans1Voice,
                  setOpen: setOpenTrans1Voice,
                  value: transVoice1,
                  setValue: setTransVoice1,
                  modalTitle: 'Оберіть голос перекладу 1',
                },
                {
                  label: `Голос(Повтор перекладу)(${toLanguage}):`,
                  lang: toLanguage,
                  open: openTrans2Voice,
                  setOpen: setOpenTrans2Voice,
                  value: transVoice2,
                  setValue: setTransVoice2,
                  modalTitle: 'Оберіть голос повтору перекладу',
                },
              ].map(
                ({label, lang, open, setOpen, value, setValue, modalTitle}) => (
                  <View key={label} style={styles.inputContainerCol}>
                    <Text
                      style={[
                        styles.sectionHeadText,
                        {color: cSectionHeadText},
                      ]}>
                      {label}
                    </Text>
                    <DropDownPicker
                      open={open}
                      setOpen={setOpen}
                      value={value}
                      setValue={setValue}
                      //   items={availableVoices
                      //     .filter(v => v.language === lang)
                      //     .map(v => ({label: v.name, value: v.id}))}
                      items={availableVoices
                        .filter(
                          v =>
                            v.language.toLowerCase().replace('_', '-') ===
                            lang.toLowerCase().replace('_', '-'),
                        )
                        .map(v => ({label: v.name, value: v.id}))}
                      placeholder={
                        availableVoices.some(v => v.language === lang)
                          ? 'Оберіть голос'
                          : 'Голоси недоступні'
                      }
                      style={{backgroundColor: cInputBg}}
                      textStyle={{color: cInputOn}}
                      listMode="MODAL"
                      modalTitle={modalTitle}
                    />
                    <TouchableOpacity
                      onPress={() => playTest(value)}
                      style={styles.testButton}>
                      <Text>🔊 Прослухати</Text>
                    </TouchableOpacity>
                  </View>
                ),
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonsContainer}>
            {hasChanges ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {backgroundColor: cBtnBg, borderColor: cBtnBorder},
                  ]}
                  onPress={handleSave}>
                  <AntDesign name="save" color={cIcon} size={20} />
                  <Text style={[styles.btnText, {color: cBtnText}]}>
                    Зберегти
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {backgroundColor: cBtnBg, borderColor: cBtnBorder},
                  ]}
                  onPress={onClose}>
                  <AntDesign name="close" color={cIcon} size={20} />
                  <Text style={[styles.btnText, {color: cBtnText}]}>
                    Вийти без збереження
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: cBtnBg, borderColor: cBtnBorder},
                ]}
                onPress={onClose}>
                <AntDesign name="close" color={cIcon} size={20} />
                <Text style={[styles.btnText, {color: cBtnText}]}>Вийти</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  modalView: {
    position: 'absolute', // ← додати
    bottom: 5, // ← замість justifyContent у centeredView
    width: '95%',
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'center',
    height: '95%',
    marginBottom: 5,
  },
  modalHeadText: {
    alignSelf: 'center',
    // marginBottom: 3,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionHeadText: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  settingsContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  inputContainerCol: {
    top: 5,
    marginBottom: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
    // alignItems: 'flex-start',
    paddingHorizontal: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  input: {
    padding: 3,
    textAlign: 'center',
  },
  picker: {
    height: 60,
    fontSize: 10,
    width: '50%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginVertical: 5,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 16,
    gap: 10,
  },
  btnText: {
    fontFamily: 'Poppins-SemiBold',
  },
});

export default ListenWordsSettingsModal;
