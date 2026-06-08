import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const { url, source } = req.query; // Ejemplo: /api/extract-product?url=...&source=empire

  if (!url) return res.status(400).json({ error: "URL requerida" });

  try {
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(html);

    let result = {};

    if (source === 'empire') {
      const ldJson = JSON.parse($('script[type="application/ld+json"]').html());
      const product = ldJson['@graph'] ? ldJson['@graph'].find(i => i['@type'] === 'Product') : ldJson;
      result = {
        name: product.name,
        price: product.offers[0]?.priceSpecification[0]?.price,
        imageUrl: product.image.startsWith('http') ? product.image : `https://www.empirekeeway.com${product.image}`
      };
    }
    // Aquí puedes agregar la lógica para 'bera' u otros haciendo scrap al HTML específico de Bera

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}