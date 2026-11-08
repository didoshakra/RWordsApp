//TopicsList.js//<FlatList/GPT опт/TableVieW
// 3-схеми

import React, {useContext, useState, useEffect, useRef} from 'react';
import {View, StyleSheet, StatusBar, ToastAndroid, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar

import {ThemeContext} from '@/context/ThemeContext';
import MyArrowBack from '@/components/main/MyArrowBack';
import TableView from '@/components/TableView';

import {openDatabase} from '../../db/dbConfig';

const TopicsList = () => {
//   console.log('TopicsList***');
  const [tData, setTData] = useState([]);

  const navigation = useNavigation();
  //   Колір
  const {sizes, getColorScheme, isDarkMode} = useContext(ThemeContext);
  const indexScheme = 1;
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
  }, [cPageBorderBg, isDarkMode]); //
  const sPageHeadIcon = sizes.sPageHeadIcon;

  // ChatGPT
  useFocusEffect(
    React.useCallback(() => {
      loadTopics();
    //   console.log('TopicList/loadTopics()/tData=', tData);
    }, []),
  );

  const loadTopics = () => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        `SELECT Topics.*, Sections.name AS section_name, Sections.pn AS section_pn, IFNULL(SUM(Words.know), 0) AS know_sum, COUNT(Words.id) AS words_count, CASE WHEN COUNT(Words.id) = 0 THEN 0
                ELSE ROUND(100.0 * SUM(Words.know) / COUNT(Words.id), 2)
                END AS know_percent
            FROM Topics JOIN Sections ON Topics.section_id = Sections.id LEFT JOIN Words ON Words.topic_id = Topics.id
            GROUP BY Topics.id
            ORDER BY Sections.pn ASC, Topics.pn ASC`,
        [],
        (_, results) => {
        //   console.log(
        //     'TopicsList/loadTopics/Кількість отриманих записів:',
        //     results.rows.length,
        //   );
          let temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          setTData(temp);
        },
        (_, error) => {
          console.log('Помилка SELECT:', error);
          return false;
        },
      );
    });
  };

  //Вилучення разом із словами цієї теми/підтвердження
  const deleteRecord = topicIdsString => {
    Alert.alert('Підтвердження', 'Ви впевнені, що хочете видалити теми?', [
      {text: 'Скасувати', style: 'cancel'},
      {
        text: 'Так, видалити',
        onPress: () => {
          openDatabase().transaction(tx => {
            tx.executeSql(
              `SELECT COUNT(*) as count FROM words WHERE topic_id IN (${topicIdsString})`,
              [],
              (_, {rows}) => {
                const count = rows.item(0).count;
                if (count > 0) {
                  Alert.alert(
                    'Теми містять слова',
                    'Видалити теми та всі пов’язані слова автоматично?',
                    [
                      {text: 'Скасувати', style: 'cancel'},
                      {
                        text: 'Так, видалити все',
                        onPress: () => {
                          openDatabase().transaction(tx2 => {
                            tx2.executeSql(
                              `DELETE FROM topics WHERE id IN (${topicIdsString})`,
                              [],
                              () => {
                                ToastAndroid.show(
                                  'Теми та слова видалено!',
                                  ToastAndroid.SHORT,
                                );
                                loadTopics();
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
                  // Без пов’язаних — одразу видаляємо
                  tx.executeSql(
                    `DELETE FROM topics WHERE id IN (${topicIdsString})`,
                    [],
                    () => {
                      ToastAndroid.show('Теми видалено!', ToastAndroid.SHORT);
                      loadTopics();
                    },
                    (_, error) => {
                      console.log('Помилка при видаленні тем:', error);
                      return true;
                    },
                  );
                }
              },
              (_, error) => {
                console.log('Помилка при перевірці слів:', error);
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
  function updateTopicsPn(tData, onSuccess) {
    if (!Array.isArray(tData)) {
      console.error('updateTopicsPn: tData is not an array', tData);
      return;
    }
    // console.log(`TopicList/updateTopicsPn(tData)=`, tData);

    openDatabase().transaction(
      tx => {
        tData.forEach(item => {
          tx.executeSql(
            'UPDATE Topics SET pn = ? WHERE id = ?',
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
      label: '👍%',
      accessor: 'know_percent',
        type: 'integer',
    //   type: 'number',
      width: 50,
      styleCell: {alignItems: 'center'},
    },
    {
      label: '👍',
      accessor: 'know_sum',
      type: 'integer',
      width: 40,
      styleCell: {alignItems: 'center'},
    },
    {
      //   label: '🔢',
      label: 'Слів',
      accessor: 'words_count',
      type: 'integer',
      width: 50,
      styleCell: {alignItems: 'center'},
    },

    {label: 'Назва теми', accessor: 'name', type: 'text', width: 300},
    {
      label: 'Назва групи тем',
      accessor: 'section_name',
      type: 'text',
      width: 250,
    },
    {label: 'Папка img', accessor: 'img', type: 'text', width: 220},
    {
      label: '№s',
      accessor: 'section_pn',
      type: 'integer',
      width: 50,
      styleCell: {alignItems: 'center'},
    },
    {
      label: '№t',
      accessor: 'pn',
      type: 'integer',
      width: 40,
      styleCell: {alignItems: 'center'},
    },
    {
      label: 'SId',
      accessor: 'section_id',
      type: 'integer',
      width: 40,
      styleCell: {alignItems: 'center'},
    },

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
            // back={'Home'}
            color={cPageHeadText}
            colorIconBg={cPageHeadBg}
            sizeIcon={sPageHeadIcon}
            titleText={'Список тем'}
          />
        </View>
        {/* Body of the page */}
        <TableView
          data={tData}
          setData={setTData}
          onSavePn={updateTopicsPn}
          columns={columns}
          title={'Теми'}
          //   colorsTable={colorsTable}
          indexScheme={indexScheme}
          onAdd={() => {
            navigation.navigate('TopicsAdd');
          }}
          onEdit={activeRow => {
            navigation.navigate('TopicsEdit', {
              itemData: activeRow, // передаємо весь об'єкт item
            });
          }}
          //   onDelete={ids => deleteRecord(ids)} // передаємо лише id
          onDelete={deleteRecord} // передаємо лише id
          sectionId={'section_id'} //🔒 id секції/Прив’язка переміщення до певного значення поля
          sectionName={'section_name'} //🔒 Назва секції
          beforeSectionName={'Група тем'} //🔒  Назва перед: назвою секції
          sortField={'pn'} //поле для сортування

          //   onDataUpdate={data => setTableData(data)} //Нова БД
          //   onChangeFlagUpdate={flag => (changedPnRef.current = flag)}
        />
      </View>
    </SafeAreaView>
  );
};
export default TopicsList;

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
  },
});
