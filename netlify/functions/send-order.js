// Серверная функция: принимает заявку с сайта и отправляет её в Telegram.
// Токен бота и ID чата хранятся в настройках Netlify (Environment variables),
// а не в коде сайта, поэтому посетители их не увидят.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { statusCode: 500, body: 'Server is not configured' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (error) {
    return { statusCode: 400, body: 'Bad request' };
  }

  // Скрытое поле-ловушка для ботов: если заполнено, молча "принимаем" и ничего не шлём
  if (data.website) {
    return { statusCode: 200, body: 'ok' };
  }

  // Очистка и ограничение длины значений
  const clean = (value, max) =>
    String(value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

  const name = clean(data.name, 80);
  const phone = clean(data.phone, 30);
  const date = clean(data.date, 20);
  const time = clean(data.time, 10);
  const guests = clean(data.guests, 20);
  const comment = clean(data.comment, 300);

  if (!name || !phone || data.consent !== true) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const text = [
    '☕ Новая заявка на бронь',
    '',
    'Имя: ' + name,
    'Телефон: ' + phone,
    'Дата: ' + (date || '—'),
    'Время: ' + (time || '—'),
    'Гостей: ' + (guests || '—'),
    'Пожелания: ' + (comment || '—')
  ].join('\n');

  try {
    const response = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });

    if (!response.ok) {
      return { statusCode: 502, body: 'Telegram error' };
    }

    return { statusCode: 200, body: 'ok' };
  } catch (error) {
    return { statusCode: 502, body: 'Telegram unreachable' };
  }
};
