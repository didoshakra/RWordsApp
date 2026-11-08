// AboutWords.js
import React from 'react';
import {ScrollView, View, Text, StyleSheet} from 'react-native';

const AboutWords = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📖 RWords</Text>
      <Text style={styles.paragraph}>
        <Text style={styles.bold}>RWords</Text> — мобільний застосунок на
        Android для вивчення іноземних слів і фраз.
      </Text>
      <Text style={styles.paragraph}>
        У застосунку ви можете прослуховувати слова, вирази та речення з
        перекладом на вибрану мову із вбудованих списків або додавати власні
        слова й теми — як безпосередньо в застосунку, так і через сайт за
        допомогою імпорту.
      </Text>
      <Text style={styles.paragraph}>
        Під час прослуховування ви можете оцінювати свої знання натискаючи
        кнопки
        <Text style={styles.highlight}> «Знаю»</Text> /
        <Text style={styles.highlight}> «Не знаю»</Text>, чи голосом, подаючи
        аналогічні команди. Це формує персональні списки: слова, позначені як
        «Знаю», можна виключати з подальшого відтворення.
      </Text>

      <Text style={styles.subtitle}>🧠 Головна ідея</Text>
      <Text style={styles.paragraph}>
        Оцінка знань голосом або кнопками формує ваші персоналізовані списки для
        подальшого прослуховування. Голосові команди роблять роботу комфортною й
        швидкою.
      </Text>

      <Text style={styles.subtitle}>🧭 Основні екрани</Text>
      <Text style={styles.list}>🏠 Home — титульний екран з іконками:</Text>
      <Text style={styles.sublist}>🌙 Темна / 🌞 Світла тема</Text>
      <Text style={styles.sublist}>❓ Загальний опис додатку</Text>

      <Text style={styles.list}>
        🎧 Слухати — головний екран з двома частинами:
      </Text>
      <Text style={styles.sublist}>🎙️🚫 Вмикати/вимикати мікрофон</Text>
      <Text style={styles.sublist}>🎙️ Налаштовувати голосові команди</Text>
      <Text style={styles.sublist}>⚙️ Обирати режими прослуховування</Text>
      <Text style={styles.sublist}>🎯 Переглядати кількість вибраних слів</Text>
      <Text style={styles.sublist}>🔽 Обирати рівень знань і теми</Text>
      <Text style={styles.sublist}>↺ Почати з початку / ▶️ Продовжити</Text>
      <Text style={styles.sublist}>
        🗣️ Керувати відтворенням кнопками чи голосом
      </Text>
      <Text style={styles.sublist}>
        ✅ Оцінювати знання («Знаю» / «Не знаю»)
      </Text>
      <Text style={styles.sublist}>
        ⏭️ Пропускати слово / 🔁 Повторювати / ⏮️ Повертатись
      </Text>
      <Text style={styles.sublist}>🔄 Почати тему з початку</Text>
      <Text style={styles.sublist}>📂 Перейти на наступну тему</Text>

      <Text style={styles.list}>
        🌐 wwwRWords — перехід на сайт для нових списків
      </Text>
      <Text style={styles.list}>
        ☰ Меню — налаштування, теми оформлення, оновлення
      </Text>

      <Text style={styles.subtitle}>💡 Додатково</Text>
      <Text style={styles.paragraph}>
        Ви можете додавати власні списки слів, експортувати й імпортувати їх
        через сайт. Завдяки цьому RWords підходить і для самостійного навчання,
        і для групових занять.
      </Text>
      <Text style={styles.paragraph}>
        Використовуйте RWords щодня, щоб закріплювати знання й робити навчання
        більш інтерактивним та ефективним.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'justify',
  },
  list: {
    fontSize: 14,
    marginTop: 10,
    fontWeight: '600',
  },
  sublist: {
    fontSize: 12,
    marginLeft: 16,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  highlight: {
    fontWeight: '600',
    color: '#0077cc',
  },
});

export default AboutWords;
