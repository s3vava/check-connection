// service-checker.js - Улучшенная проверка доступности сервисов

class ServiceChecker {
    constructor() {
        this.UA_Browser = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36";
    }

    // Главная функция проверки всех сервисов
    async checkAllServices() {
        const services = ['youtube', 'telegram', 'whatsapp', 'instagram', 'chatgpt'];
        
        console.log('🔍 Начинаем проверку всех сервисов...');
        
        // Сбрасываем статусы
        services.forEach(service => {
            this.updateServiceStatus(service, 'checking', 'Проверка...');
        });

        // Запускаем проверки параллельно
        const promises = services.map(service => {
            switch(service) {
                case 'youtube':
                    return this.checkYouTubeService();
                case 'chatgpt':
                    return this.checkChatGPTService();
                case 'instagram':
                    return this.checkInstagramService();
                case 'telegram':
                    return this.checkTelegramService();
                case 'whatsapp':
                    return this.checkWhatsAppService();
                default:
                    return Promise.resolve();
            }
        });

        await Promise.all(promises);
        console.log('✅ Проверка всех сервисов завершена');
    }

    // YouTube - проверка через Premium страницу (адаптация из Stream-All.js)
checkYouTubeService 
    // Проверка YouTube через oEmbed API (аналог оригинального метода)
    async checkYouTubeViaEmbed() {
        try {
            console.log('🎥 YouTube: Метод 1 - Проверка через oEmbed API...');
            
            const startTime = performance.now();
            
            // Тестируем с популярным видео
            const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
            const response = await Promise.race([
                fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(testVideoUrl)}&format=json`, {
                    method: 'GET',
                    cache: 'no-cache'
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);
            
            const loadTime = performance.now() - startTime;
            console.log(`🎥 YouTube: oEmbed ответ получен за ${Math.round(loadTime)}мс, статус: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('🎥 YouTube: oEmbed данные получены:', {
                    title: data.title,
                    author: data.author_name,
                    provider: data.provider_name
                });
                
                // Проверяем качество данных (аналог проверки "Premium is not available")
                const hasFullData = data.title && data.author_name && data.html;
                const isRestricted = data.title && data.title.includes('restricted') || 
                                   data.title.includes('not available');
                
                console.log('🎥 YouTube: Анализ oEmbed данных:');
                console.log(`  - Полные данные получены: ${hasFullData ? 'ДА' : 'НЕТ'}`);
                console.log(`  - Обнаружены ограничения: ${isRestricted ? 'ДА' : 'НЕТ'}`);
                
                if (isRestricted) {
                    console.log('🎥 YouTube: ⚠️ oEmbed показывает ограничения');
                    return { success: false, loadTime, region: null };
                }
                
                if (hasFullData) {
                    console.log('🎥 YouTube: ✅ oEmbed полностью функционален');
                    return { success: true, loadTime, region: 'EU' };
                }
            }
            
            console.log(`🎥 YouTube: ❌ oEmbed ошибка статус: ${response.status}`);
            return { success: false, loadTime, region: null };
            
        } catch (error) {
            console.log(`🎥 YouTube: ❌ oEmbed недоступен: ${error.message}`);
            return { success: false, loadTime: 0, region: null };
        }
    }

    // Проверка через iframe (имитация оригинального метода проверки Premium)
    async checkYouTubeViaIframe() {
        return new Promise((resolve) => {
            console.log('🎥 YouTube: Метод 2 - Проверка через iframe (имитация Premium проверки)...');
            
            try {
                const startTime = performance.now();
                const iframe = document.createElement('iframe');
                
                // Настройки iframe
                iframe.style.display = 'none';
                iframe.width = '1';
                iframe.height = '1';
                iframe.sandbox = 'allow-scripts allow-same-origin';
                
                let resolved = false;
                let loadTime = 0;
                
                // Используем embed URL с параметрами, похожими на Premium проверку
                const testVideoId = 'dQw4w9WgXcQ';
                iframe.src = `https://www.youtube.com/embed/${testVideoId}?enablejsapi=1&origin=${window.location.origin}&autoplay=0&controls=1`;
                
                console.log(`🎥 YouTube: Загружаем iframe с URL: ${iframe.src}`);
                
                iframe.onload = () => {
                    if (!resolved) {
                        resolved = true;
                        loadTime = performance.now() - startTime;
                        
                        console.log(`🎥 YouTube: ✅ Iframe загружен за ${Math.round(loadTime)}мс`);
                        
                        // Пытаемся получить дополнительную информацию через postMessage
                        try {
                            iframe.contentWindow.postMessage('{"event":"listening"}', '*');
                            console.log('🎥 YouTube: Отправлено listening событие в iframe');
                        } catch (postError) {
                            console.log(`🎥 YouTube: ⚠️ PostMessage недоступен: ${postError.message}`);
                        }
                        
                        setTimeout(() => {
                            if (document.body.contains(iframe)) {
                                document.body.removeChild(iframe);
                            }
                        }, 100);
                        
                        resolve({ success: true, loadTime, region: 'EU' });
                    }
                };
                
                iframe.onerror = (e) => {
                    if (!resolved) {
                        resolved = true;
                        loadTime = performance.now() - startTime;
                        
                        console.log(`🎥 YouTube: ❌ Iframe ошибка загрузки за ${Math.round(loadTime)}мс:`, e);
                        
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                        resolve({ success: false, loadTime, region: null });
                    }
                };
                
                document.body.appendChild(iframe);
                
                // Таймаут как в оригинальном скрипте
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        loadTime = performance.now() - startTime;
                        
                        console.log(`🎥 YouTube: ⚠️ Iframe таймаут после ${Math.round(loadTime)}мс`);
                        
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                        resolve({ success: false, loadTime, region: null });
                    }
                }, 8000); // 8 секунд как в bash версии
                
            } catch (error) {
                console.log(`🎥 YouTube: ❌ Критическая ошибка iframe: ${error.message}`);
                resolve({ success: false, loadTime: 0, region: null });
            }
        });
    }

    // ChatGPT - проверка региона через CDN trace (как в bash скрипте)
    async checkChatGPTService() {
        console.log('🤖 ChatGPT: Начинаем проверку...');
        
        try {
            // Список поддерживаемых стран из bash скрипта
            const supportedCountries = [
                "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT", "AZ", "BS", "BD", "BB", "BE", "BZ", "BJ", 
                "BT", "BO", "BA", "BW", "BR", "BN", "BG", "BF", "CV", "CA", "CL", "CO", "KM", "CG", "CR", "CI", 
                "HR", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "SV", "EE", "FJ", "FI", "FR", "GA", "GM", "GE", 
                "DE", "GH", "GR", "GD", "GT", "GN", "GW", "GY", "HT", "VA", "HN", "HU", "IS", "IN", "ID", "IQ", 
                "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI", "KW", "KG", "LV", "LB", "LS", "LR", "LI", 
                "LT", "LU", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MR", "MU", "MX", "FM", "MD", "MC", "MN", 
                "ME", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NZ", "NI", "NE", "NG", "MK", "NO", "OM", "PK", 
                "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "QA", "RO", "RW", "KN", "LC", "VC", "WS", 
                "SM", "ST", "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "ZA", "KR", "ES", "LK", "SR", "SE", 
                "CH", "TW", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TV", "UG", "UA", "AE", "GB", "US", "UY", "VU", "ZM"
            ];

            console.log(`🤖 ChatGPT: Всего поддерживаемых стран: ${supportedCountries.length}`);
            console.log('🤖 ChatGPT: Отправляем запрос на CDN trace...');

            const response = await Promise.race([
                fetch('https://chat.openai.com/cdn-cgi/trace', {
                    method: 'GET',
                    cache: 'no-cache'
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);

            if (response.ok) {
                const text = await response.text();
                console.log('🤖 ChatGPT: CDN trace получен:');
                console.log(text);
                
                const locationMatch = text.match(/loc=([A-Z]{2})/);
                const location = locationMatch ? locationMatch[1] : '';
                
                console.log(`🤖 ChatGPT: Извлеченный код страны: "${location}"`);

                if (!location) {
                    console.log('🤖 ChatGPT: ❌ Не удалось определить регион из trace');
                    this.updateServiceStatus('chatgpt', 'error', 'Регион не определен');
                    return;
                }

                const isSupported = supportedCountries.includes(location);
                console.log(`🤖 ChatGPT: Проверка поддержки региона ${location}: ${isSupported ? 'ПОДДЕРЖИВАЕТСЯ' : 'НЕ ПОДДЕРЖИВАЕТСЯ'}`);

                if (isSupported) {
                    console.log(`🤖 ChatGPT: ✅ Регион ${location} поддерживается - сервис доступен`);
                    this.updateServiceStatus('chatgpt', 'ok', `ОК (${location})`);
                } else {
                    console.log(`🤖 ChatGPT: ❌ Регион ${location} не поддерживается - сервис недоступен`);
                    this.updateServiceStatus('chatgpt', 'error', `Недоступен (${location})`);
                }
            } else {
                console.log(`🤖 ChatGPT: ❌ HTTP ошибка: ${response.status}`);
                this.updateServiceStatus('chatgpt', 'error', 'Недоступен');
            }

        } catch (error) {
            if (error.message === 'timeout') {
                console.log('🤖 ChatGPT: ❌ Таймаут при получении CDN trace');
                this.updateServiceStatus('chatgpt', 'error', 'Таймаут');
            } else {
                console.log(`🤖 ChatGPT: ❌ Ошибка соединения: ${error.message}`);
                this.updateServiceStatus('chatgpt', 'error', 'Недоступен');
            }
        }
    }

    // Instagram - проверка лицензированной музыки (адаптация из bash скрипта)
    async checkInstagramService() {
        console.log('📸 Instagram: Начинаем проверку...');
        
        try {
            // Упрощенная проверка доступности Instagram
            const startTime = performance.now();
            
            console.log('📸 Instagram: Отправляем HEAD запрос на главную страницу...');
            
            // Сначала простая проверка доступности
            const basicResponse = await Promise.race([
                fetch('https://www.instagram.com/', {
                    method: 'HEAD',
                    headers: {
                        'User-Agent': this.UA_Browser
                    },
                    cache: 'no-cache'
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);

            const loadTime = performance.now() - startTime;
            console.log(`📸 Instagram: Базовый ответ получен за ${Math.round(loadTime)}мс, статус: ${basicResponse.status}`);

            if (!basicResponse.ok) {
                console.log(`📸 Instagram: ❌ Базовая проверка не прошла - HTTP ${basicResponse.status}`);
                this.updateServiceStatus('instagram', 'error', 'Недоступен');
                return;
            }

            console.log('📸 Instagram: ✅ Базовая доступность подтверждена');
            console.log('📸 Instagram: Проверяем доступность API...');

            // Пытаемся получить более детальную информацию
            try {
                const apiStartTime = performance.now();
                const detailedResponse = await Promise.race([
                    fetch('https://www.instagram.com/api/v1/web/data/shared_data/', {
                        method: 'GET',
                        headers: {
                            'User-Agent': this.UA_Browser,
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        cache: 'no-cache'
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
                ]);

                const apiLoadTime = performance.now() - apiStartTime;
                console.log(`📸 Instagram: API ответ получен за ${Math.round(apiLoadTime)}мс, статус: ${detailedResponse.status}`);

                if (detailedResponse.ok) {
                    const data = await detailedResponse.json();
                    console.log('📸 Instagram: ✅ API доступен, данные получены');
                    console.log(`📸 Instagram: Структура данных: ${Object.keys(data).join(', ')}`);
                    
                    // Если получили данные, значит доступ полный
                    if (loadTime < 2000) {
                        console.log(`📸 Instagram: ✅ Отличная производительность (${Math.round(loadTime)}мс)`);
                        this.updateServiceStatus('instagram', 'ok', 'ОК');
                    } else {
                        console.log(`📸 Instagram: ⚠️ Медленная загрузка (${Math.round(loadTime)}мс)`);
                        this.updateServiceStatus('instagram', 'slow', 'Медленно');
                    }
                } else {
                    console.log(`📸 Instagram: ⚠️ API недоступен (статус: ${detailedResponse.status}), но основной сайт работает`);
                    // Базовый доступ есть, но API может быть ограничен
                    this.updateServiceStatus('instagram', 'slow', 'Ограничен');
                }
            } catch (apiError) {
                console.log(`📸 Instagram: ⚠️ API недоступно (${apiError.message}), анализируем базовую доступность...`);
                
                // API недоступно, но основной сайт работает
                if (loadTime < 3000) {
                    console.log(`📸 Instagram: ⚠️ Частичный доступ (API недоступен, но сайт работает)`);
                    this.updateServiceStatus('instagram', 'slow', 'Частично');
                } else {
                    console.log(`📸 Instagram: ❌ Медленный доступ (${Math.round(loadTime)}мс)`);
                    this.updateServiceStatus('instagram', 'error', 'Медленно');
                }
            }

        } catch (error) {
            if (error.message === 'timeout') {
                console.log('📸 Instagram: ❌ Таймаут при базовой проверке');
                this.updateServiceStatus('instagram', 'error', 'Таймаут');
            } else {
                console.log(`📸 Instagram: ❌ Ошибка соединения: ${error.message}`);
                this.updateServiceStatus('instagram', 'error', 'Недоступен');
            }
        }
    }

    // Telegram - проверка Web версии
    async checkTelegramService() {
        console.log('💬 Telegram: Начинаем проверку...');
        
        try {
            const startTime = performance.now();
            
            console.log('💬 Telegram: Проверяем Telegram Web (https://web.telegram.org/z/)...');
            
            // Проверяем доступность Telegram Web
            const response = await Promise.race([
                fetch('https://web.telegram.org/z/', {
                    method: 'HEAD',
                    headers: {
                        'User-Agent': this.UA_Browser
                    },
                    cache: 'no-cache'
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);

            const loadTime = performance.now() - startTime;
            console.log(`💬 Telegram: Web ответ получен за ${Math.round(loadTime)}мс, статус: ${response.status}`);

            if (response.ok) {
                console.log('💬 Telegram: ✅ Telegram Web доступен');
                
                if (loadTime < 2000) {
                    console.log(`💬 Telegram: ✅ Отличная производительность (${Math.round(loadTime)}мс)`);
                    this.updateServiceStatus('telegram', 'ok', 'ОК');
                } else if (loadTime < 5000) {
                    console.log(`💬 Telegram: ⚠️ Медленная загрузка (${Math.round(loadTime)}мс)`);
                    this.updateServiceStatus('telegram', 'slow', 'Медленно');
                } else {
                    console.log(`💬 Telegram: ❌ Очень медленная загрузка (${Math.round(loadTime)}мс)`);
                    this.updateServiceStatus('telegram', 'error', 'Очень медленно');
                }
            } else {
                console.log(`💬 Telegram: ⚠️ Telegram Web недоступен (${response.status}), проверяем API...`);
                
                // Пробуем альтернативный метод - проверка API эндпоинта
                try {
                    const apiStartTime = performance.now();
                    const apiResponse = await Promise.race([
                        fetch('https://api.telegram.org/', {
                            method: 'HEAD',
                            cache: 'no-cache'
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
                    ]);
                    
                    const apiLoadTime = performance.now() - apiStartTime;
                    console.log(`💬 Telegram: API ответ получен за ${Math.round(apiLoadTime)}мс, статус: ${apiResponse.status}`);
                    
                    if (apiResponse.ok) {
                        console.log('💬 Telegram: ⚠️ Web недоступен, но API работает');
                        this.updateServiceStatus('telegram', 'slow', 'API доступен');
                    } else {
                        console.log(`💬 Telegram: ❌ И Web и API недоступны`);
                        this.updateServiceStatus('telegram', 'error', 'Недоступен');
                    }
                } catch (apiError) {
                    console.log(`💬 Telegram: ❌ API также недоступен: ${apiError.message}`);
                    this.updateServiceStatus('telegram', 'error', 'Недоступен');
                }
            }

        } catch (error) {
            if (error.message === 'timeout') {
                console.log('💬 Telegram: ❌ Таймаут при проверке Web версии');
                this.updateServiceStatus('telegram', 'error', 'Таймаут');
            } else {
                console.log(`💬 Telegram: ❌ Ошибка соединения: ${error.message}`);
                this.updateServiceStatus('telegram', 'error', 'Недоступен');
            }
        }
    }

    // WhatsApp - проверка Web версии
    async checkWhatsAppService() {
        console.log('📱 WhatsApp: Начинаем проверку...');
        
        try {
            const startTime = performance.now();
            
            console.log('📱 WhatsApp: Отправляем HEAD запрос на https://web.whatsapp.com/...');
            
            const response = await Promise.race([
                fetch('https://web.whatsapp.com/', {
                    method: 'HEAD',
                    headers: {
                        'User-Agent': this.UA_Browser
                    },
                    cache: 'no-cache'
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);

            const loadTime = performance.now() - startTime;
            console.log(`📱 WhatsApp: Ответ получен за ${Math.round(loadTime)}мс, статус: ${response.status}`);

            if (response.ok) {
                console.log('📱 WhatsApp: ✅ WhatsApp Web доступен');
                
                if (loadTime < 2000) {
                    console.log(`📱 WhatsApp: ✅ Отличная производительность (${Math.round(loadTime)}мс)`);
                    this.updateServiceStatus('whatsapp', 'ok', 'ОК');
                } else if (loadTime < 5000) {
                    console.log(`📱 WhatsApp: ⚠️ Медленная загрузка (${Math.round(loadTime)}мс)`);
                    this.updateServiceStatus('whatsapp', 'slow', 'Медленно');
                } else {
                    console.log(`📱 WhatsApp: ❌ Очень медленная загрузка (${Math.round(loadTime)}мс)`);
                    this.updateServiceStatus('whatsapp', 'error', 'Очень медленно');
                }
            } else {
                console.log(`📱 WhatsApp: ❌ HTTP ошибка: ${response.status}`);
                this.updateServiceStatus('whatsapp', 'error', `HTTP ${response.status}`);
            }

        } catch (error) {
            if (error.message === 'timeout') {
                console.log('📱 WhatsApp: ❌ Таймаут при проверке Web версии');
                this.updateServiceStatus('whatsapp', 'error', 'Таймаут');
            } else {
                console.log(`📱 WhatsApp: ❌ Ошибка соединения: ${error.message}`);
                this.updateServiceStatus('whatsapp', 'error', 'Недоступен');
            }
        }
    }

    // Обновление статуса сервиса в UI
    updateServiceStatus(serviceName, status, text) {
        const statusElement = document.getElementById(`${serviceName}-status`);
        if (!statusElement) {
            console.log(`Service status update: ${serviceName} -> ${status}: ${text}`);
            return;
        }
        
        const indicator = statusElement.querySelector('.status-indicator');
        const textElement = statusElement.querySelector('.status-text');

        if (indicator) {
            indicator.className = `status-indicator ${status}`;
        }
        if (textElement) {
            textElement.textContent = text;
        }

        console.log(`✓ ${serviceName}: ${text} (${status})`);
    }

    // Дополнительная проверка конкретного сервиса (для кнопок в UI)
    async recheckService(serviceName) {
        console.log(`🔄 Повторная проверка сервиса: ${serviceName}`);
        this.updateServiceStatus(serviceName, 'checking', 'Повторная проверка...');
        
        switch(serviceName) {
            case 'youtube':
                await this.checkYouTubeService();
                break;
            case 'chatgpt':
                await this.checkChatGPTService();
                break;
            case 'instagram':
                await this.checkInstagramService();
                break;
            case 'telegram':
                await this.checkTelegramService();
                break;
            case 'whatsapp':
                await this.checkWhatsAppService();
                break;
        }
    }

    // Получение детального отчета о доступности
    async getDetailedReport() {
        console.log('📋 Создаем детальный отчет о доступности сервисов...');
        
        const services = ['youtube', 'chatgpt', 'instagram', 'telegram', 'whatsapp'];
        const report = {
            timestamp: new Date().toISOString(),
            services: {}
        };

        console.log(`📋 Отчет создан в: ${report.timestamp}`);

        for (const service of services) {
            console.log(`📋 Обновляем данные для ${service}...`);
            await this.recheckService(service);
            
            const statusElement = document.getElementById(`${service}-status`);
            if (statusElement) {
                const indicator = statusElement.querySelector('.status-indicator');
                const text = statusElement.querySelector('.status-text');
                
                report.services[service] = {
                    status: indicator ? indicator.className.split(' ').pop() : 'unknown',
                    message: text ? text.textContent : 'No data'
                };
                
                console.log(`📋 ${service}: ${report.services[service].status} - ${report.services[service].message}`);
            }
        }

        console.log('📋 Детальный отчет готов:', report);
        return report;
    }
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceChecker;
} else if (typeof window !== 'undefined') {
    window.ServiceChecker = ServiceChecker;
}