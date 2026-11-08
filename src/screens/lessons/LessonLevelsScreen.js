// screens/LessonLevelsScreen.js
//
// Перший екран трирівневого адмін-потоку "Контент уроків".
// Показує рівні (з таблиці levels), тап відкриває уроки цього рівня.
// CRUD рівнів свідомо відкладений — рівні створюються автоматично
// при імпорті CSV (кнопка зверху).
import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useContext} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {ThemeContext} from '@/context/ThemeContext';
import {
  getAllLevels,
  deleteLevel,
  getLessonsCountByLevelId,
} from '@/db/lessons/lessonsActions';
import {importLessonsCSV} from '@/db/lessons/importLessonsCSV';

const LessonLevelsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {getColorScheme, isDarkMode} = useContext(ThemeContext);
  const scheme = getColorScheme(1);

  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const loadLevels = useCallback(() => {
    setLoading(true);
    getAllLevels()
      .then(setLevels)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadLevels);

  const handleImport = async () => {
    setImporting(true);
    try {
      const {importedCount, skippedCount} = await importLessonsCSV();
      Alert.alert(
        'Готово',
        `Додано уроків: ${importedCount}\nПропущено (вже є): ${skippedCount}`,
      );
      loadLevels();
    } catch (e) {
      Alert.alert('Помилка імпорту', e.message);
    } finally {
      setImporting(false);
    }
  };

  const confirmDeleteLevel = async level => {
    try {
      const count = await getLessonsCountByLevelId(level.id);
      const msg =
        count > 0
          ? `${count} уроків цього рівня будуть видалені разом з рівнем. Продовжити?`
          : 'Рівень порожній. Видалити?';
      Alert.alert('Видалити рівень?', `"${level.name}"\n\n${msg}`, [
        {text: 'Скасувати', style: 'cancel'},
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLevel(level.id);
              loadLevels();
            } catch (e) {
              Alert.alert('Помилка', 'Не вдалося видалити рівень');
            }
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося перевірити уроки рівня');
    }
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={scheme.pageOn} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: scheme.pageOn}]}>
            Контент уроків
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
            <TouchableOpacity onPress={() => navigation.navigate('LevelsAdd')}>
              <MaterialIcons name="add" size={24} color={scheme.pageOn} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleImport} disabled={importing}>
              {importing ? (
                <ActivityIndicator size="small" color={scheme.pageOn} />
              ) : (
                <MaterialIcons
                  name="upload-file"
                  size={22}
                  color={scheme.pageOn}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={scheme.buttonBg} />
          </View>
        ) : levels.length === 0 ? (
          <View style={styles.center}>
            <Text
              style={{
                color: scheme.pageOn,
                textAlign: 'center',
                paddingHorizontal: 20,
              }}>
              Рівнів ще нема. Імпортуйте уроки з CSV — рівень створиться
              автоматично.
            </Text>
          </View>
        ) : (
          <FlatList
            data={levels}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{padding: 14, gap: 8}}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[
                  styles.levelCard,
                  {
                    borderColor: scheme.cardBorder,
                    backgroundColor: scheme.cardBg,
                  },
                ]}
                onPress={() =>
                  navigation.navigate('LessonTopicsLessonsScreen', {
                    levelId: item.id,
                    levelName: item.name,
                  })
                }>
                <Text style={[styles.levelCardText, {color: scheme.pageOn}]}>
                  {item.name}
                </Text>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('LevelsEdit', {itemData: item})
                    }
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <MaterialIcons
                      name="edit"
                      size={18}
                      color={scheme.pageOn}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDeleteLevel(item)}
                    hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                    <MaterialIcons
                      name="delete-outline"
                      size={18}
                      color={scheme.pageOn}
                    />
                  </TouchableOpacity>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={scheme.pageOn}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default LessonLevelsScreen;

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
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  levelCardText: {fontSize: 16, fontWeight: '700'},
});
