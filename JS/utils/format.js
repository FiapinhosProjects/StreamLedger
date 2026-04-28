// máscara de moeda
export const applyCurrencyMask = (input) => {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value === "") {
            e.target.value = "";
            return;
        }
        value = (parseInt(value, 10) / 100).toFixed(2);
        value = value.replace(".", ",");
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        e.target.value = value;
    });
};

export const formatToInput = (value) => {
    let formatted = value.toFixed(2).replace(".", ",");
    return formatted.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
};

export const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};