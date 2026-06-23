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

const tvsPriceOverrides = {
  'Apache RTR 200 4V FI': 3190.00,
  'Apache RTR 160 4V': 2390.00,
  'TVS Raider': 1650.00,
  'TVS Star HLX 150 5 Gear Disc': 1490.00,
  'TVS Sport': 1250.00,
  'TVS Ntorq 125': 1690.00
};

async function fetchTvsMotos() {
  console.log("--- Fetching TVS products ---");
  const mainUrl = "https://www.tvsmotor.com/es/ve/our-products";
  
  const { data: mainHtml } = await axios.get(mainUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    },
    timeout: 15000
  });
  
  const $ = cheerio.load(mainHtml);
  const uniqueProductsMap = new Map();
  
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/our-products/') && !href.endsWith('/our-products') && !href.endsWith('/our-products/')) {
      let name = '';
      
      const parentCard = $(el).closest('.sm-title');
      if (parentCard.length > 0) {
        name = parentCard.find('h6').text().trim();
      } else {
        const cardParent = $(el).parent();
        name = cardParent.find('h6').first().text().trim();
      }
      
      if (!name) {
        name = $(el).closest('div').find('h6').first().text().trim();
      }
      
      let image = '';
      const inlineImg = $(el).find('img.lazyload');
      if (inlineImg.length > 0) {
        image = inlineImg.attr('data-src') || inlineImg.attr('src');
      }
      
      if (!image) {
        image = $(el).parent().find('img.lazyload').first().attr('data-src') || '';
      }
      if (!image) {
        image = $(el).closest('div').find('img.lazyload').first().attr('data-src') || '';
      }
      
      if (image && image.startsWith('/')) {
        image = "https://www.tvsmotor.com" + image;
      }
      
      if (name.toLowerCase() === 'sport') {
        name = 'TVS Sport';
      } else if (name.toLowerCase() === 'raider') {
        name = 'TVS Raider';
      } else if (name.toLowerCase() === 'ntorq 125') {
        name = 'TVS Ntorq 125';
      } else if (name.toLowerCase() === 'star hlx 150 5 gear disc') {
        name = 'TVS Star HLX 150 5 Gear Disc';
      } else if (name.toLowerCase() === 'apache rtr 160 4v') {
        name = 'Apache RTR 160 4V';
      } else if (name.toLowerCase() === 'apache rtr 200 4v fi') {
        name = 'Apache RTR 200 4V FI';
      }
      
      const existing = uniqueProductsMap.get(href);
      if (existing) {
        if (!existing.name && name) existing.name = name;
        if ((!existing.image || existing.image.includes('data:image')) && image) existing.image = image;
      } else {
        uniqueProductsMap.set(href, { enlace: href, name, image });
      }
    }
  });
  
  const products = Array.from(uniqueProductsMap.values());
  console.log(`Found ${products.length} TVS products. Crawling individual specification pages...`);
  
  const results = [];
  for (const prod of products) {
    try {
      console.log(`Fetching specifications for TVS: ${prod.name} (${prod.enlace})`);
      const { data: detailHtml } = await axios.get(prod.enlace, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        },
        timeout: 15000
      });
      
      const s = cheerio.load(detailHtml);
      const specs = {};
      
      s('label').each((i, el) => {
        const labelText = s(el).text().trim();
        const parentCol = s(el).parent();
        if (parentCol.hasClass('col-5') || parentCol.hasClass('col-md-4')) {
          const valueCol = parentCol.next('.col-7, .col-md-8');
          if (valueCol.length > 0) {
            specs[labelText] = valueCol.text().trim();
          }
        }
      });
      
      let finalImage = prod.image;
      if (!finalImage || finalImage.includes('data:image/gif')) {
        const detailImg = s('.product-banner img, .banner-section img, img.img-fluid').first();
        if (detailImg.length > 0) {
          finalImage = detailImg.attr('src') || detailImg.attr('data-src') || '';
          if (finalImage && finalImage.startsWith('/')) {
            finalImage = "https://www.tvsmotor.com" + finalImage;
          }
        }
      }
      
      let categoria = 'Sincrónicas';
      if (prod.name.toLowerCase().includes('ntorq')) {
        categoria = 'Automáticas';
      }
      
      const precio = tvsPriceOverrides[prod.name] || 0.0;
      
      results.push({
        marca: 'TVS',
        nombre: prod.name,
        precio,
        imagen: finalImage,
        imagenes: finalImage ? [finalImage] : [],
        categoria,
        enlace: prod.enlace,
        
        motor: specs['Tipo'] || specs['Motor'] || null,
        cilindrada: specs['Capacidad del motor'] ? specs['Capacidad del motor'] + ' cc' : null,
        potencia: specs['Potencia Máxima (hp a rpm)'] || specs['Potencia máxima'] || null,
        torque: specs['Torque Máximo (Nm a rpm)'] || specs['Torque máximo'] || null,
        enfriamiento: specs['Tipo']?.toLowerCase().includes('aceite') ? 'Aire y Aceite' : (specs['Tipo']?.toLowerCase().includes('aire') ? 'Aire' : null),
        transmision: specs['Caja de cambios'] || null,
        embrague: specs['Embrague'] || null,
        suspension_delantera: specs['Suspensión Delantera'] || null,
        suspension_trasera: specs['Suspensión Trasera'] || null,
        frenos_delanteros: specs['Freno Delantero (A Disco)'] || specs['Freno delantero'] || null,
        frenos_traseros: specs['Freno Trasero (Disco/Tambor)'] || specs['Freno trasero'] || null,
        frenado: specs['Frenado'] || null,
        caucho_delantero: specs['Neumático (delantero)'] || null,
        caucho_trasero: specs['Neumático (trasero)'] || null,
        capacidad_combustible: specs['Capacidad del Tanque de Combustible'] || specs['Capacidad del tanque de combustible'] || null,
        colores: null,
        sistema_arranque: specs['Arranque'] || null,
        encendido: specs['Encendido'] || null,
        peso: specs['Peso en orden de marcha (con 90% de combustible y kit de herramientas)'] || specs['Peso en orden de marcha'] || null,
        capacidad_carga: specs['Capacidad de carga'] || null,
        garantia: '24 meses / 24.000 km',
        velocidad_maxima: null,
        rendimiento_gasolina: null,
        
        inclinacion_barras: null,
        capacidad_ascenso: null,
        bateria: specs['Valor nominal de la batería (Ah)'] || specs['Batería'] || null,
        fusibles: specs['Fusibles'] || null,
        aforo_aceite_motor: null,
        bujias: specs['Bujía'] || null,
        faro: specs['Faro Delantero'] || null,
        luz_freno: specs['Faro Trasero'] || null,
        luces_cruce: null,
        longitud_total: specs['Largo'] || null,
        ancho_total: specs['Ancho'] || null,
        altura_total: specs['Alto'] || null,
        distancia_ejes: specs['Distancia entre Ejes'] || null,
        dimension_caja: null,
        unidad_final: null,
        diametro_carrera: null,
        relacion_compresion: null,
        sistema_combustible: specs['Sistema de suministro de combustible'] || null
      });
      
    } catch (err) {
      console.error(`❌ Error parsing details for ${prod.name}:`, err.message);
    }
  }
  
  return results;
}

const toroPriceOverrides = {
  'Toro Jaguar TR150': 990.00,
  'Toro León TR200': 1290.00,
  'Toro Rex TR250': 1590.00,
  'Toro Power TR180': 1840.00,
  'Toro Tank TR180': 2500.00,
  'Toro Fox TR180': 1450.00
};

// Static spec mappings for the 6 models
const toroSpecs = {
  'Toro Jaguar TR150': {
    motor: 'Loncin, 150cc, monocilíndrico, 4 tiempos',
    cilindrada: '150 cc',
    transmision: 'Sincrónica de 5 velocidades',
    frenos_delanteros: 'Disco',
    frenos_traseros: 'Tambor',
    capacidad_combustible: '14 l',
    sistema_arranque: 'Eléctrico / Pedal',
    enfriamiento: 'Aire'
  },
  'Toro León TR200': {
    motor: 'Loncin, 200cc, monocilíndrico, 4 tiempos',
    cilindrada: '200 cc',
    potencia: '13 HP',
    torque: '13 Nm a 6000 rpm',
    transmision: 'Sincrónica de 5 velocidades',
    frenos_delanteros: 'Disco',
    frenos_traseros: 'Tambor',
    capacidad_combustible: '14 l',
    suspension_delantera: 'Telescópica con aceite',
    suspension_trasera: 'Doble amortiguador (dualshock)',
    sistema_arranque: 'Eléctrico / Pedal',
    enfriamiento: 'Aire'
  },
  'Toro Rex TR250': {
    motor: 'Loncin, 250cc, monocilíndrico, 4 tiempos',
    cilindrada: '250 cc',
    potencia: '15 HP',
    torque: '17 Nm a 6000 rpm',
    transmision: 'Sincrónica de 6 velocidades',
    frenos_delanteros: 'Disco',
    frenos_traseros: 'Disco',
    capacidad_combustible: '10 l',
    suspension_delantera: 'Telescópica',
    suspension_trasera: 'Monoshock',
    sistema_arranque: 'Eléctrico / Pedal',
    enfriamiento: 'Aire'
  },
  'Toro Power TR180': {
    motor: '180cc, monocilíndrico, 4 tiempos',
    cilindrada: '180 cc',
    potencia: '11 HP',
    torque: '12 Nm a 6000 rpm',
    transmision: 'Automática CVT',
    frenos_delanteros: 'Disco',
    frenos_traseros: 'Disco',
    capacidad_combustible: '8 l',
    suspension_delantera: 'Telescópica con aceite',
    suspension_trasera: 'Doble amortiguador (dualshock)',
    enfriamiento: 'Aire'
  },
  'Toro Tank TR180': {
    motor: '180cc, monocilíndrico, 4 tiempos',
    cilindrada: '180 cc',
    potencia: '11 HP',
    torque: '12 Nm a 6000 rpm',
    transmision: 'Automática CVT',
    frenos_delanteros: 'Disco',
    frenos_traseros: 'Disco',
    capacidad_combustible: '7 l',
    suspension_delantera: 'Telescópica con aceite',
    suspension_trasera: 'Doble amortiguador (dualshock)',
    enfriamiento: 'Aire'
  },
  'Toro Fox TR180': {
    motor: '180cc, monocilíndrico, 4 tiempos',
    cilindrada: '180 cc',
    potencia: '11 HP',
    torque: '12 Nm a 6000 rpm',
    transmision: 'Automática CVT',
    frenos_delanteros: 'Disco',
    frenos_traseros: 'Disco',
    capacidad_combustible: '7 l',
    suspension_delantera: 'Telescópica con aceite',
    suspension_trasera: 'Doble amortiguador (dualshock)',
    enfriamiento: 'Aire'
  }
};

const toroImageUrls = {
  'Toro Jaguar TR150': 'https://toromotos.com/wp-content/uploads/2023/07/JAGUAR.png',
  'Toro León TR200': 'https://toromotos.com/wp-content/uploads/2023/07/LEON.png',
  'Toro Rex TR250': 'https://toromotos.com/wp-content/uploads/2023/07/REX.png',
  'Toro Power TR180': 'https://toromotos.com/wp-content/uploads/2023/07/POWER.png',
  'Toro Tank TR180': 'https://toromotos.com/wp-content/uploads/2023/07/TANK.png',
  'Toro Fox TR180': 'https://toromotos.com/wp-content/uploads/2023/07/FOX.png'
};

async function fetchToroMotos() {
  console.log("--- Fetching Toro products ---");
  const mainUrl = "https://toromotos.com/inicio/";
  
  const { data: mainHtml } = await axios.get(mainUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
    },
    timeout: 15000
  });
  
  const $ = cheerio.load(mainHtml);
  const results = [];
  
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('/download/')) {
      const hrefClean = href.trim().replace(/%20$/, '');
      const rawText = $(el).text().trim();
      
      let cleanName = '';
      let categoria = 'Sincrónicas';
      
      if (rawText.includes('JAGUAR')) {
        cleanName = 'Toro Jaguar TR150';
      } else if (rawText.includes('LEÓN')) {
        cleanName = 'Toro León TR200';
      } else if (rawText.includes('REX')) {
        cleanName = 'Toro Rex TR250';
      } else if (rawText.includes('POWER')) {
        cleanName = 'Toro Power TR180';
        categoria = 'Automáticas';
      } else if (rawText.includes('TANK')) {
        cleanName = 'Toro Tank TR180';
        categoria = 'Automáticas';
      } else if (rawText.includes('FOX')) {
        cleanName = 'Toro Fox TR180';
        categoria = 'Automáticas';
      }
      
      if (cleanName && !results.some(r => r.nombre === cleanName)) {
        const specs = toroSpecs[cleanName] || {};
        const image = toroImageUrls[cleanName] || '';
        const precio = toroPriceOverrides[cleanName] || 0.0;
        
        results.push({
          marca: 'Toro',
          nombre: cleanName,
          precio,
          imagen: image,
          imagenes: image ? [image] : [],
          categoria,
          enlace: hrefClean,
          
          motor: specs.motor || null,
          cilindrada: specs.cilindrada || null,
          potencia: specs.potencia || null,
          torque: specs.torque || null,
          enfriamiento: specs.enfriamiento || null,
          transmision: specs.transmision || null,
          embrague: specs.embrague || null,
          suspension_delantera: specs.suspension_delantera || null,
          suspension_trasera: specs.suspension_trasera || null,
          frenos_delanteros: specs.frenos_delanteros || null,
          frenos_traseros: specs.frenos_traseros || null,
          frenado: null,
          caucho_delantero: null,
          caucho_trasero: null,
          capacidad_combustible: specs.capacidad_combustible || null,
          colores: null,
          sistema_arranque: specs.sistema_arranque || null,
          encendido: null,
          peso: null,
          capacidad_carga: null,
          garantia: '24 meses / 24.000 km',
          velocidad_maxima: null,
          rendimiento_gasolina: null,
          inclinacion_barras: null,
          capacidad_ascenso: null,
          bateria: null,
          fusibles: null,
          aforo_aceite_motor: null,
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
        });
      }
    }
  });
  
  return results;
}

async function fetchAvaMotos() {
  console.log("--- Loading AVA Motocicletas static products ---");
  const rawList = [
    {
      nombre: 'AVA Jaguar',
      precio: 950.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/jaguar.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/jaguar',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '7.8 kW a 8500 rpm',
      torque: '8.3 Nm a 7500 rpm',
      capacidad_combustible: '11 l',
      rendimiento_gasolina: '2.2 l / 100km',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor'
    },
    {
      nombre: 'AVA León',
      precio: 1150.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/le%C3%B3n.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/le%C3%B3n',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '7.8 kW a 8500 rpm',
      torque: '8.3 Nm a 7500 rpm',
      capacidad_combustible: '13 l',
      rendimiento_gasolina: '2.4 l / 100km',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor'
    },
    {
      nombre: 'AVA Mule',
      precio: 1250.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/mule.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/mule',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '9.0 kW a 8500 rpm',
      torque: '9.6 Nm a 7500 rpm',
      capacidad_combustible: '11 l',
      rendimiento_gasolina: '2.1 l / 100km',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor'
    },
    {
      nombre: 'AVA Pantera',
      precio: 1150.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/pantera.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/pantera',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '7.8 kW a 8500 rpm',
      torque: '8.3 Nm a 7500 rpm',
      capacidad_combustible: '13 l',
      rendimiento_gasolina: '2.2 l / 100km',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor'
    },
    {
      nombre: 'AVA Pantera Speed',
      precio: 1250.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/pantera_speed.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/pantera_speed',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '7.8 kW a 8500 rpm',
      torque: '8.3 Nm a 7500 rpm',
      capacidad_combustible: '13 l',
      rendimiento_gasolina: '2.2 l / 100km',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor'
    },
    {
      nombre: 'AVA Leopard',
      precio: 1100.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/leopard.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/leopard',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '7.8 kW a 8500 rpm',
      torque: '8.3 Nm a 7500 rpm',
      capacidad_combustible: '11 l',
      rendimiento_gasolina: '2.2 l / 100km',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor'
    },
    {
      nombre: 'AVA Wolf',
      precio: 950.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/wolf.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/wolf',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '110 cc',
      potencia: '4.5 kW a 7500 rpm',
      torque: '6.2 Nm a 5000 rpm',
      capacidad_combustible: '7 l',
      rendimiento_gasolina: '1.1 l / 100km',
      frenos_delanteros: 'Tambor',
      frenos_traseros: 'Tambor'
    },
    {
      nombre: 'AVA Chita',
      precio: 1650.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/chita.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/chita',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '11.8 kW a 7500 rpm',
      capacidad_combustible: '11 l',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor',
      distancia_ejes: '1220 mm'
    },
    {
      nombre: 'AVA Puma',
      precio: 1350.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/puma.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/puma',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '7.8 kW a 7500 rpm',
      torque: '9.5 Nm a 6000 rpm',
      capacidad_combustible: '15.5 l',
      transmision: 'De cadena',
      sistema_arranque: 'Eléctrico / Pedal'
    },
    {
      nombre: 'AVA Avispón',
      precio: 1390.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/avispon.png',
      categoria: 'Automáticas',
      enlace: 'https://avamotosvzla.com/motos/moto/avispon',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '7.6 kW a 7500 rpm',
      torque: '8.2 Nm a 6500 rpm',
      capacidad_combustible: '6 l',
      rendimiento_gasolina: '2.2 l / 100km',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor'
    },
    {
      nombre: 'AVA Tucán',
      precio: 890.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/tucan.png',
      categoria: 'Automáticas',
      enlace: 'https://avamotosvzla.com/motos/moto/tucan',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '110 cc',
      potencia: '4.7 kW a 8000 rpm',
      torque: '6.1 Nm a 6000 rpm',
      capacidad_combustible: '5 l',
      rendimiento_gasolina: '2.1 l / 100km',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor'
    },
    {
      nombre: 'AVA Flash',
      precio: 1290.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/flash.png',
      categoria: 'Automáticas',
      enlace: 'https://avamotosvzla.com/motos/moto/flash',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '7.0 kW a 7500 rpm',
      torque: '8.0 Nm a 6000 rpm',
      capacidad_combustible: '6 l',
      transmision: 'De correa',
      sistema_arranque: 'Eléctrico / Pedal',
      velocidad_maxima: '80 km/h',
      relacion_compresion: '9.2:1',
      distancia_ejes: '1280 mm'
    },
    {
      nombre: 'AVA Tigre',
      precio: 1850.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/tigre.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/tigre',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '200 cc',
      potencia: '12 kW a 7000 rpm',
      torque: '17 Nm a 6000 rpm',
      capacidad_combustible: '12 l',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor',
      distancia_ejes: '1190 mm'
    },
    {
      nombre: 'AVA Mustang',
      precio: 1990.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/mustang.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/mustang',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '200 cc',
      potencia: '12 kW a 7000 rpm',
      torque: '17 Nm a 6000 rpm',
      capacidad_combustible: '12 l',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor',
      distancia_ejes: '1420 mm'
    },
    {
      nombre: 'AVA Mustang Adventure',
      precio: 2490.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/mustang-adventure.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/mustang-adventure',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '250 cc',
      transmision: '6 velocidades',
      relacion_compresion: '8.8:1',
      velocidad_maxima: '90 km/h'
    },
    {
      nombre: 'AVA Deer',
      precio: 1790.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/deer.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/deer',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '10.5 kW a 7000 rpm',
      torque: '15 Nm a 6000 rpm',
      capacidad_combustible: '12 l',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor',
      distancia_ejes: '1190 mm'
    },
    {
      nombre: 'AVA Tigrito',
      precio: 1550.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/tigrito.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/tigrito',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '11.8 kW a 7500 rpm',
      torque: '18 Nm a 8000 rpm',
      capacidad_combustible: '11 l',
      sistema_arranque: 'Eléctrico / Pedal',
      transmision: 'De cadena',
      velocidad_maxima: '110 km/h'
    },
    {
      nombre: 'AVA Tigrito Speed',
      precio: 1650.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/tigritospeed.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/tigritospeed',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '11.8 kW a 7500 rpm',
      torque: '18 Nm a 8000 rpm',
      capacidad_combustible: '11 l',
      sistema_arranque: 'Eléctrico / Pedal',
      transmision: 'De cadena'
    },
    {
      nombre: 'AVA Deer 2',
      precio: 1850.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/deer2.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/deer2',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '7.6 kW a 7500 rpm',
      torque: '10.5 Nm a 7000 rpm',
      capacidad_combustible: '12 l',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Tambor',
      distancia_ejes: '1190 mm'
    },
    {
      nombre: 'AVA Búfalo',
      precio: 2190.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/bufalo.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/bufalo',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '200 cc',
      potencia: '11.8 kW a 7500 rpm',
      torque: '18 Nm a 8000 rpm',
      capacidad_combustible: '6 l',
      frenos_delanteros: 'Disco',
      frenos_traseros: 'Disco',
      transmision: 'Manual 4 Velocidades con Reversa (4-3-2-1-N-R)'
    },
    {
      nombre: 'AVA Rhino',
      precio: 2590.00,
      imagen: 'https://avamoto-storage.nyc3.digitaloceanspaces.com/AvamotosImagenes/motos/rhino.png',
      categoria: 'Sincrónicas',
      enlace: 'https://avamotosvzla.com/motos/moto/rhino',
      motor: '4 tiempos, monocilíndrico',
      cilindrada: '150 cc',
      potencia: '11.8 kW a 7500 rpm',
      torque: '18 Nm a 8000 rpm',
      capacidad_combustible: '14 l',
      frenos_delanteros: 'Banda',
      frenos_traseros: 'Banda',
      capacidad_carga: '270 kg'
    }
  ];

  return rawList.map(item => ({
    marca: 'Ava',
    nombre: item.nombre,
    precio: item.precio,
    imagen: item.imagen,
    imagenes: item.imagen ? [item.imagen] : [],
    categoria: item.categoria,
    enlace: item.enlace,
    
    motor: item.motor || null,
    cilindrada: item.cilindrada || null,
    potencia: item.potencia || null,
    torque: item.torque || null,
    enfriamiento: item.enfriamiento || 'Aire',
    transmision: item.transmision || null,
    embrague: item.embrague || null,
    suspension_delantera: item.suspension_delantera || null,
    suspension_trasera: item.suspension_trasera || null,
    frenos_delanteros: item.frenos_delanteros || null,
    frenos_traseros: item.frenos_traseros || null,
    frenado: null,
    caucho_delantero: null,
    caucho_trasero: null,
    capacidad_combustible: item.capacidad_combustible || null,
    colores: null,
    sistema_arranque: item.sistema_arranque || null,
    encendido: null,
    peso: null,
    capacidad_carga: item.capacidad_carga || null,
    garantia: '24 meses / 24.000 km',
    velocidad_maxima: item.velocidad_maxima || null,
    rendimiento_gasolina: item.rendimiento_gasolina || null,
    inclinacion_barras: null,
    capacidad_ascenso: null,
    bateria: null,
    fusibles: null,
    aforo_aceite_motor: null,
    bujias: null,
    faro: null,
    luz_freno: null,
    luces_cruce: null,
    longitud_total: null,
    ancho_total: null,
    altura_total: null,
    distancia_ejes: item.distancia_ejes || null,
    dimension_caja: null,
    unidad_final: null,
    diametro_carrera: null,
    relacion_compresion: item.relacion_compresion || null,
    sistema_combustible: null
  }));
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

    // 2b. Fetch data from TVS
    let tvsMotos = [];
    try {
      tvsMotos = await fetchTvsMotos();
    } catch (e) {
      console.error("❌ Error al obtener TVS, se omitirá sincronización de TVS:", e.message);
    }

    // 2c. Fetch data from Toro
    let toroMotos = [];
    try {
      toroMotos = await fetchToroMotos();
    } catch (e) {
      console.error("❌ Error al obtener Toro, se omitirá sincronización de Toro:", e.message);
    }

    // 2d. Fetch data from AVA
    let avaMotos = [];
    try {
      avaMotos = await fetchAvaMotos();
    } catch (e) {
      console.error("❌ Error al obtener AVA, se omitirá sincronización de AVA:", e.message);
    }
    
    const allMotos = [...beraMotos, ...empireMotos, ...tvsMotos, ...toroMotos, ...avaMotos];
    
    if (allMotos.length === 0) {
      console.log("⚠️ No se obtuvieron productos para guardar. Abortando.");
      return;
    }
    
    // 3. Upsert products
    console.log("--- Guardando productos en la base de datos ---");
    const query = `
      INSERT INTO public.motos (
          marca, nombre, precio, imagen, imagenes, categoria, enlace, active, updated_at,
          precio_min, precio_max, precio_fuente,
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
          $3, $3, 'api',
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
          precio = CASE WHEN public.motos.precio_fuente = 'agente_ia' THEN public.motos.precio ELSE EXCLUDED.precio END,
          precio_min = COALESCE(public.motos.precio_min, EXCLUDED.precio),
          precio_max = COALESCE(public.motos.precio_max, EXCLUDED.precio),
          precio_fuente = COALESCE(public.motos.precio_fuente, EXCLUDED.precio_fuente),
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

    if (tvsMotos.length > 0) {
      console.log("--- Desactivando productos descontinuados de TVS ---");
      const deactivateTvsQuery = `
        UPDATE public.motos
        SET active = FALSE
        WHERE marca = 'TVS' AND updated_at < $1;
      `;
      const res = await client.query(deactivateTvsQuery, [startTime]);
      console.log(`Desactivados ${res.rowCount} productos de TVS.`);
    }

    if (toroMotos.length > 0) {
      console.log("--- Desactivando productos descontinuados de Toro ---");
      const deactivateToroQuery = `
        UPDATE public.motos
        SET active = FALSE
        WHERE marca = 'Toro' AND updated_at < $1;
      `;
      const res = await client.query(deactivateToroQuery, [startTime]);
      console.log(`Desactivados ${res.rowCount} productos de Toro.`);
    }

    if (avaMotos.length > 0) {
      console.log("--- Desactivando productos descontinuados de Ava ---");
      const deactivateAvaQuery = `
        UPDATE public.motos
        SET active = FALSE
        WHERE marca = 'Ava' AND updated_at < $1;
      `;
      const res = await client.query(deactivateAvaQuery, [startTime]);
      console.log(`Desactivados ${res.rowCount} productos de Ava.`);
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
