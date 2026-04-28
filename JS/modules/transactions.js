export const processSaveTransaction = (transactions, data) => {
    const index = transactions.findIndex(t => t.id === data.id);

    if (index !== -1) {
        transactions[index] = data;
    } else {
        transactions.push(data);
    }

    return transactions;
};

export const deleteTransactionById = (transactions, id) => {
    return transactions.filter(t => t.id !== id);
};

export const isDuplicate = (transactions, data) => {
    return transactions.some(t =>
        t.title.trim().toLowerCase() === data.title.trim().toLowerCase() &&
        t.amount === data.amount &&
        t.type === data.type &&
        t.id !== data.id
    );
};