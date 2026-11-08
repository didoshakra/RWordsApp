// screens/RuleScreen.js
//
// Екран одного граматичного правила. Відкривається за rule_id
// (наприклад з іконки біля слова, у якого words.rule_id заповнений).
// Очікує navigation param: { ruleId: number }
//
// Потік даних:
//   1. SELECT * FROM rules WHERE id = ?  -> отримуємо рядок з БД
//   2. row.content_json — це ТЕКСТ (той самий JSON.stringify з сіду)
//   3. JSON.parse(row.content_json) -> знову звичайний JS-об'єкт {columns, rows}
//   4. рендеримо як таблицю
//
// ФІКС: раніше тут був ЛИШЕ один ScrollView з horizontal — тобто
// скролилось тільки вбік, вертикального скролу не було взагалі.
// Для коротких таблиць (3-4 рядки) це не впадало в очі, бо вони й так
// влазили на екран, а таблиці на 10-27 рядків впирались в межу екрана
// без можливості прокрутити вниз. Додано зовнішній вертикальний
// ScrollView, всередині якого лишився горизонтальний (для широких
// таблиць з багатьма колонками).
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {openDatabase} from '@/db/dbConfig';
import {ThemeContext} from '@/context/ThemeContext';

const RuleScreen = ({route}) => {
  const {ruleId} = route.params;
  const navigation = useNavigation();
  const {getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(0);

  const [rule, setRule] = useState(null); // {id, title, columns, rows}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = openDatabase();
    db.transaction(tx => {
      tx.executeSql(              
        'SELECT id, title, content_json FROM rules WHERE id = ?',
        [ruleId],
        (_, results) => {
          if (results.rows.length === 0) {
            setError('Правило не знайдено');
            setLoading(false);
            return;
          }
          const row = results.rows.item(0);
          try {
            const content = JSON.parse(row.content_json); // { columns, rows }
            setRule({
              id: row.id,
              title: row.title,
              columns: content.columns,
              rows: content.rows,
            });
          } catch (e) {
            console.log('❌ Помилка розбору content_json:', e);
            setError('Пошкоджені дані правила');
          }
          setLoading(false);
        },
        (_, err) => {
          console.log('❌ Помилка читання правила:', err);
          setError('Помилка читання з бази даних');
          setLoading(false);
          return false;
        },
      );
    });
  }, [ruleId]);

  // Хедер з кнопкою "✕" — потрібен в усіх трьох станах екрана
  // (завантаження / помилка / готово), інакше з екрана нема як вийти.
  const CloseHeader = ({headTitle}) => (
    <View style={[styles.head, {borderColor: scheme.border}]}>
      <Text
        style={[styles.headTitle, {color: scheme.titleOn}]}
        numberOfLines={1}>
        {headTitle}
      </Text>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
        style={styles.closeBtn}>
        <MaterialIcons name="close" size={22} color={scheme.titleOn} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.page, {backgroundColor: scheme.itemBg}]}>
        <CloseHeader headTitle="Правило" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={scheme.buttonBg} />
        </View>
      </View>
    );
  }

  if (error || !rule) {
    return (
      <View style={[styles.page, {backgroundColor: scheme.itemBg}]}>
        <CloseHeader headTitle="Правило" />
        <View style={styles.center}>
          <Text style={{color: scheme.titleOn}}>{error}</Text>
        </View>
      </View>
    );
  }

  // Ширина колонки залежить від кількості колонок — 2 колонки ширші,
  // 4 колонки вужчі, щоб таблиця в цілому не була завузькою чи завеликою.
  const colWidth = rule.columns.length <= 2 ? 180 : 140;

  return (
    <View style={[styles.page, {backgroundColor: scheme.itemBg}]}>
      <CloseHeader headTitle={rule.title} />

      {/* Зовнішній ВЕРТИКАЛЬНИЙ скрол — саме його бракувало */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          paddingTop: 12,
          paddingHorizontal: 12,
          paddingBottom: 24,
        }}>
        {/* Внутрішній горизонтальний — для широких таблиць */}
        <ScrollView horizontal>
          <View>
            {/* Шапка таблиці */}
            <View style={styles.row}>
              {rule.columns.map((col, i) => (
                <View
                  key={i}
                  style={[
                    styles.headCell,
                    {width: colWidth, backgroundColor: scheme.headerOn},
                  ]}>
                  <Text style={styles.headText}>{col}</Text>
                </View>
              ))}
            </View>

            {/* Рядки даних */}
            {rule.rows.map((r, ri) => (
              <View key={ri} style={styles.row}>
                {r.map((cell, ci) => (
                  <View
                    key={ci}
                    style={[
                      styles.cell,
                      {
                        width: colWidth,
                        backgroundColor:
                          ri % 2 === 0 ? scheme.itemBg : scheme.sectionBg,
                        borderColor: scheme.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.cellText,
                        {
                          color: scheme.itemOn,
                          fontWeight: ci === 0 ? '700' : '400',
                        },
                      ]}>
                      {cell}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

export default RuleScreen;

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    padding: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  headCell: {
    padding: 8,
    borderWidth: 0.5,
    borderColor: '#00000022',
  },
  headText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  cell: {
    padding: 8,
    borderWidth: 0.5,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 13,
  },
});
