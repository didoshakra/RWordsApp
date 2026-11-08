//SectionsList.js//<FlatList/GPT опт/TableVieW
//3-схем кол.

import React, {useContext, useState, useEffect} from 'react';
import {View, StyleSheet, StatusBar, ToastAndroid, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar

import {ThemeContext} from '@/context/ThemeContext';
import MyArrowBack from '@/components/main/MyArrowBack';
import TableView from '@/components/TableView';

import {openDatabase} from '@/db/dbConfig';

const SectionsList = () => {
  const navigation = useNavigation();
  const [tData, setTData] = useState([]);

  //   Колір
  const {sizes, getColorScheme, isDarkMode} = useContext(ThemeContext);
  const indexScheme = 2;
  const scheme = getColorScheme(indexScheme);
  const cPageBorderBg = scheme.cardBg;
  const cStatusBarBg = scheme.pageBg;
  const cPageHeadBg = scheme.pageBg;
  const cPageHeadText = scheme.pageOn;
  const cPageBg = scheme.pageBg; //Bg колір сторінки
  //   changeNavigationBarColor(cPageBorderBg, !isDarkMode); //колір Navigation Bar , true - світлі іконки
  // ✅ Navigation bar color — тільки при зміні теми або кольору
  useEffect(() => {
    changeNavigationBarColor(cPageBorderBg, !isDarkMode);
  }, [cPageBorderBg, isDarkMode]);
  //
  //
  const sPageHeadIcon = sizes.sPageHeadIcon;

  useFocusEffect(
    React.useCallback(() => {
      loadSections();
    }, []),
  );

  const loadSections = () => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        'SELECT * FROM sections ORDER BY Sections.pn ASC',
        [],
        (_, results) => {
          //   console.log(
          //     'SectionsList/loadSections/Кількість отриманих записів:',
          //     results.rows.length,
          //   );
          let temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          // console.log('Отримані записи:', temp);
          //   setSections(temp);
          setTData(temp);
        },
        (_, error) => console.log('Помилка SELECT:', error),
      );
    });
  };

  // Функція для виклику діалогового вікна перед вилученням

  //Вилучення разом із словами цієї теми/підтвердження
  // Вилучення разом із словами та темами із підтвердженням
  // Видалення секцій разом із темами та словами після підтвердження
  const deleteRecord = sectionIdsString => {
    Alert.alert('Підтвердження', 'Ви впевнені, що хочете видалити секції?', [
      {text: 'Скасувати', style: 'cancel'},
      {
        text: 'Так, видалити',
        onPress: () => {
          const db = openDatabase();

          // 1. Перевірка наявності слів у темах цих секцій
          db.transaction(tx => {
            tx.executeSql(
              `SELECT COUNT(*) as count
               FROM words
               WHERE topic_id IN (
                 SELECT id FROM topics WHERE section_id IN (${sectionIdsString})
               )`,
              [],
              (_, {rows}) => {
                const count = rows.item(0).count;

                if (count > 0) {
                  // Якщо є слова — попередження та підтвердження видалення всього
                  Alert.alert(
                    'Секції містять слова',
                    'Видалити всі пов’язані теми та слова автоматично?',
                    [
                      {text: 'Скасувати', style: 'cancel'},
                      {
                        text: 'Так, видалити все',
                        onPress: () => {
                          db.transaction(tx2 => {
                            // Видаляємо спочатку теми, щоб CASCADE спрацював
                            tx2.executeSql(
                              `DELETE FROM topics WHERE section_id IN (${sectionIdsString})`,
                              [],
                              () => {
                                // Потім видаляємо самі секції
                                tx2.executeSql(
                                  `DELETE FROM sections WHERE id IN (${sectionIdsString})`,
                                  [],
                                  () => {
                                    ToastAndroid.show(
                                      'Секції, теми та слова видалено!',
                                      ToastAndroid.SHORT,
                                    );
                                    loadSections(); // оновлюємо список
                                  },
                                  (_, error) => {
                                    console.log(
                                      'Помилка при видаленні секцій:',
                                      error,
                                    );
                                    return true;
                                  },
                                );
                              },
                              (_, error) => {
                                console.log(
                                  'Помилка при видаленні тем:',
                                  error,
                                );
                                return true;
                              },
                            );
                          });
                        },
                        style: 'destructive',
                      },
                    ],
                  );
                } else {
                  // Якщо слів немає — просто видаляємо секції (CASCADE тем спрацює)
                  tx.executeSql(
                    `DELETE FROM sections WHERE id IN (${sectionIdsString})`,
                    [],
                    () => {
                      ToastAndroid.show('Секції видалено!', ToastAndroid.SHORT);
                      loadSections();
                    },
                    (_, error) => {
                      console.log('Помилка при видаленні секцій:', error);
                      return true;
                    },
                  );
                }
              },
              (_, error) => {
                console.log('Помилка при перевірці слів у секціях:', error);
                return true;
              },
            );
          });
        },
        style: 'destructive',
      },
    ]);
  };

  // Оновлення pn в БД
  function updateSectionsPn(tData, onSuccess) {
    if (!Array.isArray(tData)) {
      console.error('updateSectionsPn: tData is not an array', tData);
      return;
    }
    console.log(`TopicList/updateSectionsPn(tData)=`, tData);

    openDatabase().transaction(
      tx => {
        tData.forEach(item => {
          tx.executeSql(
            'UPDATE Sections SET pn = ? WHERE id = ?',
            [item.pn, item.id],
            (_, result) => {
              console.log(`Оновлено topic id=${item.id} → pn=${item.pn}`);
            },
            (_, error) => {
              console.error('Помилка оновлення pn:', error);
              return false;
            },
          );
        });
      },
      error => {
        console.error('Помилка транзакції:', error);
      },
      () => {
        console.log('Оновлення pn завершено успішно.');
        onSuccess?.(); // <- ВАЖЛИВО
      },
    );
  }

  //Для TableView
  const columns = [
    {
      label: '№',
      accessor: 'pn',
      type: 'integer',
      width: 40,
      styleCell: {alignItems: 'center'},
    },
    {label: 'Назва групи тем', accessor: 'name', type: 'text', width: 300},
    {label: 'Папка img', accessor: 'img', type: 'text', width: 220},
    {
      label: 'id',
      accessor: 'id',
      type: 'integer',
      width: 40,
      styleCell: {alignItems: 'center'},
    },
  ];

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <SafeAreaView style={{flex: 1, backgroundColor: cPageBorderBg}}>
      <StatusBar barStyle="dark-content" backgroundColor={cStatusBarBg} />
      {/* Page pageContainer-Задає псевдобардюр (cPageBorderBg) і відступи в сторінці*/}
      <View style={[styles.pageContainer, {backgroundColor: cPageBg}]}>
        {/* Голова сторінки */}
        <View
          style={[styles.pageHeadContainer, {backgroundColor: cPageHeadBg}]}>
          <MyArrowBack
            // headText={'toHome'}
            // back={'Home'}//Якщо нема то повернеться в попереднє вікно
            color={cPageHeadText}
            // colorIconBg={cPageHeadBg}
            sizeIcon={sPageHeadIcon}
            titleText={'Групи тем'}
          />
        </View>
        {/* Body of the page */}
        <TableView
          data={tData}
          setData={setTData}
          onSavePn={updateSectionsPn}
          columns={columns}
          title={'Групи тем'}
          //   colorsTable={colorsTable}
          indexScheme={indexScheme}
          onAdd={() => {
            navigation.navigate('SectionsAdd');
          }}
          onEdit={activeRow => {
            navigation.navigate('SectionsEdit', {
              itemData: activeRow, // передаємо весь об'єкт item
            });
          }}
          onDelete={deleteRecord} // передаємо лише id
          //
          sectionName={'name'} //🔒 Назва секції
          beforeSectionName={'Група тем'} //🔒  Назва перед: назвою секції
          sortField={'pn'} //поле для сортування
        />
      </View>
    </SafeAreaView>
  );
};
export default SectionsList;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    paddingHorizontal: 8, // або можна 8, 10 — в пікселях
    borderRadius: 15,
    margin: '2%', //Для бардюра Bg
  },
  pageHeadContainer: {
    // height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // alignItems: "flex-end"
  },
});
