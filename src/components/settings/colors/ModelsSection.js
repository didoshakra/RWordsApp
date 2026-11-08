//ModelsSection.js;

import {View, Dimensions} from 'react-native';
import React, {useEffect, useState} from 'react';
import ModelList from './ModelList';
import ModelList1 from './ModelList1';
import ModelList2 from './ModelList2';
import ModelInput from './ModelInput';

export default function ModelsSection() {
  const [screenSize, setScreenSize] = useState(Dimensions.get('window'));
  useEffect(() => {
    const updateSize = () => setScreenSize(Dimensions.get('window'));
    const subscription = Dimensions.addEventListener('change', updateSize);
    return () => subscription?.remove();
  }, []);

  const vertOrient = screenSize.height > screenSize.width ? true : false;
  const modelsSectionStyle = {
    flex: 1,
    flexDirection: vertOrient ? 'column' : 'row',
    justifyContent: 'space-between',
    padding: 5,
    // backgroundColor: '#FFFFFF',
  };
  return (
    <View style={[modelsSectionStyle]}>
      <ModelList />
      {__DEV__ && <ModelList1 />}
      {__DEV__ && <ModelList2 />}
      {__DEV__ && <ModelInput />}
      <ModelInput />
    </View>
  );
}
