// TopicsModal.js
//Працюєdrag-and-drop всередині секції+кнопки Зберегти(зберігає в бд переміщення і вибірку)
//Перевірка змін doWords(до показу слів)
//Забираємо всі теми[*]

import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import AntDesign from 'react-native-vector-icons/AntDesign';

import {openDatabase} from '@/db/dbConfig';
import {ThemeContext} from '@/context/ThemeContext';
import {SettingsContext} from '@/context/SettingsContext';

const TopicsModal = ({headerColor}) => {
  const {settings, setSettings} = useContext(SettingsContext);
  const [selectedTopics, setSelectedTopics] = useState(
    settings.selectedTopics || [],
  );
  const [sections, setSections] = useState([]);
  const [initialSections, setInitialSections] = useState([]);
  const [collapsed, setCollapsed] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const {height} = Dimensions.get('window');
  const modalHeight = height * 0.9;

  const {getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(0);
  const {
    pageBg: cModalBg,
    headerBg: allTopicsBg,
    itemBg: cItemBg,
    itemOn: cItemOn,
    itemBgAct: cItemBgAct,
    itemOnAct: cItemOnAct,
    sectionBg: cSectionBg,
  } = scheme;
  const cBtnBg = scheme.buttonBg;
  const cBtnBorder = scheme.buttonBorder;
  const cBtnText = scheme.buttonOn;
  const cIcon = scheme.buttonOn;

  // load
  useEffect(() => {
    loadSectionsFromDB();
  }, []);

  useEffect(() => {
    // синхронізуємо selectedTopics з контекстом при відкритті модалки
    setSelectedTopics(settings.selectedTopics || []);
  }, [isExpanded, settings.selectedTopics]);

  const loadSectionsFromDB = () => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        `SELECT Topics.*,
              Sections.name AS section_name,
              Sections.pn AS section_pn,
              (SELECT COUNT(*) FROM words WHERE words.topic_id = Topics.id) AS words_count
       FROM Topics
       JOIN Sections ON Topics.section_id = Sections.id
       ORDER BY Sections.pn ASC, Topics.pn ASC`,
        [],
        (_, results) => {
          const raw = [];
          for (let i = 0; i < results.rows.length; ++i)
            raw.push(results.rows.item(i));

          const bySection = {};
          raw.forEach(topic => {
            const sid = topic.section_id;
            if (!bySection[sid]) {
              bySection[sid] = {
                title: topic.section_name,
                section_id: sid,
                section_pn: topic.section_pn,
                data: [],
              };
            }
            // Додаємо words_count в дані теми
            bySection[sid].data.push({
              ...topic,
              words_count: topic.words_count,
            });
          });

          const arr = Object.values(bySection).sort(
            (a, b) => a.section_pn - b.section_pn,
          );
          arr.forEach(sec => sec.data.sort((a, b) => a.pn - b.pn));
          setSections(arr);
          setInitialSections(JSON.parse(JSON.stringify(arr)));

          const initCollapsed = {};
          arr.forEach(sec => (initCollapsed[sec.section_id] = false));
          setCollapsed(initCollapsed);
        },
        (_, error) => console.log('Помилка SELECT:', error),
      );
    });
  };

  // Перевірка змін
  const hasSelectionChanged = () => {
    // порівнюємо вибрані теми з settings.selectedTopics
    const prev = settings.selectedTopics || [];
    if (prev.length !== selectedTopics.length) return true;
    // перевірка поелементно
    for (let i = 0; i < prev.length; i++) {
      if (prev[i] !== selectedTopics[i]) return true;
    }
    return false;
  };

  const hasOrderChanged = () => {
    // порівнюємо current sections з initialSections
    if (sections.length !== initialSections.length) return true;
    for (let i = 0; i < sections.length; i++) {
      const curr = sections[i].data.map(t => t.id);
      const init = initialSections[i].data.map(t => t.id);
      if (curr.length !== init.length) return true;
      for (let j = 0; j < curr.length; j++) {
        if (curr[j] !== init[j]) return true;
      }
    }
    return false;
  };

  const hasChanges = hasSelectionChanged() || hasOrderChanged();
  // =======================

  const toggleDropdown = () => setIsExpanded(exp => !exp);

  const toggleSection = section_id => {
    // зберігаємо твою поведінку (переключення); якщо хочеш одну відкриту — можна змінити
    setCollapsed(prev => ({...prev, [section_id]: !prev[section_id]}));
  };

  const toggleTopic = React.useCallback(topicId => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId],
    );
  }, []);

  const getSelectedLabel = () => {
    const saved = settings.selectedTopics || [];
    // if (hasAllMarker(saved)) return 'Всі';
    const count = saved.length;
    const lastTwo = count % 100,
      last = count % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return `${count} тем`;
    if (last === 1) return `${count} тема`;
    if (last >= 2 && last <= 4) return `${count} теми`;
    return `${count} тем`;
  };

  // Для підрахунку вибраніх тем у секції
  const isTopicSelectedIn = (list, id) => list.includes(id);

  const areAllTopicsSelectedInSection = section =>
    section.data.every(t => isTopicSelectedIn(selectedTopics, t.id));

  const isAnyTopicSelectedInSection = section =>
    section.data.some(t => isTopicSelectedIn(selectedTopics, t.id));

  const renderSectionHeader = ({section}) => {
    const checkedCount = section.data.filter(item =>
      isTopicSelectedIn(selectedTopics, item.id),
    ).length;

    //
    const expanded = collapsed[section.section_id];
    const allSelected = areAllTopicsSelectedInSection(section);
    const anySelected = isAnyTopicSelectedInSection(section);

    let checkboxIcon = 'check-box-outline-blank';
    if (allSelected) checkboxIcon = 'check-box';
    else if (anySelected) checkboxIcon = 'indeterminate-check-box';

    return (
      <View style={[styles.sectionHeader, {backgroundColor: cSectionBg}]}>
        <Pressable
          onPress={() => {
            const topicIds = section.data.map(t => t.id);
            const allSelected = topicIds.every(id =>
              isTopicSelectedIn(selectedTopics, id),
            );

            if (allSelected) {
              setSelectedTopics(prev =>
                prev.filter(id => !topicIds.includes(id)),
              );
            } else {
              setSelectedTopics(prev => [...new Set([...prev, ...topicIds])]);
            }
          }}
          style={{marginRight: 6}}
          hitSlop={10} //Збільшення зони натискання
        >
          <MaterialIcons name={checkboxIcon} size={22} color={cItemOn} />
        </Pressable>

        <Pressable
          onPress={() => toggleSection(section.section_id)}
          style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
          <Text style={{color: cItemOn, fontWeight: 'bold'}}>
            {expanded ? '▲' : '▼'}
            Гр:({checkedCount}/{section.data.length}) {section.title}
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderDraggableTopics = section => {
    const estimatedItemHeight = 48;
    const listH = Math.min(
      section.data.length * estimatedItemHeight,
      modalHeight * 0.55,
    );

    return (
      <View style={{maxHeight: listH}}>
        <DraggableFlatList
          data={section.data}
          keyExtractor={item => item.id.toString()}
          nestedScrollEnabled
          style={{flexGrow: 0}}
          contentContainerStyle={{paddingBottom: 6}}
          renderItem={({item, drag, isActive}) => {
            // const isSelected =
            //   isAllSelected || selectedTopics.includes(item.id);
            const isSelected = selectedTopics.includes(item.id);
            return (
              <View
                style={[
                  styles.item,
                  {
                    backgroundColor: isActive
                      ? '#ddd'
                      : isSelected
                      ? cItemBgAct
                      : cItemBg,
                  },
                ]}>
                <Pressable
                  onPress={() => toggleTopic(item.id)}
                  style={{marginRight: 8}}
                  hitSlop={10} //Збільшення зони натискання
                >
                  <MaterialIcons
                    name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                    size={20}
                    color={isSelected ? cItemOnAct : cItemOn}
                  />
                </Pressable>
                <Text
                  style={{color: isSelected ? cItemOnAct : cItemOn, flex: 1}}>
                  ({item.words_count}) {item.name}
                  {/* {' '} */}
                </Text>
                <Pressable
                  onLongPress={drag}
                  delayLongPress={150}
                  style={{paddingHorizontal: 8}}>
                  <MaterialIcons name="drag-handle" size={22} color={cItemOn} />
                </Pressable>
              </View>
            );
          }}
          onDragEnd={({data}) => {
            const newSections = sections.map(s =>
              s.section_id === section.section_id ? {...s, data} : s,
            );
            setSections(newSections);
          }}
        />
      </View>
    );
  };

  const handleSave = () => {
    // 1. оновлюємо pn у БД
    openDatabase().transaction(tx => {
      sections.forEach(sec => {
        sec.data.forEach((topic, idx) => {
          tx.executeSql('UPDATE Topics SET pn = ? WHERE id = ?', [
            idx + 1,
            topic.id,
          ]);
        });
      });
    });

    // 2. оновлюємо settings.selectedTopics
    setSettings(prevSettings => ({
      ...prevSettings,
      selectedTopics,
    }));

    // 3. оновлюємо локальні копії
    setInitialSections(JSON.parse(JSON.stringify(sections)));
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setSections(JSON.parse(JSON.stringify(initialSections)));
    setIsExpanded(false);
    setSelectedTopics(settings.selectedTopics || []);
  };

  // Рендер секцій через FlatList — щоб уникнути Plain ScrollView оточення VirtualizedList
  const renderSectionItem = ({item: section}) => (
    <View>
      {renderSectionHeader({section})}
      {collapsed[section.section_id] && renderDraggableTopics(section)}
    </View>
  );

  return (
    <>
      {/*  */}
      <Pressable onPress={toggleDropdown} style={styles.button}>
        <View style={styles.headButtonContainer}>
          <MaterialIcons
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color={headerColor}
          />
          <Text style={[styles.textInfo, {color: headerColor}]}>
            Вибрані теми:
          </Text>
          <Text style={[styles.textInfo, {color: headerColor, marginLeft: 4}]}>
            {getSelectedLabel()}
          </Text>
        </View>
      </Pressable>

      <Modal transparent visible={isExpanded} animationType="fade">
        <GestureHandlerRootView style={{flex: 1}}>
          {/* backdrop as absolute fullscreen so container can be centered */}
          <Pressable style={styles.backdrop} onPress={handleCancel} />

          {/* center modal */}
          <View style={styles.centerWrap}>
            <View
              style={[
                styles.modalContainer,
                {backgroundColor: cModalBg, height: modalHeight, width: '92%'},
              ]}>
              <Text
                style={{
                  color: cItemOn,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: 16,
                  marginVertical: 2,
                }}>
                Групи/Теми
              </Text>
              <Text
                style={{
                  color: cItemOn,
                  fontSize: 11,
                  textAlign: 'center',
                  opacity: 0.6,
                  marginBottom: 4,
                }}>
                Для зміни порядку тем тягніть за ═ зправа
              </Text>
              {/* sections list (FlatList — не ScrollView) */}
              <FlatList
                data={sections}
                keyExtractor={s => s.section_id.toString()}
                renderItem={renderSectionItem}
                style={{flex: 1}}
                contentContainerStyle={{paddingBottom: 12}}
                showsVerticalScrollIndicator={true}
              />

              {/* кнопки */}
              <View style={[styles.buttonsContainerFooter, {marginBottom: 5}]}>
                {hasChanges ? (
                  <>
                    {/* Якщо були зміни — показуємо обидві кнопки */}
                    <Pressable
                      style={[
                        styles.buttonFooter,
                        {backgroundColor: cBtnBg, borderColor: cBtnBorder},
                      ]}
                      onPress={handleSave}>
                      <AntDesign name="save" color={cIcon} size={20} />
                      <Text style={[styles.btnText, {color: cBtnText}]}>
                        Зберегти
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.buttonFooter,
                        {backgroundColor: cBtnBg, borderColor: cBtnBorder},
                      ]}
                      onPress={handleCancel}>
                      <AntDesign name="close" color={cIcon} size={20} />
                      <Text style={[styles.btnText, {color: cBtnText}]}>
                        Вийти без збереження
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    {/* Якщо змін не було — лише "Вийти" */}
                    <Pressable
                      style={[
                        styles.buttonFooter,
                        {backgroundColor: cBtnBg, borderColor: cBtnBorder},
                      ]}
                      onPress={handleCancel}>
                      <AntDesign name="close" color={cIcon} size={20} />
                      <Text style={[styles.btnText, {color: cBtnText}]}>
                        Вийти
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 5,
    width: '100%',
    padding: 6,
  },
  headButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centerWrap: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  modalContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonsContainerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginVertical: 5,
    gap: 10,
  },
  buttonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 16,
    gap: 10,
  },
  btnText: {
    fontFamily: 'Poppins-SemiBold',
  },
  textInfo: {
    // fontWeight: '600', // у React Native краще '600' замість 'semibold'
    // fontFamily: 'Poppins-SemiBold',
  },
});

export default TopicsModal;
