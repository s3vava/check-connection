// netlify/edge-functions/ip-check.js
export default async (request, context) => {
  const allowedIPs = [
    '212.237.218.122',
    '194.247.187.191', 
    '77.105.137.32'
  ];

  // Получаем IP клиента
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip')
    || context.ip;

  console.log(`Client IP: ${clientIP}`);

  // Проверяем, есть ли IP в allowlist
  if (!allowedIPs.includes(clientIP)) {
    console.log(`IP ${clientIP} not in allowlist. Redirecting to error page.`);
    
    // Перенаправляем на страницу ошибки
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/error.html'
      }
    });
  }

  // IP разрешен, продолжаем обработку
  console.log(`IP ${clientIP} allowed. Continuing to main page.`);
  return context.next();
};