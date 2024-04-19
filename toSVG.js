import potrace from 'potrace';
import sharp from 'sharp';
import fs from 'fs';

/**
 * Конвертирует растровое изображение (PNG, JPG) в SVG.
 * @param {string} inputFilePath Путь к входному изображению.
 * @param {string} outputFilePath Путь для сохранения SVG.
 */
function convertToSVG(inputFilePath, outputFilePath) {
  // Сначала обработаем изображение через sharp для получения оптимального результата
  sharp(inputFilePath)
    .greyscale() // Переводим в черно-белый формат для упрощения векторизации
    .toBuffer()
    .then((buffer) => {
      // Используем potrace для преобразования обработанного изображения в SVG
      potrace.trace(
        buffer,
        {
          color: 'black', // Цвет векторных линий
          background: 'white', // Цвет фона
          threshold: 200, // Порог для бинаризации изображения
        },
        (err, svg) => {
          if (err) {
            console.error('Ошибка при конвертации в SVG:', err);
            return;
          }
          // Сохраняем результат в файл
          fs.writeFileSync(outputFilePath, svg);
          console.log('SVG успешно сохранен:', outputFilePath);
        }
      );
    })
    .catch((err) => {
      console.error('Ошибка при обработке изображения:', err);
    });
}

// Использование функции
convertToSVG('fox.png', 'fox_output.svg');
