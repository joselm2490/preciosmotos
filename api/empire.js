const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
  try {
    const { data } = await axios.get('https://www.empirekeeway.com/productos/');
    const $ = cheerio.load(data);
    const motos = [];
    $('.product').each((i, el) => {
      const nombre = $(el).find('.woocommerce-loop-product__title').text().trim();
      const precioRaw = $(el).find('.price').text().trim();
      motos.push({
        nombre: nombre,
        precioUsd: precioRaw ? parseFloat(precioRaw.replace(/[^0-9.]/g, '')) : 0
      });
    });
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(motos);
  } catch (error) {
    res.status(500).json({ error: "Error al cargar Empire" });
  }
}