const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');

const app = express();
app.use(express.json());

const CPF = '79569919353';
const SENHA = 'Trust@2022';

app.get('/debug', async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto('https://central-de-saude.petlove.com.br/#/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(r => setTimeout(r, 3000));

    const screenshot = await page.screenshot({ encoding: 'base64' });
    const html = await page.content();

    await browser.close();

    res.json({
      screenshot: `data:image/png;base64,${screenshot}`,
      html: html.substring(0, 3000)
    });

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ erro: err.message });
  }
});

app.get('/', (req, res) => res.send('TrustVet API online'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
