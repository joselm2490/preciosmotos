// scripts/price-agent.js
require('dotenv').config();
const { getDbPool } = require('../api/_db.js');
const https = require('https');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };
    https.get(url, options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function postGroq(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.choices && parsed.choices[0]) {
            resolve(parsed.choices[0].message.content);
          } else {
            reject(new Error('Groq error: ' + body));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fetchMarketPrices(motoName, brand, currentPrice) {
  // Clean up motoName to avoid duplication of brand
  let cleanName = motoName;
  if (cleanName.toLowerCase().startsWith(brand.toLowerCase())) {
    cleanName = cleanName.substring(brand.length).trim();
  }
  cleanName = cleanName.replace(/^(ava|toro|tvs|bera|empire)\s+/i, '').trim();

  const query = `moto ${brand} ${cleanName} precio Venezuela`;
  console.log(`🔍 [${brand}] Buscando precio para: ${cleanName} (Basal: $${currentPrice})...`);
  
  const ddgUrl = 'https://r.jina.ai/https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
  let searchResultsMarkdown = '';
  try {
    searchResultsMarkdown = await httpsGet(ddgUrl);
  } catch (err) {
    console.error(`❌ Error buscando en DuckDuckGo para ${motoName}:`, err.message);
    return null;
  }
  
  // Extract URLs from DuckDuckGo redirects
  const urls = [];
  const regex = /uddg=([^&]+)/g;
  let match;
  while ((match = regex.exec(searchResultsMarkdown)) !== null && urls.length < 4) {
    const rawUrl = decodeURIComponent(match[1]);
    if (!rawUrl.includes('duckduckgo.com') && !urls.includes(rawUrl)) {
      urls.push(rawUrl);
    }
  }
  
  // Fetch detailed content of top pages that don't block
  let pagesContext = '';
  let fetchedCount = 0;
  for (const url of urls) {
    if (url.includes('facebook.com') || url.includes('mercadolibre.com') || url.includes('tucarro.com')) {
      continue;
    }
    try {
      console.log(`📖 Leyendo página de detalle: ${url} ...`);
      const content = await httpsGet('https://r.jina.ai/' + url);
      pagesContext += `\n--- CONTENIDO DE ${url} ---\n${content.substring(0, 1500)}\n`;
      fetchedCount++;
      if (fetchedCount >= 2) break; // Fetch up to 2 pages max to keep tokens low
    } catch (err) {
      console.log(`⚠️ No se pudo leer la página de detalle ${url}:`, err.message);
    }
  }
  
  const combinedContext = `
SEARCH RESULTS SUMMARY:
${searchResultsMarkdown.substring(0, 2000)}

DETAILED PAGES CONTENT:
${pagesContext}
  `;
  
  const minAllowed = Math.round(currentPrice * 0.65);
  const maxAllowed = Math.round(currentPrice * 1.35);
  
  const prompt = [
    {
      role: 'system',
      content: `Eres un asistente analista de mercado experto. Tu trabajo es analizar la información web provista y extraer los detalles de precios en DÓLARES (USD) para la motocicleta NUEVA indicada.
Debes retornar estrictamente un objeto JSON con el siguiente formato:
{
  "average_price": number (el precio promedio estimado en USD, o null si no se encuentra),
  "min_price": number (el precio mínimo estimado en USD, o null si no se encuentra),
  "max_price": number (el precio máximo estimado en USD, o null si no se encuentra),
  "reasoning": "Explicación breve de dónde se encontraron los precios, si se realizó alguna conversión y cómo se calculó el promedio"
}
Reglas críticas:
1. El precio de referencia actual de la moto es de $${currentPrice} USD. Los precios que extraigas deben estar dentro del rango realista del mercado de +/- 35% de este valor (es decir, entre $${minAllowed} y $${maxAllowed} USD).
2. Si encuentras precios expresados en Bolívares Soberanos (Bs. o VES), conviértelos a dólares (USD) usando una tasa de cambio aproximada de 36.5 Bs. por dólar, y verifica si el resultado cae dentro del rango de referencia.
3. Cualquier precio fuera de este rango es altamente probable que sea un pago inicial (cuota inicial), cuota de financiamiento semanal/mensual, o un error (como un número de teléfono o precio en bolívares mal interpretado). Debes IGNORARLO.
4. Extrae SOLAMENTE precios de motocicletas NUEVAS (cero kilómetros), nunca de segunda mano o usadas.
5. Si solo encuentras un precio único válido, colócalo en average_price, min_price y max_price.
6. Si no hay información de precio confiable dentro del rango de referencia en el contexto provisto, retorna null en los campos numéricos.`
    },
    {
      role: 'user',
      content: `Extrae los detalles de precio para la moto: "${brand} ${motoName}" en Venezuela a partir del siguiente contexto:\n\n${combinedContext}`
    }
  ];
  
  try {
    const resText = await postGroq(prompt);
    const parsed = JSON.parse(resText);
    return parsed;
  } catch (err) {
    console.error(`❌ Error analizando con Groq para ${motoName}:`, err.message);
    return null;
  }
}

async function run() {
  console.log("🚀 INICIANDO AGENTE DE PRECIOS CON IA GRATUITA (GROQ + JINA)...");
  
  if (!process.env.GROQ_API_KEY) {
    console.error("❌ ERROR: GROQ_API_KEY no definida en el archivo .env");
    process.exit(1);
  }
  
  const pool = getDbPool();
  let client;
  
  try {
    client = await pool.connect();
    
    // Buscar todas las motos activas para analizar precios (incluyendo Bera y Empire)
    const res = await client.query(
      `SELECT id, marca, nombre, precio 
       FROM public.motos 
       WHERE active = true
       ORDER BY marca, nombre`
    );
    
    const motos = res.rows;
    console.log(`Encontradas ${motos.length} motos para analizar.`);
    
    let updatedCount = 0;
    
    for (let i = 0; i < motos.length; i++) {
      const moto = motos[i];
      const currentPrice = parseFloat(moto.precio || 0);
      console.log(`\n[${i + 1}/${motos.length}] Procesando ${moto.marca} ${moto.nombre}...`);
      
      const marketData = await fetchMarketPrices(moto.nombre, moto.marca, currentPrice);
      
      if (marketData && marketData.average_price) {
        console.log(`✅ Precios extraídos con éxito:`);
        console.log(`   - Promedio: $${marketData.average_price}`);
        console.log(`   - Rango: $${marketData.min_price} - $${marketData.max_price}`);
        console.log(`   - Motivo: ${marketData.reasoning}`);
        
        await client.query(
          `UPDATE public.motos 
           SET precio = $1, precio_min = $2, precio_max = $3, precio_fuente = 'agente_ia', updated_at = NOW() 
           WHERE id = $4`,
          [marketData.average_price, marketData.min_price, marketData.max_price, moto.id]
        );
        updatedCount++;
      } else {
        console.log(`⚠️ No se obtuvieron datos de precio válidos. Se mantiene precio actual ($${moto.precio}).`);
      }
      
      // Esperar 3.5 segundos entre peticiones para evitar rate limits de Groq/Jina
      await sleep(3500);
    }
    
    console.log(`\n🎉 AGENTE FINALIZADO: Se actualizaron ${updatedCount} de ${motos.length} motos.`);
    
  } catch (err) {
    console.error("❌ ERROR GENERAL DEL AGENTE:", err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

run();
