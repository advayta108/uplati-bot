// Функция для генерации заголовков запросов
export const getHeaders = (token?: string) => ({
  'accept': 'application/json',
  'accept-language': 'ru-RU,ru;q=0.5',
  'authorization': token ? `Bearer ${token}` : '',
  'sec-ch-ua': '"Not_A Brand";v="99", "Brave";v="109", "Chromium";v="109"',
  'sec-ch-ua-mobile': '?1',
  'sec-ch-ua-platform': '"Android"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
  'sec-gpc': '1',
  'x-client': 'web;2.4.27;desktop',
  'Referer': 'https://lk.uplati.ru/',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'User-Agent': 'Uplati-SDK',
});

