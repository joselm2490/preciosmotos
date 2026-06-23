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

// Parse technical specifications from WPBakery description shortcodes
function parseShortcodes(description) {
  const specs = {};
  if (!description) return specs;
  
  // Robust regex that accounts for smart quotes U+00BB (»), standard quotes, and the WordPress double prime bug (&#8243;)
  const regex = /col_1_content=[»"'](.*?)(?:[»"']|&#8243;)\s+col_2_content=[»"'](.*?)(?:[»"']|&#8243;)/g;
  let match;
  while ((match = regex.exec(description)) !== null) {
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    specs[key] = value;
  }
  return specs;
}

const priceOverrides = {
  'matrix ii': 1589,
  'matrix lite': 1379,
  'ek xpress lite': 1179,
  'tx ii 150': 1575,
  'v302c': 6199,
  'rk 250': 2135,
  'qj motor srt700s': 9050,
  'qj motor srt 550x': 7935,
  'qj motor srt550': 7935,
  'qj motor srt700sx': 9050
};

function categorizeEmpireMoto(nombre, specs) {
  const nameLower = nombre.toLowerCase().trim();
  
  // 1. Eléctricas
  if (nameLower.includes('e-bike') || nameLower.includes('e-go') || nameLower.includes('classica') || nameLower.includes('gev')) {
    return 'Eléctricas';
  }
  
  // 2. Carga
  const caja = specs['tamaño de la caja'];
  const hasCaja = caja && caja.trim() !== '' && caja.trim().toUpperCase() !== 'N/A';
  const hasRetroceso = (specs['transmisión'] && specs['transmisión'].toLowerCase().includes('retroceso')) || 
                       (specs['tipo'] && specs['tipo'].toLowerCase().includes('retroceso'));
  if (nameLower.includes('atlas') || hasRetroceso || hasCaja) {
    return 'Carga';
  }
  
  // 3. Automáticas (Scooters)
  const isAutoTrans = (specs['transmisión'] && (specs['transmisión'].toLowerCase().includes('automática') || specs['transmisión'].toLowerCase().includes('automatico'))) ||
                      (specs['tipo'] && (specs['tipo'].toLowerCase().includes('automática') || specs['tipo'].toLowerCase().includes('automatico')));
  if (nameLower.includes('outlook') || nameLower.includes('matrix') || nameLower.includes('scooter') || nameLower.includes('fort') || isAutoTrans) {
    return 'Automáticas';
  }
  
  // 4. Sincrónicas (Manual transmission / gears)
  const isSyncTrans = (specs['transmisión'] && (specs['transmisión'].toLowerCase().includes('velocidades') || specs['transmisión'].toLowerCase().includes('sincrónica') || specs['transmisión'].toLowerCase().includes('sincronica') || specs['transmisión'].toLowerCase().includes('manual'))) ||
                      (specs['tipo'] && (specs['tipo'].toLowerCase().includes('velocidades') || specs['tipo'].toLowerCase().includes('sincrónica') || specs['tipo'].toLowerCase().includes('sincronica') || specs['tipo'].toLowerCase().includes('manual')));
  if (nameLower.includes('xpress') || nameLower.includes('horse') || nameLower.includes('owen') || nameLower.includes('tx') || nameLower.includes('ek') || isSyncTrans) {
    return 'Sincrónicas';
  }
  
  return 'Otros';
}

async function fetchEmpireMotos() {
  console.log("--- Fetching Empire products from REST API ---");
  const response = await axios.get("https://www.empirekeeway.com/wp-json/wc/store/v1/products?per_page=100", {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  
  console.log(`Fetched ${response.data.length} Empire products from API.`);
  
  const excludedKeywords = ['espejo', 'retrovisor', 'portabanda', 'repuesto', 'accesorio', 'repuestos', 'tapa', 'stop', 'tanque', 'rulera'];
  const filtered = response.data.filter(p => {
    const nameLower = p.name.toLowerCase();
    return !excludedKeywords.some(keyword => nameLower.includes(keyword));
  });
  
  console.log(`Filtered to ${filtered.length} Empire motorcycles.`);
  
  return filtered.map(p => {
    const rawImages = p.images?.map(img => img.src) || [];
    const images = rawImages.map(src => {
      if (src && src.startsWith('/')) {
        return `https://www.empirekeeway.com${src}`;
      }
      return src;
    });
    const mainImage = images[0] || '';
    const specs = parseShortcodes(p.description);
    
    // Extract displacement from engine if not directly specified
    let cilindrada = specs['cilindrada'];
    if (!cilindrada && specs['motor']) {
      const match = specs['motor'].match(/\d+cc/i);
      if (match) cilindrada = match[0];
    }
    
    // Parse price dynamically
    let precio = parseFloat(p.prices?.price || 0) / 100;
    
    // Handle variable products that return 1.0 or 0.0 but have a price range max_amount
    if ((precio === 1.0 || precio === 0.0) && p.prices?.price_range?.max_amount) {
      precio = parseFloat(p.prices.price_range.max_amount) / 100;
    }
    
    // Apply manual price overrides for specific catalog models with database placeholders
    const nameLower = p.name.toLowerCase().trim();
    if (priceOverrides[nameLower] !== undefined) {
      precio = priceOverrides[nameLower];
    }
    
    return {
      marca: 'Empire',
      nombre: p.name,
      precio,
      imagen: mainImage,
      imagenes: images,
      categoria: categorizeEmpireMoto(p.name, specs),
      enlace: p.permalink || '',
      
      // Specifications
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
      colores: specs['colores'] || specs['color'] || null,
      sistema_arranque: specs['encendido'] || null,
      encendido: specs['encendido'] || null,
      peso: specs['peso'] || null,
      capacidad_carga: specs['capacidad de carga'] || null,
      garantia: specs['garantía'] || null,
      velocidad_maxima: null,
      rendimiento_gasolina: null,
      
      // Empty for Bera
      inclinacion_barras: null,
      capacidad_ascenso: null,
      bateria: null,
      fusibles: null,
      aforo_aceite_motor: null,
      
      // Empire specific specifications
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
    };
  });
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
