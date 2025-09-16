class FinancialChart {
    constructor() {
        this.chart = null;
        this.currentView = 'monthly'; // monthly, yearly, category
        this.init();
    }

    init() {
        this.createChart();
        this.updateChart();
        this.setupEventListeners();
    }

    createChart() {
        const ctx = document.getElementById('financialChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Receitas',
                        data: [],
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Despesas',
                        data: [],
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Saldo',
                        data: [],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolução Financeira',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': R$ ' + context.parsed.y.toFixed(2);
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    updateChart(view = this.currentView) {
        this.currentView = view;
        
        const data = this.prepareChartData(view);
        
        this.chart.data.labels = data.labels;
        this.chart.data.datasets[0].data = data.income;
        this.chart.data.datasets[1].data = data.expenses;
        this.chart.data.datasets[2].data = data.balance;
        
        this.chart.options.plugins.title.text = this.getTitle(view);
        this.chart.update();
        
        // Atualizar botões ativos
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
    }

    prepareChartData(view) {
        const manager = window.financialManager;
        const now = new Date();
        const data = {
            labels: [],
            income: [],
            expenses: [],
            balance: []
        };

        switch(view) {
            case 'monthly':
                // Últimos 12 meses
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthData = this.getMonthData(date.getFullYear(), date.getMonth());
                    
                    data.labels.push(this.getMonthName(date.getMonth()));
                    data.income.push(monthData.income);
                    data.expenses.push(monthData.expenses);
                    data.balance.push(monthData.income - monthData.expenses);
                }
                break;

            case 'yearly':
                // Últimos 5 anos
                for (let i = 4; i >= 0; i--) {
                    const year = now.getFullYear() - i;
                    const yearData = this.getYearData(year);
                    
                    data.labels.push(year.toString());
                    data.income.push(yearData.income);
                    data.expenses.push(yearData.expenses);
                    data.balance.push(yearData.income - yearData.expenses);
                }
                break;

            case 'category':
                // Por categoria (últimos 6 meses)
                const categories = {};
                const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                
                manager.transactions.forEach(transaction => {
                    const transactionDate = new Date(transaction.date);
                    if (transactionDate >= sixMonthsAgo && transaction.type === 'expense') {
                        if (!categories[transaction.category]) {
                            categories[transaction.category] = 0;
                        }
                        categories[transaction.category] += transaction.amount;
                    }
                });

                data.labels = Object.keys(categories).map(cat => this.getCategoryName(cat));
                data.income = Array(Object.keys(categories).length).fill(0);
                data.expenses = Object.values(categories);
                data.balance = Array(Object.keys(categories).length).fill(0);
                
                // Mudar para gráfico de pizza para visualização de categorias
                this.chart.config.type = 'pie';
                this.chart.data.datasets = [{
                    data: data.expenses,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ],
                    borderWidth: 2
                }];
                break;
        }

        return data;
    }

    getMonthData(year, month) {
        const manager = window.financialManager;
        let income = 0;
        let expenses = 0;

        manager.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            if (transactionDate.getFullYear() === year && transactionDate.getMonth() === month) {
                if (transaction.type === 'income') {
                    income += transaction.amount;
                } else {
                    expenses += transaction.amount;
                }
            }
        });

        return { income, expenses };
    }

    getYearData(year) {
        const manager = window.financialManager;
        let income = 0;
        let expenses = 0;

        manager.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            if (transactionDate.getFullYear() === year) {
                if (transaction.type === 'income') {
                    income += transaction.amount;
                } else {
                    expenses += transaction.amount;
                }
            }
        });

        return { income, expenses };
    }

    getMonthName(month) {
        const months = [
            'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
        ];
        return months[month];
    }

    getCategoryName(categoryKey) {
        const categories = {
            'food': 'Alimentação',
            'transport': 'Transporte',
            'housing': 'Moradia',
            'health': 'Saúde',
            'education': 'Educação',
            'entertainment': 'Entretenimento',
            'other': 'Outros'
        };
        return categories[categoryKey] || categoryKey;
    }

    getTitle(view) {
        const titles = {
            'monthly': 'Evolução Mensal (Últimos 12 meses)',
            'yearly': 'Evolução Anual (Últimos 5 anos)',
            'category': 'Despesas por Categoria (Últimos 6 meses)'
        };
        return titles[view];
    }

    setupEventListeners() {
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                
                // Resetar para gráfico de linha se não for categoria
                if (view !== 'category' && this.chart.config.type === 'pie') {
                    this.chart.config.type = 'line';
                    this.chart.data.datasets = [
                        {
                            label: 'Receitas',
                            data: [],
                            borderColor: '#27ae60',
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Despesas',
                            data: [],
                            borderColor: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Saldo',
                            data: [],
                            borderColor: '#3498db',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }
                    ];
                }
                
                this.updateChart(view);
            });
        });
    }

    // Método para atualizar quando novos dados são adicionados
    refresh() {
        this.updateChart(this.currentView);
    }
}

// Inicializar o gráfico quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.financialChart = new FinancialChart();
    
    // Observar mudanças nos dados para atualizar o gráfico automaticamente
    const originalSaveData = window.financialManager.saveData;
    window.financialManager.saveData = function() {
        originalSaveData.apply(this);
        if (window.financialChart) {
            window.financialChart.refresh();
        }
    };
});
