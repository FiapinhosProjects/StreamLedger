let revenueChartInstance = null;
let expenseChartInstance = null;

export const initChart = () => {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Arrecadado'],
            datasets: [
                { label: 'twitch', data: [0], backgroundColor: '#9147FF' },
                { label: 'youtube', data: [0], backgroundColor: '#FB2C36' },
                { label: 'donates', data: [0], backgroundColor: '#00FF7F' }
            ]
        }
    });
};

export const initExpenseChart = () => {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    expenseChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Setup', 'Software', 'Outros'],
            datasets: [{
                data: [0, 0, 0]
            }]
        }
    });
};

export const updateRevenueChart = (transactions) => {
    if (!revenueChartInstance) return;

    const twitch = transactions
        .filter(t => t.type === 'income' && t.category === 'Twitch Subs')
        .reduce((acc, t) => acc + t.amount, 0);

    const youtube = transactions
        .filter(t => t.type === 'income' && t.category === 'YouTube AdSense')
        .reduce((acc, t) => acc + t.amount, 0);

    const donates = transactions
        .filter(t => t.type === 'income' && t.category === 'Donates')
        .reduce((acc, t) => acc + t.amount, 0);

    revenueChartInstance.data.datasets[0].data = [twitch];
    revenueChartInstance.data.datasets[1].data = [youtube];
    revenueChartInstance.data.datasets[2].data = [donates];

    revenueChartInstance.update();
};