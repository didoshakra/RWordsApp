// SettingsScreen.js
import React, {useState} from 'react';
import {View, Button} from 'react-native';
import ListenWordsSettingsModal from './listen_words/ListenWordsSettingsModal';
// import VoskCommandsModal from '@/vosk/VoskCommandsModal';

export default function SettingsScreen() {
  const [showSettingsWords, setShowSettingsWords] = useState(false);
  //   const [showSettingsVoice, setShowSettingsVoice] = useState(false);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
      }}>
      <Button
        title="Налаштування прослуховування слів"
        onPress={() => setShowSettingsWords(true)}
      />

      <ListenWordsSettingsModal
        isVisible={showSettingsWords}
        onClose={() => setShowSettingsWords(false)}
      />
      {/* <VoskCommandsModal
        isVisible={showSettingsVoice}
        onClose={() => setShowSettingsVoice(false)}
      /> */}
    </View>
  );
}
