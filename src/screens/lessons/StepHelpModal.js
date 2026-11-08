// screens/StepHelpModal.js
// добав.
// Довідка по кроку уроку (rule/content/dialogue/review).
// Дані для кожного кроку лежать у STEP_HELP нижче — додавати нові кроки
// сюди, компонент сам підхопить (якщо кроку нема — покаже заглушку).

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

const STEP_HELP = {
  rule: {
    title: '❔ Довідка «Теорія»',
    sections: [
      {
        heading: '1. Для чого цей етап',
        items: [
          'Тут коротко пояснюється граматичне правило уроку (якщо воно є).',
          'Натисніть «Переглянути», щоб відкрити повний опис правила.',
        ],
      },
      {
        heading: '2. Якщо правила нема',
        items: [
          'Деякі уроки не мають окремої граматичної теми — тоді переходьте одразу далі.',
        ],
      },
      {
        heading: '3. Наступний етап',
        items: ['Після ознайомлення з правилом перейдіть до «Контенту».'],
      },
    ],
  },

  content: {
    title: '❔ Довідка «Контент»',
    intro:
      'Це не опис кнопок, а коротке пояснення, що відбувається на цьому етапі.',
    sections: [
      {
        heading: '1. Для чого цей етап',
        items: [
          'На цьому етапі ви знайомитеся зі словами, виразами, реченнями та текстами, які потрібні для теми уроку.',
          'Перед діалогом рекомендується прослухати матеріал хоча б один раз.',
        ],
      },
      {
        heading: '2. Вкладки',
        items: [
          'Слова — окремі слова.',
          'Вирази — сталі вирази.',
          'Речення — приклади використання.',
          "Текст — зв'язний текст.",
          'Всі — усі типи матеріалу разом.',
        ],
      },
      {
        heading: '3. Озвучка',
        items: [
          'Можна слухати автоматично або вручну.',
          'Озвучуються оригінал і переклад відповідно до налаштувань.',
        ],
      },
      {
        heading: '4. Оцінювання',
        items: [
          'Позначайте знайомі та незнайомі слова.',
          'Програма використовує ці дані для повторення.',
        ],
      },
      {
        heading: '5. Налаштування',
        items: ['Через ⚙️ можна змінити всі параметри відтворення.'],
      },
      {
        heading: '6. Наступний етап',
        items: ['Після ознайомлення з матеріалом перейдіть до діалогу з AI.'],
      },
    ],
  },

  dialogue: {
    title: '❔ Довідка «Діалог з AI»',
    sections: [
      {
        heading: '1. Для чого цей етап',
        items: [
          'AI ставить прості питання по темі уроку, використовуючи вивчені слова та правило.',
          'Ви відповідаєте голосом — це тренує розмовну практику.',
        ],
      },
      {
        heading: '2. Як це працює',
        items: [
          'Натисніть на мікрофон, скажіть відповідь, зупиніть запис.',
          'Розпізнаний текст можна поправити перед відправкою.',
          'AI покаже виправлення (якщо є помилка) і поставить наступне питання.',
        ],
      },
      {
        heading: '3. Немає обмежень',
        items: [
          'Спілкуйтесь стільки, скільки хочете — завершуйте кнопкою «Завершити».',
        ],
      },
      {
        heading: '4. Наступний етап',
        items: ['Після діалогу перейдіть до «Підсумку».'],
      },
    ],
  },

  review: {
    title: '❔ Довідка «Підсумок»',
    sections: [
      {
        heading: '1. Для чого цей етап',
        items: [
          'Тут буде статистика по уроку: скільки слів ви вже знаєте, скільки часу витрачено, як пройшов діалог.',
        ],
      },
      {
        heading: '2. Поки що',
        items: ['Цей етап ще розробляється.'],
      },
    ],
  },
};

const StepHelpModal = ({isVisible, onClose, stepKey}) => {
  const help = STEP_HELP[stepKey];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableOpacity style={styles.centeredView} onPress={onClose} />
      <View style={styles.modalView}>
        <Text style={styles.modalHeadText}>
          {help ? help.title : '❔ Довідка'}
        </Text>
        <ScrollView style={styles.scrollContainer}>
          {help ? (
            <>
              {help.intro && <Text style={styles.introText}>{help.intro}</Text>}
              {help.sections.map((section, idx) => (
                <View key={idx} style={styles.sectionBlock}>
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                  {section.items.map((item, itemIdx) => (
                    <Text key={itemIdx} style={styles.modalText}>
                      • {item}
                    </Text>
                  ))}
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.modalText}>
              Підказка для цього кроку ще не готова.
            </Text>
          )}
        </ScrollView>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <AntDesign name="close" color={'#1a1a1a'} size={20} />
            <Text style={styles.btnText}>Закрити вікно</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default StepHelpModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalView: {
    width: '90%',
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 0,
  },
  modalHeadText: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  introText: {
    marginBottom: 10,
    fontSize: 12,
    fontStyle: 'italic',
  },
  sectionBlock: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalText: {
    marginBottom: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContainer: {
    height: '80%',
    width: '100%',
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginVertical: 5,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: '#ffd11a',
    borderColor: '#ffd11a',
  },
  btnText: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
