export const getTotalByType = (transactions, type) => {
    return transactions
        .filter(t => t.type === type)
        .reduce((acc, t) => acc + t.amount, 0);
};

export const getTotalByCategory = (transactions, type, category) => {
    return transactions
        .filter(t => t.type === type && t.category === category)
        .reduce((acc, t) => acc + t.amount, 0);
};

export const getTotalExcludingCategories = (transactions, type, excludeCategories) => {
    return transactions
        .filter(t => t.type === type && !excludeCategories.includes(t.category))
        .reduce((acc, t) => acc + t.amount, 0);
};

export const isDuplicate = (transactions, data) => {
    return transactions.some(t =>
        t.title.trim().toLowerCase() === data.title.trim().toLowerCase() &&
        t.amount === data.amount &&
        t.type === data.type &&
        t.id !== data.id
    );
};
