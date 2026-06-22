// scripts/db-sync.js
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { getDbPool } = require('../api/_db.js');

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

// Helper to get Bera attributes by name
function getBeraAttr(p, name) {
  const attr = p.attributes?.find(a => a.name.toLowerCase() === name.toLowerCase());
  return attr && attr.terms && attr.terms.length > 0 ? attr.terms.map(t => t.name).join(', ') : null;
}

async function fetchBeraMotos() {
  console.log("--- Fetching Bera products ---");
  const response = await axios.get("https://beravirtual.com/wp-json/wc/store/v1/products?per_page=100", {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  console.log(`Fetched ${response.data.length} Bera products.`);
  
  return response.data.map(p => {
    const images = p.images?.map(img => img.src) || [];
    const mainImage = images[0] || '';
    
    return {
      marca: 'Bera',
      nombre: p.name,
      precio: parseFloat(p.prices?.price || 0),
      imagen: mainImage,
      imagenes: images,
      categoria: p.categories?.[0]?.name || 'Otros',
      enlace: p.permalink || '',
      
      // Especificaciones
      motor: getBeraAttr(p, 'Motor'),
      cilindrada: getBeraAttr(p, 'Cilindrada'),
      potencia: getBeraAttr(p, 'Potencia del motor'),
      torque: null,
      enfriamiento: null,
      transmision: getBeraAttr(p, 'Transmisión'),
      embrague: getBeraAttr(p, 'Embrague'),
      suspension_delantera: null,
      suspension_trasera: null,
      frenos_delanteros: null,
      frenos_traseros: getBeraAttr(p, 'Freno trasero'),
      frenado: getBeraAttr(p, 'Frenado'),
      caucho_delantero: null,
      caucho_trasero: null,
      capacidad_combustible: getBeraAttr(p, 'Aforo de tanque de gasolina'),
      colores: getBeraAttr(p, 'Color'),
      sistema_arranque: getBeraAttr(p, 'Sistema de arranque'),
      encendido: getBeraAttr(p, 'Sistema de encedido'),
      peso: null,
      capacidad_carga: getBeraAttr(p, 'Maxima carga util'),
      garantia: null,
      velocidad_maxima: getBeraAttr(p, 'Velocidad maxima'),
      rendimiento_gasolina: getBeraAttr(p, 'Rendimiento de gasolina'),
      
      // Nuevos campos Bera
      inclinacion_barras: getBeraAttr(p, 'Inclinación de barras'),
      capacidad_ascenso: getBeraAttr(p, 'Capacidad de ascenso'),
      bateria: getBeraAttr(p, 'Batería'),
      fusibles: getBeraAttr(p, 'Fusibles'),
      aforo_aceite_motor: getBeraAttr(p, 'Aforo de aceite de motor'),
      
      // Vacíos para Empire
      bujias: null,
      faro: null,
      luz_freno: null,
      luces_cruce: null,
      longitud_total: null,
      ancho_total: null,
      altura_total: null,
      distancia_ejes: null,
      dimension_caja: null,
      unidad_final: null,
      diametro_carrera: null,
      relacion_compresion: null,
      sistema_combustible: null
    };
  });
}

// Scrape Empire product details page
async function scrapeEmpireProductDetails(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' 
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(html);
    const specs = {};
    
    // Parse wpb_tab attributes
    $('.wpb_tab .nectar-hor-list-item').each((i, itemEl) => {
      const key = $(itemEl).find('.nectar-list-item h4').text().trim().toLowerCase();
      const val = $(itemEl).find('.nectar-list-item').eq(1).text().trim();
      if (key && val) {
        specs[key] = val;
      }
    });
    
    // Extract gallery images
    const images = [];
    $('.woocommerce-product-gallery__image img, .nectar-fancy-box img, .single-product img').each((i, img) => {
      let src = $(img).attr('data-nectar-img-src') || $(img).attr('data-src') || $(img).attr('src') || '';
      if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('banner') && !src.includes('header')) {
        if (src.startsWith('/')) {
          src = `https://www.empirekeeway.com${src}`;
        }
        if (!images.includes(src)) {
          images.push(src);
        }
      }
    });
    
    return { specs, images };
  } catch (e) {
    console.error(`⚠️ Error scraping Empire details for ${url}:`, e.message);
    return { specs: {}, images: [] };
  }
}

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchEmpireMotos() {
  console.log("--- Scraping Empire products ---");
  const { data: html } = await axios.get('https://www.empirekeeway.com/productos/', {
    headers: { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' 
    }
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
      marca: 'Empire',
      nombre,
      precio,
      imagen,
      enlace
    });
  });

  console.log(`Found ${products.length} Empire products. Scraping individual detail pages...`);
  
  const fullProducts = [];
  
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`[${i+1}/${products.length}] Scraping details for: ${p.nombre}...`);
    
    const details = await scrapeEmpireProductDetails(p.enlace);
    const specs = details.specs;
    
    // Si no se encuentran imágenes en el detalle, usamos la de la grilla principal
    const images = details.images.length > 0 ? details.images : [p.imagen];
    const mainImage = images[0] || p.imagen;
    
    // Intentar extraer cilindrada del motor si no existe una clave directa
    let cilindrada = specs['cilindrada'];
    if (!cilindrada && specs['motor']) {
      const match = specs['motor'].match(/\d+cc/i);
      if (match) cilindrada = match[0];
    }
    
    fullProducts.push({
      ...p,
      imagen: mainImage,
      imagenes: images,
      categoria: 'Motos',
      
      // Especificaciones
      motor: specs['motor'] || null,
      cilindrada: cilindrada || null,
      potencia: specs['potencia máxima'] || null,
      torque: specs['torque máximo'] || null,
      enfriamiento: specs['enfriamiento'] || null,
      transmision: specs['transmisión'] || specs['tipo'] || null,
      embrague: specs['embrague / clutch'] || null,
      suspension_delantera: specs['suspensión delantera'] || null,
      suspension_trasera: specs['suspensión trasera'] || null,
      frenos_delanteros: specs['frenos delantera'] || specs['frenos delanteros'] || specs['freno delantero'] || null,
      frenos_traseros: specs['frenos trasera'] || specs['frenos traseros'] || specs['freno trasero'] || null,
      frenado: null,
      caucho_delantero: specs['caucho delantero'] || null,
      caucho_trasero: specs['caucho trasero'] || null,
      capacidad_combustible: specs['capacidad de combistible'] || specs['capacidad de combustible'] || null,
      colores: specs['colores'] || null,
      sistema_arranque: specs['encendido'] || null,
      encendido: specs['encendido'] || null,
      peso: specs['peso'] || null,
      capacidad_carga: specs['capacidad de carga'] || null,
      garantia: specs['garantía'] || null,
      velocidad_maxima: null,
      rendimiento_gasolina: null,
      
      // Vacíos para Bera
      inclinacion_barras: null,
      capacidad_ascenso: null,
      bateria: null,
      fusibles: null,
      aforo_aceite_motor: null,
      
      // Especificaciones específicas de Empire
      bujias: specs['bujías'] || specs['bujía'] || specs['bujias'] || null,
      faro: specs['faro'] || null,
      luz_freno: specs['luz de freno'] || null,
      luces_cruce: specs['luces de cruce'] || null,
      longitud_total: specs['longitud total'] || null,
      ancho_total: specs['ancho total'] || null,
      altura_total: specs['altura total'] || null,
      distancia_ejes: specs['distancia entre ejes'] || null,
      dimension_caja: specs['tamaño de la caja'] || null,
      unidad_final: specs['unidad final'] || null,
      diametro_carrera: specs['diámetro x carrera'] || null,
      relacion_compresion: specs['relación de compresión'] || null,
      sistema_combustible: specs['sistema de combustible'] || null
    });
    
    // Pequeño retardo de 100ms
    await sleep(100);
  }

  console.log(`Scraped full details for ${fullProducts.length} Empire products.`);
  return fullProducts;
}

async function sync(closePool = false) {
  const startTime = new Date();
  console.log(`Iniciando sincronización completa: ${startTime.toISOString()}`);
  
  const pool = getDbPool();
  let client;
  
  try {
    client = await pool.connect();
    
    // 1. Fetch data from Bera
    let beraMotos = [];
    try {
      beraMotos = await fetchBeraMotos();
    } catch (e) {
      console.error("❌ Error al obtener Bera, se omitirá sincronización de Bera:", e.message);
    }
    
    // 2. Fetch data from Empire
    let empireMotos = [];
    try {
      empireMotos = await fetchEmpireMotos();
    } catch (e) {
      console.error("❌ Error al obtener Empire, se omitirá sincronización de Empire:", e.message);
    }
    
    const allMotos = [...beraMotos, ...empireMotos];
    
    if (allMotos.length === 0) {
      console.log("⚠️ No se obtuvieron productos para guardar. Abortando.");
      return;
    }
    
    // 3. Upsert products
    console.log("--- Guardando productos en la base de datos ---");
    const query = `
      INSERT INTO public.motos (
          marca, nombre, precio, imagen, imagenes, categoria, enlace, active, updated_at,
          motor, cilindrada, potencia, torque, enfriamiento, transmision, embrague,
          suspension_delantera, suspension_trasera, frenos_delanteros, frenos_traseros, frenado,
          caucho_delantero, caucho_trasero, capacidad_combustible, colores, sistema_arranque, encendido,
          peso, capacidad_carga, garantia, velocidad_maxima, rendimiento_gasolina,
          inclinacion_barras, capacidad_ascenso, bateria, fusibles, aforo_aceite_motor,
          bujias, faro, luz_freno, luces_cruce, longitud_total, ancho_total, altura_total,
          distancia_ejes, dimension_caja, unidad_final, diametro_carrera, relacion_compresion, sistema_combustible
      )
      VALUES (
          $1, $2, $3, $4, $5, $6, $7, TRUE, NOW(),
          $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25,
          $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35,
          $36, $37, $38, $39, $40, $41, $42,
          $43, $44, $45, $46, $47, $48
      )
      ON CONFLICT (marca, nombre)
      DO UPDATE SET
          precio = EXCLUDED.precio,
          imagen = EXCLUDED.imagen,
          imagenes = EXCLUDED.imagenes,
          categoria = EXCLUDED.categoria,
          enlace = EXCLUDED.enlace,
          active = TRUE,
          updated_at = NOW(),
          motor = EXCLUDED.motor,
          cilindrada = EXCLUDED.cilindrada,
          potencia = EXCLUDED.potencia,
          torque = EXCLUDED.torque,
          enfriamiento = EXCLUDED.enfriamiento,
          transmision = EXCLUDED.transmision,
          embrague = EXCLUDED.embrague,
          suspension_delantera = EXCLUDED.suspension_delantera,
          suspension_trasera = EXCLUDED.suspension_trasera,
          frenos_delanteros = EXCLUDED.frenos_delanteros,
          frenos_traseros = EXCLUDED.frenos_traseros,
          frenado = EXCLUDED.frenado,
          caucho_delantero = EXCLUDED.caucho_delantero,
          caucho_trasero = EXCLUDED.caucho_trasero,
          capacidad_combustible = EXCLUDED.capacidad_combustible,
          colores = EXCLUDED.colores,
          sistema_arranque = EXCLUDED.sistema_arranque,
          encendido = EXCLUDED.encendido,
          peso = EXCLUDED.peso,
          capacidad_carga = EXCLUDED.capacidad_carga,
          garantia = EXCLUDED.garantia,
          velocidad_maxima = EXCLUDED.velocidad_maxima,
          rendimiento_gasolina = EXCLUDED.rendimiento_gasolina,
          inclinacion_barras = EXCLUDED.inclinacion_barras,
          capacidad_ascenso = EXCLUDED.capacidad_ascenso,
          bateria = EXCLUDED.bateria,
          fusibles = EXCLUDED.fusibles,
          aforo_aceite_motor = EXCLUDED.aforo_aceite_motor,
          bujias = EXCLUDED.bujias,
          faro = EXCLUDED.faro,
          luz_freno = EXCLUDED.luz_freno,
          luces_cruce = EXCLUDED.luces_cruce,
          longitud_total = EXCLUDED.longitud_total,
          ancho_total = EXCLUDED.ancho_total,
          altura_total = EXCLUDED.altura_total,
          distancia_ejes = EXCLUDED.distancia_ejes,
          dimension_caja = EXCLUDED.dimension_caja,
          unidad_final = EXCLUDED.unidad_final,
          diametro_carrera = EXCLUDED.diametro_carrera,
          relacion_compresion = EXCLUDED.relacion_compresion,
          sistema_combustible = EXCLUDED.sistema_combustible;
    `;
    
    for (const m of allMotos) {
      await client.query(query, [
        m.marca, m.nombre, m.precio, m.imagen, m.imagenes, m.categoria, m.enlace, // 1-7
        m.motor, m.cilindrada, m.potencia, m.torque, m.enfriamiento, m.transmision, m.embrague, // 8-14
        m.suspension_delantera, m.suspension_trasera, m.frenos_delanteros, m.frenos_traseros, m.frenado, // 15-19
        m.caucho_delantero, m.caucho_trasero, m.capacidad_combustible, m.colores, m.sistema_arranque, m.encendido, // 20-25
        m.peso, m.capacidad_carga, m.garantia, m.velocidad_maxima, m.rendimiento_gasolina, // 26-30
        m.inclinacion_barras, m.capacidad_ascenso, m.bateria, m.fusibles, m.aforo_aceite_motor, // 31-35
        m.bujias, m.faro, m.luz_freno, m.luces_cruce, m.longitud_total, m.ancho_total, m.altura_total, // 36-42
        m.distancia_ejes, m.dimension_caja, m.unidad_final, m.diametro_carrera, m.relacion_compresion, m.sistema_combustible // 43-48
      ]);
    }
    console.log("--- Upsert de productos completado ---");
    
    // 4. Deactivate old products
    if (beraMotos.length > 0) {
      console.log("--- Desactivando productos descontinuados de Bera ---");
      const deactivateBeraQuery = `
        UPDATE public.motos
        SET active = FALSE
        WHERE marca = 'Bera' AND updated_at < $1;
      `;
      const res = await client.query(deactivateBeraQuery, [startTime]);
      console.log(`Desactivados ${res.rowCount} productos de Bera.`);
    }
    
    if (empireMotos.length > 0) {
      console.log("--- Desactivando productos descontinuados de Empire ---");
      const deactivateEmpireQuery = `
        UPDATE public.motos
        SET active = FALSE
        WHERE marca = 'Empire' AND updated_at < $1;
      `;
      const res = await client.query(deactivateEmpireQuery, [startTime]);
      console.log(`Desactivados ${res.rowCount} productos de Empire.`);
    }
    
    console.log("🎉 Sincronización finalizada exitosamente con especificaciones.");
    
  } catch (error) {
    console.error("❌ Error grave en la sincronización:", error.message, error.stack);
  } finally {
    if (client) client.release();
    if (closePool) {
      await pool.end();
      console.log("--- Conexión de base de datos cerrada ---");
    }
  }
}

// Permitir que el script sea importado o ejecutado directamente
if (require.main === module) {
  sync(true);
} else {
  module.exports = { sync };
}
