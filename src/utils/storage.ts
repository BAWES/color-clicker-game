import { GameState } from '@/types';
import CryptoJS from 'crypto-js';

// Simple key for demo purposes - in production you might want something more secure
const STORAGE_KEY = 'blob_game_save';
const CRYPTO_KEY = 'blob-game-secret-123';

export const storage = {
  saveGame(state: GameState) {
    try {
      // Convert Set to Array before saving
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
        CRYPTO_KEY
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
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, CRYPTO_KEY).toString(CryptoJS.enc.Utf8);
      const saveData = JSON.parse(decrypted);
      
      // Convert Array back to Set after loading
      const state = {
        ...saveData.state,
        achievements: {
          ...saveData.state.achievements,
          colorsUnlocked: new Set(saveData.state.achievements.colorsUnlocked)
        }
      };
      
      const stateString = JSON.stringify(saveData.state);
      const checksum = CryptoJS.SHA256(stateString).toString();
      
      if (checksum !== saveData.checksum) {
        console.warn('Save data appears to be tampered with');
        return null;
      }
      
      return state;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }
}; 