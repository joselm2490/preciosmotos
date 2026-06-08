// api/bera.js
const axios = require('axios');

export default async function handler(req, res) {
  try {
    // Hacemos la petición desde el servidor de Vercel (no hay bloqueo CORS aquí)
    const response = await axios.get("https://beravirtual.com/wp-json/wc/store/v1/products?per_page=100");
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener Bera" });
  }
}