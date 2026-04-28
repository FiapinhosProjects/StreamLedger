// --- SERVIÇO DE ARMAZENAMENTO (LocalStorage) ---
 
export const loadTransactions = () => {
    return JSON.parse(localStorage.getItem('streamledger_data')) || [];
};
 
export const saveTransactions = (transactions) => {
    localStorage.setItem('streamledger_data', JSON.stringify(transactions));
};
 