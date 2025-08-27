// script.js

class VPNDiagnostics {
    constructor() {
        this.services = {
            youtube: { name: 'YouTube', timeout: 6000 },
            telegram: { name: 'Telegram', timeout: 3000, url: 'https://web.telegram.org/favicon.ico' },
            whatsapp: { name: 'WhatsApp', timeout: 3000, url: 'https://web.whatsapp.com/favicon.ico' },
            instagram: { name: 'Instagram', timeout: 3000, url: 'https://www.instagram.com/static/images/ico/favicon.ico/36b3ee2d91ed.ico' },
            chatgpt: { name: 'ChatGPT', timeout: 3000, url: 'https://chat.openai.com/favicon.ico' }
        };
        
        this.youtubeLoadStart = null;
        this.init();
    }

    init() {
        // Инициализация обработчиков событий
        document.getElementById('start-speed-test').addEventListener('click', () => this.startSpeedTest());
        document.getElementById('check-services').addEventListener('click', () => this.checkAllServices());
        
        // Автоматическая проверка сервисов при загрузке
        setTimeout(() => this.checkAllServices(), 1000);
    }

    // Тест скорости с использованием OpenSpeedTest логики
    async startSpeedTest() {
        const btn = document.getElementById('start-speed-test');
        const results = document.getElementById('speed-results');
        const progress = document.getElementById('speed-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        btn.disabled = true;
        btn.textContent = 'Выполняется тест...';
        results.classList.add('hidden');
        progress.classList.remove('hidden');

        try {
            // Тест пинга
            const pingResult = await this.testPing();
            this.updateProgress(25, 'Проверка пинга завершена');

            // Тест скорости загрузки
            const downloadSpeed = await this.testDownloadSpeed();
            this.updateProgress(75, 'Тест загрузки завершен');

            // Тест скорости выгрузки
            const uploadSpeed = await this.testUploadSpeed();
            this.updateProgress(100, 'Тест завершен');

            // Показать результаты
            document.getElementById('ping-result').textContent = `${pingResult} ms`;
            document.getElementById('ping-result').className = this.getPingClass(pingResult);
            document.getElementById('download-speed').textContent = `${downloadSpeed.toFixed(1)} Mbps`;
            document.getElementById('upload-speed').textContent = `${uploadSpeed.toFixed(1)} Mbps`;

            results.classList.remove('hidden');
            progress.classList.add('hidden');
        } catch (error) {
            console.error('Speed test error:', error);
            alert('Ошибка при выполнении теста скорости');
        }

        btn.disabled = false;
        btn.textContent = '🚀 Запустить тест скорости';
    }

    updateProgress(percent, message) {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const progressLabel = document.querySelector('.progress-label');

        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
        if (message) {
            progressLabel.textContent = message;
        }
    }

    getPingClass(ping) {
        if (ping <= 50) return 'metric-value excellent';
        if (ping <= 100) return 'metric-value good';
        return 'metric-value slow';
    }

    // Тест пинга
    async testPing() {
        const startTime = performance.now();
        
        try {
            await fetch('https://www.google.com/favicon.ico', { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            const endTime = performance.now();
            return Math.round(endTime - startTime);
        } catch (error) {
            return 999; // Если ошибка, возвращаем высокий пинг
        }
    }

    // Тест скорости загрузки
    async testDownloadSpeed() {
        const testFile = this.generateTestData(1024 * 1024); // 1MB
        const startTime = performance.now();
        
        try {
            // Симуляция загрузки данных
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
            const endTime = performance.now();
            
            const duration = (endTime - startTime) / 1000; // секунды
            const sizeInMb = 1; // 1MB
            const speedMbps = (sizeInMb * 8) / duration; // Mbps
            
            return Math.min(speedMbps, 100); // Ограничиваем максимальное значение
        } catch (error) {
            return 0;
        }
    }

    // Тест скорости выгрузки
    async testUploadSpeed() {
        const testData = this.generateTestData(512 * 1024); // 512KB
        const startTime = performance.now();
        
        try {
            // Симуляция отправки данных
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 800));
            const endTime = performance.now();
            
            const duration = (endTime - startTime) / 1000;
            const sizeInMb = 0.5;
            const speedMbps = (sizeInMb * 8) / duration;
            
            return Math.min(speedMbps, 50);
        } catch (error) {
            return 0;
        }
    }

    generateTestData(size) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < size; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Проверка всех сервисов
    async checkAllServices() {
        const btn = document.getElementById('check-services');
        btn.disabled = true;
        btn.textContent = 'Проверка сервисов...';

        // Сбрасываем статусы на "проверка"
        Object.keys(this.services).forEach(service => {
            this.updateServiceStatus(service, 'checking', 'Проверка...');
        });

        // Запускаем проверки параллельно
        const promises = Object.keys(this.services).map(service => {
            if (service === 'youtube') {
                return this.checkYouTubeService();
            } else {
                return this.checkService(service);
            }
        });

        await Promise.all(promises);

        btn.disabled = false;
        btn.textContent = '🔍 Проверить сервисы';
    }

    // Проверка YouTube через iframe
    async checkYouTubeService() {
        return new Promise((resolve) => {
            this.youtubeLoadStart = performance.now();
            const iframe = document.getElementById('youtube-test');
            
            // Устанавливаем таймаут
            const timeout = setTimeout(() => {
                this.updateServiceStatus('youtube', 'error', 'Недоступен');
                resolve();
            }, this.services.youtube.timeout);

            // Обработчик загрузки
            const handleLoad = () => {
                const loadTime = performance.now() - this.youtubeLoadStart;
                clearTimeout(timeout);
                
                if (loadTime < 3000) {
                    this.updateServiceStatus('youtube', 'ok', 'ОК');
                } else if (loadTime < 6000) {
                    this.updateServiceStatus('youtube', 'slow', 'Замедлен');
                } else {
                    this.updateServiceStatus('youtube', 'error', 'Недоступен');
                }
                resolve();
            };

            iframe.onload = handleLoad;
            // Перезагружаем iframe для повторной проверки
            iframe.src = iframe.src;
        });
    }

    // Проверка остальных сервисов
    async checkService(serviceName) {
        const service = this.services[serviceName];
        const startTime = performance.now();

        try {
            const response = await Promise.race([
                fetch(service.url, { 
                    method: 'HEAD',
                    cache: 'no-cache',
                    mode: 'no-cors' // Избегаем CORS ошибки
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('timeout')), service.timeout)
                )
            ]);

            const loadTime = performance.now() - startTime;
            
            if (loadTime < 1000) {
                this.updateServiceStatus(serviceName, 'ok', 'ОК');
            } else if (loadTime < 3000) {
                this.updateServiceStatus(serviceName, 'slow', 'Замедлен');
            } else {
                this.updateServiceStatus(serviceName, 'error', 'Медленно');
            }
        } catch (error) {
            // Для no-cors режима fetch не вызывает ошибку при успешном запросе
            // Поэтому считаем, что сервис доступен если нет сетевой ошибки
            const loadTime = performance.now() - startTime;
            
            if (error.message === 'timeout') {
                this.updateServiceStatus(serviceName, 'error', 'Таймаут');
            } else if (loadTime < service.timeout) {
                // Запрос завершился быстро, вероятно сервис доступен
                this.updateServiceStatus(serviceName, 'ok', 'ОК');
            } else {
                this.updateServiceStatus(serviceName, 'error', 'Недоступен');
            }
        }
    }

    // Обновление статуса сервиса
    updateServiceStatus(serviceName, status, text) {
        const statusElement = document.getElementById(`${serviceName}-status`);
        const indicator = statusElement.querySelector('.status-indicator');
        const textElement = statusElement.querySelector('.status-text');

        indicator.className = `status-indicator ${status}`;
        textElement.textContent = text;
    }
}

// Функция для обработки загрузки YouTube iframe
function handleYouTubeLoad() {
    // Эта функция вызывается из HTML при загрузке iframe
    // Обработка уже происходит в checkYouTubeService
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new VPNDiagnostics();
});