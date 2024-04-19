export async function removeBackground(inputImagePath, outputImagePath) {
  const image = await sharp(inputImagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = image;

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]]; // Получаем RGB значения каждого пикселя
    if (chroma.distance([r, g, b], '#FFFFFF') < 50) {
      // Сравниваем с зеленым цветом
      data[i + 3] = 0; // Делаем пиксель прозрачным
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).toFile(outputImagePath);
}
