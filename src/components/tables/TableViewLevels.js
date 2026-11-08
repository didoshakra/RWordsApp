// TableViewLevelsLevels.js //3-и рівні/відкривається//Працює зміна колонок
//Озвучка/+секція і тема коли нічого нема
//
// ЗМІНА: додано окрему гілку рендеру для "плоского" режиму
// (dataLevel1 і dataLevel2 обидва порожні — саме так викликаєтьсяв
// з RulesListLevels). Раніше всі рядки ховались в один
// fake-topic { words: data } і рендерились вкладеним FlatList без
// заданої висоти — через це не було вертикального скролу.
// Тепер у плоскому режимі рядки йдуть напряму в SectionList
// (renderFlatRow), без обгортки "тема" і без вкладеного списку.

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useContext,
} from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Pressable,
  FlatList,
  Modal,
} from 'react-native';
// import {useFocusEffect} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {LogBox} from 'react-native';
import {ThemeContext} from '@/context/ThemeContext';
import WordPlayerBar from './WordPlayerBar'; // якщо в тій самій папці

LogBox.ignoreLogs([
  'ref.measureLayout must be called with a ref to a native component',
]);

// Панель управління шириною стовпця
function ResizeDock({
  open,
  column,
  width,
  onChange,
  onClose,
  step = 10,
  min = 30,
  max = 1000,
}) {
  if (!open || !column) return null;
  return (
    <View style={styles.resizeDock}>
      <Text style={styles.resizeDockLabel}>{column}</Text>
      <View style={styles.resizeDockBtns}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, width - step))}
          style={styles.resBtn}>
          <Text style={{fontSize: 20}}>-</Text>
        </TouchableOpacity>
        <Text style={styles.resizeDockWidth}>{width}px</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, width + step))}
          style={styles.resBtn}>
          <Text style={{fontSize: 20}}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.resBtn, {marginLeft: 30}]}>
          <Text style={{fontWeight: 'bold'}}>Готово</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const TableViewLevels = ({
  loading, // Передаємо стан індикатора
  data,
  onRefresh, //Оновлення data
  setData,
  dataLevel1 = [], // теми
  dataLevel2 = [], // секції
  onSavePn,
  columns,
  title,
  indexScheme,
  onAdd,
  onEdit,
  onDelete,
  onSaveToAudio,
  onImport,
  onImportText,
  onTranslate,
  onExportWordsToSite,
  sectionId,
  sectionName,
  beforeSectionName = 'Секція',
  sortField = 'pn',
  translate,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onOpenRule, // Для правил rele_id
  openRuleField, // Для правил rele_id
  onToggleFlag, // (id, accessor, newValue) — тап на зірку/прапорець у рядку
}) => {
  const {sizes, getColorScheme} = useContext(ThemeContext);
  const sPageTitleFont = sizes.sPageTitleFont;
  const scheme = getColorScheme(indexScheme);
  const cTableTitleText = scheme.titleOn;
  const cTableHeadOn = scheme.headerOn;
  const cLevel1Bg = scheme.level1Bg;
  const cLevel1On = scheme.level1On;
  const cSectionBg = scheme.sectionBg;
  const cSectionOn = scheme.sectionOn;
  const cItemBg = scheme.itemBg;
  const cItemOn = scheme.itemOn;
  const cItemBgAct = scheme.itemBgAct;
  const cItemOnAct = scheme.itemOnAct;
  const cBorder = scheme.border;
  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;
  const cButtonOnAct = scheme.buttonOnAct;
  const cModalBg = scheme.modalBg;
  const cModalOn = scheme.modalOn;
  const cIcon = scheme.buttonOn;
  //   console.log(
  //     'TableViewLevel/openRuleField:',
  //     openRuleField,
  //     'onOpenRule:',
  //     typeof onOpenRule,
  //   );

  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowsData, setSelectedRowsData] = useState([]); // ← масив об'єктів
  const [selectedRowData, setSelectedRowData] = useState(null); // ← один для edit
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [expandedLevel1, setExpandedLevel1] = useState({});
  const [expandedLevel2, setExpandedLevel2] = useState({});
  //   const dataRef = useRef(data);
  //   const changedPnRef = useRef(false);
  const [previewModal, setPreviewModal] = useState({visible: false, text: ''}); //Стан для модалки розкритття тексту
  const [columnWidths, setColumnWidths] = useState(
    columns.reduce((acc, col) => ({...acc, [col.accessor]: col.width}), {}),
  );
  const [resizePanel, setResizePanel] = useState({open: false, column: null});
  const [moveOffset, setMoveOffset] = useState(0); // Переміщення груп рядків
  const [showPlayer, setShowPlayer] = useState(false);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  // Вибір секції, коли додаємо Тему і секцій декілька
  const [sectionPicker, setSectionPicker] = useState({visible: false});
  //   console.log('TableViewLevels.js/data', data);
  //   console.log('TableViewLevels.js/dataLevel1', dataLevel1);
  //   console.log('TableViewLevels.js/dataLevel2', dataLevel2);

  // Плоский режим (без тем/секцій) — саме так викликається для rules
  const isFlatMode = dataLevel1.length === 0 && dataLevel2.length === 0;

  useEffect(() => {
    setColumnWidths(
      columns.reduce((acc, col) => ({...acc, [col.accessor]: col.width}), {}),
    );
  }, [columns]);

  //   useEffect(() => {
  //     dataRef.current = data;
  //   }, [data]);

  // --- Формуємо трирівневу структуру для SectionList ---
  const sections = useMemo(() => {
    // ===== Плоска таблиця (без секцій і тем) =====
    // Рядки йдуть НАПРЯМУ в SectionList (без обгортки "тема" і без
    // вкладеного FlatList) — так SectionList бачить реальну кількість
    // елементів і коректно визначає висоту/скрол.
    if (dataLevel2.length === 0 && dataLevel1.length === 0) {
      return [
        {
          id: -1,
          key: 'flat',
          title: '',
          data: data.map(item => ({...item, key: String(item.id)})),
        },
      ];
    }
    // ===== 2 рівні (теми → записи) =====
    if (dataLevel2.length === 0) {
      return [
        {
          id: -1,
          key: 'topics',
          title: '',
          data: dataLevel1.map(topic => ({
            ...topic,
            key: String(topic.id),
            title: topic.name,
            words: data.filter(word => word.topic_id === topic.id),
          })),
        },
      ];
    }
    // ===== Звичайний режим =====
    return dataLevel2.map(section => {
      const topics = dataLevel1.filter(t => t.section_id === section.id);
      const wordIds = topics.flatMap(topic =>
        data.filter(word => word.topic_id === topic.id).map(word => word.id),
      );
      return {
        ...section,
        key: String(section.id),
        title: section.name,
        wordIds,
        topics,
        data: expandedLevel2[section.id]
          ? topics.map(topic => ({
              ...topic,
              key: String(topic.id),
              title: topic.name,
              words: data.filter(word => word.topic_id === topic.id),
            }))
          : [],
      };
    });
  }, [data, dataLevel1, dataLevel2, expandedLevel2]);

  // --- Логіка кнопки "Додати" в нижньому FAB-меню (коли нічого не вибрано) ---
  // Якщо структури ще нема — пропонуємо створити відповідний рівень,
  // замість того щоб одразу намагатись додати слово, якому нема куди приліпитись.
  const handleAddPress = useCallback(() => {
    setFabMenuVisible(false);

    // 1. Секцій нема зовсім -> одразу створюємо секцію, вибирати нема з чого
    if ((!dataLevel2 || dataLevel2.length === 0) && onAddSection) {
      onAddSection();
      return;
    }

    // 2. Секції є, але жодної теми ще не створено -> питаємо, куди додати тему
    if ((!dataLevel1 || dataLevel1.length === 0) && onAddTopic) {
      if (dataLevel2.length === 1) {
        // Секція одна - без додаткового вибору одразу додаємо тему в неї
        onAddTopic?.(dataLevel2[0]);
      } else {
        // Секцій декілька - треба вибрати, в яку саме додати тему
        setSectionPicker({visible: true});
      }
      return;
    }

    // 3. Є хоч одна тема - працює як і раніше (додавання слова)
    onAdd?.();
  }, [dataLevel1, dataLevel2, onAdd, onAddSection, onAddTopic]);

  // moveSelectedRow — тепер приймає offset, не direction
  const moveSelectedRow = useCallback(
    offset => {
      if (selectedRows.length !== 1) return;
      const rowId = selectedRows[0];
      const word = data.find(w => w.id === rowId);
      if (!word) return;

      const topicWords = data
        .filter(w => w.topic_id === word.topic_id)
        .sort((a, b) => a[sortField] - b[sortField]);

      const groups = [];
      const seenKeys = new Set();
      for (const w of topicWords) {
        const key =
          w.group_key && w.group_key.trim() ? w.group_key : String(w.id);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          groups.push(key);
        }
      }

      const currentGroupKey = word.group_key || String(word.id);
      const groupIdx = groups.indexOf(currentGroupKey);
      if (groupIdx === -1) return;

      const newGroupIdx = groupIdx + offset;
      if (newGroupIdx < 0 || newGroupIdx >= groups.length) return;

      const newGroups = [...groups];
      if (offset > 0) {
        for (let i = groupIdx; i < groupIdx + offset; i++) {
          [newGroups[i], newGroups[i + 1]] = [newGroups[i + 1], newGroups[i]];
        }
      } else {
        for (let i = groupIdx; i > groupIdx + offset; i--) {
          [newGroups[i], newGroups[i - 1]] = [newGroups[i - 1], newGroups[i]];
        }
      }

      let pn = 1;
      const reindexed = [];
      for (const key of newGroups) {
        const groupWords = topicWords.filter(
          w => (w.group_key || String(w.id)) === key,
        );
        for (const w of groupWords) {
          reindexed.push({...w, [sortField]: pn++});
        }
      }

      const newData = data.map(w => {
        const updated = reindexed.find(u => u.id === w.id);
        return updated || w;
      });

      setData(newData);
      onSavePn?.(reindexed); // було onSavePn(reindexed) — впаде, якщо проп не передано
    },
    [selectedRows, data, setData, sortField, onSavePn],
  );

  const moveInfo = useMemo(() => {
    if (selectedRows.length !== 1 || !moveMode) return null;
    const rowId = selectedRows[0];

    const word = data.find(w => w.id === rowId);
    if (!word) return null;

    const topicWords = data
      .filter(w => w.topic_id === word.topic_id)
      .sort((a, b) => a[sortField] - b[sortField]);

    // Групуємо по group_key
    const groups = [];
    const seenKeys = new Set();
    for (const w of topicWords) {
      const key =
        w.group_key && w.group_key.trim() ? w.group_key : String(w.id);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        groups.push(key);
      }
    }

    const currentGroupKey =
      word.group_key && word.group_key.trim()
        ? word.group_key
        : String(word.id);
    const idx = groups.indexOf(currentGroupKey);
    if (idx === -1) return null;

    return {idx, total: groups.length, groups, topicWords, word};
  }, [selectedRows, moveMode, data, sortField]);
  //   ---------------
  const selectedRowsSet = useMemo(() => new Set(selectedRows), [selectedRows]);

  const handleRowPress = useCallback(item => {
    setSelectedRows(prev => {
      const isSelected = prev.includes(item.id);
      const newSelected = isSelected
        ? prev.filter(id => id !== item.id)
        : [...prev, item.id];
      return newSelected;
    });

    setSelectedRowsData(prev => {
      const isSelected = prev.some(d => d.id === item.id);
      const newData = isSelected
        ? prev.filter(d => d.id !== item.id)
        : [...prev, item];

      // selectedRowData — завжди останній єдиний вибраний
      if (newData.length === 1) {
        setSelectedRowData(newData[0]);
      } else {
        setSelectedRowData(null);
      }

      return newData;
    });
  }, []);

  const hasSelectedRows = selectedRows.length > 0;
  const hasOneSelectedRow = selectedRows.length === 1;

  // --- Модальне меню (довгий тап на темі/секції) ---
  const handleAdd = () => {
    setMenuVisible(false);
    if (selectedItem?.type === 'topic') onAddTopic?.(selectedItem.data);
    else onAddSection?.(selectedItem.data);
  };

  const handleEdit = () => {
    setMenuVisible(false);
    if (selectedItem?.type === 'topic') onEditTopic?.(selectedItem.data);
    else onEditSection?.(selectedItem.data);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    if (selectedItem?.type === 'topic') onDeleteTopic?.(selectedItem.data);
    else onDeleteSection?.(selectedItem.data);
  };

  // --- Рендер заголовку секції (рівень 2) ---
  const renderSectionHeader = useCallback(
    ({section}) => {
      if (section.id === -1) {
        return null;
      }
      const isExpanded = expandedLevel2[section.id] ?? false;
      const allWordIds = section.wordIds ?? [];
      const selectedCount = allWordIds.filter(id =>
        selectedRowsSet.has(id),
      ).length;
      const totalCount = allWordIds.length;
      const topicsCount = section.topics?.length ?? 0;
      const selectedTopicsCount = (section.topics ?? []).filter(t =>
        data
          .filter(w => w.topic_id === t.id)
          .some(w => selectedRowsSet.has(w.id)),
      ).length;
      const notFilled = (section.wordIds ?? []).filter(id => {
        const w = data.find(w => w.id === id);
        return w && (!w.word?.trim() || !w.translation?.trim());
      }).length;
      const allSelected = selectedCount === totalCount && totalCount > 0;
      const anySelected = selectedCount > 0 && !allSelected;

      let checkboxIcon = 'check-box-outline-blank';
      if (allSelected) checkboxIcon = 'check-box';
      else if (anySelected) checkboxIcon = 'indeterminate-check-box';

      return (
        <View>
          <TouchableOpacity
            onPress={() =>
              setExpandedLevel2(prev => ({
                ...prev,
                [section.id]: !prev[section.id],
              }))
            }
            style={{
              backgroundColor: cSectionBg,
              paddingHorizontal: 2,
              paddingVertical: 2,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onLongPress={() => {
              setSelectedItem({type: 'section', data: section});
              setMenuVisible(true);
            }}>
            <Text style={{fontWeight: '600', color: cSectionOn, fontSize: 14}}>
              ⋮
            </Text>
            <Pressable
              onPress={() => {
                if (allSelected) {
                  setSelectedRows(prev =>
                    prev.filter(id => !allWordIds.includes(id)),
                  );
                } else {
                  setSelectedRows(prev => [
                    ...new Set([...prev, ...allWordIds]),
                  ]);
                }
              }}
              hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
              style={{marginRight: 8}}>
              <MaterialIcons
                name={checkboxIcon}
                size={20}
                color={allSelected ? cItemOnAct : cItemOn}
              />
            </Pressable>
            <Text style={{fontWeight: '800', color: cSectionOn, fontSize: 14}}>
              {`${isExpanded ? '▲' : '▼'} `}
              <Text style={{color: cSectionOn}}>
                Гр:({topicsCount}
                {selectedTopicsCount > 0
                  ? `✔️${selectedTopicsCount}`
                  : null}){' '}
              </Text>
              <Text style={{color: cSectionOn}}>
                (📋{totalCount}
                {selectedCount > 0 ? <Text>{`✔️${selectedCount}`}</Text> : null}
                {notFilled > 0 ? (
                  <Text style={{color: 'red'}}>{`❗${notFilled}`}</Text>
                ) : null}
                )
              </Text>
              {`${section.title}`}
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [expandedLevel2, selectedRowsSet],
  );

  // --- Спільний рендер вмісту одного рядка даних (чекбокс, іконка правила,
  // колонки) — використовується і в renderFlatRow, і всередині renderTopic,
  // щоб не дублювати JSX двічі. ---
  const renderRowContent = useCallback(
    (item, {showMoveMarker = false} = {}) => {
      const isWordSelected = selectedRowsSet.has(item.id);

      let moveMarker = null;
      if (showMoveMarker && moveMode && moveInfo) {
        const {idx, groups, topicWords, word} = moveInfo;
        const targetIdx = idx + moveOffset;

        if (item.id === word.id) {
          moveMarker = <Text style={{color: 'orange', fontSize: 16}}>⮞</Text>;
        } else if (item.topic_id === word.topic_id) {
          const itemGroupKey =
            item.group_key && item.group_key.trim()
              ? item.group_key
              : String(item.id);
          const itemGroupIdx = groups.indexOf(itemGroupKey);
          const groupItems = topicWords.filter(
            w => (w.group_key || String(w.id)) === itemGroupKey,
          );

          if (
            moveOffset < 0 &&
            itemGroupIdx === targetIdx &&
            groupItems[0]?.id === item.id
          ) {
            moveMarker = <Text style={{color: 'orange', fontSize: 16}}>▲</Text>;
          } else if (
            moveOffset > 0 &&
            itemGroupIdx === targetIdx &&
            groupItems[groupItems.length - 1]?.id === item.id
          ) {
            moveMarker = <Text style={{color: 'orange', fontSize: 16}}>▼</Text>;
          }
        }
      }

      return (
        <>
          {/* Чекбокс / маркери переміщення */}
          <View style={{marginRight: 1}}>
            {moveMarker || (
              <MaterialIcons
                name={isWordSelected ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={isWordSelected ? cItemOnAct : cItemOn}
              />
            )}
          </View>

          {/* Іконка правила — тільки якщо у слова є rule_id */}
          {onOpenRule && item[openRuleField || 'rule_id'] ? (
            <TouchableOpacity
              onPress={() => onOpenRule(item[openRuleField || 'rule_id'])}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              style={{marginRight: 6, marginLeft: 8}}>
              <MaterialCommunityIcons
                name="book-open-page-variant-outline"
                size={18}
                color="red" // тимчасово захардкодь
              />
            </TouchableOpacity>
          ) : null}

          {/* Колонки даних */}
          {columns.map(column => {
            const value = item[column.accessor];
            let content;

            if (column.type === 'img') {
              return (
                <View
                  key={column.accessor}
                  style={[
                    {width: columnWidths[column.accessor] || column.width},
                    column.style,
                  ]}>
                  <Image
                    source={{uri: value}}
                    style={{
                      width: columnWidths[column.accessor] || column.width,
                      height: 40,
                      resizeMode: 'contain',
                    }}
                  />
                </View>
              );
            }

            if (column.type === 'flag') {
              const isOn = !!value;
              return (
                <TouchableOpacity
                  key={column.accessor}
                  onPress={() =>
                    onToggleFlag?.(item.id, column.accessor, !isOn)
                  }
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  style={[
                    {
                      width: columnWidths[column.accessor] || column.width,
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                    },
                    column.styleCell,
                  ]}>
                  <MaterialIcons
                    name={isOn ? 'star' : 'star-border'}
                    size={20}
                    color={isOn ? '#f5a623' : cItemOn}
                  />
                </TouchableOpacity>
              );
            }

            if (column.type === 'know') content = value ? '👍' : '';
            else if (column.type === 'boolean') content = value ? '✔' : '';
            else if (column.type === 'date')
              content = value ? new Date(value).toLocaleDateString() : '-';
            else if (column.type === 'integer')
              content = value != null ? Math.floor(value) : '-';
            else content = value;

            return (
              <View
                key={column.accessor}
                style={[
                  {
                    width: columnWidths[column.accessor] || column.width,
                    justifyContent: 'center',
                    height: '100%',
                    paddingHorizontal: 1,
                  },
                  column.styleCell,
                ]}>
               <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.rowText,
                    {
                      color: isWordSelected ? cItemOnAct : cItemOn,
                      lineHeight: 20,
                    },
                    column.styleCellText,
                  ]}>
                  {content}
                </Text>
              </View>
            );
          })}
        </>
      );
    },
    [
      selectedRowsSet,
      moveMode,
      moveInfo,
      moveOffset,
      columns,
      columnWidths,
      cItemOn,
      cItemOnAct,
      onOpenRule,
      openRuleField,
    ],
  );

  // --- Рендер одного рядка в ПЛОСКОМУ режимі (без тем/секцій) ---
  // Викликається напряму з SectionList, без вкладеного FlatList —
  // саме це дає SectionList реальну кількість елементів і робочий скрол.
  const renderFlatRow = useCallback(
    ({item}) => {
      const isWordSelected = selectedRowsSet.has(item.id);
      return (
        <Pressable
          onPress={() => handleRowPress(item)}
          onLongPress={() => {
            const text = item.word || item.title || item.translation || '';
            if (text.length > 0) {
              setPreviewModal({visible: true, text});
            }
          }}
          delayLongPress={400}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderColor: cBorder,
            backgroundColor: isWordSelected ? cItemBgAct : cItemBg,
            height: 38,
            paddingLeft: 8,
            overflow: 'hidden',
          }}>
          {renderRowContent(item, {showMoveMarker: true})}
        </Pressable>
      );
    },
    [
      selectedRowsSet,
      handleRowPress,
      cBorder,
      cItemBg,
      cItemBgAct,
      renderRowContent,
    ],
  );

  // --- Рендер теми з словами (рівні 1 + 0) ---
  const renderTopic = useCallback(
    ({item: topic}) => {
      const words = topic.words || [];
      const allWordIds = words.map(w => w.id);
      const selectedCount = allWordIds.filter(id =>
        selectedRowsSet.has(id),
      ).length;
      const totalCount = allWordIds.length;
      const allSelected = allWordIds.every(id => selectedRowsSet.has(id));
      const anySelected = allWordIds.some(id => selectedRowsSet.has(id));

      let checkboxIcon = 'check-box-outline-blank';
      if (allSelected) checkboxIcon = 'check-box';
      else if (anySelected) checkboxIcon = 'indeterminate-check-box';

      const isFakeTopic = topic.id === -1;
      const isExpanded = isFakeTopic ? true : !!expandedLevel1[topic.id];

      return (
        <View>
          {/* Заголовок теми */}
          {!isFakeTopic && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 2,
                paddingLeft: 4,
                backgroundColor: cLevel1Bg,
              }}>
              <Text
                style={{fontWeight: '600', color: cSectionOn, fontSize: 14}}>
                ⋮
              </Text>
              <Pressable
                onPress={() => {
                  if (allSelected) {
                    setSelectedRows(prev =>
                      prev.filter(id => !allWordIds.includes(id)),
                    );
                  } else {
                    setSelectedRows(prev => [
                      ...new Set([...prev, ...allWordIds]),
                    ]);
                  }
                }}
                hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
                style={{marginRight: 8}}>
                <MaterialIcons
                  name={checkboxIcon}
                  size={20}
                  color={allSelected || anySelected ? cItemOnAct : cItemOn}
                />
              </Pressable>
              <TouchableOpacity
                onPress={() =>
                  setExpandedLevel1(prev => ({
                    ...prev,
                    [topic.id]: !prev[topic.id],
                  }))
                }
                onLongPress={() => {
                  setSelectedItem({type: 'topic', data: topic});
                  setMenuVisible(true);
                }}
                delayLongPress={500}
                style={{flex: 1}}>
                <Text
                  style={{fontWeight: '800', color: cLevel1On, fontSize: 14}}>
                  {`${isExpanded ? '▲' : '▼'} `}
                  <Text style={{color: cLevel1On}}>
                    Те:(📋{totalCount}
                    {selectedCount > 0 ? (
                      <Text
                        style={{
                          color: cLevel1On,
                        }}>{` ✔️${selectedCount}`}</Text>
                    ) : null}
                    {(() => {
                      const notFilled = words.filter(
                        w => !w.word?.trim() || !w.translation?.trim(),
                      ).length;
                      return notFilled > 0 ? (
                        <Text style={{color: 'red'}}>{` ❗${notFilled}`}</Text>
                      ) : null;
                    })()}
                    )
                  </Text>
                  {` ${topic.title}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Слова */}
          {isExpanded && (
            <FlatList
              data={words}
              keyExtractor={item => String(item.id)}
              //   extraData={selectedRowsSet}
              extraData={[selectedRowsSet, moveInfo]} // ← замінити
              scrollEnabled={true}
              nestedScrollEnabled={true}
              contentContainerStyle={{paddingLeft: 16}}
              renderItem={({item}) => {
                const isWordSelected = selectedRowsSet.has(item.id);
                return (
                  <Pressable
                    onPress={() => handleRowPress(item)}
                    onLongPress={() => {
                      const text = item.word || item.translation || '';
                      if (text.length > 0) {
                        setPreviewModal({visible: true, text});
                      }
                    }}
                    delayLongPress={400}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderBottomWidth: 1,
                      borderColor: cBorder,
                      backgroundColor: isWordSelected ? cItemBgAct : cItemBg,
                      //   height: 44,
                      height: 38,
                      paddingLeft: 8,
                      overflow: 'hidden',
                    }}>
                    {renderRowContent(item, {showMoveMarker: true})}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      );
    },
    [
      expandedLevel1,
      selectedRowsSet,
      handleRowPress,
      moveMode,
      moveOffset,
      moveInfo,
      selectedRows,
      data,
      renderRowContent,
      cBorder,
      cItemBg,
      cItemBgAct,
      cLevel1Bg,
      cLevel1On,
      cSectionOn,
      cItemOn,
      cItemOnAct,
    ],
  );
  // Якщо showPlayer — рендеримо тільки WordPlayerBar на весь екран
  if (showPlayer) {
    return (
      <View style={{flex: 1}}>
        <WordPlayerBar
          selectedWords={data.filter(w => selectedRows.includes(w.id))}
          indexScheme={indexScheme}
          onClose={() => setShowPlayer(false)}
        />
      </View>
    );
  }
  // ************************************
  return (
    <View style={styles.pageContainer}>
      {/* Заголовок сторінки */}
      <View style={styles.pageHeadContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Text>✅ {selectedRows.length}</Text>
        </View>
        <Text
          style={[
            styles.tableTittleText,
            {color: cTableTitleText, fontSize: sPageTitleFont},
          ]}>
          {title}
        </Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Text>📄 {data.length}</Text>
        </View>
      </View>
      {/* Таблиця */}
      <View style={styles.tableContainer}>
        <ScrollView
          horizontal
          style={{flex: 1}}
          contentContainerStyle={{flexGrow: 1}}>
          <View style={{flex: 1}}>
            {/* Шапка таблиці */}
            <View style={styles.tableHeadRow}>
              {(() => {
                const allIds = data.map(d => d.id);
                const selectedCount = allIds.filter(id =>
                  selectedRowsSet.has(id),
                ).length;
                const allSelected =
                  selectedCount === allIds.length && allIds.length > 0;
                const anySelected = selectedCount > 0 && !allSelected;
                let icon = 'check-box-outline-blank';
                if (allSelected) icon = 'check-box';
                else if (anySelected) icon = 'indeterminate-check-box';
                return (
                  <Pressable
                    onPress={() => setSelectedRows(allSelected ? [] : allIds)}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    style={{
                      width: 30,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MaterialIcons
                      name={icon}
                      size={20}
                      color={
                        allSelected || anySelected ? cItemOnAct : cTableHeadOn
                      }
                    />
                  </Pressable>
                );
              })()}
              {onOpenRule ? (
                <View
                  style={{
                    width: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <MaterialCommunityIcons
                    name="book-open-page-variant-outline"
                    size={18}
                    color={cTableHeadOn}
                  />
                </View>
              ) : null}
              {columns.map(col => (
                <View
                  key={col.accessor}
                  style={[
                    styles.tableHeadCell,
                    {
                      width: columnWidths[col.accessor] || col.width,
                      position: 'relative',
                      overflow: 'visible',
                    },
                  ]}>
                  <View style={[styles.headerTextContainer, col.styleHeadCell]}>
                    <Text
                      style={[
                        styles.headerText,
                        {color: cTableHeadOn},
                        col.styleHeadText,
                      ]}
                      numberOfLines={1}>
                      {col.label}
                    </Text>
                  </View>
                  <View
                    onTouchEnd={() =>
                      setResizePanel({open: true, column: col.accessor})
                    }
                    style={{
                      width: 30,
                      height: '120%',
                      marginRight: -10,
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      zIndex: 2,
                      backgroundColor: 'rgba(0,0,255,0.07)',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      borderRadius: 8,
                    }}
                    hitSlop={{left: 4, right: 4, top: 4, bottom: 4}}
                  />
                </View>
              ))}
            </View>
            {/* Основний список */}
            <SectionList
              sections={sections}
              keyExtractor={item => item.key}
              renderSectionHeader={renderSectionHeader}
              renderItem={isFlatMode ? renderFlatRow : renderTopic}
              extraData={[selectedRowsSet, moveInfo]}
              stickySectionHeadersEnabled={false}
              removeClippedSubviews={true}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={5}
              style={{flex: 1}}
            />
          </View>
        </ScrollView>
      </View>
      {/* ▶ Панель відтворення вибраних слів */}
      {selectedRows.length > 0 && showPlayer && (
        <WordPlayerBar
          selectedWords={data.filter(w => selectedRows.includes(w.id))}
          indexScheme={indexScheme}
          onClose={() => setShowPlayer(false)}
        />
      )}
      {/* Кнопки управління */}
      {/* FAB кнопка */}
      {!showPlayer && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setFabMenuVisible(true)}>
          <MaterialIcons name="menu" color="#fff" size={26} />
        </TouchableOpacity>
      )}
      {/* Bottom Sheet меню */}
      <Modal
        visible={fabMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFabMenuVisible(false)}>
        <Pressable
          style={styles.fabOverlay}
          onPress={() => setFabMenuVisible(false)}>
          <View style={[styles.fabSheet, {backgroundColor: cModalBg}]}>
            {/* Заголовок */}
            <View style={styles.fabSheetHeader}>
              <Text style={[styles.fabSheetTitle, {color: cModalOn}]}>
                {hasSelectedRows ? `✔ ${selectedRows.length} вибрано` : 'Дії'}
              </Text>
              <TouchableOpacity onPress={() => setFabMenuVisible(false)}>
                <MaterialIcons name="close" size={22} color={cModalOn} />
              </TouchableOpacity>
            </View>

            {/* ── Без вибраних ── */}
            {!hasSelectedRows && (
              <View style={styles.fabGroup}>
                {onAdd && (
                  <TouchableOpacity
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={handleAddPress}>
                    <Entypo name="add-to-list" color={cIcon} size={22} />
                    <Text style={[styles.fabItemText, {color: cBtnText}]}>
                      Додати
                    </Text>
                  </TouchableOpacity>
                )}
                {onImport && (
                  <TouchableOpacity
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={() => {
                      setFabMenuVisible(false);
                      onImport();
                    }}>
                    <AntDesign name="upload" color={cIcon} size={22} />
                    <Text style={[styles.fabItemText, {color: cBtnText}]}>
                      Імпорт з CSV
                    </Text>
                  </TouchableOpacity>
                )}
                {onImportText && (
                  <TouchableOpacity
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={() => {
                      setFabMenuVisible(false);
                      onImportText();
                    }}>
                    <AntDesign name="filetext1" color={cIcon} size={22} />
                    <Text style={[styles.fabItemText, {color: cBtnText}]}>
                      Імпорт тексту
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── З вибраними ── */}
            {hasSelectedRows && !moveMode && (
              <View style={styles.fabGroup}>
                {onDelete && (
                  <TouchableOpacity
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={() => {
                      setFabMenuVisible(false);
                      onDelete(selectedRows);
                      setSelectedRows([]);
                      setSelectedRowsData([]);
                      setSelectedRowData(null);
                    }}>
                    <AntDesign name="delete" color={'#e53935'} size={22} />
                    <Text style={[styles.fabItemText, {color: '#e53935'}]}>
                      Видалити
                    </Text>
                  </TouchableOpacity>
                )}
                {hasOneSelectedRow && (
                  <TouchableOpacity
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={() => {
                      setFabMenuVisible(false);
                      setMoveOffset(0);
                      setMoveMode(true);
                    }}>
                    <MaterialIcons name="swap-vert" color={cIcon} size={22} />
                    <Text style={[styles.fabItemText, {color: cBtnText}]}>
                      Перемістити
                    </Text>
                  </TouchableOpacity>
                )}
                {hasOneSelectedRow && onEdit && (
                  <TouchableOpacity
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={() => {
                      setFabMenuVisible(false);
                      onEdit(selectedRowData);
                    }}>
                    <Feather name="edit" color={cIcon} size={22} />
                    <Text style={[styles.fabItemText, {color: cBtnText}]}>
                      Редагувати
                    </Text>
                  </TouchableOpacity>
                )}
                {onTranslate && (
                  <TouchableOpacity
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={() => {
                      setFabMenuVisible(false);
                      onTranslate(selectedRows);
                    }}>
                    <MaterialCommunityIcons
                      name="translate"
                      color={cIcon}
                      size={22}
                    />
                    <Text style={[styles.fabItemText, {color: cBtnText}]}>
                      {translate ? 'Зупинити переклад' : 'Перекласти'}
                    </Text>
                  </TouchableOpacity>
                )}
                {onExportWordsToSite && (
                  <TouchableOpacity
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={() => {
                      setFabMenuVisible(false);
                      onExportWordsToSite(selectedRows);
                    }}>
                    <Feather name="upload-cloud" color={cIcon} size={22} />
                    <Text style={[styles.fabItemText, {color: cBtnText}]}>
                      Експорт слів на сайт
                    </Text>
                  </TouchableOpacity>
                )}

                {onSaveToAudio && (
                  <TouchableOpacity
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={() => {
                      setFabMenuVisible(false);
                      onSaveToAudio(selectedRows);
                      setSelectedRows([]);
                      setSelectedRowsData([]);
                      setSelectedRowData(null);
                    }}>
                    <MaterialIcons name="audio-file" color={cIcon} size={22} />
                    <Text style={[styles.fabItemText, {color: cBtnText}]}>
                      Записати звук
                    </Text>
                  </TouchableOpacity>
                )}
                {!showPlayer && (
                  <TouchableOpacity
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={() => {
                      setFabMenuVisible(false);
                      setShowPlayer(true);
                    }}>
                    <MaterialIcons name="volume-up" color={cIcon} size={22} />
                    <Text style={[styles.fabItemText, {color: cBtnText}]}>
                      Озвучити
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                  onPress={() => {
                    setFabMenuVisible(false);
                    setSelectedRows([]);
                    setSelectedRowsData([]);
                    setSelectedRowData(null);
                    setMoveMode(false);
                    setMoveOffset(0);
                  }}>
                  <MaterialIcons name="deselect" color={cIcon} size={22} />
                  <Text style={[styles.fabItemText, {color: cBtnText}]}>
                    Зняти всі
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
      {/* Вибір секції, коли додаємо Тему і секцій декілька */}
      <Modal
        visible={sectionPicker.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setSectionPicker({visible: false})}>
        <Pressable
          style={styles.fabOverlay}
          onPress={() => setSectionPicker({visible: false})}>
          <View style={[styles.fabSheet, {backgroundColor: cModalBg}]}>
            <View style={styles.fabSheetHeader}>
              <Text style={[styles.fabSheetTitle, {color: cModalOn}]}>
                В яку секцію додати тему?
              </Text>
              <TouchableOpacity
                onPress={() => setSectionPicker({visible: false})}>
                <MaterialIcons name="close" size={22} color={cModalOn} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight: 320}}>
              <View style={styles.fabGroup}>
                {dataLevel2.map(section => (
                  <TouchableOpacity
                    key={section.id}
                    style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                    onPress={() => {
                      setSectionPicker({visible: false});
                      onAddTopic?.(section);
                    }}>
                    <MaterialIcons name="folder-open" color={cIcon} size={22} />
                    <Text style={[styles.fabItemText, {color: cBtnText}]}>
                      {section.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
      {/* // Окрема модалка переміщення */}
      <Modal
        visible={moveMode && hasOneSelectedRow && !!moveInfo}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setMoveMode(false);
          setMoveOffset(0);
        }}>
        {/* Прозорий overlay — не затемнює екран */}
        <View style={styles.moveModeOverlay}>
          <View style={[styles.fabSheet, {backgroundColor: cModalBg}]}>
            <View style={styles.fabSheetHeader}>
              <Text style={[styles.fabSheetTitle, {color: cModalOn}]}>
                Переміщення: {moveInfo?.idx + moveOffset + 1} /{' '}
                {moveInfo?.total}
              </Text>
            </View>
            <View style={styles.fabGroup}>
              <TouchableOpacity
                style={[
                  styles.fabItem,
                  {backgroundColor: cBtnBg},
                  moveInfo?.idx + moveOffset <= 0 && {opacity: 0.4},
                ]}
                disabled={moveInfo?.idx + moveOffset <= 0}
                onPress={() => setMoveOffset(prev => prev - 1)}>
                <MaterialIcons name="arrow-upward" color={cIcon} size={22} />
                <Text style={[styles.fabItemText, {color: cBtnText}]}>
                  Вгору
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.fabItem,
                  {backgroundColor: cBtnBg},
                  moveInfo?.idx + moveOffset >= moveInfo?.total - 1 && {
                    opacity: 0.4,
                  },
                ]}
                disabled={moveInfo?.idx + moveOffset >= moveInfo?.total - 1}
                onPress={() => setMoveOffset(prev => prev + 1)}>
                <MaterialIcons name="arrow-downward" color={cIcon} size={22} />
                <Text style={[styles.fabItemText, {color: cBtnText}]}>
                  Вниз
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fabItem, {backgroundColor: cBtnBg}]}
                onPress={() => {
                  if (moveOffset !== 0) moveSelectedRow(moveOffset);
                  setMoveMode(false);
                  setMoveOffset(0);
                  onRefresh?.();
                }}>
                <MaterialIcons name="done" color={cButtonOnAct} size={22} />
                <Text style={[styles.fabItemText, {color: cButtonOnAct}]}>
                  Готово
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/*Модалка розкриття тексту поля при довгому натисканні */}
      <Modal
        visible={previewModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewModal({visible: false, text: ''})}>
        <TouchableOpacity
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.3)'}}
          onPress={() => setPreviewModal({visible: false, text: ''})}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70%',
            backgroundColor: 'white',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            padding: 16,
          }}>
          <ScrollView style={{flex: 1}}>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: '#1a73e8',
                fontWeight: 'bold',
              }}>
              {previewModal.text.split('\n')[0]}
            </Text>
            <Text style={{fontSize: 16, lineHeight: 24}}>
              {previewModal.text.split('\n').slice(1).join('\n')}
            </Text>
          </ScrollView>
          <TouchableOpacity
            style={[styles.cancelBtn, {marginTop: 12}]}
            onPress={() => setPreviewModal({visible: false, text: ''})}>
            <Text style={styles.cancelText}>Закрити</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* Модальне меню (довгий тап на темі/секції) */}
      <Modal
        visible={isMenuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                Дії з {selectedItem?.type === 'topic' ? 'темою' : 'секцією'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedItem?.data
                  ? `${selectedItem.type === 'topic' ? 'Тема' : 'Секція'}: ${
                      selectedItem.data.title
                    }`
                  : ''}
              </Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleAdd}>
                <MaterialIcons
                  name="add-circle-outline"
                  size={28}
                  color="green"
                />
                <Text style={styles.btnText}>Додати</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleEdit}>
                <MaterialIcons name="edit" size={28} color="orange" />
                <Text style={styles.btnText}>Редагувати</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
                <MaterialIcons name="delete-outline" size={28} color="red" />
                <Text style={[styles.btnText, {color: 'red'}]}>Видалити</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setMenuVisible(false)}>
              <Text style={styles.cancelText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      {/* Панель ресайзу колонок */}
      <ResizeDock
        open={resizePanel.open}
        column={columns.find(c => c.accessor === resizePanel.column)?.label}
        width={columnWidths[resizePanel.column] || 100}
        onChange={w =>
          setColumnWidths(curr => ({...curr, [resizePanel.column]: w}))
        }
        onClose={() => setResizePanel({open: false, column: null})}
      />
      {/* Індикатор запису рзвучки */}
      {loading && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.5)', // Напівпрозорий фон
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000, // Щоб було поверх таблиці
          }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
};

export default TableViewLevels;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pageHeadContainer: {
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableTittleText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  tableHeadRow: {
    paddingStart: 4,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  tableHeadCell: {
    padding: 2,
    borderRightWidth: 1,
  },
  headerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'center',
  },
  rowText: {
    fontSize: 14,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginVertical: 5,
    gap: 5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 100,
    marginHorizontal: 10,
    paddingVertical: 2,
    paddingHorizontal: 10,
    gap: 5,
  },
  btnText: {
    fontFamily: 'Poppins-SemiBold',
  },
  resizeDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  resizeDockLabel: {
    width: '100%',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  resizeDockBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resizeDockWidth: {
    marginHorizontal: 20,
    minWidth: 50,
    textAlign: 'center',
    fontSize: 16,
  },
  resBtn: {
    padding: 10,
    marginHorizontal: 2,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    elevation: 8,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  cancelText: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  fabOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  fabSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 16,
    elevation: 10,
  },
  fabSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  fabSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  fabGroup: {
    gap: 2,
  },
  fabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  fabItemText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
  },
  moveModeOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    // backgroundColor: 'rgba(0,0,0,0.4)' — НЕ МАЄ БУТИ!
  },
});
