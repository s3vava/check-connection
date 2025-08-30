        // Глобальные переменки для хранения результатов
        let lastCheckResult = null;
        let serviceChecker = null;

        // Инициализация при загрузке страницы
        document.addEventListener('DOMContentLoaded', function() {
            addLogEntry('Страница загружена, готов к проверке');
            updateTimestamp('Страница загружена');
            
            // Инициализируем checker если класс доступен
            if (typeof ServiceChecker !== 'undefined') {
                serviceChecker = new ServiceChecker();
                addLogEntry('ServiceChecker инициализирован', 'success');
            } else {
                addLogEntry('Ошибка: ServiceChecker не найден. Убедитесь что yt_check.js загружен', 'error');
            }
        });

        // Основная функция запуска проверки
        async function startCheck() {
            if (!serviceChecker) {
                addLogEntry('Ошибка: ServiceChecker не инициализирован', 'error');
                return;
            }

            addLogEntry('🎬 Начинаем проверку YouTube...', 'success');
            updateTimestamp('Проверка запущена');
            updateServiceStatus('checking', 'Проверка...');
            hideRegionInfo();

            const startTime = performance.now();

            try {
                // Перехватываем console.log для отображения в интерфейсе
                const originalLog = console.log;
                console.log = function(...args) {
                    const message = args.join(' ');
                    addLogEntry(message);
                    originalLog.apply(console, args);
                };

                // Запускаем проверку
                await serviceChecker.checkYouTubeService();
                
                const totalTime = Math.round(performance.now() - startTime);
                addLogEntry(`✅ Проверка завершена за ${totalTime}мс`, 'success');
                updateTimestamp(`Проверка завершена (${totalTime}мс)`);

                // Восстанавливаем console.log
                console.log = originalLog;

                // Показываем дополнительную информацию
                showRegionInfo(totalTime);

            } catch (error) {
                const totalTime = Math.round(performance.now() - startTime);
                addLogEntry(`❌ Ошибка проверки: ${error.message}`, 'error');
                updateTimestamp(`Ошибка проверки (${totalTime}мс)`);
                updateServiceStatus('error', 'Ошибка проверки');
                
                // Восстанавливаем console.log
                console.log = originalLog;
            }
        }

        // Обновление статуса сервиса в интерфейсе
        function updateServiceStatus(status, text) {
            const indicator = document.querySelector('#youtube-status .status-indicator');
            const textElement = document.getElementById('youtube-text');

            if (indicator) {
                indicator.className = `status-indicator ${status}`;
            }
            if (textElement) {
                textElement.textContent = text;
            }
        }

        // Показать информацию о регионе
        function showRegionInfo(responseTime) {
            const regionInfo = document.getElementById('region-info');
            const regionCode = document.getElementById('region-code');
            const responseTimeElement = document.getElementById('response-time');

            // Пытаемся извлечь регион из статуса
            const statusText = document.getElementById('youtube-text').textContent;
            const regionMatch = statusText.match(/\(([A-Z]{2})\)/);
            
            if (regionMatch) {
                regionCode.textContent = regionMatch[1];
                responseTimeElement.textContent = responseTime;
                regionInfo.style.display = 'block';
            }
        }

        // Скрыть информацию о регионе
        function hideRegionInfo() {
            document.getElementById('region-info').style.display = 'none';
        }

        // Добавление записи в лог
        function addLogEntry(message, type = 'info') {
            const logOutput = document.getElementById('log-output');
            const entry = document.createElement('div');
            entry.className = `log-entry ${type}`;
            
            const timestamp = new Date().toLocaleTimeString('ru-RU');
            entry.textContent = `[${timestamp}] ${message}`;
            
            logOutput.appendChild(entry);
            logOutput.scrollTop = logOutput.scrollHeight;

            // Ограничиваем количество записей в логе
            const entries = logOutput.getElementsByClassName('log-entry');
            if (entries.length > 100) {
                logOutput.removeChild(entries[0]);
            }
        }

        // Обновление времени последней проверки
        function updateTimestamp(status) {
            const timestampElement = document.getElementById('timestamp');
            const now = new Date().toLocaleString('ru-RU');
            timestampElement.textContent = `Последняя проверка: ${now} - ${status}`;
        }

        // Очистка лога
        function clearLog() {
            const logOutput = document.getElementById('log-output');
            logOutput.innerHTML = '<div class="log-entry">Лог очищен</div>';
            addLogEntry('Лог очищен', 'warning');
        }

        // Показать детальную информацию
        function showDetailedInfo() {
            const statusText = document.getElementById('youtube-text').textContent;
            const indicator = document.querySelector('#youtube-status .status-indicator');
            const status = indicator.className.replace('status-indicator ', '');

            let detailMessage = `Текущий статус: ${statusText}\n`;
            detailMessage += `Класс статуса: ${status}\n`;
            detailMessage += `User Agent: ${navigator.userAgent}\n`;
            detailMessage += `Язык браузера: ${navigator.language}\n`;
            detailMessage += `Платформа: ${navigator.platform}`;

            alert(detailMessage);
            addLogEntry('Показана детальная информация', 'info');
        }

        // Имитация метода updateServiceStatus для совместимости с ServiceChecker
        if (typeof window.ServiceChecker === 'undefined') {
            window.updateServiceStatus = updateServiceStatus;
        }

        // Обработка ошибок загрузки скрипта
        window.addEventListener('error', function(event) {
            if (event.filename && event.filename.includes('yt_check.js')) {
                addLogEntry('❌ Ошибка загрузки yt_check.js: ' + event.message, 'error');
                updateServiceStatus('error', 'Скрипт не загружен');
            }
        });

        // Автоматическая проверка при загрузке (опционально)
        window.addEventListener('load', function() {
            setTimeout(() => {
                if (confirm('Выполнить автоматическую проверку YouTube при загрузке страницы?')) {
                    startCheck();
                }
            }, 1000);
        });