//RulesListLevels.js/Для правил /поки 1 рівень

import React, {useContext, useState, useRef} from 'react';
import {View, StyleSheet, StatusBar, ToastAndroid, Alert} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import changeNavigationBarColor from 'react-native-navigation-bar-color'; //змінити колір Navigation Bar

import {Buffer} from 'buffer'; // Для озвучки Azure

import {ThemeContext} from '@/context/ThemeContext';
import MyArrowBack from '@/components/main/MyArrowBack';
import TableViewLevels from '@/components/tables/TableViewLevels';
// import RulesListLevelsHelpModal from './RulesListLevelsHelpModal';

import {openDatabase} from '@/db/dbConfig';
// import {handleSQLError} from '@/db/dbUtils';
import {
  deleteRules,
  updateRulesPn,
  toggleRulePriority,
} from '@/db/rules/rulesActions';

const RulesListLevels = () => {
  //   const [loading, setLoading] = useState(false); //Стан завантаження
  const [tData, setTData] = useState([]); // нотатки
  //   const [tThemes, setTThemes] = useState([]); // note_themes
  //   const [tSection, setTSection] = useState([]); // note_section
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

  useFocusEffect(
    React.useCallback(() => {
      loadRules();
    }, []),
  );

  // з section_name/theme_name (сортування за назвою, бо pn відсутнє)
  const loadRules = () => {
    openDatabase().transaction(tx => {
      tx.executeSql(
        `SELECT rules.*
         FROM rules
         ORDER BY  rules.pn ASC`,
        [],
        (_, results) => {
          let temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          setTData(temp);
        },
        (_, error) => {
          console.log('Помилка SELECT rules:', error);
          return false;
        },
      );
    });
  };

  /////////////////////////////////////////////////////////////////////////
  // Підтвердження видалення
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
          onPress: () => {
            deleteRules(ids)
              .then(() => {
                ToastAndroid.show('Правило видалено!', ToastAndroid.SHORT);
                loadRules();
              })
              .catch(error => {
                console.log('Помилка видалення:', error);
                handleSQLError(error, 'видалення з таблиці rules');
              });
          },
        },
      ],
      {cancelable: false},
    );
  };

const handleTogglePriority = (id, accessor, newValue) => {
  setTData(prev =>
    prev.map(row =>
      row.id === id ? {...row, [accessor]: newValue ? 1 : 0} : row,
    ),
  );
  toggleRulePriority(id, newValue).catch(error => {
    console.log('Помилка оновлення priority:', error);
    loadRules();
  });
};

  //*************************************************************** */
  const columns = [
    {
      label: '⭐',
      accessor: 'priority',
      type: 'flag',
      width: 44,
    },
    {
      label: '№',
      accessor: 'pn',
      type: 'integer',
      width: 40,
      styleCell: {alignItems: 'center'},
    },
    {
      label: 'Правило',
      accessor: 'title',
      type: 'text',
      width: 600,
      styleCell: {alignItems: 'flex-start'},
      styleCellText: {fontWeight: '600', textAlign: 'left'},
      styleHeadCell: {justifyContent: 'flex-start'}, // ← це вирівнює шапку вліво
      styleHeadText: {textAlign: 'left', paddingLeft: 20},
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
            // titleText={'Правила'}
          />
          {/* <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <RulesListLevelsHelpModal pcBg={cModalBg} pcOn={cModalOn} />
          </View> */}
        </View>
        {/* Body of the page */}
        <TableViewLevels
          data={tData}
          columns={columns}
          title={'Правила англійської'}
          indexScheme={indexScheme}
          //   onSavePn={handleSavePn}
          sortField={'pn'} // pn тепер працює — MAX(pn)+1 при вставці
          onAdd={() => {
            navigation.navigate('RulesAdd');
          }}
          onEdit={activeRow => {
            navigation.navigate('RulesEdit', {
              itemData: activeRow,
            });
          }}
          onDelete={confirmDeleteRecord}
          onOpenRule={ruleId => navigation.navigate('RuleScreen', {ruleId})} //Екран з правилами
          openRuleField={'id'}
          onSavePn={reindexed => updateRulesPn(reindexed).then(loadRules)}
          onToggleFlag={handleTogglePriority}
          //
        />
      </View>
    </SafeAreaView>
  );
};

export default RulesListLevels;

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
