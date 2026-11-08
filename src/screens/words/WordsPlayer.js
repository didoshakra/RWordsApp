//screen/words/WordsPlayer.js
// screens/WordsPlayer.js
//
// Презентаційний компонент — лише вміст гілки isStarted=true з Words.js.
// Жодної власної логіки/стану: всі дані та колбеки приходять пропсами
// з контейнера Words.js, який лишається єдиним власником стану,
// ефектів циклу, TTS та голосового керування.
import React from 'react';
import {View, Text, TouchableOpacity, Image, ScrollView, StyleSheet} from 'react-native';

const WordsPlayer = ({
  wordData,
  wordIndex,
  showImg,
// isImageDefault,
  imageSource,
  isDefault,
  getFontSize,
  handleCommand,
  showTranslation,
  reverseOrder,
  translateWord,
  cOutputBg,
  cOutputBorder,
  cPageOn,
  cKnownText,
}) => {
  const current = wordData[wordIndex];
  if (!current) return null;

  return (
    <>
      {showImg && !isDefault && (
        <View
          style={[
            styles.wordTextContainer,
            {flex: 1, backgroundColor: cOutputBg, borderColor: cOutputBorder},
          ]}>
          <Image source={imageSource} style={styles.wordImage} />
        </View>
      )}

      {/* Оригінал */}
      <TouchableOpacity
        onPress={() => handleCommand('know')}
        activeOpacity={0.8}
        style={{flex: 1}}>
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}
          showsVerticalScrollIndicator={true}>
          <View
            style={[
              styles.wordTextContainer,
              {flex: 1, backgroundColor: cOutputBg},
            ]}>
            <Text style={styles.cardBadgeLeft}>✅</Text>
            <Text
              style={[
                styles.wordText,
                {
                  color: current.know === 1 ? cKnownText : cPageOn,
                  fontSize: getFontSize(current.word || ''),
                },
              ]}>
              {reverseOrder ? current.translation || '' : current.word || ''}
            </Text>
          </View>
        </ScrollView>
      </TouchableOpacity>

      {/* Переклад */}
      {translateWord && (
        <TouchableOpacity
          onPress={() => handleCommand('dont_know')}
          activeOpacity={0.8}
          style={{flex: 1}}>
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}
            showsVerticalScrollIndicator={true}>
            <View
              style={[
                styles.wordTextContainer,
                {flex: 1, backgroundColor: cOutputBg},
              ]}>
              <Text style={styles.cardBadgeLeft}>❌</Text>
              {showTranslation ? (
                <Text
                  style={[
                    styles.wordText,
                    {color: cPageOn, fontSize: getFontSize(current.word || '')},
                  ]}>
                  {reverseOrder
                    ? current.word || ''
                    : current.translation || ''}
                </Text>
              ) : (
                <Text style={[styles.wordText, {color: cPageOn, fontSize: 36}]}>
                  ?
                </Text>
              )}
            </View>
          </ScrollView>
        </TouchableOpacity>
      )}
    </>
  );
};

export default WordsPlayer;

const styles = StyleSheet.create({
  wordImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 30,
  },
  wordTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 30,
    overflow: 'hidden',
  },
  wordText: {
    textAlign: 'center',
    fontSize: 26,
    fontFamily: 'Poppins-Regular ',
  },
  cardBadgeLeft: {
    position: 'absolute',
    top: 8,
    left: 12,
    fontSize: 18,
    zIndex: 10,
  },
});