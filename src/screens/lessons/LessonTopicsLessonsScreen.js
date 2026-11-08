// screens/LessonTopicsLessonsScreen.js
//
// Другий екран адмін-потоку: уроки обраного рівня (route.params.levelId).
// Тап на урок відкриває третій екран — прив'язку тем.
import React, {useState, useCallback} from 'react';
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
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {useContext} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {ThemeContext} from '@/context/ThemeContext';
import {getLessonsByLevelId} from '@/db/lessons/lessonsActions';

const LessonTopicsLessonsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const {levelId, levelName} = route.params;
  const {getColorScheme, isDarkMode} = useContext(ThemeContext);
  const scheme = getColorScheme(1);

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLessons = useCallback(() => {
    setLoading(true);
    getLessonsByLevelId(levelId)
      .then(setLessons)
      .finally(() => setLoading(false));
  }, [levelId]);

  useFocusEffect(loadLessons);

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
          <Text style={[styles.headerTitle, {color: scheme.pageOn}]}>
            Уроки {levelName}
          </Text>
          <View style={{width: 22}} />
        </View>

        {loading ? (
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
            contentContainerStyle={{padding: 14, gap: 8}}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.lessonCard,
                  {
                    borderColor: scheme.cardBorder,
                    backgroundColor: scheme.cardBg,
                  },
                ]}
                onPress={() =>
                  navigation.navigate('LessonTopicsBindScreen', {
                    lessonPn:item.pn,
                    lessonId: item.id,
                    lessonTitle: item.title,
                  })
                }>
                <Text style={[styles.pnText, {color: scheme.pageOn}]}>
                  {item.pn}
                </Text>
                <Text
                  style={[styles.titleText, {color: scheme.pageOn}]}
                  numberOfLines={1}>
                  {item.title}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={scheme.pageOn}
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default LessonTopicsLessonsScreen;

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
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  pnText: {fontSize: 15, fontWeight: '700', width: 26},
  titleText: {fontSize: 14, flex: 1},
});
