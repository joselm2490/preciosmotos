const axios = require('axios');

export default async function handler(req, res) {
    try {
        const response = await axios.get("https://open.er-api.com/v6/latest/USD");
        res.status(200).json({ tasa: response.data.rates.VES || 36.5 });
    } catch (e) {
        res.status(200).json({ tasa: 36.5 });
    }
}