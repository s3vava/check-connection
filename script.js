// script.js - ОБНОВЛЕННАЯ ВЕРСИЯ с улучшенными проверками сервисов

class VPNDiagnostics {
    constructor() {
        this.services = {
            youtube: { name: 'YouTube', timeout: 6000 },
            telegram: { name: 'Telegram', timeout: 3000 },
            whatsapp: { name: 'WhatsApp', timeout: 3000 },
            instagram: { name: 'Instagram', timeout: 3000 },
            chatgpt: { name: 'ChatGPT', timeout: 3000 }
        };
        
        this.youtubeLoadStart = null;
        // Инициализируем проверщик сервисов
        this.serviceChecker = new ServiceChecker();
        this.init();
    }

    init() {
        // Инициализация обработчиков событий
        document.getElementById('start-speed-test').addEventListener('click', () => this.startSpeedTest());
        document.getElementById('check-services').addEventListener('click', () => this.checkAllServices());
        
        // Автоматическая проверка сервисов при загрузке
        setTimeout(() => this.checkAllServices(), 1000);
    }

    // Проверка всех сервисов (используем новый ServiceChecker)
    async checkAllServices() {
        const btn = document.getElementById('check-services');
        btn.disabled = true;
        btn.textContent = 'Проверка сервисов...';

        try {
            await this.serviceChecker.checkAllServices();
        } catch (error) {
            console.error('Ошибка при проверке сервисов:', error);
        }

        btn.disabled = false;
        btn.textContent = '🔍 Проверить сервисы';
    }

    // Тест скорости с использованием OpenSpeedTest логики
    async startSpeedTest() {
        const btn = document.getElementById('start-speed-test');
        const results = document.getElementById('speed-results');
        const progress = document.getElementById('speed-progress');

        btn.disabled = true;
        btn.textContent = 'Выполняется тест...';
        results.classList.add('hidden');
        progress.classList.remove('hidden');

        try {
            // Тест пинга (более точный)
            this.updateProgress(5, 'Проверка пинга...');
            const pingResult = await this.testPing();
            this.updateProgress(25, 'Проверка пинга завершена');

            // Показываем результат пинга сразу
            document.getElementById('ping-result').textContent = `${pingResult} ms`;
            document.getElementById('ping-result').className = this.getPingClass(pingResult);

            // Тест скорости загрузки (реальный)
            this.updateProgress(30, 'Тест загрузки...');
            const downloadSpeed = await this.testDownloadSpeed();
            this.updateProgress(70, 'Тест загрузки завершен');

            // Показываем результат загрузки
            document.getElementById('download-speed').textContent = `${downloadSpeed.toFixed(1)} Mbps`;

            // Тест скорости выгрузки (улучшенный)
            this.updateProgress(75, 'Тест выгрузки...');
            const uploadSpeed = await this.testUploadSpeed();
            this.updateProgress(100, 'Все тесты завершены');

            // Показываем все результаты
            document.getElementById('upload-speed').textContent = `${uploadSpeed.toFixed(1)} Mbps`;

            // Финальное отображение
            setTimeout(() => {
                results.classList.remove('hidden');
                progress.classList.add('hidden');
            }, 500);

        } catch (error) {
            console.error('Speed test error:', error);
            this.updateProgress(0, 'Ошибка при выполнении тестов');
            setTimeout(() => {
                progress.classList.add('hidden');
                alert('Ошибка при выполнении теста скорости. Проверьте подключение к интернету.');
            }, 1000);
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

    // Точный тест пинга - несколько измерений к разным серверам
    async testPing() {
        const testServers = [
            'https://www.cloudflare.com/cdn-cgi/trace',
            'https://1.1.1.1/',
            'https://www.google.com/generate_204'
        ];

        let totalPing = 0;
        let successCount = 0;

        for (let server of testServers) {
            try {
                const startTime = performance.now();
                const response = await Promise.race([
                    fetch(server, { 
                        method: 'HEAD',
                        cache: 'no-cache',
                        mode: 'no-cors' // Избегаем CORS проблем
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
                ]);
                
                const endTime = performance.now();
                const pingTime = Math.round(endTime - startTime);
                
                if (pingTime < 2000) { // Исключаем таймауты
                    totalPing += pingTime;
                    successCount++;
                }
            } catch (error) {
                console.log(`Ping to ${server} failed:`, error.message);
            }
        }

        if (successCount === 0) {
            return 999; // Если все серверы недоступны
        }

        return Math.round(totalPing / successCount);
    }

    // Реальный тест скорости загрузки
    async testDownloadSpeed() {
        const testFiles = [
            { url: 'https://fsn1-speed.hetzner.com/100MB.bin', size: 100, name: '100MB (Hetzner EU)' },
            { url: 'https://ash-speed.hetzner.com/10MB.bin', size: 10, name: '10MB (Hetzner)' }
        ];

        let totalSpeed = 0;
        let testCount = 0;
        let currentTest = 0;

        for (let testFile of testFiles) {
            currentTest++;
            try {
                this.updateProgress(25 + (currentTest * 10), `Загрузка ${testFile.name}...`);
                
                const startTime = performance.now();
                
                const response = await Promise.race([
                    fetch(testFile.url, { 
                        cache: 'no-cache',
                        method: 'GET'
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
                ]);

                if (response.ok) {
                    const reader = response.body.getReader();
                    let receivedLength = 0;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        receivedLength += value.length;
                        
                        const downloadProgress = (receivedLength / (testFile.size * 1024 * 1024)) * 10;
                        const currentProgress = 25 + ((currentTest - 1) * 10) + downloadProgress;
                        this.updateProgress(Math.min(currentProgress, 70), `Загружено ${Math.round(receivedLength / 1024 / 1024)}MB из ${testFile.name}`);
                    }

                    const endTime = performance.now();
                    const duration = (endTime - startTime) / 1000;
                    const sizeInMB = receivedLength / (1024 * 1024);
                    const speedMbps = (sizeInMB * 8) / duration;
                    
                    console.log(`Download test ${testFile.name}: ${sizeInMB.toFixed(1)}MB in ${duration.toFixed(1)}s = ${speedMbps.toFixed(1)} Mbps`);
                    
                    if (speedMbps > 0.1 && speedMbps < 2000) {
                        totalSpeed += speedMbps;
                        testCount++;
                        
                        if (testFile.size >= 100 && testCount >= 1) {
                            console.log('Successful large file test, stopping early');
                            break;
                        }
                    }
                }
                
            } catch (error) {
                console.log(`Download test failed for ${testFile.name}:`, error.message);
            }
        }

        if (testCount === 0) {
            return 5.0; // Fallback скорость
        }

        const averageSpeed = totalSpeed / testCount;
        return Math.round(averageSpeed * 10) / 10;
    }

    // УЛУЧШЕННЫЙ тест скорости выгрузки
    async testUploadSpeed() {
        const uploadServices = [
            {
                url: 'https://httpbin.org/post',
                name: 'HTTPBin',
                maxSize: 10 * 1024 * 1024,
                headers: { 'Content-Type': 'application/octet-stream' }
            },
            {
                url: 'https://postman-echo.com/post',
                name: 'Postman Echo',
                maxSize: 5 * 1024 * 1024,
                headers: { 'Content-Type': 'application/octet-stream' }
            },
            {
                url: 'https://reqres.in/api/users',
                name: 'ReqRes',
                maxSize: 2 * 1024 * 1024,
                headers: { 'Content-Type': 'application/json' }
            }
        ];

        const testSizes = [
            64 * 1024,      // 64KB
            256 * 1024,     // 256KB
            1024 * 1024,    // 1MB
            2 * 1024 * 1024, // 2MB
            5 * 1024 * 1024, // 5MB
        ];

        let bestResults = [];
        let currentTest = 0;
        const totalTests = uploadServices.length * 3;

        for (let service of uploadServices) {
            console.log(`\n=== Тестирование ${service.name} ===`);
            
            for (let testIndex = 0; testIndex < 3; testIndex++) {
                currentTest++;
                
                let testSize;
                if (testIndex === 0) testSize = testSizes[1]; // 256KB
                else if (testIndex === 1) testSize = testSizes[2]; // 1MB
                else testSize = Math.min(testSizes[3], service.maxSize); // 2MB или максимум сервиса

                const sizeLabel = testSize >= 1024 * 1024 
                    ? `${(testSize / 1024 / 1024).toFixed(1)}MB` 
                    : `${(testSize / 1024).toFixed(0)}KB`;
                
                try {
                    this.updateProgress(75 + (currentTest * 20 / totalTests), 
                        `Выгрузка ${sizeLabel} в ${service.name}... (${testIndex + 1}/3)`);
                    
                    const result = await this.performUploadTest(service, testSize, sizeLabel);
                    
                    if (result && result.speedMbps > 0.1 && result.speedMbps < 1000) {
                        bestResults.push(result);
                        console.log(`✓ ${sizeLabel} → ${result.speedMbps.toFixed(1)} Mbps (${result.duration.toFixed(1)}s)`);
                    }

                    // Пауза между тестами для избежания rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    console.log(`✗ ${sizeLabel} к ${service.name}: ${error.message}`);
                }
            }

            // Если у нас уже есть хорошие результаты, можем остановиться
            if (bestResults.length >= 5) {
                console.log('Достаточно успешных тестов, завершаем досрочно');
                break;
            }
        }

        return this.calculateAverageUploadSpeed(bestResults);
    }

    // Выполнение одного теста выгрузки с детальным мониторингом
    async performUploadTest(service, size, sizeLabel) {
        const testData = this.generateOptimizedTestData(size, service.name);
        
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            let uploadStart = null;
            let uploadProgress = [];
            
            // Отслеживаем прогресс загрузки для более точного измерения
            xhr.upload.addEventListener('progress', (e) => {
                if (!uploadStart) {
                    uploadStart = performance.now();
                }
                
                if (e.lengthComputable) {
                    const currentTime = performance.now();
                    const elapsedTime = (currentTime - uploadStart) / 1000;
                    const uploadedMB = e.loaded / (1024 * 1024);
                    const instantSpeed = (uploadedMB * 8) / elapsedTime;
                    
                    uploadProgress.push({
                        time: elapsedTime,
                        loaded: e.loaded,
                        total: e.total,
                        speed: instantSpeed
                    });
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const endTime = performance.now();
                    
                    if (uploadProgress.length > 0) {
                        // Используем данные прогресса для более точного измерения
                        const lastProgress = uploadProgress[uploadProgress.length - 1];
                        const avgSpeed = this.calculateProgressiveSpeed(uploadProgress);
                        
                        resolve({
                            speedMbps: avgSpeed,
                            duration: lastProgress.time,
                            size: size,
                            service: service.name,
                            sizeLabel: sizeLabel,
                            progressPoints: uploadProgress.length
                        });
                    } else {
                        // Fallback к общему времени
                        const totalTime = (endTime - uploadStart) / 1000;
                        const sizeInMB = size / (1024 * 1024);
                        const speedMbps = (sizeInMB * 8) / totalTime;
                        
                        resolve({
                            speedMbps: speedMbps,
                            duration: totalTime,
                            size: size,
                            service: service.name,
                            sizeLabel: sizeLabel,
                            progressPoints: 0
                        });
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error'));
            });

            xhr.addEventListener('timeout', () => {
                reject(new Error('Timeout'));
            });

            // Настройка и отправка запроса
            xhr.open('POST', service.url);
            xhr.timeout = 30000; // 30 секунд таймаут
            
            // Установка заголовков
            Object.entries(service.headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });
            
            xhr.setRequestHeader('Content-Length', size.toString());
            xhr.setRequestHeader('User-Agent', 'VPN-Speed-Test/1.0');
            
            const requestStart = performance.now();
            uploadStart = requestStart;
            
            xhr.send(testData);
        });
    }

    // Вычисление прогрессивной скорости на основе точек прогресса
    calculateProgressiveSpeed(progressPoints) {
        if (progressPoints.length < 2) {
            return 0;
        }

        // Исключаем первые 10% и последние 10% для более точного измерения
        const startIndex = Math.floor(progressPoints.length * 0.1);
        const endIndex = Math.floor(progressPoints.length * 0.9);
        
        if (endIndex <= startIndex) {
            // Если точек мало, используем все
            const firstPoint = progressPoints[0];
            const lastPoint = progressPoints[progressPoints.length - 1];
            
            const timeDiff = lastPoint.time - firstPoint.time;
            const dataDiff = (lastPoint.loaded - firstPoint.loaded) / (1024 * 1024);
            
            return timeDiff > 0 ? (dataDiff * 8) / timeDiff : 0;
        }

        // Используем средний участок для расчета
        const startPoint = progressPoints[startIndex];
        const endPoint = progressPoints[endIndex];
        
        const timeDiff = endPoint.time - startPoint.time;
        const dataDiff = (endPoint.loaded - startPoint.loaded) / (1024 * 1024);
        
        return timeDiff > 0 ? (dataDiff * 8) / timeDiff : 0;
    }

    // Генерация оптимизированных тестовых данных
    generateOptimizedTestData(size, serviceName) {
        // Для JSON сервисов создаем структурированные данные
        if (serviceName === 'ReqRes') {
            const baseObject = {
                name: "SpeedTest",
                job: "DataTransfer",
                timestamp: Date.now(),
                testId: Math.random().toString(36).substring(7)
            };
            
            // Добавляем данные до нужного размера
            const targetDataSize = size - JSON.stringify(baseObject).length - 100;
            const fillData = 'A'.repeat(Math.max(0, targetDataSize));
            
            return JSON.stringify({
                ...baseObject,
                data: fillData
            });
        }
        
        // Для бинарных данных используем типичные паттерны
        const buffer = new ArrayBuffer(size);
        const view = new Uint8Array(buffer);
        
        // Создаем реалистичные данные (не полностью случайные)
        for (let i = 0; i < size; i++) {
            if (i % 1024 === 0) {
                view[i] = 0xFF;
            } else if (i % 256 === 0) {
                view[i] = 0xAA;
            } else if (i % 64 === 0) {
                view[i] = (i / 64) % 256;
            } else {
                view[i] = (i * 13 + 37) % 256;
            }
        }
        
        return buffer;
    }

    // Вычисление финальной средней скорости
    calculateAverageUploadSpeed(results) {
        if (results.length === 0) {
            console.log('Нет успешных результатов, используем fallback');
            return 0.5; // Минимальная скорость
        }

        console.log(`\n=== Анализ результатов (${results.length} тестов) ===`);
        
        // Группируем результаты по размерам для более точного анализа
        const bySize = {};
        results.forEach(result => {
            const sizeKey = result.sizeLabel;
            if (!bySize[sizeKey]) bySize[sizeKey] = [];
            bySize[sizeKey].push(result.speedMbps);
        });

        // Анализируем результаты по размерам
        Object.entries(bySize).forEach(([size, speeds]) => {
            const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
            const min = Math.min(...speeds);
            const max = Math.max(...speeds);
            console.log(`${size}: avg=${avg.toFixed(1)} min=${min.toFixed(1)} max=${max.toFixed(1)} Mbps (${speeds.length} тестов)`);
        });

        // Используем медиану вместо среднего для исключения выбросов
        const allSpeeds = results.map(r => r.speedMbps).sort((a, b) => a - b);
        const median = allSpeeds.length % 2 === 0
            ? (allSpeeds[allSpeeds.length / 2 - 1] + allSpeeds[allSpeeds.length / 2]) / 2
            : allSpeeds[Math.floor(allSpeeds.length / 2)];

        // Фильтруем результаты в пределах 50% от медианы для исключения аномалий
        const filteredResults = results.filter(r => 
            r.speedMbps >= median * 0.5 && r.speedMbps <= median * 2.0
        );

        if (filteredResults.length > 0) {
            const avgFiltered = filteredResults.reduce((sum, r) => sum + r.speedMbps, 0) / filteredResults.length;
            console.log(`Медиана: ${median.toFixed(1)} Mbps`);
            console.log(`Среднее отфильтрованное: ${avgFiltered.toFixed(1)} Mbps (${filteredResults.length} из ${results.length} тестов)`);
            
            return Math.round(avgFiltered * 10) / 10;
        }

        return Math.round(median * 10) / 10;
    }

    // Обновление статуса сервиса (для совместимости)
    updateServiceStatus(serviceName, status, text) {
        if (this.serviceChecker) {
            this.serviceChecker.updateServiceStatus(serviceName, status, text);
        }
    }
}

// Функция для обработки загрузки YouTube iframe (для совместимости)
function handleYouTubeLoad() {
    // Обработка происходит в ServiceChecker
    console.log('YouTube iframe loaded');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new VPNDiagnostics();
});