//screens/words/WordsMenu.js
// screens/WordsMenu.js
//
// Презентаційний компонент — лише вміст гілки isStarted=false з Words.js
// (меню перед стартом: голосові команди, налаштування прослуховування,
// вибір тем/фільтра, інфо про кількість слів). Без власного стану.
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import KnowFilterModal from '@/components/settings/listen_words/KnowFilterModal';
import TopicsModal from './TopicsModal';

const WordsMenu = ({
  setModalVisible,
  setIsSettingsModal,
  wordCount,
  untranslatedCount,
  translateWord,
  wordTypeFilter,
  cPageHeadOn,
  sPageHeadIcon,
  cLoadText,
  cErrorOn,
  cPageOn,
}) => {
  return (
    <>
      <View style={{marginTop: 16, marginLeft: 16, alignItems: 'flex-start'}}>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.menuItem}>
          <MaterialIcons name="settings-voice" color={cPageHeadOn} size={sPageHeadIcon} />
          <Text style={styles.menuText}>Голосові команди</Text>
          <Ionicons name="chevron-forward" size={20} color={cPageHeadOn} style={{marginLeft: 'auto'}} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSettingsModal(true)} style={styles.menuItem}>
          <Ionicons name="settings" color={cPageHeadOn} size={sPageHeadIcon} />
          <Text style={styles.menuText}>Режими прослуховування</Text>
          <Ionicons name="chevron-forward" size={20} color={cPageHeadOn} style={{marginLeft: 'auto'}} />
        </TouchableOpacity>
      </View>

      <View style={{flex: 1, marginTop: 5, paddingHorizontal: 20, textAlign: 'center'}}>
        <KnowFilterModal headerColor={cLoadText} />
        <TopicsModal headerColor={cLoadText} />
        <Text style={{color: cLoadText}}>🎯 Вибрано слів: {wordCount}</Text>
        {wordCount > 0 &&
          (!translateWord ? (
            <Text style={{color: cErrorOn}}>🎯 Без перекладу</Text>
          ) : (
            untranslatedCount > 0 && (
              <Text style={{color: cErrorOn}}>🎯 Є неперекладені тексти: {untranslatedCount}</Text>
            )
          ))}
        {wordTypeFilter.length > 0 && (
          <Text style={{color: cLoadText}}>🎯 Типи: {wordTypeFilter.join(', ')}</Text>
        )}
      </View>

      <View style={styles.startContaner}>
        <Text style={[styles.wordText, {color: cPageOn}]}>
          Щоб слухати,{' '}
          {wordCount > 0
            ? 'натисніть:'
            : wordCount === 0
            ? 'виберіть теми для прослуховування у налаштуваннях вище'
            : `перекладіть тексти вибраних тем у розділі "Слова", або виберіть інші теми`}
        </Text>
      </View>
    </>
  );
};

export default WordsMenu;

const styles = StyleSheet.create({
  startContaner: {
    flex: 1,
    marginTop: 5,
    textAlign: 'center',
    alignSelf: 'center',
  },
  wordText: {
    textAlign: 'center',
    fontSize: 26,
    fontFamily: 'Poppins-Regular ',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
    width: '100%',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 8,
  },
});
