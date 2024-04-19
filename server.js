import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { google } from 'googleapis';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai'; // Import the entire OpenAI package
import axios from 'axios';
import sharp from 'sharp';
import { Storage } from '@google-cloud/storage';
import { remover } from './remover.js';
//import { removeGreenBackground } from './removeGreenBackground.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const storage = new Storage();
const bucketName = 'dall-e-bucket';
const filename = '../DALL-E/downloaded_images/generatedImage_2024033113262.png';

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

//setx GOOGLE_APPLICATION_CREDENTIALS "C:\Users\Yuliya\Desktop\DALL-E\tshirtorder-418208-a258d3961350.json"

app.post('/upload-image', async (req, res) => {
  const { fileData, type } = req.body;
  const filePath = `../DALL-E/${
    type === 'downloaded' ? 'downloaded_images' : 'output_images'
  }/${fileData}`;

  try {
    const response = await storage.bucket(bucketName).upload(filePath, {
      public: true,
      metadata: {
        contentType: 'image/jpg',
      },
    });
    console.log('upload response', response);
    // Assuming the response structure you provided
    res.json({ message: response });
  } catch (error) {
    console.error('Error uploading image:', error);
    res
      .status(500)
      .json({ message: 'Failed to upload  image', error: error.message });
  }
});

app.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    });

    // Assuming the response structure you provided
    if (response.data.length > 0) {
      const base64EncodedImage = response.data[0].b64_json;

      // Decode base64 (consider stripping the data URI scheme if present)
      const base64Image = base64EncodedImage.split(';base64,').pop();

      const timestamp = new Date()
        .toISOString()
        .replace(/[-:.T]/g, '')
        .slice(0, -5);
      const filePath = path.join(
        __dirname,
        'downloaded_images',
        `${timestamp}.jpg`
      );

      const outputPath = path.join(__dirname, 'icons', `${timestamp}.jpg`);

      // Using promises for writeFile to handle it with async/await
      await fs.promises.writeFile(filePath, base64Image, {
        encoding: 'base64',
      });
      //  await removeGreenBackground(filePath, outputPath);
      console.log('Image saved successfully.');
      res.json({ message: { fileName: `${timestamp}.jpg` } });
    } else {
      res.status(404).json({ message: 'No image data found in response' });
    }
  } catch (error) {
    console.error('Error generating image:', error);
    res
      .status(500)
      .json({ message: 'Failed to generate image', error: error.message });
  }
});
const openai = new OpenAI({});

const oauth2Client = new google.auth.OAuth2(
  '',
  '',
  'http://localhost:3000/auth/google/callback'
);

// Step 1: Redirect users to Google's OAuth2 server
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
    prompt: 'consent', // Forces a prompt for consent so you can get a refresh token
  });
  res.redirect(url);
});

// Step 2: Google redirects users back to your application with a code
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query; // Extract the authorization code from the query parameters
  if (!code) {
    return res.status(400).send('Authorization code is missing.');
  }

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.redirect('http://localhost:3001');
  } catch (error) {
    console.error('Error during the OAuth2 callback:', error);
    res
      .status(500)
      .send('Failed to authenticate. See server console for details.');
  }
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

app.post('/send-email', async (req, res) => {
  const { email, links, size } = req.body;
  const rawMessage = `From: "Yuliya Russinova" <juliyapashintseva@gmail.com>
To: <${email}>
Subject: "T-shirt Print"
Content-Type: text/plain; charset="UTF-8"

Dear Sir or Madame,
I'm writing to request a t-shirt of ${size} with the following print: ${links[0]}`;

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    console.log(response.data);
    res.send({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res
      .status(500)
      .send({ message: 'Failed to send email', error: error.message });
  }
});

app.post('/apply-image', async (req, res) => {
  const tshirtImagePath = 'tshirt.jpeg';
  const widthPercentage = 0.35;
  const { outputImageName } = req.body;
  //  const filePath = `../DALL-E/downloaded_images/${fileData}`;

  try {
    const designImagePath = `downloaded_images/${outputImageName}`;
    const designOutputImagePath = `downloaded_images/${outputImageName.replace(
      '.jpg',
      '_cropped.png'
    )}`;
    await remover(designImagePath, designOutputImagePath);
    // Загружаем изображение майки и получаем его размеры
    const tshirt = sharp(tshirtImagePath);
    const tshirtMetadata = await tshirt.metadata();

    // Загружаем рисунок, который будем накладывать
    const design = sharp(designOutputImagePath);
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
      .toFile(`output_images/${outputImageName.replace('.', '_output.')}`);

    console.log(
      `Design has been overlayed onto the t-shirt image and saved to ${outputImageName.replace(
        '.',
        '_output.'
      )}`
    );
    res.send({
      message: `output_images/${outputImageName.replace('.', '_output.')}`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: 'Failed to apply image', error: error.message });
  }
});
