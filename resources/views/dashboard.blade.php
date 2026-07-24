<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard – Driscoll's</title>
    <!-- Google Font -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <!-- ApexCharts CDN -->
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    <!-- Flatpickr CDN -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <!-- Custom Dashboard Styles -->
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}" />
</head>
<body>
    <!-- Modal Backdrop Overlay -->
    <div class="modal-backdrop active" id="dashboardModal">
        <!-- Modal Content Container -->
        <div class="modal-content" id="modalContent">
            
            <!-- Close Button -->
            <button class="modal-close-btn" id="closeModal" title="Cerrar (Esc)" aria-label="Cerrar Modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <!-- Dashboard Header -->
            <header class="dashboard-header">
                <div class="dashboard-title-group">
                    <h1>Dashboard Analytics</h1>
                    <div class="dashboard-subtitle">Resumen ejecutivo y estado del sistema</div>
                </div>

                <div class="date-picker-wrapper">
                    <svg class="date-picker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <input id="dateRange" type="text" placeholder="Seleccionar rango..." readonly />
                </div>
            </header>

            <!-- Dashboard Body -->
            <main class="dashboard-body">
                
                <!-- KPI Stat Summary Cards -->
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper purple">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                        </div>
                        <div class="kpi-info">
                            <span class="kpi-label">WhatsApp Enviados</span>
                            <span class="kpi-value" id="kpi-messages">482</span>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper emerald">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                        </div>
                        <div class="kpi-info">
                            <span class="kpi-label">Carnets / Documentos</span>
                            <span class="kpi-value" id="kpi-documents">126</span>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper amber">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                        </div>
                        <div class="kpi-info">
                            <span class="kpi-label">Integraciones Activas</span>
                            <span class="kpi-value" id="kpi-integrations">99.4%</span>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-grid">
                    
                    <!-- Chart 1: WhatsApp -->
                    <div class="chart-card">
                        <div class="chart-card-header">
                            <h2 class="chart-card-title">Mensajes WhatsApp enviados</h2>
                        </div>
                        <div class="chart-container" id="chart-messages"></div>
                    </div>

                    <!-- Chart 2: Documentos -->
                    <div class="chart-card documents">
                        <div class="chart-card-header">
                            <h2 class="chart-card-title">Documentos y Carnets enviados</h2>
                        </div>
                        <div class="chart-container" id="chart-documents"></div>
                    </div>

                    <!-- Chart 3: Integraciones -->
                    <div class="chart-card integrations" style="grid-column: 1 / -1;">
                        <div class="chart-card-header">
                            <h2 class="chart-card-title">Actividad de Integraciones</h2>
                        </div>
                        <div class="chart-container" id="chart-integrations"></div>
                    </div>

                </div>
            </main>
        </div>
    </div>

    <script>
        let chartMessagesInstance = null;
        let chartDocumentsInstance = null;
        let chartIntegrationsInstance = null;

        // Close Modal Handler
        function closeModalWindow() {
            const modal = document.getElementById('dashboardModal');
            modal.classList.remove('active');
            setTimeout(() => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '/';
                }
            }, 250);
        }

        document.getElementById('closeModal').addEventListener('click', closeModalWindow);
        
        // Close on clicking backdrop outside content
        document.getElementById('dashboardModal').addEventListener('click', (e) => {
            if (e.target.id === 'dashboardModal') {
                closeModalWindow();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModalWindow();
            }
        });

        // Initialize Flatpickr in range mode
        flatpickr('#dateRange', {
            mode: 'range',
            dateFormat: 'Y-m-d',
            defaultDate: [
                new Date(new Date().setDate(new Date().getDate() - 7)), 
                new Date()
            ],
            onClose: function(selectedDates) {
                if (selectedDates.length === 2) {
                    const start = selectedDates[0].toISOString().split('T')[0];
                    const end   = selectedDates[1].toISOString().split('T')[0];
                    fetchDashboardData(start, end);
                }
            }
        });

        // Render ApexChart with dark theme options
        function createChartOptions(title, categories, seriesData, primaryColor, secondaryColor) {
            return {
                chart: { 
                    type: 'area', 
                    height: 260, 
                    toolbar: { show: false },
                    background: 'transparent',
                    fontFamily: 'Inter, sans-serif',
                    foreColor: '#94a3b8'
                },
                theme: { mode: 'dark' },
                colors: [primaryColor],
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 2.5 },
                series: [{ name: title, data: seriesData }],
                xaxis: { 
                    categories: categories,
                    axisBorder: { show: false },
                    axisTicks: { show: false }
                },
                yaxis: {
                    labels: {
                        formatter: (val) => Math.round(val)
                    }
                },
                grid: {
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                    strokeDashArray: 4
                },
                tooltip: { 
                    theme: 'dark',
                    x: { format: 'yyyy-MM-dd' }
                },
                fill: { 
                    type: 'gradient', 
                    gradient: { 
                        shade: 'dark',
                        type: 'vertical',
                        shadeIntensity: 0.5, 
                        gradientToColors: [secondaryColor],
                        opacityFrom: 0.5, 
                        opacityTo: 0.05 
                    } 
                },
                animations: { enabled: true, easing: 'easeinout', speed: 600 }
            };
        }

        function renderOrUpdateCharts(dates, messages, documents, integrations) {
            // Update KPI totals
            document.getElementById('kpi-messages').innerText = messages.reduce((a, b) => a + b, 0);
            document.getElementById('kpi-documents').innerText = documents.reduce((a, b) => a + b, 0);

            // Chart 1: Messages
            const opt1 = createChartOptions('Mensajes Enviados', dates, messages, '#6366f1', '#8b5cf6');
            if (chartMessagesInstance) {
                chartMessagesInstance.updateOptions(opt1);
            } else {
                chartMessagesInstance = new ApexCharts(document.querySelector('#chart-messages'), opt1);
                chartMessagesInstance.render();
            }

            // Chart 2: Documents
            const opt2 = createChartOptions('Documentos Enviados', dates, documents, '#10b981', '#34d399');
            if (chartDocumentsInstance) {
                chartDocumentsInstance.updateOptions(opt2);
            } else {
                chartDocumentsInstance = new ApexCharts(document.querySelector('#chart-documents'), opt2);
                chartDocumentsInstance.render();
            }

            // Chart 3: Integrations
            const opt3 = createChartOptions('Operaciones Exitosas', dates, integrations, '#f59e0b', '#fbbf24');
            if (chartIntegrationsInstance) {
                chartIntegrationsInstance.updateOptions(opt3);
            } else {
                chartIntegrationsInstance = new ApexCharts(document.querySelector('#chart-integrations'), opt3);
                chartIntegrationsInstance.render();
            }
        }

        // Fetch Data
        function fetchDashboardData(start, end) {
            // Generación de datos de muestra para el rango seleccionado
            const dates = [];
            const messages = [];
            const documents = [];
            const integrations = [];
            
            const startDate = new Date(start);
            const endDate = new Date(end);
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 7;

            for (let i = 0; i <= diffDays; i++) {
                const d = new Date(startDate);
                d.setDate(d.getDate() + i);
                dates.push(d.toISOString().split('T')[0]);
                messages.push(Math.floor(Math.random() * 80) + 20);
                documents.push(Math.floor(Math.random() * 25) + 5);
                integrations.push(Math.floor(Math.random() * 50) + 15);
            }

            renderOrUpdateCharts(dates, messages, documents, integrations);
        }

        // Initial Load
        document.addEventListener('DOMContentLoaded', () => {
            const today = new Date();
            const lastWeek = new Date();
            lastWeek.setDate(today.getDate() - 7);
            fetchDashboardData(lastWeek.toISOString().split('T')[0], today.toISOString().split('T')[0]);
        });
    </script>
</body>
</html>
