const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const CPF = '79569919353';
const SENHA = 'Trust@2022';

app.get('/exames', async (req, res) => {
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

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto('https://central-de-saude.petlove.com.br/#/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Login
    await page.waitForSelector('input[type="text"], input[name="cpf"], input[placeholder*="CPF"]', { timeout: 15000 });
    await page.type('input[type="text"], input[name="cpf"], input[placeholder*="CPF"]', CPF);
    await page.type('input[type="password"]', SENHA);
    await page.click('button[type="submit"]');

    // Aguarda redirecionar após login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

    // Aguarda tabela carregar
    await page.waitForSelector('td[data-label="Código"]', { timeout: 20000 });

    // Captura os dados
    const exames = await page.evaluate(() => {
      const linhas = document.querySelectorAll('tbody tr');
      const resultado = [];

      linhas.forEach(tr => {
        const codigo = tr.querySelector('td[data-label="Código"]');
        const procedimento = tr.querySelector('td[data-label="Procedimento"]');
        const carenciaCheck = tr.querySelector('td[data-label="Carência"] .fa-check-circle-o');
        const carenciaCross = tr.querySelector('td[data-label="Carência"] .fa-times-circle-o');
        const limiteCheck = tr.querySelector('td[data-label="Limite"] .fa-check-circle-o');
        const copart = tr.querySelector('td[data-label="Copart."] span');

        if (codigo && procedimento) {
          const carenciaOk = carenciaCheck
            ? getComputedStyle(carenciaCheck).display !== 'none'
            : false;
          const limiteOk = limiteCheck
            ? getComputedStyle(limiteCheck).display !== 'none'
            : false;

          resultado.push({
            codigo: codigo.innerText.trim(),
            procedimento: procedimento.innerText.replace('?', '').trim(),
            carencia: carenciaOk ? 'Cumprida' : 'Em carência',
            limite: limiteOk ? 'Disponível' : 'Esgotado',
            coparticipacao: copart ? copart.innerText.trim() : ''
          });
        }
      });

      return resultado;
    });

    await browser.close();

    res.json({
      pet: { nome: 'Capitu', chip: '981020004382421' },
      exames
    });

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ erro: err.message });
  }
});

app.get('/', (req, res) => res.send('TrustVet API online'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));