document.addEventListener('DOMContentLoaded', function() {
    const checkButton = document.getElementById('checkButton');
    const resultDiv = document.getElementById('result');
    
    checkButton.addEventListener('click', checkYouTubeAccess);
    
    async function checkYouTubeAccess() {
        checkButton.disabled = true;
        checkButton.innerHTML = '<span class="loading"></span>Проверяем...';
        resultDiv.style.display = 'none';
        
        try {
            // Вызываем серверную функцию Netlify
            const response = await fetch('/.netlify/functions/check-youtube', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoUrl: 'https://www.youtube.com/shorts/vjJkdBXVgsk'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            displayResult(data);
            
        } catch (error) {
            console.error('Ошибка:', error);
            displayError('Ошибка при проверке: ' + error.message);
        } finally {
            checkButton.disabled = false;
            checkButton.innerHTML = 'Проверить доступность YouTube';
        }
    }
    
    function displayResult(data) {
        const { speed, status, downloadTime, fileSize } = data;
        
        let statusClass = '';
        let statusIcon = '';
        let statusText = '';
        
        switch (status) {
            case 'excellent':
                statusClass = 'status-excellent';
                statusIcon = '🟢';
                statusText = 'Отличное подключение';
                break;
            case 'good':
                statusClass = 'status-good';
                statusIcon = '🟡';
                statusText = 'Хороший доступ';
                break;
            case 'poor':
                statusClass = 'status-poor';
                statusIcon = '🔴';
                statusText = 'Недоступен';
                break;
        }
        
        resultDiv.className = `result ${statusClass}`;
        resultDiv.innerHTML = `
            <h3>${statusIcon} ${statusText}</h3>
            <p><strong>Скорость загрузки:</strong> ${speed.toFixed(2)} МБ/с</p>
            <p><strong>Размер файла:</strong> ${(fileSize / 1024 / 1024).toFixed(2)} МБ</p>
            <p><strong>Время загрузки:</strong> ${downloadTime.toFixed(2)} сек</p>
        `;
        resultDiv.style.display = 'block';
    }
    
    function displayError(message) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = `
            <h3>❌ Ошибка</h3>
            <p>${message}</p>
        `;
        resultDiv.style.display = 'block';
    }
});