//RootStack.js
import React, {useContext} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ThemeContext} from '@/context/ThemeContext';

// import Settings from '../screens/Settings';

import Home from '@/screens/Home';
import ColorSettings from '@/components/settings/colors/ColorSettings';
//
import Words from '@/screens/words/Words';
// import WordsList from '@/screens/words/WordsList';
import WordsListLevels from '@/screens/words/WordsListLevels';
import WordsAdd from '@/screens/words/WordsAdd';
import WordsEdit from '@/screens/words/WordsEdit';
import TopicsList from '@/screens/words/TopicList';

import TopicsAdd from '@/screens/words/TopicsAdd';
import TopicsEdit from '@/screens/words/TopicsEdit';
import SectionsList from '@/screens/words/SectionsList';
import SectionsAdd from '@/screens/words/SectionsAdd';
import SectionsEdit from '@/screens/words/SectionsEdit';
import Profile from '@/screens/registration/Profile';
import AppWebView from '@/components/web/AppWebView';
import MenuScreen from '@/screens/MenuScreen';
import SettingsScreen from '@/components/settings/SettingsScreen';
//
import AboutWords from '@/screens/AboutWords';
import ImportTextScreen from '@/screens/words/ImportTextScreen';
import TranslatorScreen from '@/screens/translator/TranslatorScreen';
import NoteRecorderScreen from '@/screens/notes/NoteRecorderScreen';
import NotesListLevels from '@/screens/notes/NotesListLevels';
import NotesAdd from '@/screens/notes/NoteAdd';
import NotesEdit from '@/screens/notes/NotesEdit';
import NotesSectionAdd from '@/screens/notes/NotesSectionAdd';
import NotesSectionEdit from '@/screens/notes/NotesSectionEdit';
import NotesThemesAdd from '@/screens/notes/NotesThemesAdd';
import NotesThemesEdit from '@/screens/notes/NotesThemesEdit';
import RuleScreen from '@/screens/rules/RuleScreen';
import RulesListLevels from '@/screens/rules/RulesListLevels';
import RulesAdd from '@/screens/rules/RuleFormScreen';
import RulesEdit from '@/screens/rules/RuleFormScreen';
import LearningHomeScreen from '@/screens/learning/LearningHomeScreen';
import LessonScreen from '@/screens/lessons/LessonScreen';
import LessonsListScreen from '@/screens/lessons/LessonsListScreen';
import AIDialogueScreen from '@/screens/dialog/AIDialogueScreen';
import LessonLevelsScreen from '@/screens/lessons/LessonLevelsScreen';
import LessonTopicsLessonsScreen from '@/screens/lessons/LessonTopicsLessonsScreen';
import LessonTopicsBindScreen from '@/screens/lessons/LessonTopicsBindScreen';
import LevelsAdd from '@/screens/lessons/LevelsAdd';
import LevelsEdit from '@/screens/lessons/LevelsEdit';
import FreeDialogueScreen from '@/screens/dialog/FreeDialogueScreen';

//Створення власного стеку
const Stack = createNativeStackNavigator(); //функція, яка повертає об’єкт, що містить 2 властивості: Screenі Navigator.

export default function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home" //початковий маршрут
    >
      <Stack.Screen
        name="Home"
        component={Home}
        options={{headerShown: false}}
      />
      {/* <Stack.Screen
        name="Profile"
        component={Profile}
        options={{headerShown: false}}
      />
      <Stack.Screen name="Settings" component={Settings} /> */}

      <Stack.Screen
        name="ColorSettings"
        component={ColorSettings}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AppWebView"
        component={AppWebView}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="MenuScreen"
        component={MenuScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AboutRWords"
        component={AboutWords}
        options={{headerShown: false}}
      />
      {/* <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{headerShown: false}}
      /> */}

      {/* // Word */}

      <Stack.Screen
        name="Words"
        component={Words}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="WordsAdd"
        component={WordsAdd}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="WordsEdit"
        component={WordsEdit}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="TopicsList"
        component={TopicsList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="TopicsAdd"
        component={TopicsAdd}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="TopicsEdit"
        component={TopicsEdit}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="SectionsList"
        component={SectionsList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="SectionsAdd"
        component={SectionsAdd}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="SectionsEdit"
        component={SectionsEdit}
        options={{headerShown: false}}
      />
      {/* <Stack.Screen
        name="WordsList"
        component={WordsList}
        options={{headerShown: false}}
      /> */}
      <Stack.Screen
        name="WordsListLevels"
        component={WordsListLevels}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ImportText"
        component={ImportTextScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="TranslatorScreen"
        component={TranslatorScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="NoteRecorderScreen"
        component={NoteRecorderScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NotesListLevels"
        component={NotesListLevels}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NotesAdd"
        component={NotesAdd}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NotesSectionAdd"
        component={NotesSectionAdd}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NotesSectionEdit"
        component={NotesSectionEdit}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NotesThemesAdd"
        component={NotesThemesAdd}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NotesThemesEdit"
        component={NotesThemesEdit}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="NotesEdit"
        component={NotesEdit}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="RuleScreen"
        component={RuleScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RulesListLevels"
        component={RulesListLevels}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RulesAdd"
        component={RulesAdd}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RulesEdit"
        component={RulesEdit}
        options={{headerShown: false}}
      />
      {/*  */}
      <Stack.Screen
        name="LearningHomeScreen"
        component={LearningHomeScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LessonScreen"
        component={LessonScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LessonsListScreen"
        component={LessonsListScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LessonLevelsScreen"
        component={LessonLevelsScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LessonTopicsLessonsScreen"
        component={LessonTopicsLessonsScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LessonTopicsBindScreen"
        component={LessonTopicsBindScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LevelsAdd"
        component={LevelsAdd}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LevelsEdit"
        component={LevelsEdit}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AIDialogueScreen"
        component={AIDialogueScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="FreeDialogueScreen"
        component={FreeDialogueScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{headerShown: false}}
      />

      {/* examples */}
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{headerShown: false}}
      />
      </Stack.Navigator>
  );
}
