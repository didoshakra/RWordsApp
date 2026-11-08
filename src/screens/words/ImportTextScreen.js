// screens/words/ImportTextScreen.js

import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Picker} from '@react-native-picker/picker';
import MyArrowBack from '@/components/main/MyArrowBack';
import {openDatabase} from '@/db/dbConfig';

// ── Розбивка тексту на речення ──────────────────────────────
function splitIntoSentences(text) {
  const protected_text = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|i\.e|e\.g)\./gi, '$1<DOT>')
    .replace(/\b([A-Z])\./g, '$1<DOT>');

  const raw = protected_text.split(/(?<=[.!?…])\s+(?=\S)/);

  return raw
    .map(s => s.replace(/<DOT>/g, '.').trim())
    .filter(s => s.length > 15);
}

// ── Запис у БД ──────────────────────────────────────────────
function saveToDatabase({sectionName, topicName, sentences}, onDone) {
  const db = openDatabase();

  db.transaction(tx => {
    tx.executeSql(
      'SELECT id FROM sections WHERE name = ?',
      [sectionName],
      (_, res) => {
        if (res.rows.length > 0) {
          insertTopic(tx, res.rows.item(0).id);
        } else {
          tx.executeSql('SELECT MAX(pn) as maxPn FROM sections', [], (_, r) => {
            const newPn = (r.rows.item(0).maxPn ?? 0) + 1;
            tx.executeSql(
              'INSERT INTO sections (name, img, pn) VALUES (?, ?, ?)',
              [sectionName, 'other', newPn],
              (_, ins) => insertTopic(tx, ins.insertId),
              () => Alert.alert('Помилка', 'Не вдалося додати секцію'),
            );
          });
        }
      },
    );

    function insertTopic(tx, sectionId) {
      tx.executeSql(
        'SELECT id FROM topics WHERE name = ? AND section_id = ?',
        [topicName, sectionId],
        (_, res) => {
          if (res.rows.length > 0) {
            insertWords(tx, res.rows.item(0).id);
          } else {
            tx.executeSql(
              'SELECT MAX(pn) as maxPn FROM topics WHERE section_id = ?',
              [sectionId],
              (_, r) => {
                const newPn = (r.rows.item(0).maxPn ?? 0) + 1;
                tx.executeSql(
                  'INSERT INTO topics (name, img, section_id, pn) VALUES (?, ?, ?, ?)',
                  [topicName, 'other', sectionId, newPn],
                  (_, ins) => insertWords(tx, ins.insertId),
                  () => Alert.alert('Помилка', 'Не вдалося додати тему'),
                );
              },
            );
          }
        },
      );
    }

    function insertWords(tx, topicId) {
      tx.executeSql(
        'SELECT MAX(pn) as maxPn FROM words WHERE topic_id = ?',
        [topicId],
        (_, r) => {
          let pn = r.rows.item(0).maxPn ?? 0;
          let idx = 0;
          let count = 0;

          function nextWord() {
            if (idx >= sentences.length) {
              setTimeout(() => {
                Alert.alert('✅ Успіх', `Імпортовано ${count} речень.`);
              }, 300);
              onDone?.();
              return;
            }

            const word = sentences[idx];
            tx.executeSql(
              'SELECT id FROM words WHERE word = ? AND topic_id = ?',
              [word, topicId],
              (_, wr) => {
                if (wr.rows.length === 0) {
                  pn++;
                  tx.executeSql(
                    'INSERT INTO words (word, img, topic_id, pn) VALUES (?, ?, ?, ?)',
                    [word, '', topicId, pn],
                    () => {
                      count++;
                      idx++;
                      nextWord();
                    },
                    () => {
                      idx++;
                      nextWord();
                    },
                  );
                } else {
                  idx++;
                  nextWord();
                }
              },
              () => {
                idx++;
                nextWord();
              },
            );
          }
          nextWord();
        },
        () => onDone?.(),
      );
    }
  });
}

// ── Екран ────────────────────────────────────────────────────
export default function ImportTextScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const sections = route.params?.sections || [];

  const [sectionId, setSectionId] = useState(
    sections.length > 0 ? String(sections[0].id) : '',
  );
  const [topicName, setTopicName] = useState('');
  const [text, setText] = useState('');
  const [sentences, setSentences] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedSection = sections.find(s => String(s.id) === sectionId);

  const handleSplit = () => {
    if (!sectionId) {
      Alert.alert('Помилка', 'Оберіть секцію');
      return;
    }
    if (!topicName.trim()) {
      Alert.alert('Помилка', 'Введіть назву теми');
      return;
    }
    if (!text.trim()) {
      Alert.alert('Помилка', 'Вставте текст');
      return;
    }

    const result = splitIntoSentences(text);
    if (!result.length) {
      Alert.alert('Помилка', 'Не вдалося розбити на речення');
      return;
    }
    setSentences(result);
  };

  const handleRemove = idx => {
    setSentences(prev => prev.filter((_, i) => i !== idx));
  };

  const handleImport = () => {
    if (!sentences?.length || !selectedSection) return;
    setLoading(true);
    saveToDatabase(
      {
        sectionName: selectedSection.name,
        topicName: topicName.trim(),
        sentences,
      },
      () => {
        setLoading(false);
        navigation.goBack();
      },
    );
  };

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.head}>
        <MyArrowBack
          color="#fff"
          colorIconBg="#333"
          sizeIcon={24}
          titleText="Імпорт тексту"
        />
      </View>

      <ScrollView style={st.scroll} keyboardShouldPersistTaps="handled">
        {/* Секція — Picker */}
        <Text style={st.label}>Секція</Text>
        <View style={st.pickerWrap}>
          <Picker
            selectedValue={sectionId}
            onValueChange={val => setSectionId(val)}
            style={st.picker}
            dropdownIconColor="#fff">
            {sections.map(s => (
              <Picker.Item key={s.id} label={s.name} value={String(s.id)} />
            ))}
          </Picker>
        </View>

        {/* Тема */}
        <Text style={st.label}>Тема (нова назва)</Text>
        <TextInput
          style={st.input}
          value={topicName}
          onChangeText={setTopicName}
          placeholder="Назва тексту або статті"
          placeholderTextColor="#6b7280"
        />

        {/* Текст */}
        <Text style={st.label}>Текст</Text>
        <TextInput
          style={st.textarea}
          value={text}
          onChangeText={setText}
          placeholder="Вставте текст тут..."
          placeholderTextColor="#6b7280"
          multiline
          textAlignVertical="top"
        />

        {/* Кнопки */}
        <View style={st.btnRow}>
          <TouchableOpacity style={[st.btn, st.btnBlue]} onPress={handleSplit}>
            <Text style={st.btnText}>✂️ Розбити на речення</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[st.btn, st.btnGray]}
            onPress={() => navigation.goBack()}>
            <Text style={[st.btnText, {color: '#374151'}]}>Відмінити</Text>
          </TouchableOpacity>
        </View>

        {/* Preview речень */}
        {sentences && (
          <View style={st.preview}>
            <View style={st.previewHead}>
              <Text style={st.previewTitle} numberOfLines={1}>
                {topicName}
              </Text>
              <Text style={st.count}>{sentences.length} речень</Text>
            </View>

            {sentences.map((sentence, idx) => (
              <View key={idx} style={st.row}>
                <Text style={st.num}>{idx + 1}</Text>
                <Text style={st.sentence}>{sentence}</Text>
                <TouchableOpacity onPress={() => handleRemove(idx)}>
                  <Text style={st.removeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {loading ? (
              <ActivityIndicator
                style={{marginTop: 16}}
                color="#22c55e"
                size="large"
              />
            ) : (
              <View style={[st.btnRow, {marginTop: 16}]}>
                <TouchableOpacity
                  style={[st.btn, st.btnGreen]}
                  onPress={handleImport}>
                  <Text style={st.btnText}>
                    ⬇ Імпортувати ({sentences.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[st.btn, st.btnGray]}
                  onPress={() => navigation.goBack()}>
                  <Text style={[st.btnText, {color: '#374151'}]}>
                    Відмінити
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#1e1e2e'},
  head: {paddingHorizontal: 8},
  scroll: {flex: 1, paddingHorizontal: 16},
  label: {color: '#9ca3af', fontSize: 13, marginTop: 16, marginBottom: 4},
  input: {
    backgroundColor: '#2a2a3e',
    color: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  textarea: {
    backgroundColor: '#2a2a3e',
    color: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 180,
    marginBottom: 12,
  },
  pickerWrap: {
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    marginBottom: 4,
    overflow: 'hidden',
  },
  picker: {color: '#fff'},
  btnRow: {flexDirection: 'row', gap: 10, marginTop: 12},
  btn: {flex: 1, borderRadius: 10, padding: 13, alignItems: 'center'},
  btnBlue: {backgroundColor: '#3b82f6'},
  btnGreen: {backgroundColor: '#22c55e'},
  btnGray: {backgroundColor: '#e5e7eb'},
  btnText: {color: '#fff', fontWeight: '700', fontSize: 14},
  preview: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#2a2a3e',
    padding: 14,
  },
  previewHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  count: {color: '#9ca3af', fontSize: 13},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff11',
  },
  num: {color: '#6b7280', fontSize: 11, minWidth: 24, paddingTop: 2},
  sentence: {flex: 1, color: '#e5e7eb', fontSize: 13, lineHeight: 20},
  removeBtn: {color: '#ef4444', fontSize: 14, paddingHorizontal: 4},
});
