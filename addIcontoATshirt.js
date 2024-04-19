import sharp from 'sharp';

// Путь к изображению футболки и логотипу
const tshirtImagePath = 'tshirt.jpg';
const logoImagePath = 'image.png'; // Логотип должен быть с прозрачным фоном

// Позиция, где должен быть размещен логотип на футболке
const logoPosition = {
  left: 100, // отступ слева в пикселях
  top: 100, // отступ сверху в пикселях
};

// Размеры логотипа
const logoWidth = 200; // ширина логотипа в пикселях
const logoHeight = 100; // высота логотипа в пикселях

sharp(tshirtImagePath)
  .composite([
    {
      input: logoImagePath,
      top: logoPosition.top,
      left: logoPosition.left,
      blend: 'over',
      width: logoWidth,
      height: logoHeight,
    },
  ])
  .toFile('output.jpg', (err) => {
    if (err) {
      console.error('Ошибка при добавлении логотипа: ', err);
    } else {
      console.log('Логотип успешно добавлен на футболку');
    }
  });
