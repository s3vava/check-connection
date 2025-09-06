const ytdl = require('ytdl-core');
const axios = require('axios');

exports.handler = async (event, context) => {
    // Настройка CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Обработка preflight запроса
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { videoUrl } = JSON.parse(event.body || '{}');
        
        if (!videoUrl) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'URL видео не предоставлен' })
            };
        }

        console.log('Начинаем проверку YouTube для:', videoUrl);

        // Получаем информацию о видео и прямые ссылки
        const info = await ytdl.getInfo(videoUrl);
        
        // Выбираем формат с минимальным качеством
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
        if (formats.length === 0) {
            throw new Error('Не найдены подходящие форматы видео');
        }
        
        // Сортируем по качеству (выбираем минимальное)
        formats.sort((a, b) => {
            const qualityA = parseInt(a.quality) || 0;
            const qualityB = parseInt(b.quality) || 0;
            return qualityA - qualityB;
        });
        
        const selectedFormat = formats[0];
        const downloadUrl = selectedFormat.url;
        
        console.log('Выбранный формат:', {
            quality: selectedFormat.quality,
            container: selectedFormat.container,
            contentLength: selectedFormat.contentLength
        });

        // Измеряем скорость загрузки
        const startTime = Date.now();
        
        const response = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            timeout: 30000, // 30 секунд таймаут
            headers: {
                'Range': 'bytes=0-1048575' // Загружаем первый 1MB для теста
            }
        });

        let downloadedBytes = 0;
        
        // Создаем промис для отслеживания загрузки
        const downloadPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Таймаут загрузки'));
            }, 15000);

            response.data.on('data', (chunk) => {
                downloadedBytes += chunk.length;
            });

            response.data.on('end', () => {
                clearTimeout(timeout);
                resolve();
            });

            response.data.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });

        await downloadPromise;
        
        const endTime = Date.now();
        const downloadTime = (endTime - startTime) / 1000; // в секундах
        const speedMBps = (downloadedBytes / 1024 / 1024) / downloadTime; // МБ/с

        console.log('Результаты теста:', {
            downloadedBytes,
            downloadTime,
            speedMBps
        });

        // Определяем статус согласно требованиям
        let status;
        if (speedMBps < 1) {
            status = 'poor';
        } else if (speedMBps >= 20) {
            status = 'excellent';
        } else if (speedMBps >= 10) {
            status = 'good';
        } else {
            status = 'good';
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                speed: speedMBps,
                status: status,
                downloadTime: downloadTime,
                fileSize: downloadedBytes,
                videoTitle: info.videoDetails.title,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Ошибка при проверке YouTube:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: `Ошибка проверки: ${error.message}`,
                details: error.stack
            })
        };
    }
};