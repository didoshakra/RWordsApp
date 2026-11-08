//WordsHeadRight.jd
import React, {useState} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Modal} from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import SettingsModal from '../../components/settings/listen_words/ListenWordsSettingsModal';
import WordsHelpModal from './WordsHelpModal';

// export default function WordsHeadRight(props) {
const WordsHeadRight = props => {
//   const [isSettingsModal, setIsSettingsModal] = useState(false);
//   const colorIcon = props.colorIcon;
//   const colorIconBg = props.colorIconBg;
//   const sizeIcon = props.sizeIcon || 25;
//   const setShowContextInfo = props.setShowContextInfo;
//   const sizeBg = sizeIcon + 5;
  const cModalBg = props.modalBg || 'white';
  const cModalOn = props.modalOn || 'black';

  return (
    <View style={styles.headRight}>
      {/* <TouchableOpacity
        onPress={() => setShowContextInfo(true)}
        style={[
          styles.iconContainer,
          {
            backgroundColor: colorIconBg,
            height: sizeBg,
            width: sizeBg,
            borderRadius: sizeBg / 2,
          },
        ]}>
        <MaterialIcons
          name={'settings-voice'}
          color={colorIcon}
          size={sizeIcon}
        />
      </TouchableOpacity> */}
      {/* <TouchableOpacity
        onPress={() => setIsSettingsModal(true)}
        style={[
          styles.iconContainer,
          {
            backgroundColor: colorIconBg,
            height: sizeBg,
            width: sizeBg,
            borderRadius: sizeBg / 2,
          },
        ]}>
        <Ionicons name={'settings'} color={colorIcon} size={sizeIcon} />
      </TouchableOpacity> */}

      {/*Налаштування Words */}
      {/* <SettingsModal
        isVisible={isSettingsModal}
        onClose={() => setIsSettingsModal(false)}
      /> */}
      {/*  */}
      <WordsHelpModal
        pcBg={cModalBg}
        pcOn={cModalOn}
        colorIcon={props.colorIcon}
        colorIconBg={props.colorIconBg}
      />
    </View>
  );
};
export default WordsHeadRight;

const styles = StyleSheet.create({
  headLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    // gap:   5,
  },
  headRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 1,
    marginRight: 5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
