import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  console.log("--- API Empire: Iniciando consulta ---");
  try {
    const { data: html } = await axios.get('https://www.empirekeeway.com/productos/atlas-hd/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(html);
    const scriptContent = $('script[type="application/ld+json"]').html();

    if (!scriptContent) {
      console.log("Error: No se encontró JSON-LD");
      return res.status(404).json({ error: "JSON-LD no encontrado" });
    }

    const ldJson = JSON.parse(scriptContent);
    const product = ldJson['@graph'].find(i => i['@type'] === 'Product');

    console.log("Datos extraídos:", product.name);

    const responseData = {
      nombre: product.name,
      precio: product.offers[0].priceSpecification[0].price,
      imagen: product.image.startsWith('http') ? product.image : `https://www.empirekeeway.com${product.image}`
    };

    console.log("--- API Empire: Respuesta enviada exitosamente ---");
    res.status(200).json(responseData);

  } catch (error) {
    console.error("Error en API Empire:", error.message);
    res.status(500).json({ error: error.message });
  }
}