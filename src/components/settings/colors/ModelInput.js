///ModelInput.js
import React, {useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

// import logoRa from '@/assets/images/sun_man_hands-oval-ra-red-64-41.png';
import logoRa from '@/assets/images/SunMan_RW.png';
import {ThemeContext} from '@/context/ThemeContext';

export default function ModelInput() {
  //   Колір
  const {colors, getColorScheme} = useContext(ThemeContext);
  const tc = colors;
  const scheme = getColorScheme(1);

  //
  const cPageBg = scheme.pageBg; //Bg колір сторінки
  const cPageBorder = scheme.pageBorder;
  const cCardBg = scheme.cardBg;
  const cCardBorder = scheme.cardBorder;
  const cCardText = scheme.cardOn;
  const cTittleInputBG = scheme.titleBg;
  const cTittleOn = scheme.titleOn;
  const cInputText = scheme.inputOn;
  const cInputBg = scheme.inputBg;
  const cInputBorder = tc.ctBorder1;
  const cLink = tc.cLink;
  const cTableTitleText = scheme.titleOn;
  const cTableHeadBg = scheme.headerBg;
  const cTableHeadText = scheme.headerOn;
  const cHeadText = scheme.headerOn;
  const cHeadBg = scheme.headerBg;
  const cItemBg = scheme.inputBg;
  const cItemText = scheme.inputOn;
  const cItemBgAct = scheme.activeBg;
  const cItemTextAct = scheme.activeOn;
  const cBorder = scheme.border;
  const cBtnBg = scheme.buttonBg;
  const cBtnText = scheme.buttonOn;
  const cBtnBorder = scheme.buttonBorder;
  const cBtnBg1 = scheme.buttonBg;
  const cBtnText1 = scheme.buttonOn;
  const cBtnBorder1 = scheme.buttonBorder;
  const cBtnBgAct = scheme.buttonBgAct;
  const cBtnTextAct = scheme.buttonOnAct;

  return (
    <View
      style={[
        styles.pageContainer,
        {backgroundColor: cPageBg, borderColor: cPageBorder},
      ]}>
      <View
        style={[
          styles.cardContainer,
          {backgroundColor: cCardBg, borderColor: cCardBorder},
        ]}>
        <View
          style={[
            styles.headInputsContainer,
            {backgroundColor: cTittleInputBG},
          ]}>
          <Image style={styles.logoRa} source={logoRa} />
          <Text style={[styles.headInputText, {color: cTittleOn}]}>
            Hey, come back
          </Text>
        </View>
        <View
          style={[
            styles.inputContainer,
            {backgroundColor: cInputBg, borderColor: cInputBorder},
          ]}>
          <Ionicons name={'mail-outline'} color={cInputText} size={20} />
          <TextInput
            style={[styles.inputText, {color: cInputText}]}
            placeholder="Enter your Email"
          />
        </View>
        <View
          style={[
            styles.inputContainer,
            {backgroundColor: cInputBg, borderColor: cInputBorder},
          ]}>
          <SimpleLineIcons name={'lock'} color={cInputText} size={20} />
          <TextInput
            style={[styles.inputText, {color: cInputText}]}
            placeholder="Enter your Password"
          />
        </View>
        <Text style={[styles.forgotPassword, {color: cLink}]}>
          Forgot Password?
        </Text>
        <TouchableOpacity
          style={[
            styles.loginButtonWrapper,
            {backgroundColor: cBtnBg, borderColor: cInputBorder},
          ]}>
          <Text style={[styles.loginText, {color: cBtnText}]}>ModelInput</Text>
        </TouchableOpacity>
        <Text style={[styles.continueText, {color: cCardText}]}>
          or continue with
        </Text>
        <TouchableOpacity
          style={[
            styles.googleButtonContainer,
            {backgroundColor: cBtnBg1, borderColor: cInputBorder},
          ]}>
          {/* <Image
            source={require('/../../assets/icons/logo_google-48.png')}
            style={styles.googleImage}
          /> */}
          <Text style={[styles.googleText, {color: cBtnText}]}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerContainer}>
          <Text style={[styles.accountText, {color: cCardText}]}>
            Don't an account?{' '}
          </Text>
          <Text style={[styles.signupText, {color: cLink}]}>Sing up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    marginTop: 10,
    padding: 5,
    // padding: '3%',
    borderRadius: 15,
    borderWidth: 2,
    // тінь для iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    // тінь для Android
    elevation: 6, // Тінь на Android
    // margin: 2,
  },
  cardContainer: {
    padding: 20,
    margin: 15,
    borderRadius: 15,
    borderWidth: 2,
    // тінь для iOS
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    // тінь для Android
    elevation: 6, // Тінь на Android
  },
  headInputsContainer: {
    paddingHorizontal: 5,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  logoRa: {
    marginVertical: '1%',
    height: 38,
    width: 60,
    alignSelf: 'center',
  },
  headInputText: {
    // top: '1%', пливло вниз
    // textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
  },
  inputContainer: {
    marginTop: 10,
    // height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20, //
    marginTop: 5, //
    // // gap:  5,
  },
  inputText: {
    height: 40,
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 10,
    fontFamily: 'Poppins-Light',
  },

  forgotPassword: {
    textAlign: 'right',
    fontFamily: 'Poppins-SemiBold',
    marginVertical: '1%',
  },
  loginButtonWrapper: {
    marginTop: '2%',
    borderWidth: 2,
    borderRadius: 100,
    padding: 2,
    // marginVertical: '1%', //
    marginHorizontal: '5%', //
  },
  loginText: {
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  continueText: {
    textAlign: 'center',
    marginVertical: '2%',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  googleButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 2,
    marginVertical: 2, //
    marginHorizontal: '5%', //
    gap: 20,
  },
  googleImage: {
    height: 20,
    width: 20,
  },
  googleText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  accountText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  signupText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    fontWeight: 800,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: '1%',
    gap: 2,
  },
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    gap: '5%',
    marginBottom: 5,
  },
});
