//ProfileScreen.js;
//https://www.youtube.com/watch?v=o3eaTF2j_IA&ab_channel=ZeroDegreeCoder
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
// import Header from '../components/Header';
import {fontSize, iconSize, spacing} from '../../constants/dimensions';
// import { colors } from '../constants/color'

import CustomInput from '../../components/CustomInput';

// icons
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useTheme} from '@react-navigation/native';

export default function ProfileScreen() {
  const {colors} = useTheme();

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={{
        paddingBottom: 2 * spacing.xl,
      }}>
      {/* <Header /> */}

      {/* profile image container */}
      <View style={styles.profileImageContainer}>
        <Image
          source={require('../../assets/images/dp.png')}
          style={styles.profileImage}
        />
        <TouchableOpacity
          style={[
            styles.editIconContainer,
            {
              backgroundColor: colors.orange,
            },
          ]}>
          <Feather
            name={'edit-3'}
            size={iconSize.md}
            color={colors.iconWhite}
          />
        </TouchableOpacity>
      </View>

      {/* profile details contaienr */}
      <View style={styles.nameRoleContainer}>
        <Text
          style={[
            styles.name,
            {
              color: colors.textPrimary,
            },
          ]}>
          GFXAgency
        </Text>
        <Text
          style={[
            styles.role,
            {
              color: colors.textSecondary,
            },
          ]}>
          UI UX DESIGN
        </Text>
      </View>

      {/* infult fiels container */}
      <View style={styles.inputFieldsContainer}>
        {/* add all the input fields */}
        <CustomInput
          label="Your Email"
          placeholder="zerodegreecoder@gmail.com"
          icon={
            <Ionicons
              name={'mail-outline'}
              size={iconSize.md}
              color={colors.iconSecondary}
              style={styles.icon}
            />
          }
          // value
          // handleChange
        />

        <CustomInput
          label="Phone Number"
          placeholder="+93123135"
          icon={
            <Feather
              name={'phone'}
              size={iconSize.md}
              color={colors.iconSecondary}
              style={styles.icon}
            />
          }
        />

        <CustomInput label="Website" placeholder="www.zerodegreecoder.in" />

        <CustomInput
          label="Password"
          placeholder="*******"
          icon={
            <AntDesign
              name={'lock1'}
              size={iconSize.md}
              color={colors.iconSecondary}
              style={styles.icon}
            />
          }
          type="password"
        />
      </View>

      {/* logutbutt */}
      <TouchableOpacity
        style={[
          styles.logoutButton,
          {
            borderColor: colors.orange,
          },
        ]}>
        <Text
          style={[
            styles.logoutText,
            {
              color: colors.orange,
            },
          ]}>
          Logout
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  profileImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  profileImage: {
    height: 140,
    width: 140,
  },
  editIconContainer: {
    height: 35,
    width: 35,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22,
    gap: 45,
  },
  nameRoleContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  name: {
    fontFamily: 'Poppins - semiBold',
    fontSize: fontSize.lg,
  },
  role: {
    fontFamily: 'Poppins - regular',
    fontSize: fontSize.md,
  },
  inputFieldsContainer: {
    marginVertical: spacing.md,
  },
  icon: {
    marginHorizontal: spacing.sm,
  },
  logoutButton: {
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: spacing.md,
  },
  logoutText: {
    fontSize: fontSize.lg,
    fontFamily: 'Poppins - bold',
  },
});
