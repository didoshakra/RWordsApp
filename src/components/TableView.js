// TableView.js /SectionList/Гориз. скрол/ з кольорами/мультивиділення/
// ResizeColl стрілки/перемішення рядків стрілки/Update "pn"
//виділення <1сек
//
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useContext,
} from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {LogBox} from 'react-native';
import {ThemeContext} from '@/context/ThemeContext';
import TableHelpModal from './TableHelpModal';

LogBox.ignoreLogs([
  'ref.measureLayout must be called with a ref to a native component',
]);

// --- Компонент для повтору назви секції по всій ширині таблиці ---
function SectionHeaderRepeat({
  title,
  totalWidth,
  padding = 30,
  textStyle,
  containerStyle,
}) {
  const [titleWidth, setTitleWidth] = useState(0);

  const baseContainerStyle = {
    width: totalWidth,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  };

  const combinedContainerStyle = [baseContainerStyle, containerStyle];

  // Перший рендер: визначення ширини тексту
  if (!titleWidth && totalWidth > 0) {
    return (
      <View style={combinedContainerStyle}>
        <Text
          onLayout={e => setTitleWidth(e.nativeEvent.layout.width)}
          style={[{fontWeight: 'bold'}, textStyle]}>
          {title}
        </Text>
      </View>
    );
  }

  // Розрахунок кількості повторень заголовка
  const n = Math.ceil(totalWidth / (titleWidth + padding));
  const arr = Array(n).fill(0);

  return (
    <View style={combinedContainerStyle}>
      {arr.map((_, i) => (
        <Text
          key={i}
          style={[
            {
              fontWeight: 'bold',
              marginRight: padding / 2,
              marginLeft: i === 0 ? 0 : padding / 2,
            },
            textStyle,
          ]}>
          {title}
        </Text>
      ))}
    </View>
  );
}

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
          <Text style={{fontSize: 24}}>-</Text>
        </TouchableOpacity>
        <Text style={styles.resizeDockWidth}>{width}px</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, width + step))}
          style={styles.resBtn}>
          <Text style={{fontSize: 24}}>+</Text>
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

// Мемо-компонент для рядка таблиці
const TableRow = React.memo(function TableRow({
  item,
  isActive,
  onPress,
  columns,
  columnWidths,
  cItemBg,
  cItemOn,
  cItemBgAct,
  cItemOnAct,
}) {
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      style={{
        backgroundColor: isActive ? cItemBgAct : cItemBg,
      }}>
      <View style={styles.rowContainer}>
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
                    height: column.width,
                    resizeMode: 'contain',
                  }}
                />
              </View>
            );
          }
          if (column.type === 'know') {
            // content = value ? '👍' : '👎';
            content = value ? '👍' : '';
          } else if (column.type === 'boolean') {
            // content = value ? '✔' : '✖';
            content = value ? '✔' : '';
          } else if (column.type === 'date') {
            content = value ? new Date(value).toLocaleDateString() : '-';
          } else if (column.type === 'integer') {
            content = value != null ? Math.floor(value) : '-';
          } else if (column.type === 'number') {
            content = value != null ? value.toFixed(2) : '-';
          } else {
            content = value;
          }
          return (
            <View
              key={column.accessor}
              style={[
                {
                  width: columnWidths[column.accessor] || column.width,
                  paddingLeft: 5,
                  justifyContent: 'center',
                },
                column.styleCell,
              ]}>
              <Text
                style={[
                  styles.rowText,
                  {
                    // color: isActive ? '#00f' : '#000',
                    color: isActive ? cItemOnAct : cItemOn,
                  },
                ]}>
                {content}
              </Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
});

const TableView = ({
  data,
  setData,
  onSavePn,
  columns,
  title,
  indexScheme,
  onAdd,
  onEdit,
  onDelete,
  onSaveToAudio,
  onImport,
  onTranslate,
  sectionId,
  sectionName,
  beforeSectionName = 'Секція',
  sortField = 'pn',
  translate,
}) => {
  console.log('TableView/data', data);
  const {sizes, getColorScheme} = useContext(ThemeContext);
  const sPageTitleFont = sizes.sPageTitleFont;
  const scheme = getColorScheme(indexScheme);
  const cTableTitleText = scheme.titleOn;
  const cTableHeadBg = scheme.headerBg;
  const cTableHeadOn = scheme.headerOn;
  const cIconHead = scheme.modalOn;
  const cSectionBg = scheme.sectionBg;
  const cSectionOn = scheme.sectionOn;
  const cItemBg = scheme.itemBg;
  const cItemOn = scheme.itemOn;
  const cItemBgAct = scheme.itemBgAct;
  const cItemOnAct = scheme.itemOnAct;
  const cBorder = scheme.border;
  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;
  const cBtnBorder = scheme.buttonBorder;
  const cIcon = scheme.buttonOn;

  const cModalBg = scheme.modalBg;
  const cModalOn = scheme.modalOn;

  const [activeRows, setActiveRows] = useState([]);
  const [activeRowData, setActiveRowData] = useState(null);
  const [moveMode, setMoveMode] = useState(false);
  const [sections, setSections] = useState([]);
  const dataRef = useRef(data);
  const changedPnRef = useRef(false);

  const [columnWidths, setColumnWidths] = useState(
    columns.reduce((acc, col) => ({...acc, [col.accessor]: col.width}), {}),
  );
  const [resizePanel, setResizePanel] = useState({open: false, column: null});
  const minWidth = 30;

  useEffect(() => {
    setColumnWidths(
      columns.reduce((acc, col) => ({...acc, [col.accessor]: col.width}), {}),
    );
  }, [columns]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (changedPnRef.current) {
          Alert.alert(
            'Зберегти зміни?',
            'Було змінено порядок. Зберегти зміни?',
            [
              {text: 'Ні', style: 'cancel'},
              {
                text: 'Так',
                onPress: () => {
                  onSavePn(dataRef.current);
                },
              },
            ],
          );
        }
      };
    }, []),
  );

  const groupBy = (array, key) => {
    return array.reduce((result, item) => {
      (result[item[key]] = result[item[key]] || []).push(item);
      return result;
    }, {});
  };

  const moveSelectedRow = direction => {
    if (activeRows.length !== 1) return;
    const rowId = activeRows[0];
    const secIdx = sections.findIndex(sec =>
      sec.data.some(row => row.id === rowId),
    );
    if (secIdx === -1) return;
    const section = sections[secIdx];
    const idx = section.data.findIndex(row => row.id === rowId);
    if (idx === -1) return;
    let newSectionData = [...section.data];
    let newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= newSectionData.length) return;
    const [removed] = newSectionData.splice(idx, 1);
    newSectionData.splice(newIdx, 0, removed);
    newSectionData = newSectionData.map((item, i) => ({
      ...item,
      [sortField]: i + 1,
    }));
    const newSections = sections.map((sec, i) =>
      i === secIdx ? {...sec, data: newSectionData} : sec,
    );
    setSections(newSections);
    changedPnRef.current = true;
    if (typeof setData === 'function') {
      const flatData = newSections.flatMap(sec => sec.data);
      setData(flatData);
    }
    setActiveRowData(newSectionData[newIdx]);
  };

  useEffect(() => {
    if (sectionId) {
      const grouped = groupBy(data, sectionId);
      const newSections = Object.entries(grouped).map(([key, groupItems]) => ({
        key,
        data: groupItems,
        title: groupItems[0]?.[sectionName] ?? key,
        beforeTitle: beforeSectionName,
      }));
      setSections(newSections);
    } else {
      setSections([
        {
          key: 'all',
          data,
          title: 'Усі',
          beforeTitle: beforeSectionName,
        },
      ]);
    }
  }, [data]);
const activeRowsSet = useMemo(() => new Set(activeRows), [activeRows]);


  const handleRowPress = useCallback(
    item => {
      setActiveRows(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id],
      );
      setActiveRowData(prev =>
        activeRows.length === 1 && activeRows[0] === item.id
          ? null
          : activeRows.length === 0
          ? item
          : null,
      );
    },
    [activeRows],
  );

  const renderItem = useCallback(
    ({item}) => (
      <TableRow
        item={item}
        isActive={activeRowsSet.has(item.id)}
        onPress={handleRowPress}
        columns={columns}
        columnWidths={columnWidths}
        cItemBgAct={cItemBgAct}
        cItemBg={cItemBg}
        cItemOnAct={cItemOnAct}
        cItemOn={cItemOn}
      />
    ),
    [activeRowsSet, handleRowPress, columns, columnWidths, cItemBgAct, cItemBg],
  );

  const totalWidth = useMemo(
    () =>
      columns.reduce(
        (sum, col) => sum + (columnWidths[col.accessor] || col.width || 0),
        0,
      ),
    [columns, columnWidths],
  );

  // --- SectionHeader з автозаповненням
  const renderSectionHeader = useCallback(
    ({section}) => (
      <SectionHeaderRepeat
        title={`${section.beforeTitle}: ${section.title}`}
        totalWidth={totalWidth}
        padding={40}
        containerStyle={{backgroundColor: cSectionBg}}
        textStyle={{color: cSectionOn, fontSize: 15}}
      />
    ),
    [totalWidth, cSectionOn, cSectionBg],
  );

  let moveInfo = null;
  if (activeRows.length === 1 && moveMode) {
    const rowId = activeRows[0];
    const sec = sections.find(sec => sec.data.some(row => row.id === rowId));
    if (sec) {
      const idx = sec.data.findIndex(row => row.id === rowId);
      moveInfo = {
        idx,
        total: sec.data.length,
      };
    }
  }

  const hasSelectedRows = activeRows.length > 0;
  const hasMultipleSelectedRows = activeRows.length > 1;


  return (
    <View style={styles.pageContainer}>
      <View style={styles.pageHeadContainer}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Text>✅ {activeRows.length}</Text>
          {/* <TouchableOpacity onPress={onAdd}>
            <Entypo name="thumbs-up" color={cIconHead} size={20} />
          </TouchableOpacity> */}
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
          <TableHelpModal pcBg={cModalBg} pcOn={cModalOn} />
        </View>
      </View>

      <View style={styles.tableContainer}>
        <ScrollView horizontal>
          <View>
            <View
              style={[
                styles.tableHeadRow,
                {
                  borderColor: cBorder,
                  backgroundColor: cTableHeadBg,
                  width: totalWidth,
                },
              ]}>
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
                  <View style={styles.headerTextContainer}>
                    <Text
                      style={[styles.headerText, {color: cTableHeadOn}]}
                      numberOfLines={1}>
                      {col.label}
                    </Text>
                  </View>
                  <View
                    onTouchEnd={() =>
                      setResizePanel({open: true, column: col.accessor})
                    }
                    style={{
                      width: 30, // широка зона для тапу!
                      height: '120%',
                      marginRight: -10, // частина заходить "під" текст
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      zIndex: 2,
                      backgroundColor: 'rgba(0,0,255,0.07)', // для тесту, потім зробити прозорою
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      borderRadius: 8,
                    }}
                    hitSlop={{left: 4, right: 4, top: 4, bottom: 4}}
                  />
                </View>
              ))}
            </View>
            <View style={styles.dragListContainer}>
              <SectionList
                sections={sections}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                stickySectionHeadersEnabled={false}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={21}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({
                  length: 44,
                  offset: 44 * index,
                  index,
                })}
              />
            </View>
          </View>
        </ScrollView>
      </View>
      {/* buttonsContainer */}
      <View style={[styles.buttonsContainer]}>
        {!hasSelectedRows && onAdd && (
          <TouchableOpacity
            style={[
              styles.button,
              {backgroundColor: cBtnBg, borderColor: cBtnBorder},
            ]}
            onPress={onAdd}>
            <Entypo name="add-to-list" color={cIcon} size={20} />
            <Text style={[styles.btnText, {color: cBtnText}]}>Додати</Text>
          </TouchableOpacity>
        )}
        {!hasSelectedRows && onImport && (
          <TouchableOpacity
            style={[
              styles.button,
              {backgroundColor: cBtnBg, borderColor: cBtnBorder},
            ]}
            onPress={onImport}>
            <AntDesign name="upload" color={cIcon} size={20} />
            <Text style={[styles.btnText, {color: cBtnText}]}>
              Імпорт з CSV
            </Text>
          </TouchableOpacity>
        )}
        {!hasSelectedRows && onTranslate && (
          <TouchableOpacity
            style={[
              styles.button,
              {backgroundColor: cBtnBg, borderColor: cBtnBorder},
            ]}
            onPress={onTranslate}>
            <MaterialCommunityIcons name="translate" color={cIcon} size={20} />
            <Text style={[styles.btnText, {color: cBtnText}]}>
              {translate ? 'Зупинити переклад' : 'Перекласти всі слова'}
            </Text>
          </TouchableOpacity>
        )}
        {!moveMode && activeRows.length === 1 && (
          <>
            {onEdit && (
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: cBtnBg, borderColor: cBtnBorder},
                ]}
                onPress={() => onEdit(activeRowData)}>
                <Feather name="edit" color={cIcon} size={20} />
                <Text style={[styles.btnText, {color: cBtnText}]}>
                  Редагувати
                </Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: cBtnBg, borderColor: cBtnBorder},
                ]}
                onPress={() => {
                  onDelete(activeRows);
                  setActiveRows([]);
                  setActiveRowData(null);
                }}>
                <AntDesign name="delete" color={cIcon} size={20} />
                <Text style={[styles.btnText, {color: cBtnText}]}>
                  Видалити
                </Text>
              </TouchableOpacity>
            )}
            {onSaveToAudio && (
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: cBtnBg, borderColor: cBtnBorder},
                ]}
                onPress={() => {
                  onSaveToAudio(activeRows);
                  setActiveRows([]);
                  setActiveRowData(null);
                }}>
                {/* <MaterialIcons name="audio-file" color={cIcon} size={20} /> */}
                <Text style={[styles.btnText, {color: cBtnText}]}>
                  Записати Звук
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: cBtnBg, borderColor: cBtnBorder},
              ]}
              onPress={() => setMoveMode(true)}>
              <MaterialIcons name="swap-vert" color={cIcon} size={20} />
              <Text style={[styles.btnText, {color: cBtnText}]}>
                Перемістити рядок
              </Text>
            </TouchableOpacity>
          </>
        )}
        {moveMode && activeRows.length === 1 && moveInfo && (
          <>
            <Text style={{fontWeight: 'bold', fontSize: 16}}>
              Рядок {moveInfo.idx + 1} із {moveInfo.total}
            </Text>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: cBtnBg,
                  borderColor: cBtnBorder,
                  opacity: moveInfo.idx === 0 ? 0.5 : 1,
                },
              ]}
              onPress={() => moveSelectedRow('up')}
              disabled={moveInfo.idx === 0}>
              <MaterialIcons name="arrow-upward" color={cIcon} size={20} />
              <Text style={[styles.btnText, {color: cBtnText}]}>Вгору</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: cBtnBg,
                  borderColor: cBtnBorder,
                  opacity: moveInfo.idx === moveInfo.total - 1 ? 0.5 : 1,
                },
              ]}
              onPress={() => moveSelectedRow('down')}
              disabled={moveInfo.idx === moveInfo.total - 1}>
              <MaterialIcons name="arrow-downward" color={cIcon} size={20} />
              <Text style={[styles.btnText, {color: cBtnText}]}>Вниз</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: '#eee', borderColor: cBtnBorder},
              ]}
              onPress={() => setMoveMode(false)}>
              <MaterialIcons name="done" color={'#333'} size={20} />
              <Text style={[styles.btnText, {color: '#333'}]}>Готово</Text>
            </TouchableOpacity>
          </>
        )}
        {hasMultipleSelectedRows && (
          <>
            {onDelete && (
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: cBtnBg, borderColor: cBtnBorder},
                ]}
                onPress={() => {
                  onDelete(activeRows);
                  setActiveRows([]);
                  setActiveRowData(null);
                }}>
                <AntDesign name="delete" color={cIcon} size={20} />
                <Text style={[styles.btnText, {color: cBtnText}]}>
                  Видалити
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: cBtnBg, borderColor: cBtnBorder},
              ]}
              onPress={() => {
                setActiveRows([]);
                setActiveRowData(null);
              }}>
              <MaterialIcons name="deselect" color={cIcon} size={20} />
              <Text style={[styles.btnText, {color: cBtnText}]}>
                Зняти всі ✅
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

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
    </View>
  );
};

export default TableView;

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
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  tableHeadRow: {
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
  rowContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  rowText: {
    fontSize: 14,
  },
  dragListContainer: {
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginVertical: 5,
    gap: 10,
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
});
