//NotesListLevels.js/
//Працює з note_section / note_themes / notes (без pn, know, img, section_key, type, translation)
//Запис озвучки нет- працює на полі text

import React, {useContext, useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ToastAndroid,
  Alert,
  ActivityIndicator,
  Text,
  Modal,
  Platform,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar

import {Buffer} from 'buffer'; // Для озвучки Azure

import {ThemeContext} from '@/context/ThemeContext';
import MyArrowBack from '@/components/main/MyArrowBack';
import TableViewLevels from '@/components/tables/TableViewLevels';
// import NotesListLevelsHelpModal from './NotesListLevelsHelpModal';

import {openDatabase} from '@/db/dbConfig';
import {handleSQLError} from '@/db/dbUtils';
import {updateNotesPn} from '@/db/notes/noteActions';

const NotesListLevels = () => {
  const [loading, setLoading] = useState(false); //Стан завантаження
  const [tData, setTData] = useState([]); // нотатки
  const [tThemes, setTThemes] = useState([]); // note_themes
  const [tSection, setTSection] = useState([]); // note_section
  const navigation = useNavigation();

  //   Колір
  const {sizes, getColorScheme, isDarkMode} = useContext(ThemeContext);
  const indexScheme = 0;
  const scheme = getColorScheme(indexScheme);
  const cPageBorderBg = scheme.cardBg;
  const cStatusBarBg = scheme.pageBg;
  const cPageHeadBg = scheme.pageBg;
  const cPageHeadText = scheme.pageOn;
  const cPageBg = scheme.pageBg;
  const cModalBg = scheme.modalBg;
  const cModalOn = scheme.modalOn;
  const sPageHeadIcon = sizes.sPageHeadIcon;

  React.useEffect(() => {
    changeNavigationBarColor(cPageBorderBg, !isDarkMode);
  }, [cPageBorderBg, isDarkMode]);

  // Loads
  useFocusEffect(
    React.useCallback(() => {
      loadSection();
    }, []),
  );
  useFocusEffect(
    React.useCallback(() => {
      loadThemes();
    }, []),
  );
  useFocusEffect(
    React.useCallback(() => {
      loadNotes();
    }, []),
  );

  const loadSection = () => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        'SELECT * FROM note_section ORDER BY note_section.name ASC',
        [],
        (_, results) => {
          let temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          setTSection(temp);
        },
        (_, error) => console.log('Помилка SELECT note_section:', error),
      );
    });
  };

  const loadThemes = () => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        `SELECT note_themes.*, note_section.name AS section_name,
                COUNT(notes.id) AS notes_count
                FROM note_themes
                JOIN note_section ON note_themes.section_id = note_section.id
                LEFT JOIN notes ON notes.theme_id = note_themes.id
                GROUP BY note_themes.id
                ORDER BY note_section.name ASC, note_themes.name ASC`,
        [],
        (_, results) => {
          let temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          setTThemes(temp);
        },
        (_, error) => {
          console.log('Помилка SELECT note_themes:', error);
          return false;
        },
      );
    });
  };

  // з section_name/theme_name (сортування за назвою, бо pn відсутнє)
  const loadNotes = () => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        `SELECT notes.*,
                notes.theme_id AS topic_id,
                note_themes.name AS theme_name,
                note_themes.section_id AS section_id,
                note_section.name AS section_name
         FROM notes
         JOIN note_themes ON notes.theme_id = note_themes.id
         JOIN note_section ON note_themes.section_id = note_section.id
         ORDER BY note_section.name ASC, note_themes.name ASC, notes.id ASC`,
        [],
        (_, results) => {
          let temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          setTData(temp);
        },
        (_, error) => {
          console.log('Помилка SELECT notes:', error);
          return false;
        },
      );
    });
  };

  // === Запис ToAudio =======================================
  const splitTextIntoChunks = (text, limit) => {
    const words = text.trim().split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += limit) {
      chunks.push(words.slice(i, i + limit).join(' '));
    }
    return chunks;
  };

  /////////////////////////////////////////////////////////////////////////
  // Підтвердження видалення нотаток
  const confirmDeleteRecord = ids => {
    Alert.alert(
      'Підтвердження видалення',
      'Ви дійсно хочете видалити цей запис?',
      [
        {
          text: 'Ні',
          onPress: () => console.log('Видалення скасовано'),
          style: 'cancel',
        },
        {
          text: 'Так',
          onPress: () => deleteRecord(ids),
        },
      ],
      {cancelable: false},
    );
  };

  // Видалення теми (note_themes)
  const confirmDeleteTheme = theme => {
    Alert.alert('Видалити тему?', `"${theme.name}"`, [
      {text: 'Скасувати', style: 'cancel'},
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: () => {
          openDatabase().transaction(tx => {
            tx.executeSql(
              'SELECT COUNT(*) as count FROM notes WHERE theme_id = ?',
              [theme.id],
              (_, {rows}) => {
                const count = rows.item(0).count;
                const msg =
                  count > 0
                    ? `${count} нотаток будуть видалені разом з темою. Продовжити?`
                    : 'Тема порожня. Видалити?';
                Alert.alert('Підтвердження', msg, [
                  {text: 'Скасувати', style: 'cancel'},
                  {
                    text: 'Видалити',
                    style: 'destructive',
                    onPress: () => {
                      openDatabase().transaction(tx2 => {
                        tx2.executeSql('PRAGMA foreign_keys = ON;');
                        tx2.executeSql(
                          'DELETE FROM note_themes WHERE id = ?',
                          [theme.id],
                          () => {
                            loadThemes();
                            loadNotes();
                          },
                          (_, error) => {
                            console.log('Помилка:', error);
                            return true;
                          },
                        );
                      });
                    },
                  },
                ]);
              },
            );
          });
        },
      },
    ]);
  };

  // Видалення групи (note_section)
  const confirmDeleteGroup = section => {
    Alert.alert('Видалити групу?', `"${section.name}"`, [
      {text: 'Скасувати', style: 'cancel'},
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: () => {
          openDatabase().transaction(tx => {
            tx.executeSql(
              'SELECT COUNT(*) as count FROM note_themes WHERE section_id = ?',
              [section.id],
              (_, {rows}) => {
                const count = rows.item(0).count;
                const msg =
                  count > 0
                    ? `${count} тем і всі їх нотатки будуть видалені. Продовжити?`
                    : 'Група порожня. Видалити?';
                Alert.alert('Підтвердження', msg, [
                  {text: 'Скасувати', style: 'cancel'},
                  {
                    text: 'Видалити',
                    style: 'destructive',
                    onPress: () => {
                      openDatabase().transaction(tx2 => {
                        tx2.executeSql('PRAGMA foreign_keys = ON;');
                        tx2.executeSql(
                          'DELETE FROM note_section WHERE id = ?',
                          [section.id],
                          () => {
                            loadSection();
                            loadThemes();
                            loadNotes();
                          },
                          (_, error) => {
                            console.log('Помилка:', error);
                            return true;
                          },
                        );
                      });
                    },
                  },
                ]);
              },
            );
          });
        },
      },
    ]);
  };

  // Видалення нотаток за id
  const deleteRecord = ids => {
    if (ids.length === 0) return;

    const idsString = ids.join(',');

    openDatabase().transaction(tx => {
      tx.executeSql(
        `DELETE FROM notes WHERE id IN (${idsString})`,
        [],
        (_, results) => {
          if (results.rowsAffected > 0) {
            ToastAndroid.show('Запис видалено!', ToastAndroid.SHORT);
            loadNotes();
          } else {
            ToastAndroid.show('Запис не знайдено', ToastAndroid.SHORT);
          }
        },
        (_, error) => {
          console.log('SQL Error:', error);
          handleSQLError(error, 'видалення з таблиці notes');
          return true;
        },
      );
    });
  };

  const handleSavePn = async reindexed => {
    try {
      await updateNotesPn(reindexed);
      loadNotes();
    } catch (e) {
      console.log('Помилка збереження порядку:', e);
    }
  };

  //*************************************************************** */
  const columns = [
    {
      label: '№',
      accessor: 'id',
      type: 'integer',
      width: 60,
      styleCell: {alignItems: 'center'},
    },
    {
      label: 'Текст нотатки',
      accessor: 'text',
      type: 'text',
      width: 600,
      styleCellText: {fontWeight: 600},
    },
  ];

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: cPageBorderBg}}>
      <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} />
      <View style={[styles.pageContainer, {backgroundColor: cPageBg}]}>
        {/* Голова сторінки */}
        <View
          style={[styles.pageHeadContainer, {backgroundColor: cPageHeadBg}]}>
          <MyArrowBack
            color={cPageHeadText}
            colorIconBg={cPageHeadBg}
            sizeIcon={sPageHeadIcon}
            titleText={'Список нотаток'}
          />
          {/* <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <NotesListLevelsHelpModal pcBg={cModalBg} pcOn={cModalOn} />
          </View> */}
        </View>
        {/* Body of the page */}
        <TableViewLevels
          loading={loading}
          data={tData} // нотатки
          onRefresh={loadNotes}
          dataLevel1={tThemes} // теми
          dataLevel2={tSection} // групи
          setData={setTData}
          columns={columns}
          title={'Нотатки по темах'}
          indexScheme={indexScheme}
          onSavePn={handleSavePn}
          sortField={'pn'} // pn тепер працює — MAX(pn)+1 при вставці
          onAdd={() => {
            navigation.navigate('NotesAdd');
          }}
          onEdit={activeRow => {
            navigation.navigate('NotesEdit', {
              itemData: activeRow,
            });
          }}
          onDelete={confirmDeleteRecord}
          //   onImport={importNotes}
          //   onExportWordsToSite={handleExport}
          //   onSaveToAudio={saveSelectedToAudio}
          sectionId={'theme_id'} //🔒 Прив’язка переміщення до певного значення поля
          sectionName={'theme_name'} //Назва теми
          beforeSectionName={'Тема'} // Назва перед: назвою теми
          //
          onAddTopic={() => navigation.navigate('NotesThemesAdd')}
          onEditTopic={theme =>
            navigation.navigate('NotesThemesEdit', {itemData: theme})
          }
          onDeleteTopic={confirmDeleteTheme}
          onAddSection={() => navigation.navigate('NotesSectionAdd')}
          onEditSection={section =>
            navigation.navigate('NotesSectionEdit', {itemData: section})
          }
          onDeleteSection={confirmDeleteGroup}
        />
      </View>
      {/* для експорту даних на сайт */}
      {/* <Modal visible={showExport} animationType="slide">
        <AppWebView
          selectedWords={exportData?.notes}
          topicName={exportData?.themeName}
          onClose={() => {
            setShowExport(false);
            setExportData(null);
          }}
        />
      </Modal> */}
    </SafeAreaView>
  );
};

export default NotesListLevels;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    paddingHorizontal: 8,
    borderRadius: 15,
    margin: '2%',
  },
  pageHeadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
