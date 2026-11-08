// KnowFilterModal.js
import React, {useState, useContext} from 'react';
import {View, Text, Modal, Pressable, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {SettingsContext} from '@/context/SettingsContext';
import {ThemeContext} from '@/context/ThemeContext';

const KnowFilterModal = ({headerColor}) => {
  const {settings, setSettings} = useContext(SettingsContext);
  const {getColorScheme} = useContext(ThemeContext);
  const scheme = getColorScheme(0);

  const {
    pageBg: cModalBg,
    itemBg: cItemBg,
    itemOn: cItemOn,
    itemBgAct: cItemBgAct,
    itemOnAct: cItemOnAct,
  } = scheme;

  const cBtnBg = scheme.buttonBg;
  const cBtnBorder = scheme.buttonBorder;
  const cBtnText = scheme.buttonOn;
  const cIcon = scheme.buttonOn;

  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilter, setTempFilter] = useState(settings.knowFilter || '*');

  const toggleDropdown = () => setIsExpanded(prev => !prev);

  const options = [
    {label: 'Вcі', value: '*'},
    {label: 'Знаю', value: '1'},
    {label: 'Не знаю', value: '0'},
  ];

  const handleSave = () => {
    setSettings(prev => ({...prev, knowFilter: tempFilter}));
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setTempFilter(settings.knowFilter || '*');
    setIsExpanded(false);
  };

  // ===== перевірка змін =====
  const hasChanges = tempFilter !== (settings.knowFilter || '*');

  return (
    <>
      <Pressable onPress={toggleDropdown} style={styles.button}>
        <View style={styles.headButtonContainer}>
          <MaterialIcons
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color={headerColor}
          />
          <Text style={[styles.textInfo, {color: headerColor}]}>
            Вибрані знання:
          </Text>
          <Text style={[styles.textInfo, {color: headerColor, marginLeft: 4}]}>
            {options.find(o => o.value === tempFilter)?.label || 'Вcі'}
          </Text>
        </View>
      </Pressable>

      <Modal transparent visible={isExpanded} animationType="fade">
        <GestureHandlerRootView style={{flex: 1}}>
          <Pressable style={styles.backdrop} onPress={handleCancel} />

          <View style={styles.centerWrap}>
            <View
              style={[
                styles.modalContainer,
                {backgroundColor: cModalBg, width: '80%', paddingVertical: 10},
              ]}>
              {options.map(opt => {
                const selected = tempFilter === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setTempFilter(opt.value)}
                    style={[
                      styles.item,
                      {
                        backgroundColor: selected ? cItemBgAct : cItemBg,
                        paddingVertical: 12,
                      },
                    ]}>
                    <MaterialIcons
                      name={selected ? 'check-box' : 'check-box-outline-blank'}
                      size={22}
                      color={selected ? cItemOnAct : cItemOn}
                      style={{marginRight: 12}}
                    />
                    <Text style={{color: selected ? cItemOnAct : cItemOn}}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}

              <View style={[styles.buttonsContainerFooter, {marginTop: 10}]}>
                {hasChanges ? (
                  <>
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  buttonsContainerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  buttonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 8,
  },
  btnText: {
    fontFamily: 'Poppins-SemiBold',
  },
  textInfo: {},
});

export default KnowFilterModal;
