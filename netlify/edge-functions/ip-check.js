// netlify/edge-functions/ip-check.js
export default async (request, context) => {
  // Для тестирования - временно разрешаем всем доступ
  // Раскомментируйте код ниже после проверки работы сайта
  
  const allowedIPs = [
    '212.237.218.122',
    '194.247.187.191', 
    '77.105.137.32',
    '188.243.228.99'
  ];

  // Получаем URL запроса
  const url = new URL(request.url);
  
  // Если запрос к error.html, пропускаем проверку IP
  if (url.pathname === '/error.html') {
    return context.next();
  }

  // Получаем IP клиента
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip')
    || context.ip;

  console.log(`Client IP: ${clientIP}, Path: ${url.pathname}`);

  // ВРЕМЕННО: Пропускаем всех для тестирования
  // Закомментируйте эти 3 строки когда убедитесь что сайт работает
  //console.log(`TESTING MODE: Allowing all IPs`);
  //return context.next();

   //Основная логика проверки IP (раскомментируйте когда тестирование завершено)
  
  if (!allowedIPs.includes(clientIP)) {
    console.log(`IP ${clientIP} not in allowlist. Showing error page.`);
    
    // Возвращаем HTML содержимое страницы ошибки напрямую
    const errorHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VPN не подключен</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body class="error-page">
    <div class="container">
        <div class="error-content">
            <div class="vpn-logo">
                <img src="https://i.ibb.co/9HSvmtq8/image.png?text=VPN" alt="VPN Logo" class="logo-img">
            </div>
            
            <h1>Вы не подключены к ВПН</h1>
            <p class="error-message">
                Подключитесь и обновите страницу для запуска диагностики
            </p>

            <div class="instructions">
                <h2>Инструкции по подключению:</h2>
                
                <div class="device-instructions">
                    <div class="device-card">
                        <h3>📱 iPhone</h3>
                        <ol>
                            <li>Скачайте приложение V2BOX из App Store</li>
                            <li>Откройте приложение и настройте подключение</li>
                            <li>Нажмите кнопку подключения</li>
                            <li>Обновите эту страницу</li>
                        </ol>
                    </div>

                    <div class="device-card">
                        <h3>🤖 Android</h3>
                        <ol>
                            <li>Установите приложение V2BOX</li>
                            <li>Импортируйте конфигурацию VPN</li>
                            <li>Активируйте VPN соединение</li>
                            <li>Обновите эту страницу</li>
                        </ol>
                    </div>
                </div>
            </div>

            <button class="retry-btn" onclick="window.location.reload()">
                🔄 Обновить страницу
            </button>
        </div>
    </div>
</body>
</html>`;
    
    return new Response(errorHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }
  

  // IP разрешен, продолжаем обработку
  console.log(`IP ${clientIP} allowed. Continuing to main page.`);
  return context.next();
};