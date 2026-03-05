import CryptoJS from 'crypto-js';

const SECRET = process.env.AES_SECRET_KEY || 'fallback_key_32_chars_minimum!!!';

export const encrypt = (text: string): string =>
  CryptoJS.AES.encrypt(text, SECRET).toString();

export const decrypt = (cipher: string): string =>
  CryptoJS.AES.decrypt(cipher, SECRET).toString(CryptoJS.enc.Utf8);
