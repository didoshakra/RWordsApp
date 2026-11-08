// Profile

import {View, Text, StyleSheet} from 'react-native';
import React from 'react';
// import Login from '../../screens/registration/Login';
// import Login from '@/screens/registration/Login';

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile в роботі</Text>
      {/* <Login /> */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  text: {
    fontWeight: 'bold',
    fontSize: 30,
    color:'red'
  },
});
