export const getTransactions = () => {
    return JSON.parse(localStorage.getItem('streamledger_data')) || [];
};

export const saveTransactions = (data) => {
    localStorage.setItem('streamledger_data', JSON.stringify(data));
};