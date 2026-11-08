// screens/LessonsListScreen.js
//
// Список уроків для СТУДЕНТА (не адмінка). Рівні тепер беруться
// з таблиці levels (а не хардкоджений масив), уроки — по level_id.
import React, {useState, useEffect, useContext, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {ThemeContext} from '@/context/ThemeContext';
import {SettingsContext} from '@/context/SettingsContext';
import {getAllLevels, getLessonsByLevelId} from '@/db/lessons/lessonsActions';

const LessonsListScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {getColorScheme, isDarkMode} = useContext(ThemeContext);
  const scheme = getColorScheme(1);

  const {settings, setSettings} = useContext(SettingsContext);
  const currentLessonId = settings?.currentLessonId || null;

  const [levels, setLevels] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);

  useEffect(() => {
    getAllLevels()
      .then(rows => {
        setLevels(rows);
        setSelectedLevelId(rows.length > 0 ? rows[0].id : null);
      })
      .finally(() => setLoadingLevels(false));
  }, []);

  const loadLessons = useCallback(() => {
    if (!selectedLevelId) {
      setLessons([]);
      return;
    }
    setLoadingLessons(true);
    getLessonsByLevelId(selectedLevelId)
      .then(setLessons)
      .finally(() => setLoadingLessons(false));
  }, [selectedLevelId]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  useFocusEffect(loadLessons);

  const openLesson = lesson => {
    setSettings(prev => ({...prev, currentLessonId: lesson.id}));
    navigation.navigate('LessonScreen', {lessonId: lesson.id});
  };

  const handleExit = () => navigation.goBack();

  const renderItem = ({item}) => {
    const isCurrent = item.id === currentLessonId;
    return (
      <TouchableOpacity
        style={[
          styles.row,
          {borderColor: scheme.cardBorder, backgroundColor: scheme.cardBg},
          isCurrent && {borderColor: '#ffd11a', borderWidth: 2},
        ]}
        onPress={() => openLesson(item)}
        activeOpacity={0.8}>
        <View style={styles.rowLeft}>
          <Text style={[styles.dayNumber, {color: scheme.headerOn}]}>
            {item.pn}
          </Text>
        </View>
        <View style={styles.rowMiddle}>
          <Text
            style={[styles.title, {color: scheme.pageOn}]}
            numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        {isCurrent && (
          <MaterialIcons name="play-circle-filled" size={24} color="#ffd11a" />
        )}
      </TouchableOpacity>
    );
  };

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
          <TouchableOpacity onPress={handleExit}>
            <Ionicons name="arrow-back" size={22} color={scheme.pageOn} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: scheme.pageOn}]}>
            Уроки
          </Text>
          <View style={{width: 22}} />
        </View>

        {loadingLevels ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={scheme.buttonBg} />
          </View>
        ) : levels.length === 0 ? (
          <View style={styles.center}>
            <Text style={{color: scheme.pageOn }}>Контенту ще нема.</Text>
          </View>
        ) : (
          <>
            <View style={styles.levelSwitch}>
              {levels.map(level => {
                const active = level.id === selectedLevelId;
                return (
                  <TouchableOpacity
                    key={level.id}
                    onPress={() => setSelectedLevelId(level.id)}
                    style={[
                      styles.levelBtn,
                      {borderColor: scheme.border},
                      active && {
                        backgroundColor: '#ffd11a',
                        borderColor: '#ffd11a',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.levelBtnText,
                        {color: active ? '#1a1a1a' : scheme.pageOn},
                      ]}>
                      {level.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {loadingLessons ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={scheme.buttonBg} />
              </View>
            ) : lessons.length === 0 ? (
              <View style={styles.center}>
                <Text style={{color: scheme.pageOn}}>
                  Уроків для цього рівня ще нема
                </Text>
              </View>
            ) : (
              <FlatList
                data={lessons}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default LessonsListScreen;

const styles = StyleSheet.create({
  pageContainer: {flex: 1, borderRadius: 15, borderWidth: 2, margin: '1%'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerTitle: {fontSize: 16, fontWeight: '600'},
  levelSwitch: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 10,
  },
  levelBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  levelBtnText: {fontSize: 14, fontWeight: '700'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  listContent: {paddingHorizontal: 14, paddingBottom: 20, gap: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  rowLeft: {width: 30, alignItems: 'center'},
  dayNumber: {fontSize: 15, fontWeight: '700'},
  rowMiddle: {flex: 1},
  title: {fontSize: 14, fontWeight: '500'},
});
