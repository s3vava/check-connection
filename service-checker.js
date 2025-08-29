// service-checker.js - Улучшенная проверка доступности сервисов

class ServiceChecker {
    constructor() {
        this.UA_Browser = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36";
    }

    // Главная функция проверки всех сервисов
    async checkAllServices() {
        const services = ['youtube', 'telegram', 'whatsapp', 'instagram', 'chatgpt'];
        
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
    }

    // YouTube - проверка через Premium страницу (как в bash скрипте)
    async checkYouTubeService() {
        try {
            const startTime = performance.now();
            
            // Проверяем YouTube Premium страницу
            const response = await Promise.race([
                fetch('https://www.youtube.com/premium', {
                    method: 'GET',
                    headers: {
                        'Accept-Language': 'en',
                        'User-Agent': this.UA_Browser,
                        'Cookie': 'YSC=BiCUU3-5Gdk; CONSENT=YES+cb.20220301-11-p0.en+FX+700; GPS=1; VISITOR_INFO1_LIVE=4VwPMkB7W5A; PREF=tz=Asia.Shanghai'
                    },
                    cache: 'no-cache'
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
            ]);

            const loadTime = performance.now() - startTime;
            
            if (response.ok) {
                const text = await response.text();
                
                // Проверяем на редирект в Китай
                const isCN = text.includes('www.google.cn');
                if (isCN) {
                    this.updateServiceStatus('youtube', 'error', 'Недоступен (CN)');
                    return;
                }

                // Проверяем доступность Premium
                const isNotAvailable = text.includes('Premium is not available in your country');
                const isAvailable = text.includes('ad-free') || text.includes('premium');
                
                // Определяем регион
                const regionMatch = text.match(/"countryCode":"([A-Z]{2})"/);
                const region = regionMatch ? regionMatch[1] : '';

                if (isNotAvailable) {
                    this.updateServiceStatus('youtube', 'slow', `Ограничен${region ? ` (${region})` : ''}`);
                } else if (isAvailable) {
                    if (loadTime < 2000) {
                        this.updateServiceStatus('youtube', 'ok', `ОК${region ? ` (${region})` : ''}`);
                    } else {
                        this.updateServiceStatus('youtube', 'slow', `Медленно${region ? ` (${region})` : ''}`);
                    }
                } else {
                    this.updateServiceStatus('youtube', 'ok', 'ОК');
                }
            } else {
                this.updateServiceStatus('youtube', 'error', `HTTP ${response.status}`);
            }

        } catch (error) {
            if (error.message === 'timeout') {
                this.updateServiceStatus('youtube', 'error', 'Таймаут');
            } else {
                this.updateServiceStatus('youtube', 'error', 'Недоступен');
            }
        }
    }

    // ChatGPT - проверка региона через CDN trace (как в bash скрипте)
    async checkChatGPTService() {
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

            const response = await Promise.race([
                fetch('https://chat.openai.com/cdn-cgi/trace', {
                    method: 'GET',
                    cache: 'no-cache'
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
            ]);

            if (response.ok) {
                const text = await response.text();
                const locationMatch = text.match(/loc=([A-Z]{2})/);
                const location = locationMatch ? locationMatch[1] : '';

                if (!location) {
                    this.updateServiceStatus('chatgpt', 'error', 'Регион не определен');
                    return;
                }

                if (supportedCountries.includes(location)) {
                    this.updateServiceStatus('chatgpt', 'ok', `ОК (${location})`);
                } else {
                    this.updateServiceStatus('chatgpt', 'error', `Недоступен (${location})`);
                }
            } else {
                this.updateServiceStatus('chatgpt', 'error', 'Недоступен');
            }

        } catch (error) {
            if (error.message === 'timeout') {
                this.updateServiceStatus('chatgpt', 'error', 'Таймаут');
            } else {
                this.updateServiceStatus('chatgpt', 'error', 'Недоступен');
            }
        }
    }

    // Instagram - проверка лицензированной музыки (адаптация из bash скрипта)
    async checkInstagramService() {
        try {
            // Упрощенная проверка доступности Instagram
            const startTime = performance.now();
            
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

            if (!basicResponse.ok) {
                this.updateServiceStatus('instagram', 'error', 'Недоступен');
                return;
            }

            // Пытаемся получить более детальную информацию
            try {
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

                if (detailedResponse.ok) {
                    const data = await detailedResponse.json();
                    // Если получили данные, значит доступ полный
                    if (loadTime < 2000) {
                        this.updateServiceStatus('instagram', 'ok', 'ОК');
                    } else {
                        this.updateServiceStatus('instagram', 'slow', 'Медленно');
                    }
                } else {
                    // Базовый доступ есть, но API может быть ограничен
                    this.updateServiceStatus('instagram', 'slow', 'Ограничен');
                }
            } catch (apiError) {
                // API недоступно, но основной сайт работает
                if (loadTime < 3000) {
                    this.updateServiceStatus('instagram', 'slow', 'Частично');
                } else {
                    this.updateServiceStatus('instagram', 'error', 'Медленно');
                }
            }

        } catch (error) {
            if (error.message === 'timeout') {
                this.updateServiceStatus('instagram', 'error', 'Таймаут');
            } else {
                this.updateServiceStatus('instagram', 'error', 'Недоступен');
            }
        }
    }

    // Telegram - проверка Web версии
    async checkTelegramService() {
        try {
            const startTime = performance.now();
            
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

            if (response.ok) {
                if (loadTime < 2000) {
                    this.updateServiceStatus('telegram', 'ok', 'ОК');
                } else if (loadTime < 5000) {
                    this.updateServiceStatus('telegram', 'slow', 'Медленно');
                } else {
                    this.updateServiceStatus('telegram', 'error', 'Очень медленно');
                }
            } else {
                // Пробуем альтернативный метод - проверка API эндпоинта
                try {
                    const apiResponse = await Promise.race([
                        fetch('https://api.telegram.org/', {
                            method: 'HEAD',
                            cache: 'no-cache'
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
                    ]);
                    
                    if (apiResponse.ok) {
                        this.updateServiceStatus('telegram', 'slow', 'API доступен');
                    } else {
                        this.updateServiceStatus('telegram', 'error', 'Недоступен');
                    }
                } catch (apiError) {
                    this.updateServiceStatus('telegram', 'error', 'Недоступен');
                }
            }

        } catch (error) {
            if (error.message === 'timeout') {
                this.updateServiceStatus('telegram', 'error', 'Таймаут');
            } else {
                this.updateServiceStatus('telegram', 'error', 'Недоступен');
            }
        }
    }

    // WhatsApp - проверка Web версии
    async checkWhatsAppService() {
        try {
            const startTime = performance.now();
            
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

            if (response.ok) {
                if (loadTime < 2000) {
                    this.updateServiceStatus('whatsapp', 'ok', 'ОК');
                } else if (loadTime < 5000) {
                    this.updateServiceStatus('whatsapp', 'slow', 'Медленно');
                } else {
                    this.updateServiceStatus('whatsapp', 'error', 'Очень медленно');
                }
            } else {
                this.updateServiceStatus('whatsapp', 'error', `HTTP ${response.status}`);
            }

        } catch (error) {
            if (error.message === 'timeout') {
                this.updateServiceStatus('whatsapp', 'error', 'Таймаут');
            } else {
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
        const services = ['youtube', 'chatgpt', 'instagram', 'telegram', 'whatsapp'];
        const report = {
            timestamp: new Date().toISOString(),
            services: {}
        };

        for (const service of services) {
            await this.recheckService(service);
            
            const statusElement = document.getElementById(`${service}-status`);
            if (statusElement) {
                const indicator = statusElement.querySelector('.status-indicator');
                const text = statusElement.querySelector('.status-text');
                
                report.services[service] = {
                    status: indicator ? indicator.className.split(' ').pop() : 'unknown',
                    message: text ? text.textContent : 'No data'
                };
            }
        }

        return report;
    }
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServiceChecker;
} else if (typeof window !== 'undefined') {
    window.ServiceChecker = ServiceChecker;
}