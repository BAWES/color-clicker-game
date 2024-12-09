import { GameState } from '../types';
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'blob_game_save';
const SECRET_KEY = 'your-secret-key-here';

export const storage = {
  saveGame(state: GameState) {
    try {
      // Convert Set to Array for serialization
      const serializedState = {
        ...state,
        achievements: {
          ...state.achievements,
          colorsUnlocked: Array.from(state.achievements.colorsUnlocked)
        }
      };

      const stateString = JSON.stringify(serializedState);
      const checksum = CryptoJS.SHA256(stateString).toString();
      
      const saveData = {
        state: serializedState,
        checksum,
        timestamp: Date.now()
      };
      
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(saveData),
        SECRET_KEY
      ).toString();
      
      localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  },

  loadGame(): GameState | null {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      const saveData = JSON.parse(decrypted);
      
      const stateString = JSON.stringify(saveData.state);
      const checksum = CryptoJS.SHA256(stateString).toString();
      
      if (checksum !== saveData.checksum) {
        console.warn('Save data appears to be tampered with');
        return null;
      }

      // Convert Array back to Set after deserialization
      return {
        ...saveData.state,
        achievements: {
          ...saveData.state.achievements,
          colorsUnlocked: new Set(saveData.state.achievements.colorsUnlocked)
        }
      };
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }
}; 