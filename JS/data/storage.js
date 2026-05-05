// utils/storage.js
// ----------------------------------------------------
// 2. Ofuscação de Local Storage (Base64)
// ----------------------------------------------------

const STORAGE_KEY = 'streamLedger_transactions';

export function getTransactions() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  
  try {
    // Decodifica de Base64 e converte para JSON
    const decodedData = decodeURIComponent(escape(atob(data)));
    return JSON.parse(decodedData);
  } catch (e) {
    console.warn("Retornando parse padrão pois os dados não estão em Base64 ou estão corrompidos.");
    // Fallback caso o dado já estivesse salvo antes (migration transparente)
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}

export function saveTransactions(transactions) {
  try {
    const jsonStr = JSON.stringify(transactions);
    // Converte para Base64 para ofuscar o conteúdo no DevTools
    const encodedData = btoa(unescape(encodeURIComponent(jsonStr)));
    localStorage.setItem(STORAGE_KEY, encodedData);
  } catch (e) {
    console.error("Erro ao salvar no storage:", e);
  }
}