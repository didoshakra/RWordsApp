//BackShadow.js
//https://reactnative.dev/docs/dimensions

import React from 'react';
import {StyleSheet, View, TouchableWithoutFeedback} from 'react-native';

export default function BackShadow({onPress}) {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.fullScreen} />
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 2,
  },
});