// AppWebView.js//Після експорту даних на WEB
//Працює завантаження слів

import React, {useRef, useState} from 'react';
import {View, Alert, ActivityIndicator} from 'react-native';
import {WebView} from 'react-native-webview';
import {importJSON} from './importJSON'; // твоя функція імпорту JSON у SQLite

export default function AppWebView({selectedWords, topicName, onClose}) {
  const webviewRef = useRef(null);

  // Якщо є слова для експорту — це export-потік (потрібна авторизація)
  // Якщо слів нема (звичайний вхід через меню/бот-бар) — import-потік (авторизація не потрібна)
  const isExport = Array.isArray(selectedWords) && selectedWords.length > 0;
  // Простий перегляд — звичайна головна сторінка сайту, без auth і без обміну повідомленнями
  const siteUrl = isExport
    ? 'https://rwords.vercel.app/auth/app?flow=export'
    : 'https://rwords.vercel.app/';

  const sendToWeb = typeAndPayload => {
    const msg = JSON.stringify(typeAndPayload);
    webviewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: ${JSON.stringify(msg)}
      }));
      true;
    `);
  };

  const handleMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        // Сайт підтвердив авторизацію → надсилаємо слова (RN -> WEB, експорт з додатку)
        case 'rwords-auth-ok': {
          sendToWeb({
            type: 'rwords-app-to-site', // ⚠️ перейменовано, щоб не плутати з веб->app напрямком
            payload: {
              words: selectedWords,
              topicName: topicName,
            },  
          });
          break;
        }

        // НОВЕ: сайт надсилає теми/слова для імпорту в локальну SQLite (WEB -> RN)
        case 'rwords-export': {
          if (!data.payload) {
            console.error('rwords-export: payload відсутній', data);
            break;
          }
          importJSON(
            data.payload,
            count => {
              sendToWeb({type: 'rwords-done', count});
              Alert.alert(
                'Готово!',
                `Імпортовано ${count} слів у розділ «З додатку»`,
                [{text: 'OK', onPress: onClose}],
              );
            },
            err => {
              sendToWeb({
                type: 'rwords-error',
                message: String(err?.message || err),
              });
              Alert.alert('Помилка', 'Не вдалося імпортувати слова у додаток');
            },
          );
          break;
        }

        // Імпорт завершено (підтвердження від сайту після rwords-app-export)
        case 'rwords-done': {
          Alert.alert(
            'Готово!',
            `Імпортовано ${data.count} слів у розділ «З додатку»`,
            [{text: 'OK', onPress: onClose}],
          );
          break;
        }

        // Помилка
        case 'rwords-error': {
          Alert.alert('Помилка', data.message || 'Щось пішло не так');
          break;
        }
      }
    } catch (err) {
      console.error('WebView message error:', err);
    }
  };

  return (
    <View style={{flex: 1}}>
      <WebView
        ref={webviewRef}
        source={{uri: siteUrl}}
        userAgent="RWords/1.0.0 (ReactNative)"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
      />
    </View>
  );
}