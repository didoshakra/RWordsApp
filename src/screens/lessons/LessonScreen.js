// screens/LessonScreen.js
//
// Єдиний контейнер уроку. STEPS: rule -> content -> dialogue -> review.
//
// "content" — один крок з вкладками Слова/Вирази/Речення/Текст.
// Кожна вкладка монтує Words.js у embedded-режимі (lessonId + wordTypeFilter),
// теми резолвляться автоматично з lesson_topics, WordsMenu не показується,
// автозапуск одразу після завантаження слів.
//
// Крок "rule": показує назву правила (якщо є), кнопки "Переглянути" (модалка
// RuleScreen) і "Далі" — обидві завжди активні, без примусового перегляду.
//
// Апаратна кнопка "Назад" повторює поведінку екранної кнопки "Назад"
// (повертає на попередній крок, не виходить з уроку одразу).
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {openDatabase} from '@/db/dbConfig';
import {ThemeContext} from '@/context/ThemeContext'; 
import Words from '../words/Words';
import ListenWordsSettingsModal from '@/components/settings/listen_words/ListenWordsSettingsModal';
import StepHelpModal from './StepHelpModal';

const STEPS = ['rule', 'content', 'dialogue', 'review'];

const STEP_LABELS = {
  rule: 'Теорія',
  content: 'Контент',
  dialogue: 'Діалог',
  review: 'Підсумок',
};

const CONTENT_TABS = [
  {key: 'word', label: 'Слова'},
  {key: 'phrase', label: 'Вирази'},
  {key: 'sentence', label: 'Речення'},
  {key: 'text', label: 'Текст'},
  {key: 'all', label: 'Всі'},
];

const LessonScreen = ({route}) => {
  const {lessonId} = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(0);

  const [lesson, setLesson] = useState(null);
  const [ruleTitle, setRuleTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [contentTab, setContentTab] = useState('word');
  const [isHelpModal, setIsHelpModal] = useState(false);
  const [isSettingsModal, setIsSettingsModal] = useState(false);
  const activeWordTypeFilter = useMemo(
    () =>
      contentTab === 'all'
        ? ['word', 'phrase', 'sentence', 'text']
        : [contentTab],
    [contentTab],
  );

  const currentStep = STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;
  const hasRule = !!lesson?.rule_id;

  useEffect(() => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM lessons WHERE id = ?',
        [lessonId],
        (_, results) => {
          if (results.rows.length === 0) {
            setError('Урок не знайдено');
            setLoading(false);
            return;
          }
          const lessonRow = results.rows.item(0);
          setLesson(lessonRow);

          if (lessonRow.rule_id) {
            tx.executeSql(
              'SELECT title FROM rules WHERE id = ?',
              [lessonRow.rule_id],
              (_, ruleRes) => {
                if (ruleRes.rows.length > 0) {
                  setRuleTitle(ruleRes.rows.item(0).title);
                }
                setLoading(false);
              },
              (_, err) => {
                console.log('❌ Помилка читання правила:', err);
                setLoading(false);
                return false;
              },
            );
          } else {
            setLoading(false);
          }
        },
        (_, err) => {
          console.log('❌ Помилка читання уроку:', err);
          setError('Помилка читання з бази даних');
          setLoading(false);
          return false;
        },
      );
    });
  }, [lessonId]);

  const openRule = () => {
    navigation.navigate('RuleScreen', {ruleId: lesson.rule_id});
  };

  const goNext = () => {
    if (!isLastStep) setStepIndex(i => i + 1);
  };

  const goBackStep = () => {
    if (!isFirstStep) setStepIndex(i => i - 1);
  };

  const handleExit = () => {
    navigation.goBack();
  };

  // Апаратна кнопка "Назад" — та сама поведінка, що й екранна кнопка "Назад"
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (!isFirstStep) {
          goBackStep();
          return true; // перехоплюємо, стандартна навігація не спрацьовує
        }
        return false; // на першому кроці — стандартна поведінка (вихід з уроку)
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, [isFirstStep]),
  );

  if (loading) {
    return (
      <View style={[styles.page, {backgroundColor: scheme.itemBg}]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={scheme.buttonBg} />
        </View>
      </View>
    );
  }

  if (error || !lesson) {
    return (
      <View style={[styles.page, {backgroundColor: scheme.itemBg}]}>
        <View style={styles.center}>
          <Text style={{color: scheme.titleOn}}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.page,
        {
          backgroundColor: scheme.itemBg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}>
      {/* Шапка */}
      <View style={[styles.head, {borderColor: scheme.border}]}>
        {/* 1-й рядок */}
        <View style={styles.headRow}>
          <TouchableOpacity
            onPress={handleExit}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
            <MaterialIcons name="arrow-back" size={22} color={scheme.titleOn} />
          </TouchableOpacity>

          <Text
            style={[styles.stepTitle, {color: scheme.titleOn}]}
            numberOfLines={1}>
            {STEP_LABELS[currentStep]}
          </Text>

          <View style={styles.headIcons}>
            <TouchableOpacity onPress={() => setIsHelpModal(true)}>
              <MaterialIcons
                name="help-outline"
                size={22}
                color={scheme.titleOn}
              />
            </TouchableOpacity>

            {currentStep === 'content' && (
              <TouchableOpacity
                onPress={() => setIsSettingsModal(true)}
                style={{marginLeft: 10}}>
                <MaterialIcons
                  name="settings"
                  size={22}
                  color={scheme.titleOn}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2-й рядок */}
        <Text
          style={[styles.lessonTitle, {color: scheme.titleOn}]}
          numberOfLines={1}>
          Урок {lesson.id} • {lesson.title}
        </Text>

        {/* 3-й рядок */}
        <Text style={[styles.progressText, {color: scheme.itemOn}]}>
          Крок {stepIndex + 1} з {STEPS.length}
        </Text>
      </View>

      {/* Вміст поточного кроку */}
      <View style={styles.content}>
        {currentStep === 'rule' && (
          <View style={styles.center}>
            {hasRule ? (
              <>
                <Text style={[styles.ruleHint, {color: scheme.itemOn}]}>
                  Правило уроку:
                </Text>
                <Text style={[styles.ruleTitle, {color: scheme.titleOn}]}>
                  {ruleTitle || '...'}
                </Text>
                <TouchableOpacity
                  style={[styles.ruleBtn, {borderColor: scheme.border}]}
                  onPress={openRule}>
                  <Text style={{color: scheme.itemOn, fontWeight: '600'}}>
                    Переглянути
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{color: scheme.itemOn}}>
                Для цього уроку немає окремого правила — переходьте далі.
              </Text>
            )}
          </View>
        )}

        {currentStep === 'content' && (
          <View style={{flex: 1}}>
            <View style={styles.tabsRow}>
              {CONTENT_TABS.map(tab => {
                const active = tab.key === contentTab;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setContentTab(tab.key)}
                    style={[
                      styles.tabBtn,
                      {borderColor: scheme.border},
                      active && {
                        backgroundColor: '#ffd11a',
                        borderColor: '#ffd11a',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.tabBtnText,
                        {color: active ? '#1a1a1a' : scheme.itemOn},
                      ]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{flex: 1}}>
              <Words
                lessonId={lesson.id}
                wordTypeFilter={activeWordTypeFilter}
                embedded={true}
              />
            </View>
          </View>
        )}

        {currentStep === 'dialogue' && (
          <View style={styles.center}>
            <Text style={[styles.ruleHint, {color: scheme.itemOn}]}>
              Зараз ви поспілкуєтесь з AI на тему уроку, використовуючи вивчені
              слова.
            </Text>
            <TouchableOpacity
              style={[styles.ruleBtn, {borderColor: scheme.border}]}
              onPress={() =>
                navigation.navigate('AIDialogueScreen', {lessonId: lesson.id})
              }>
              <Text style={{color: scheme.itemOn, fontWeight: '600'}}>
                Розпочати діалог
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStep === 'review' && (
          <View style={styles.center}>
            <Text style={{color: scheme.itemOn}}>
              «Підсумок» — ще не готово
            </Text>
          </View>
        )}
      </View>

      {/* Навігація по кроках */}
      <View style={[styles.footer, {borderColor: scheme.border}]}>
        {!isFirstStep && (
          <TouchableOpacity
            style={[styles.navBtn, {borderColor: scheme.border}]}
            onPress={goBackStep}>
            <Text style={[styles.navBtnText, {color: scheme.itemOn}]}>
              Назад
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navBtn, styles.navBtnPrimary]}
          onPress={goNext}
          disabled={isLastStep}>
          <Text style={styles.navBtnPrimaryText}>Далі</Text>
        </TouchableOpacity>
      </View>
      <StepHelpModal
        isVisible={isHelpModal}
        onClose={() => setIsHelpModal(false)}
        stepKey={currentStep}
      />
      <ListenWordsSettingsModal
        isVisible={isSettingsModal}
        onClose={() => setIsSettingsModal(false)}
      />
    </View>
  );
};

export default LessonScreen;

const styles = StyleSheet.create({
  page: {flex: 1},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  head: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },

  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },

  headIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 54,
    justifyContent: 'flex-end',
  },

  lessonTitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '600',
  },

  progressText: {
    marginTop: 2,
    fontSize: 11,
  },
  content: {flex: 1},
  ruleHint: {fontSize: 13, textAlign: 'center', opacity: 0.7},
  ruleTitle: {fontSize: 20, fontWeight: '700', textAlign: 'center'},
  ruleBtn: {
    borderWidth: 2,
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabBtnText: {fontSize: 11, fontWeight: '700'},
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  navBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 100,
    paddingVertical: 6,
    alignItems: 'center',
  },
  navBtnPrimary: {backgroundColor: '#ffd11a', borderColor: '#ffd11a'},
  navBtnText: {fontSize: 14, fontWeight: '600'},
  navBtnPrimaryText: {fontSize: 14, fontWeight: '800', color: '#1a1a1a'},
});
