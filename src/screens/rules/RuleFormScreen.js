// screens/RuleFormScreen.js
//
// ОДИН екран для Додавання ТА Редагування правила.
// Режим визначається наявністю route.params.itemData:
//   - є itemData  -> редагування (форма попередньо заповнена)
//   - нема itemData -> додавання нового правила
//
// Зареєструй ЦЕЙ САМИЙ компонент під двома іменами в навігаторі —
// окремі файли RulesAdd.js/RulesEdit.js не потрібні:
//   <Stack.Screen name="RulesAdd" component={RuleFormScreen} />
//   <Stack.Screen name="RulesEdit" component={RuleFormScreen} />
import React, {useContext, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ToastAndroid,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';

import {ThemeContext} from '@/context/ThemeContext';
import MyArrowBack from '@/components/main/MyArrowBack';
import {
  insertRule,
  updateRule,
  stringifyRuleTableText,
} from '@/db/rules/rulesActions';

const RuleFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const editingRule = route.params?.itemData ?? null;
  const isEdit = !!editingRule;

  const {getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(0);

  const [title, setTitle] = useState(editingRule?.title ?? '');
  const [tableText, setTableText] = useState(() => {
    if (!editingRule) return '';
    try {
      const content = JSON.parse(editingRule.content_json);
      return stringifyRuleTableText(content);
    } catch (e) {
      console.log('Помилка розбору content_json при відкритті форми:', e);
      return '';
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Помилка', 'Введи назву правила');
      return;
    }
    if (!tableText.trim()) {
      Alert.alert(
        'Помилка',
        'Введи вміст таблиці (хоча б заголовок і 1 рядок даних)',
      );
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateRule(editingRule.id, title.trim(), tableText);
        ToastAndroid.show('Правило оновлено', ToastAndroid.SHORT);
      } else {
        await insertRule(title.trim(), tableText);
        ToastAndroid.show('Правило додано', ToastAndroid.SHORT);
      }
      navigation.goBack();
    } catch (e) {
      // Помилки з parseRuleTableText мають людяний текст — показуємо як є
      Alert.alert('Помилка в тексті таблиці', e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: scheme.cardBg}}>
      <View style={[styles.head, {backgroundColor: scheme.pageBg}]}>
        <MyArrowBack
          color={scheme.pageOn}
          colorIconBg={scheme.pageBg}
          sizeIcon={24}
          titleText={isEdit ? 'Редагувати правило' : 'Нове правило'}
        />
      </View>

      <ScrollView style={{flex: 1, padding: 12}} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, {color: scheme.pageOn}]}>Назва правила</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Наприклад: Часи"
          placeholderTextColor="#999"
          style={[styles.input, {color: scheme.pageOn, borderColor: scheme.border}]}
        />

        <Text style={[styles.label, {color: scheme.pageOn, marginTop: 16}]}>
          Вміст таблиці
        </Text>
        <Text style={[styles.hint, {color: scheme.pageOn}]}>
          Перший рядок — заголовки колонок, кожен наступний — рядок даних.
          Комірки розділяй символом "|". Приклад:{'\n\n'}
          Час | Формула{'\n'}
          Present Simple | Підмет + початкова форма{'\n'}
          Past Simple | Підмет + минула форма
        </Text>
        <TextInput
          value={tableText}
          onChangeText={setTableText}
          placeholder={'Час | Формула\nPresent Simple | Підмет + ...'}
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          style={[styles.textarea, {color: scheme.pageOn, borderColor: scheme.border}]}
        />

        <TouchableOpacity
          disabled={saving}
          onPress={handleSave}
          style={[
            styles.saveBtn,
            {backgroundColor: scheme.buttonBg, opacity: saving ? 0.6 : 1},
          ]}>
          <Text style={{color: scheme.buttonOn, fontWeight: '700'}}>
            {saving
              ? 'Збереження...'
              : isEdit
              ? 'Зберегти зміни'
              : 'Додати правило'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RuleFormScreen;

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 180,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo',
  },
  saveBtn: {
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
});
