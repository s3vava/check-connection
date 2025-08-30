import ytdl from "ytdl-core";

export async function handler(event, context) {
  try {
    const url = "https://www.youtube.com/shorts/vjJkdBXVgsk";

    // Получаем информацию о видео
    const info = await ytdl.getInfo(url);

    // Берем самый простой формат (чтобы гарантированно получить ссылку)
    const format = ytdl.chooseFormat(info.formats, { quality: "lowest" });
    if (!format || !format.url) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Не удалось получить ссылку на поток" }),
      };
    }

    // Скачиваем первые 1 MB (чтобы не грузить весь файл)
    const start = Date.now();
  const response = await fetch(format.url, {
  headers: { Range: "bytes=0-999999" },
});

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Ошибка при запросе сегмента" }),
      };
    }

    const buffer = await response.arrayBuffer();
    const size = buffer.byteLength; // реально загружено байт
    const duration = (Date.now() - start) / 1000; // сек
    const speedMbps = (size * 8) / (1024 * 1024 * duration); // Мбит/с

    // Определяем статус по порогам
    let status;
    if (speedMbps < 1) {
      status = "LIMITED"; // сильное замедление
    } else if (speedMbps < 3) {
      status = "DEGRADED"; // можно смотреть, но качество ограничено
    } else {
      status = "OK"; // ограничений нет
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        video: info.videoDetails.title,
        sizeBytes: size,
        timeSec: duration.toFixed(2),
        speedMbps: parseFloat(speedMbps.toFixed(2)),
        status,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
