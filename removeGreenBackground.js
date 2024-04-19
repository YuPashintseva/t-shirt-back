import sharp from 'sharp';

export async function removeOutsideCircle(
  inputImagePath,
  outputImagePath,
  radius = 50
) {
  const image = await sharp(inputImagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = image;

  const centerX = info.width / 2;
  const centerY = info.height / 2;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) > radius) {
        data[i + 3] = 0; // Делаем пиксель полностью прозрачным
      }
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  }).toFile(outputImagePath);
}

async function overlayImageOnTshirt(
  tshirtImagePath,
  designImagePath,
  outputImagePath,
  widthPercentage = 0.35
) {
  try {
    // Загружаем изображение майки и получаем его размеры
    const tshirt = sharp(tshirtImagePath);
    const tshirtMetadata = await tshirt.metadata();

    // Загружаем рисунок, который будем накладывать
    const design = sharp(designImagePath);
    const designMetadata = await design.metadata();

    // Масштабируем рисунок так, чтобы его ширина соответствовала ширине майки (с некоторым отступом)
    const designWidth = Math.round(tshirtMetadata.width * widthPercentage); // например, ширина рисунка будет 90% от ширины майки
    const scaleFactor = designWidth / designMetadata.width;
    const designHeight = Math.round(designMetadata.height * scaleFactor);

    // Рассчитываем координаты для центрирования рисунка на майке
    const top = Math.round((tshirtMetadata.height - designHeight) / 2);
    const left = Math.round((tshirtMetadata.width - designWidth) / 2);

    // Накладываем масштабированный рисунок на изображение майки
    const compositeImage = await tshirt
      .composite([
        {
          input: await design.resize(designWidth).toBuffer(),
          top: top,
          left: left,
        },
      ])
      .toFile(outputImagePath);

    console.log(
      `Design has been overlayed onto the t-shirt image and saved to ${outputImagePath}`
    );
  } catch (error) {
    console.error('Error during image overlay:', error);
  }
}

// removeOutsideCircle('2024040512000.jpg', '2024040512000_3.png');
/*overlayImageOnTshirt('tshirt.jpeg', '1.png', '1_output.png')
  .then(() => console.log('Наложение изображений завершено'))
  .catch((err) => console.error(err));*/
