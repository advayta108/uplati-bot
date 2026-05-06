// Функция для генерации заголовков запросов (в т.ч. как у актуального веб-клиента lk.uplati.ru)
export const getHeaders = (token?: string): Record<string, string> => {
  const h: Record<string, string> = {
    accept: 'application/json',
    'accept-language': 'ru-RU,ru;q=0.7',
    'sec-ch-ua': '"Brave";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'sec-gpc': '1',
    'x-client': 'web;2.8.5;desktop',
    Referer: 'https://lk.uplati.ru/',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'User-Agent': 'Uplati-SDK',
  };
  if (token) {
    h.authorization = `Bearer ${token}`;
  }
  return h;
};

