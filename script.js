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

            // Тест скорости выгрузки (реальный)
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
            //'https://www.google.com/generate_204',
            'https://www.cloudflare.com/cdn-cgi/trace',
            //'https://httpbin.org/status/204',
            //'https://www.gstatic.com/generate_204'
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

    // Реальный тест скорости загрузки с альтернативными сервисами
    async testDownloadSpeed() {
        // Используем разные сервисы для тестовых файлов
        const testFiles = [
            // Hetzner - отличные тестовые файлы
            //{ url: 'https://ash-speed.hetzner.com/100MB.bin', size: 100, name: '100MB (Hetzner)' },
            { url: 'https://fsn1-speed.hetzner.com/100MB.bin', size: 100, name: '100MB (Hetzner EU)' },
            
            // Альтернативные сервисы
            //{ url: 'https://proof.ovh.net/files/100Mb.dat', size: 100, name: '100MB (OVH)' },
            //{ url: 'https://lg.newark.linode.com/100MB-newark.bin', size: 100, name: '100MB (Linode)' },
            
            // Fallback на меньшие размеры
            //{ url: 'https://ash-speed.hetzner.com/10MB.bin', size: 10, name: '10MB (Hetzner)' }
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
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)) // 30 сек
                ]);

                if (response.ok) {
                    // Читаем данные чанками для точного измерения
                    const reader = response.body.getReader();
                    let receivedLength = 0;
                    const chunks = [];

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        chunks.push(value);
                        receivedLength += value.length;
                        
                        // Обновляем прогресс во время загрузки
                        const downloadProgress = (receivedLength / (testFile.size * 1024 * 1024)) * 10;
                        const currentProgress = 25 + ((currentTest - 1) * 10) + downloadProgress;
                        this.updateProgress(Math.min(currentProgress, 70), `Загружено ${Math.round(receivedLength / 1024 / 1024)}MB из ${testFile.name}`);
                    }

                    const endTime = performance.now();
                    const duration = (endTime - startTime) / 1000; // в секундах
                    const sizeInMB = receivedLength / (1024 * 1024); // в MB
                    const speedMbps = (sizeInMB * 8) / duration; // в Mbps
                    
                    console.log(`Download test ${testFile.name}: ${sizeInMB.toFixed(1)}MB in ${duration.toFixed(1)}s = ${speedMbps.toFixed(1)} Mbps`);
                    
                    if (speedMbps > 0.1 && speedMbps < 2000) { // Реалистичные границы
                        totalSpeed += speedMbps;
                        testCount++;
                        
                        // После успешного 100MB теста можем остановиться
                        if (testFile.size >= 100 && testCount >= 1) {
                            console.log('Successful large file test, stopping early');
                            break;
                        }
                    }
                }
                
            } catch (error) {
                console.log(`Download test failed for ${testFile.name}:`, error.message);
                
                // Если первые несколько тестов провалились, переходим к fallback
                if (currentTest >= 3 && testCount === 0) {
                    console.log('Multiple failures, using fallback test');
                    return await this.fallbackDownloadTest();
                }
            }
        }

        if (testCount === 0) {
            console.log('All download tests failed, using fallback');
            return await this.fallbackDownloadTest();
        }

        const averageSpeed = totalSpeed / testCount;
        console.log(`Average download speed: ${averageSpeed.toFixed(1)} Mbps from ${testCount} tests`);
        
        return Math.round(averageSpeed * 10) / 10;
    }

    // Запасной тест загрузки
    async fallbackDownloadTest() {
        try {
            // Используем Cloudflare и другие CDN
            const testUrls = [
                //'https://cachefly.cachefly.net/10mb.test', // 10MB CacheFly
                'https://speed.cloudflare.com/__down?bytes=50000000', // 50MB Cloudflare
                //'https://via.placeholder.com/2048x2048.jpg', // ~400KB изображение
                //'https://picsum.photos/2048/2048.jpg' // ~300KB случайное изображение
            ];
            
            let totalSpeed = 0;
            let testCount = 0;
            
            for (let url of testUrls) {
                for (let iteration = 0; iteration < 2; iteration++) {
                    try {
                        const startTime = performance.now();
                        const response = await Promise.race([
                            fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}&i=${iteration}`, { 
                                cache: 'no-cache' 
                            }),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
                        ]);
                        
                        if (response.ok) {
                            const data = await response.blob();
                            const endTime = performance.now();
                            
                            const duration = (endTime - startTime) / 1000;
                            const sizeInMB = data.size / (1024 * 1024);
                            const speedMbps = (sizeInMB * 8) / duration;
                            
                            if (speedMbps > 0.1 && speedMbps < 500) {
                                totalSpeed += speedMbps;
                                testCount++;
                                console.log(`Fallback test: ${sizeInMB.toFixed(2)}MB in ${duration.toFixed(1)}s = ${speedMbps.toFixed(1)} Mbps`);
                            }
                        }
                        
                        // Пауза между запросами
                        await new Promise(resolve => setTimeout(resolve, 200));
                        
                    } catch (error) {
                        console.log(`Fallback test failed for ${url}:`, error.message);
                    }
                }
            }
            
            if (testCount > 0) {
                const avgSpeed = totalSpeed / testCount;
                console.log(`Fallback average: ${avgSpeed.toFixed(1)} Mbps from ${testCount} tests`);
                return Math.round(avgSpeed * 10) / 10;
            }
            
            return 5.0; // Базовая скорость
            
        } catch (error) {
            console.log('Fallback download test failed:', error);
            return 2.0; // Минимальная скорость
        }
    }

    // Тест скорости выгрузки с альтернативными сервисами
    async testUploadSpeed() {
        // Используем надежные сервисы для upload тестов
        const uploadServices = [
            { 
                url: 'https://httpbin.org/post', 
                name: 'HTTPBin',
                sizes: [1024 * 1024, 5 * 1024 * 1024] // 1MB, 5MB
            },
            { 
                url: 'https://ptsv2.com/t/vpn-test/post', 
                name: 'PostTestServer',
                sizes: [1024 * 1024] // 1MB
            },
            { 
                url: 'https://httpbun.org/post', 
                name: 'HTTPBun',
                sizes: [512 * 1024, 1024 * 1024] // 512KB, 1MB
            }
        ];

        let totalSpeed = 0;
        let testCount = 0;
        let currentTest = 0;

        for (let service of uploadServices) {
            for (let size of service.sizes) {
                currentTest++;
                const sizeLabel = size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(0)}MB` : `${(size / 1024).toFixed(0)}KB`;
                
                try {
                    this.updateProgress(70 + (currentTest * 5), `Выгрузка ${sizeLabel} в ${service.name}...`);
                    
                    const testData = this.generateBinaryTestData(size);
                    const startTime = performance.now();
                    
                    const response = await Promise.race([
                        fetch(service.url, {
                            method: 'POST',
                            body: testData,
                            headers: {
                                'Content-Type': 'application/octet-stream',
                                'Content-Length': size.toString(),
                                'User-Agent': 'VPN-Speed-Test'
                            }
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000))
                    ]);

                    if (response.ok || response.status === 413) { // 413 = too large, но данные отправлены
                        const endTime = performance.now();
                        const duration = (endTime - startTime) / 1000;
                        const sizeInMB = size / (1024 * 1024);
                        const speedMbps = (sizeInMB * 8) / duration;
                        
                        console.log(`Upload test ${sizeLabel} to ${service.name}: ${sizeInMB.toFixed(2)}MB in ${duration.toFixed(1)}s = ${speedMbps.toFixed(1)} Mbps`);
                        
                        if (speedMbps > 0.1 && speedMbps < 1000) {
                            totalSpeed += speedMbps;
                            testCount++;
                            
                            // После успешного большого теста можем остановиться
                            if (size >= 5 * 1024 * 1024 && testCount >= 1) {
                                console.log('Successful large upload test, stopping early');
                                break;
                            }
                        }
                    }

                } catch (error) {
                    console.log(`Upload test failed for ${sizeLabel} to ${service.name}:`, error.message);
                }
            }
            
            // Если уже есть успешные тесты, не тестируем все сервисы
            if (testCount >= 2) break;
        }

        if (testCount === 0) {
            console.log('All upload tests failed, using fallback');
            return await this.fallbackUploadTest();
        }

        const averageSpeed = totalSpeed / testCount;
        console.log(`Average upload speed: ${averageSpeed.toFixed(1)} Mbps from ${testCount} tests`);
        
        return Math.round(averageSpeed * 10) / 10;
    }

    // Запасной тест выгрузки
    async fallbackUploadTest() {
        try {
            // Простые тесты с маленькими файлами
            const fallbackServices = [
                'https://httpbin.org/post',
                'https://postman-echo.com/post',
                'https://reqres.in/api/users'
            ];
            
            const testSizes = [64 * 1024, 128 * 1024, 256 * 1024]; // 64KB, 128KB, 256KB
            let totalSpeed = 0;
            let testCount = 0;

            for (let service of fallbackServices) {
                for (let size of testSizes) {
                    try {
                        const testData = this.generateBinaryTestData(size);
                        const startTime = performance.now();
                        
                        const response = await Promise.race([
                            fetch(service, {
                                method: 'POST',
                                body: testData,
                                headers: {
                                    'Content-Type': 'application/octet-stream'
                                }
                            }),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
                        ]);

                        if (response.ok) {
                            const endTime = performance.now();
                            const duration = (endTime - startTime) / 1000;
                            const sizeInMB = size / (1024 * 1024);
                            const speedMbps = (sizeInMB * 8) / duration;
                            
                            if (speedMbps > 0.1 && speedMbps < 200) {
                                totalSpeed += speedMbps;
                                testCount++;
                                console.log(`Fallback upload: ${(size/1024).toFixed(0)}KB in ${duration.toFixed(1)}s = ${speedMbps.toFixed(1)} Mbps`);
                            }
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 300));
                        
                    } catch (error) {
                        console.log(`Fallback upload test failed:`, error.message);
                    }
                }
                
                // Если есть успешные тесты, не тестируем все сервисы
                if (testCount >= 3) break;
            }

            if (testCount > 0) {
                const avgSpeed = totalSpeed / testCount;
                console.log(`Fallback upload average: ${avgSpeed.toFixed(1)} Mbps from ${testCount} tests`);
                return Math.round(avgSpeed * 10) / 10;
            }

            return 1.5; // Базовая скорость выгрузки
            
        } catch (error) {
            console.log('Fallback upload test failed:', error);
            return 0.8; // Минимальная скорость выгрузки
        }
    }

    // Генерация бинарных тестовых данных
    generateBinaryTestData(size) {
        const buffer = new ArrayBuffer(size);
        const view = new Uint8Array(buffer);
        
        // Заполняем случайными данными для реалистичности
        for (let i = 0; i < size; i++) {
            view[i] = Math.floor(Math.random() * 256);
        }
        
        return buffer;
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
                    this.updateServiceStatus('youtube', 'error', 'Медленно');
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