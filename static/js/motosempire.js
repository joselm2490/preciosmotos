// api/empire.js
const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
    try {
        // 1. Descargamos la página del producto
        const { data } = await axios.get('https://www.empirekeeway.com/productos/outlook-300-xl/');
        const $ = cheerio.load(data);

        // 2. Buscamos el script de tipo JSON-LD
        const jsonLdScript = $('script[type="application/ld+json"]').html();
        const jsonData = JSON.parse(jsonLdScript);

        // 3. Localizamos el objeto tipo 'Product' dentro del JSON
        // A veces el JSON es un objeto directo, otras veces un array en '@graph'
        const product = Array.isArray(jsonData['@graph'])
            ? jsonData['@graph'].find(item => item['@type'] === 'Product')
            : jsonData;

        // 4. Extraemos los datos exactos que necesitas
        const motoData = {
            nombre: product.name,
            precioUsd: parseFloat(product.offers[0].priceSpecification[0].price),
            imagen: product.image, // Ya viene la URL directa
            categoria: "Scooter" // Nota: el JSON-LD a veces no incluye categoría, 
            // si la necesitas, podemos extraerla del HTML con $('...').text()
        };

        res.status(200).json(motoData);
    } catch (error) {
        res.status(500).json({ error: "No se pudieron extraer los datos del JSON-LD" });
    }
}