///SignUp.js //З SignUp
//https://medium.com/@chaudharyalinawazz/building-a-login-screen-in-react-native-a-step-by-step-guide-f90b10aea4ec
//https://www.youtube.com/supported_browsers?next_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Deu-8OlWbwjA&ab_channel=ZeroDegreeCoder
import React, {useContext, useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  useColorScheme,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {Formik} from 'formik';
import * as yup from 'yup';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import {openDatabase} from 'react-native-sqlite-storage';

// import {useAuth} from '../auth/authContext';
import logoRa from '../../assets/images/sun_man_hands-oval-ra-red-64-41.png';
import logo from '../../assets/images/main/sun_man_mount-380-RA-Algerian.png';
import {ThemeContext} from '../../context/ThemeContext';
import MyArrowBack from '../../components/main/MyArrowBack';
// import PageHeadRight from '../../components/main/PageHeadRight';

var db = openDatabase({name: 'UserDatabase.db'});

const loginValidationSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, ({min}) => `Password must be at least ${min} characters`)
    .required('Password is required'),
});

export default function SignUp() {
  const emailInput = useRef(null);
  const passwordInput = useRef(null);
  const [userData, setUserData] = useState({});
  let [inputUserEmail, setInputUserEmail] = useState('');
  let [inputUserPassword, setInputUserPassword] = useState('');
  //   const {token, user, saveToken, saveUser} = useAuth();
  const navigation = useNavigation();
  //   Колір
  const isDarkMode = useColorScheme() === 'dark';
  const {colors} = useContext(ThemeContext);
  const tc = colors;
  const cPageBg = tc.ctBg1; //Bg колір сторінки
  const cTittle = tc.ctText; //Bg колір сторінки
  const cText = tc.ctText; //Bg колір сторінки
  const cInputBg = tc.ctBg; //Bg колір сторінки
  const cInputBorder = tc.ctBorder1; //Bg колір сторінки
  const cBtnBg = tc.ctBtnBg; //Bg колір сторінки
  const cBtnText = tc.ctBtnText; //Bg колір сторінки
  const cLink = tc.ctLink;

  let loginUser = ({email, password}) => {
    // console.log('SignUp/loginUser/email=', email);
    // console.log('SignUp/loginUser/password=', password);
    setUserData({});
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM table_user where user_name = ? AND user_contact=?',
        [email, password],
        (tx, results) => {
          var len = results.rows.length;
          console.log('len', len);
          if (len > 0) {
            setUserData(results.rows.item(0));
            console.log(
              'SignUp/loginUser/db.transaction/results=',
              results.rows.item(0),
            );
          } else {
            Alert('No user found');
          }
        },
      );
    });
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: cPageBg}}>
      {/* Голова сторінки */}
      <View style={[styles.headContainer, {backgroundColor: cPageBg}]}>
        <MyArrowBack
          headText={'SignUp'}
          color={cText}
          colorIconBg={cPageBg}
          sizeIcon={25}
        />
        {/* <PageHeadRight colorIcon={cText} colorIconBg={cPageBg} sizeIcon={25} /> */}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Image style={styles.logoRa} source={logoRa} />
        {/* <Image source={logo} style={styles.logo} /> */}
        {/* Контейнер форми */}
        {/* <View style={{flex: 1, backgroundColor: cPageBg}}> */}
        {/* <View style={{flex: 1, backgroundColor: '#ff1'}}> */}
        <Text style={[styles.headingText, {color: cTittle}]}>
          Hey, come back
        </Text>
        <Formik
          validationSchema={loginValidationSchema}
          initialValues={{email: '', password: ''}}
          //   onSubmit={() => loginUser(values.email, values.password)} //Обробка кінцевих даних/values.email, ...
          onSubmit={loginUser} //Обробка кінцевих даних/values.email, ...
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            isValid,
          }) => (
            // /{/* KeyboardAvoidingView-залишатисявидимим, поки відображається віртуальна клавіатура. */}
            <KeyboardAvoidingView
              behavior="padding"
              style={{flex: 1, justifyContent: 'space-between'}}>
              <View
                style={[
                  styles.inputContainer,
                  {backgroundColor: cInputBg, borderColor: cInputBorder},
                ]}>
                <AntDesign name={'user'} color={cText} size={30} />
                <TextInput
                  style={styles.textInput}
                  onChangeText={handleChange('name')}
                  placeholder="Full Name"
                  keyboardType="default"
                  onBlur={handleBlur('name')}
                  value={values.name}
                  //
                  autoFocus={true}
                  autoCapitalize="words"
                  autoCorrect={true}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInput.current.focus()}
                />
              </View>
              {errors.name && touched.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
              <View
                style={[
                  styles.inputContainer,
                  {backgroundColor: cInputBg, borderColor: cInputBorder},
                ]}>
                <Ionicons name={'mail-outline'} color={cText} size={30} />
                <TextInput
                  style={styles.textInput}
                  placeholder="email@example.com"
                  keyboardType="email-address"
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                  //
                  ref={emailInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={() => passwordInput.current.focus()}
                />
              </View>
              {errors.email && touched.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
              <View
                style={[
                  styles.inputContainer,
                  {backgroundColor: cInputBg, borderColor: cInputBorder},
                ]}>
                <SimpleLineIcons name={'lock'} color={cText} size={30} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your Password"
                  secureTextEntry
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                  //
                  ref={passwordInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                />
              </View>
              {errors.password && touched.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
              <TouchableOpacity
                // onPress={() => navigation.navigate('Forget')}
                onPress={() => navigation.navigate('ProfileScreen')}>
                <Text style={[styles.forgotPassword, {color: cLink}]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!isValid}
                style={[
                  styles.loginBtnWrapper,
                  {backgroundColor: cBtnBg, borderColor: cInputBorder},
                ]}>
                <Text style={[styles.loginText, {color: cBtnText}]}>
                  SignUp
                </Text>
              </TouchableOpacity>
              <Text style={[styles.continueText, {color: cText}]}>
                or continue with
              </Text>
              <TouchableOpacity
                style={[
                  styles.googleBtnContainer,
                  {backgroundColor: cInputBg, borderColor: cInputBorder},
                ]}>
                <Image
                  source={require('/../../../assets/icons/logo_google-48.png')}
                  style={styles.googleImage}
                />
                <Text style={[styles.googleText, {color: cTittle}]}>
                  Google
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerContainer}
                onPress={() => navigation.navigate('SignUp')}>
                <Text style={[styles.accountText, {color: cText}]}>
                  Don't an account?{' '}
                </Text>
                <Text style={[styles.signupText, {color: cLink}]}>Sing up</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headContainer: {
    height: 40,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  //   container: {
  //     flex: 1,
  //     justifyContent: 'center',
  //     alignItems: 'center',
  //     paddingHorizontal: '10%',
  //   },
  logoRa: {
    marginVertical: '1%',
    height: 130,
    width: 200,
    alignSelf: 'center',
  },
  headingText: {
    // top: '1%', пливло вниз
    textAlign: 'center',
    fontSize: 32,
    fontFamily: 'Poppins-Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 20, //
    padding: 2,
    marginVertical: '2%', //
    marginHorizontal: '5%', //
    // gap:  5,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontFamily: 'Poppins-Light',
  },

  forgotPassword: {
    textAlign: 'right',
    fontFamily: 'Poppins-SemiBold',
    marginVertical: '1%',
    // color: '#000',
  },
  loginBtnWrapper: {
    marginTop: '2%',
    borderWidth: 2,
    borderRadius: 100,
    padding: 10,
    marginVertical: '1%', //
    marginHorizontal: '5%', //
  },
  loginText: {
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Poppins-Regular',
  },
  continueText: {
    textAlign: 'center',
    marginVertical: '2%',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  googleBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 100,
    padding: 10,
    marginVertical: '1%', //
    marginHorizontal: '5%', //
    gap: 10,
  },
  googleImage: {
    height: 30,
    width: 30,
  },
  googleText: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: '2%',
    gap: 10,
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
    marginVertical: '2%',
    gap: 10,
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
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    gap: '5%',
    marginBottom: 10,
  },
});
