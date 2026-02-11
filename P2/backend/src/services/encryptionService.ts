import CryptoJS from 'crypto-js';

const AES_SECRET = process.env.AES_SECRET_KEY || 'default-secret-key-change-this';

export class EncryptionService {
  // Encriptar texto
  static encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, AES_SECRET).toString();
  }

  // Desencriptar texto
  static decrypt(encryptedText: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, AES_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}