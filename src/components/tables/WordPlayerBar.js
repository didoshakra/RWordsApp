// WordPlayerBar.js
// Компактна панель відтворення слів для TableViewLevels.
// Показується коли є вибрані рядки (selectedWords).

// WordPlayerBar.js
import React, {useContext,useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {ThemeContext} from '@/context/ThemeContext';
import {SettingsContext} from '@/context/SettingsContext';
import {useWordPlayer} from '@/hooks/useWordPlayer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ListenWordsSettingsModal from '@/components/settings/listen_words/ListenWordsSettingsModal';


const WordPlayerBar = ({selectedWords, indexScheme, onClose}) => {
  const {getColorScheme} = useContext(ThemeContext);
  const {settings} = useContext(SettingsContext);

  const scheme   = getColorScheme(indexScheme);
  const cBg      = scheme.cardBg    ?? '#f0f0f0';
  const cOn      = scheme.cardOn    ?? '#222';
  const cBtnBg   = scheme.buttonBg  ?? '#ddd';
  const cBtnOn   = scheme.buttonOn  ?? '#222';
  const cBorder  = scheme.border    ?? '#ccc';
  const cInputBg = scheme.inputBg   ?? '#fff';
  const [isSettingsModal, setIsSettingsModal] = useState(false);

  const translateWord = settings?.translateWord ?? true;
  const reverseOrder  = settings?.reverseOrder  ?? false;

  const {
    wordIndex,
    isStarted,
    isRunning,
    currentWord,
    showTranslation,
    playerCommand,
  } = useWordPlayer(selectedWords, settings);

  const getFontSize = text => {
    if (!text) return 26;
    const wc = text.trim().split(/\s+/).length;
    if (wc >= 10) return 18;
    if (wc <= 3) return 34;
    return 22;
  };

  const buttons = [
    {cmd: 'start',                       icon: 'replay',       label: 'Почати', visible: !isStarted},
    {cmd: isRunning ? 'stop' : 'resume', icon: isRunning ? 'stop' : 'play-arrow', label: isRunning ? 'Стоп' : 'Старт', visible: isStarted},
    {cmd: 'repeat', icon: 'repeat-one',  label: 'Повтор',  visible: isStarted},
    {cmd: 'back',   icon: 'skip-previous', label: 'Назад', visible: isStarted},
    {cmd: 'next',   icon: 'skip-next',   label: 'Далі',    visible: isStarted},
  ];

  return (
    <View
      style={[styles.container, {backgroundColor: cBg, borderColor: cBorder}]}>
      {/* Шапка: лічильник + назва теми + закрити */}
      <View style={styles.header}>
        <Text style={[styles.counter, {color: cOn}]}>
          {isStarted
            ? `${wordIndex + 1} / ${selectedWords.length}`
            : `▶ ${selectedWords.length} сл.`}
        </Text>
        {isStarted && currentWord?.topic_name && (
          <Text style={[styles.topicText, {color: cOn}]} numberOfLines={1}>
            {currentWord.topic_name}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => setIsSettingsModal(true)}
          style={styles.closeBtn}>
          <Ionicons name="settings" size={20} color={cOn} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            playerCommand('reset');
            onClose?.();
          }}
          style={styles.closeBtn}>
          <MaterialIcons name="close" size={20} color={cOn} />
        </TouchableOpacity>
      </View>

      {/* Картки слів */}
      {isStarted && currentWord ? (
        <View style={styles.cardsRow}>
          {/* Оригінал */}
          <View
            style={[
              styles.card,
              {backgroundColor: cInputBg, borderColor: cBorder},
            ]}>
            <Text style={styles.cardBadge}>✅</Text>
            <ScrollView contentContainerStyle={styles.cardContent}>
              <Text
                style={[
                  styles.cardText,
                  {color: cOn, fontSize: getFontSize(currentWord.word)},
                ]}>
                {reverseOrder
                  ? currentWord.translation ?? ''
                  : currentWord.word ?? ''}
              </Text>
            </ScrollView>
          </View>

          {/* Переклад */}
          {translateWord && (
            <View
              style={[
                styles.card,
                {backgroundColor: cInputBg, borderColor: cBorder},
              ]}>
              <Text style={styles.cardBadge}>❌</Text>
              <ScrollView contentContainerStyle={styles.cardContent}>
                {showTranslation ? (
                  <Text
                    style={[
                      styles.cardText,
                      {
                        color: cOn,
                        fontSize: getFontSize(currentWord.translation),
                      },
                    ]}>
                    {reverseOrder
                      ? currentWord.word ?? ''
                      : currentWord.translation ?? ''}
                  </Text>
                ) : (
                  <Text style={[styles.cardText, {color: cOn, fontSize: 30}]}>
                    ?
                  </Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.hintRow}>
          <Text style={[styles.hintText, {color: cOn}]}>
            Натисніть «Почати» для озвучки
          </Text>
        </View>
      )}

      {/* Кнопки керування */}
      <View style={styles.btnRow}>
        {buttons
          .filter(b => b.visible)
          .map(b => (
            <TouchableOpacity
              key={b.cmd}
              onPress={() => playerCommand(b.cmd)}
              style={[
                styles.btn,
                {backgroundColor: cBtnBg, borderColor: cBorder},
              ]}>
              <MaterialIcons name={b.icon} size={20} color={cBtnOn} />
              <Text style={[styles.btnLabel, {color: cBtnOn}]}>{b.label}</Text>
            </TouchableOpacity>
          ))}
      </View>
      <ListenWordsSettingsModal
        isVisible={isSettingsModal}
        onClose={() => setIsSettingsModal(false)}
      />
    </View>
  );
};

export default WordPlayerBar;

const styles = StyleSheet.create({
  container: {
    flex: 1, // ← додати
    borderTopWidth: 1,
    borderRadius: 10,
    margin: 6,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  counter: {
    fontWeight: 'bold',
    fontSize: 13,
    minWidth: 55,
  },
  topicText: {
    flex: 1,
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  cardsRow: {
    // flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flex: 1, // ← замість height: 100
  },
  card: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBadge: {
    position: 'absolute',
    top: 4,
    left: 8,
    fontSize: 14,
    zIndex: 10,
  },
  cardContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  cardText: {
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  hintRow: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    opacity: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  btnLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
});