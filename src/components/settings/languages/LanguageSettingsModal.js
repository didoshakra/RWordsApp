//LanguageSettingsModal.js//Налаштування голосів запису слів з інтернет
//Modal Для голосі Azure(темп/)
// Остап (Чоловічий)'/Поліна (Жіночий)',
// Швидкість (Rate)/"Висота (Pitch)/"Пауза між рядками (ms)"

import React, {useState, useContext} from 'react';
import {AZURE_KEY as DEFAULT_AZURE_KEY} from '@/config/secrets';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  ToastAndroid,
  Alert,
  Switch,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DropDownPicker from 'react-native-dropdown-picker';
import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';

import {SettingsContext} from '@/context/SettingsContext';
import {ThemeContext} from '@/context/ThemeContext';
import {LanguagePickers} from './LanguagePickers';

const azureVoices = [
  {label: 'Остап (Чоловічий)', value: 'uk-UA-OstapNeural'},
  {label: 'Поліна (Жіночий)', value: 'uk-UA-PolinaNeural'},
];
const LanguageSettingsModal = ({pcBg = 'transparent', pcOn = 'gray'}) => {
  const [isVisible, setIsVisible] = useState(false);
  const {settings, setSettings} = useContext(SettingsContext);
  const {sizes, getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(0);

  const cPageHeadText = scheme.pageOn;
  const cModalViewBG = scheme.modalBg;
  const cModalViewBorder = scheme.border;
  const cSectionHeadText = scheme.modalOn;
  const cInputBg = scheme.inputBg;
  const cInputOn = scheme.inputOn;
  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;

  // Azure states
  const [fromLanguage, setFromLanguage] = useState(
    settings?.fromLanguage ?? 'uk-UA',
  );
  const [toLanguage, setToLanguage] = useState(settings?.toLanguage ?? 'en-GB');
  const [azureVoice, setAzureVoice] = useState(
    settings?.azureVoice ?? 'uk-UA-OstapNeural',
  );
  const [azureRate, setAzureRate] = useState(settings?.azureRate ?? '0%');
  const [azurePitch, setAzurePitch] = useState(settings?.azurePitch ?? '0%');
  const [azureBreak, setAzureBreak] = useState(settings?.azureBreak ?? 1000);
  const [openAzure, setOpenAzure] = useState(false);

  // Нові states
  const [voiceNet, setVoiceNet] = useState(settings?.voiceNet ?? false);
  const [reversImportCSV, setReversImportCSV] = useState(
    settings?.reversImportCSV ?? false,
  );
  const [reversTranslate, setReversTranslate] = useState(
    settings?.reversTranslate ?? false,
  );

  const adjustPercent = (val, setter, delta) => {
    const num = parseInt(val) || 0;
    setter(`${num + delta}%`);
  };

  const adjustBreak = delta => {
    setAzureBreak(prev => Math.max(0, prev + delta));
  };

  const testAzureVoice = async () => {
    try {
      const AZURE_KEY = settings?.azureKey || DEFAULT_AZURE_KEY;
      const url = `https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1`;
      const ssml = `<speak version='1.0' xml:lang='uk-UA'><voice name='${azureVoice}'><prosody rate='${azureRate}' pitch='${azurePitch}'>Ви слухаєте тест голосу.<break time='${azureBreak}ms'/>Наступний розділ.</prosody></voice></speak>`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        },
        body: ssml,
      });
      const arrayBuffer = await response.arrayBuffer();
      const tempPath = `${RNFS.CachesDirectoryPath}/azure_test.mp3`;
      await RNFS.writeFile(
        tempPath,
        Buffer.from(arrayBuffer).toString('base64'),
        'base64',
      );
      const sound = new Sound(tempPath, '', err => {
        if (!err) sound.play(() => sound.release());
      });
    } catch (e) {
      Alert.alert('Помилка', e.message);
    }
  };

  const handleSave = () => {
    setSettings(prev => ({
      ...prev,
      fromLanguage,
      toLanguage,
      azureVoice,
      azureRate,
      azurePitch,
      azureBreak,
      voiceNet,
      reversImportCSV,
      reversTranslate,
    }));
    setIsVisible(false);
    ToastAndroid.show('Збережено', ToastAndroid.SHORT);
  };

  const StepperRow = ({label, value, onMinus, onPlus}) => (
    <View style={styles.controlRow}>
      <Text style={[styles.label, {color: cSectionHeadText}]}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          onPress={onMinus}
          style={[styles.stepBtn, {backgroundColor: cBtnBg}]}>
          <AntDesign name="minus" color={cBtnText} size={20} />
        </TouchableOpacity>
        <View style={[styles.valueBox, {backgroundColor: cInputBg}]}>
          <Text style={{color: cInputOn}}>{value}</Text>
        </View>
        <TouchableOpacity
          onPress={onPlus}
          style={[styles.stepBtn, {backgroundColor: cBtnBg}]}>
          <AntDesign name="plus" color={cBtnText} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const SwitchRow = ({label, value, onChange, text}) => (
    <View style={styles.switchRow}>
      <Text style={[styles.label, {color: cSectionHeadText}]}>{label}</Text>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
        <Switch value={value} onValueChange={onChange} />
        <Text style={{color: cSectionHeadText}}>{text}</Text>
      </View>
    </View>
  );

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
              Налаштування списку слів
            </Text>

            <ScrollView contentContainerStyle={{paddingBottom: 20}}>
              {/* Секція: Імпорт і переклад */}
              <Text style={[styles.subHead, {color: cSectionHeadText}]}>
                Імпорт і переклад:
              </Text>
              <SwitchRow
                label="Реверсний імпорт:"
                value={reversImportCSV}
                onChange={setReversImportCSV}
                text={reversImportCSV ? '✅' : '❌'}
              />
              <SwitchRow
                label="Реверсний переклад:"
                value={reversTranslate}
                onChange={setReversTranslate}
                text={reversTranslate ? '✅' : '❌'}
              />

              <View style={styles.separator} />

              {/* Секція: Озвучка запису */}
              <Text style={[styles.subHead, {color: cSectionHeadText}]}>
                Озвучка для запису:
              </Text>
              <SwitchRow
                label="Джерело:"
                value={voiceNet}
                onChange={setVoiceNet}
                text={voiceNet ? '🌐 Інтернет' : '📵 Автономно'}
              />

              <View style={styles.separator} />

              {/* Секція: Azure */}
              <Text style={[styles.subHead, {color: cSectionHeadText}]}>
                Параметри Azure:
              </Text>
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
              <Text
                style={[styles.label, {color: cSectionHeadText, marginTop: 8}]}>
                Голос:
              </Text>
              <DropDownPicker
                open={openAzure}
                value={azureVoice}
                items={azureVoices}
                setOpen={setOpenAzure}
                setValue={setAzureVoice}
                listMode="MODAL"
                style={{backgroundColor: cInputBg}}
                textStyle={{color: cInputOn}}
              />
              <StepperRow
                label="Швидкість (Rate):"
                value={azureRate}
                onMinus={() => adjustPercent(azureRate, setAzureRate, -5)}
                onPlus={() => adjustPercent(azureRate, setAzureRate, 5)}
              />
              <StepperRow
                label="Висота (Pitch):"
                value={azurePitch}
                onMinus={() => adjustPercent(azurePitch, setAzurePitch, -2)}
                onPlus={() => adjustPercent(azurePitch, setAzurePitch, 2)}
              />
              <StepperRow
                label="Пауза між рядками (ms):"
                value={azureBreak}
                onMinus={() => adjustBreak(-250)}
                onPlus={() => adjustBreak(250)}
              />
              <TouchableOpacity
                style={[styles.testButton, {backgroundColor: cBtnBg}]}
                onPress={testAzureVoice}>
                <Text style={{color: cBtnText, fontWeight: 'bold'}}>
                  🔊 Прослухати результат
                </Text>
              </TouchableOpacity>
            </ScrollView>

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

      <TouchableOpacity
        onPress={() => setIsVisible(true)}
        style={styles.iconContainer}>
        <MaterialIcons
          name={'settings'}
          color={pcOn || 'gray'}
          size={sizes.sIcon || 32}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {flex: 1, backgroundColor: 'rgba(0,0,0,0.3)'},
  modalView: {
    width: '95%',
    height: '92%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 10,
  },
  modalHeadText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subHead: {fontSize: 14, fontWeight: 'bold', marginBottom: 5, marginTop: 10},
  separator: {height: 1, backgroundColor: '#ccc', marginVertical: 10},
  controlRow: {flexDirection: 'row', alignItems: 'center', marginTop: 12},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  label: {flex: 1, fontSize: 14, fontWeight: '500'},
  stepper: {flexDirection: 'row', alignItems: 'center', gap: 8},
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueBox: {
    width: 70,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  testButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    paddingVertical: 10,
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
  iconContainer: {alignSelf: 'center'},
});

export default LanguageSettingsModal;
