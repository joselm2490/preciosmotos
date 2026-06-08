import axios from 'axios';
import * as cheerio from 'cheerio';

function parsePrice(priceText) {
  if (!priceText) return 0;
  
  let cleanText = priceText;
  if (cleanText.includes('-')) {
      const parts = cleanText.split('-');
      cleanText = parts[parts.length - 1];
  }
  
  cleanText = cleanText.replace(/\./g, '');
  cleanText = cleanText.replace(/,/g, '.');
  
  const match = cleanText.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

export default async function handler(req, res) {
  console.log("--- API Empire: Iniciando consulta ---");
  try {
    const { data: html } = await axios.get('https://www.empirekeeway.com/productos/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' }
    });

    const $ = cheerio.load(html);
    const products = [];
    const excludedKeywords = ['espejo', 'retrovisor', 'portabanda', 'repuesto', 'accesorio', 'repuestos'];

    $('ul.products li.product').each((i, el) => {
      const $el = $(el);
      
      const nombre = $el.find('.woocommerce-loop-product__title, h2, h3').first().text().trim();
      if (!nombre) return;
      
      // Filtrar accesorios
      const lowercaseNombre = nombre.toLowerCase();
      const isAccessory = excludedKeywords.some(keyword => lowercaseNombre.includes(keyword));
      if (isAccessory) return;

      const enlace = $el.find('a').first().attr('href') || '';
      
      const imgEl = $el.find('img').first();
      let imagen = imgEl.attr('data-nectar-img-src') || imgEl.attr('data-src') || imgEl.attr('src') || '';
      
      if (imagen && imagen.startsWith('/')) {
        imagen = `https://www.empirekeeway.com${imagen}`;
      }

      const priceText = $el.find('.price').text().trim();
      const precio = parsePrice(priceText);

      products.push({
        nombre,
        precio,
        imagen,
        enlace
      });
    });

    console.log(`--- API Empire: Enviando ${products.length} productos ---`);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(products);

  } catch (error) {
    console.error("Error en API Empire:", error.message);
    res.status(500).json({ error: error.message });
  }
}