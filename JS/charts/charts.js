// --- MÓDULO DE GRÁFICOS (Chart.js) ---
 
export let revenueChartInstance = null;
export let expenseChartInstance = null;
 
export const initChart = () => {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
 
    revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Arrecadado'],
            datasets: [
                {
                    label: 'twitch',
                    data: [0],
                    backgroundColor: '#9147FF',
                    borderRadius: 6,
                    barPercentage: 0.4,
                    categoryPercentage: 0.5
                },
                {
                    label: 'youtube',
                    data: [0],
                    backgroundColor: '#FB2C36',
                    borderRadius: 6,
                    barPercentage: 0.4,
                    categoryPercentage: 0.5
                },
                {
                    label: 'donates',
                    data: [0],
                    backgroundColor: '#00FF7F',
                    borderRadius: 6,
                    barPercentage: 0.4,
                    categoryPercentage: 0.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#a0a0a0',
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#a0a0a0',
                    },
                    border: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#a0a0a0',
                        usePointStyle: true,
                        boxWidth: 10,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(18, 18, 20, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
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
                data: [0, 0, 0],
                backgroundColor: ['#9147FF', '#00FF7F', '#FF6900'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#a0a0a0',
                        usePointStyle: false,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(18, 18, 20, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
 
    const isDespesasPage = window.location.pathname.includes('despesas.html');
    if (!isDespesasPage) return;
};