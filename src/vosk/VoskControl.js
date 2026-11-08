//VoskControl.js/Робоча з Words
//GPT

import {useState, useEffect, useRef, useCallback, useContext} from 'react';
import Vosk from 'react-native-vosk';
import {SettingsContext} from '@/context/SettingsContext';
import {defaultVoskCommands} from '@/vosk/defaultVoskCommands';

export const useVoskControl = (handleVoice, modalVisible) => {
  const {voiceCommands, setVoiceCommands} = useContext(SettingsContext);

  const commands = voiceCommands || defaultVoskCommands;
  const setCommands = setVoiceCommands; // Ось тут просто присвоюємо
  const [isLoadModel, setIsLoadModel] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false); //розпізнавання голосу
  const [result, setResult] = useState('Голос'); //Розпізнане слово
  const vosk = useRef(new Vosk()).current;

  const loadModel = useCallback(() => {
    vosk
      .loadModel('model-uk-uk')
      .then(() => setIsLoadModel(true))
      .catch(e => console.log('error', e));
  }, [vosk]);

  const unloadModel = useCallback(() => {
    vosk.unload();
    setIsLoadModel(false);
    setIsRecognizing(false);
  }, [vosk]);


  const record = async () => {
    try {
      await vosk.start();
      console.log('Початок розпізнавання...');
      setIsRecognizing(true);
      setResult('Cлухаю');
    } catch (e) {
      console.error(e);
    }
  };

  const stopVoice = async () => {
    try {
      await vosk.stop();
      console.log('Зупинка розпізнавання...');
      setIsRecognizing(false);
      setResult('Не слухаю');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadModel();
    return () => {
      unloadModel();
    };
  }, [loadModel, unloadModel]);

  useEffect(() => {
    const resultEvent = vosk.onResult(res => {
      console.log('***VoiceControl/resultEvent/СЛОВО: ' + res);
      setResult(prev => (prev !== res ? res : prev)); //GPT-Не рендериться якщо змінна не змінилася
      if (!res) return;

      const text = res.toLowerCase();

      if (!modalVisible && typeof handleVoice === 'function') {
        let matched = false;
        for (const [command, keywords] of Object.entries(commands)) {
          if (keywords.some(keyword => text.includes(keyword))) {
            console.log('***VoiceControl/Команда знайдена: ' + command);
            handleVoice(command);
            matched = true;
            setTimeout(() => setResult('Cлухаю'), 1000);
            break;
          }
        }
        if (!matched) {
          console.log('***VoiceControl/Жодна команда не знайдена для:', text);
        }
      }
    });

    const errorEvent = vosk.onError(e => {
      console.error('VoiceControl/ErrorEvent: ', e);
    });

    return () => {
      resultEvent.remove();
      errorEvent.remove();
    };
  }, [vosk, commands, modalVisible, handleVoice]);

  return {
    loadModel,
    unloadModel,
    record,
    stopVoice,
    result,
    setResult,
    isRecognizing,
    isLoadModel,
    commands,
    setCommands,
  };
};
