import {ToastAndroid} from 'react-native';

export const handleSQLError = (error, query) => {
  let errorMessage = 'Невідома помилка';

  // Перевірка повідомлення про помилку для більш детальної діагностики
  if (error.message.includes('FOREIGN KEY constraint failed')) {
    errorMessage = 'Помилка: неможливо зробити операцію, тому що є залежні записи!';
  } else if (error.message.includes('SQLITE_CONSTRAINT')) {
    errorMessage = 'Помилка: порушено обмеження при виконанні запиту!';
  } else if (error.message.includes('SQLITE_BUSY')) {
    errorMessage = 'База даних наразі зайнята. Спробуйте пізніше.';
  } else if (error.message.includes('SQLITE_SYNTAX')) {
    errorMessage = `Помилка синтаксису SQL запиту: ${query}`;
  } else {
    errorMessage = 'RRR Помилка транзакції!';
  }

  // Виведення повідомлення
  console.log(`Помилка виконання SQL: ${errorMessage}`, query);
  ToastAndroid.show(errorMessage, ToastAndroid.LONG);
};
