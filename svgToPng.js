import sharp from 'sharp';
import fs from 'fs';

function convertSVGToJPG(inputFilePath, outputFilePath) {
  sharp(inputFilePath)
    .jpeg({ quality: 90 }) // Установка качества JPG
    .toFile(outputFilePath)
    .then(() => {
      console.log('Файл успешно сохранен:', outputFilePath);
    })
    .catch((err) => {
      console.error('Ошибка при конвертации SVG в JPG:', err);
    });
}

// Использование функции
convertSVGToJPG('output_fox_2.svg', 'output_fox_2.jpg');
