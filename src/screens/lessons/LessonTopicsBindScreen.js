// screens/LessonTopicsBindScreen.js
//
// Третій екран адмін-потоку: прив'язані теми обраного уроку
// (route.params.lessonId). "+ Додати тему" відкриває модалку
// з усіма темами, згрупованими по секціях.
//
// Тап на назву теми (в обох списках — прив'язаних і в модалці
// вибору) розкриває акордеоном список слів цієї теми — щоб не
// прив'язувати наосліп, не бачачи вмісту.
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {useContext} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {ThemeContext} from '@/context/ThemeContext';
import {
  getLessonTopics,
  removeTopicFromLesson,
  addTopicToLesson,
  getAllTopicsGrouped,
  getWordsByTopicId,
} from '@/db/lessons/lessonsActions';

const TYPE_LABELS = {word: '', phrase: '', sentence: '', text: '📄 '};

const LessonTopicsBindScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const {lessonId, lessonTitle} = route.params;
  const {getColorScheme, isDarkMode} = useContext(ThemeContext);
  const scheme = getColorScheme(1);

  const [boundTopics, setBoundTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [allTopics, setAllTopics] = useState([]);

  // Спільні для обох списків — розкриті теми і кеш слів
  const [expandedTopics, setExpandedTopics] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [wordsCache, setWordsCache] = useState({});
  const [loadingWordsFor, setLoadingWordsFor] = useState(null);

  const loadBound = useCallback(() => {
    setLoading(true);
    getLessonTopics(lessonId)
      .then(setBoundTopics)
      .finally(() => setLoading(false));
  }, [lessonId]);

  useFocusEffect(loadBound);

  const openPicker = () => {
    getAllTopicsGrouped().then(setAllTopics);
    setPickerVisible(true);
  };

  const handleAdd = async topicId => {
    await addTopicToLesson(lessonId, topicId, 0);
    setPickerVisible(false);
    loadBound();
  };

  const handleRemove = async topicId => {
    await removeTopicFromLesson(lessonId, topicId);
    loadBound();
  };
const toggleSection = sectionName => {
  setExpandedSections(prev => ({...prev, [sectionName]: !prev[sectionName]}));
};
  const toggleExpand = async topicId => {
    const isExpanded = !!expandedTopics[topicId];
    setExpandedTopics(prev => ({...prev, [topicId]: !isExpanded}));

    if (!isExpanded && !wordsCache[topicId]) {
      setLoadingWordsFor(topicId);
      const words = await getWordsByTopicId(topicId);
      setWordsCache(prev => ({...prev, [topicId]: words}));
      setLoadingWordsFor(null);
    }
  };

  const renderWordsList = topicId => {
    const words = wordsCache[topicId];
    if (loadingWordsFor === topicId) {
      return (
        <View style={styles.wordsBox}>
          <ActivityIndicator size="small" color={scheme.pageOn} />
        </View>
      );
    }
    if (!words) return null;
    if (words.length === 0) {
      return (
        <View style={styles.wordsBox}>
          <Text style={{color: scheme.pageOn, opacity: 0.6, fontSize: 12}}>
            Тема порожня
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.wordsBox}>
        {words.map(w => (
          <Text
            key={w.id}
            style={{color: scheme.pageOn, fontSize: 13, marginBottom: 2}}
            numberOfLines={1}>
            {TYPE_LABELS[w.type] ?? ''}
            {w.word} — {w.translation}
          </Text>
        ))}
      </View>
    );
  };

  const boundIds = new Set(boundTopics.map(t => t.topic_id));
  const grouped = allTopics.reduce((acc, t) => {
    if (!acc[t.section_name]) acc[t.section_name] = [];
    acc[t.section_name].push(t);
    return acc;
  }, {});

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: scheme.pageBg,
      }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={scheme.pageBg}
      />
      <View
        style={[
          styles.pageContainer,
          {backgroundColor: scheme.cardBg, borderColor: scheme.cardBorder},
        ]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={scheme.pageOn} />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, {color: scheme.pageOn}]}
            numberOfLines={1}>
            {lessonTitle}
          </Text>
          <View style={{width: 22}} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={scheme.buttonBg} />
          </View>
        ) : (
          <FlatList
            data={boundTopics}
            keyExtractor={item => String(item.topic_id)}
            contentContainerStyle={{padding: 14, gap: 8, paddingBottom: 80}}
            ListEmptyComponent={
              <Text
                style={{
                  color: scheme.pageOn,
                  opacity: 0.6,
                  textAlign: 'center',
                  marginTop: 20,
                }}>
                Немає прив'язаних тем
              </Text>
            }
            renderItem={({item}) => {
              const isExpanded = !!expandedTopics[item.topic_id];
              return (
                <View
                  style={[
                    styles.topicCard,
                    {
                      borderColor: scheme.cardBorder,
                      backgroundColor: scheme.cardBg,
                    },
                  ]}>
                  <View style={styles.topicRow}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                      onPress={() => toggleExpand(item.topic_id)}>
                      <Ionicons
                        name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                        size={16}
                        color={scheme.pageOn}
                        style={{marginRight: 6}}
                      />
                      <Text
                        style={{color: scheme.pageOn, flex: 1}}
                        numberOfLines={1}>
                        {item.topic_name}{' '}
                        <Text style={{opacity: 0.5, fontSize: 12}}>
                          ({item.section_name})
                        </Text>
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemove(item.topic_id)}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <MaterialIcons
                        name="close"
                        size={20}
                        color={scheme.pageOn}
                      />
                    </TouchableOpacity>
                  </View>
                  {isExpanded && renderWordsList(item.topic_id)}
                </View>
              );
            }}
          />
        )}

        <TouchableOpacity
          style={[styles.addBtn, {backgroundColor: '#ffd11a'}]}
          onPress={openPicker}>
          <MaterialIcons name="add" size={20} color="#1a1a1a" />
          <Text style={styles.addBtnText}>Додати тему</Text>
        </TouchableOpacity>
      </View>

      {/* Модалка вибору теми */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}>
        <Pressable
          style={styles.overlay}
          onPress={() => setPickerVisible(false)}>
          <View style={[styles.sheet, {backgroundColor: scheme.cardBg}]}>
            <View style={styles.sheetHeader}>
              <Text
                style={{color: scheme.pageOn, fontSize: 16, fontWeight: '600'}}>
                Оберіть тему
              </Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <MaterialIcons name="close" size={22} color={scheme.pageOn} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: 450}}>
              {Object.entries(grouped).map(([sectionName, topics]) => {
                const sectionExpanded = !!expandedSections[sectionName];
                return (
                  <View key={sectionName} style={{marginBottom: 10}}>
                    <TouchableOpacity
                      style={styles.sectionHeaderRow}
                      onPress={() => toggleSection(sectionName)}>
                      <Ionicons
                        name={
                          sectionExpanded ? 'chevron-down' : 'chevron-forward'
                        }
                        size={14}
                        color={scheme.pageOn}
                        style={{marginRight: 4}}
                      />
                      <Text
                        style={{
                          color: scheme.pageOn,
                          opacity: 0.8,
                          fontSize: 13,
                          fontWeight: '600',
                        }}>
                        {sectionName} ({topics.length})
                      </Text>
                    </TouchableOpacity>
                    {sectionExpanded &&
                      topics.map(t => {
                        const bound = boundIds.has(t.topic_id);
                        const isExpanded = !!expandedTopics[t.topic_id];
                        return (
                          <View
                            key={t.topic_id}
                            style={[
                              styles.pickerCard,
                              {borderColor: scheme.cardBorder},
                              bound && {opacity: 0.4},
                            ]}>
                            <View style={styles.topicRow}>
                              <TouchableOpacity
                                style={{
                                  flex: 1,
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}
                                onPress={() => toggleExpand(t.topic_id)}>
                                <Ionicons
                                  name={
                                    isExpanded
                                      ? 'chevron-down'
                                      : 'chevron-forward'
                                  }
                                  size={16}
                                  color={scheme.pageOn}
                                  style={{marginRight: 6}}
                                />
                                <Text
                                  style={{color: scheme.pageOn, flex: 1}}
                                  numberOfLines={1}>
                                  {t.topic_name}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                disabled={bound}
                                onPress={() => handleAdd(t.topic_id)}
                                hitSlop={{
                                  top: 8,
                                  bottom: 8,
                                  left: 8,
                                  right: 8,
                                }}>
                                {bound ? (
                                  <MaterialIcons
                                    name="check"
                                    size={18}
                                    color="#ffd11a"
                                  />
                                ) : (
                                  <MaterialIcons
                                    name="add"
                                    size={18}
                                    color={scheme.pageOn}
                                  />
                                )}
                              </TouchableOpacity>
                            </View>
                            {isExpanded && renderWordsList(t.topic_id)}
                          </View>
                        );
                      })}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default LessonTopicsBindScreen;

const styles = StyleSheet.create({
  pageContainer: {flex: 1, borderRadius: 15, borderWidth: 2, margin: '1%'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginHorizontal: 8,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 2,
  },
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  topicCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  topicRow: {flexDirection: 'row', alignItems: 'center'},
  wordsBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
    paddingLeft: 22,
  },
  addBtn: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 100,
    paddingVertical: 12,
  },
  addBtnText: {color: '#1a1a1a', fontWeight: '700'},
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16},
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  pickerCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
  },
});
