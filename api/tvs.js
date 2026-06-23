// api/tvs.js
const { getDbPool } = require('./_db.js');

module.exports = async function handler(req, res) {
  console.log("--- API TVS (DB): Consultando base de datos con especificaciones ---");
  const pool = getDbPool();
  let client;
  try {
    client = await pool.connect();
    
    const result = await client.query(
      `SELECT 
        nombre, precio, imagen, imagenes, categoria, enlace,
        motor, cilindrada, potencia, torque, enfriamiento, transmision, embrague,
        suspension_delantera, suspension_trasera, frenos_delanteros, frenos_traseros, frenado,
        caucho_delantero, caucho_trasero, capacidad_combustible, colores, sistema_arranque, encendido,
        peso, capacidad_carga, garantia, velocidad_maxima, rendimiento_gasolina,
        inclinacion_barras, capacidad_ascenso, bateria, fusibles, aforo_aceite_motor,
        bujias, faro, luz_freno, luces_cruce, longitud_total, ancho_total, altura_total,
        distancia_ejes, dimension_caja, unidad_final, diametro_carrera, relacion_compresion, sistema_combustible
       FROM public.motos 
       WHERE marca = 'TVS' AND active = true 
       ORDER BY nombre ASC`
    );
    
    // Mapeamos al formato compatible
    const products = result.rows.map(row => ({
      // Compatibility fields
      name: row.nombre,
      categories: [{ name: row.categoria || 'Otros' }],
      prices: { price: parseFloat(row.precio) },
      images: row.imagen ? [{ src: row.imagen }] : [],
      permalink: row.enlace || '',

      // Direct fields
      nombre: row.nombre,
      precio: parseFloat(row.precio),
      imagen: row.imagen || '',
      imagenes: row.imagenes || [],
      enlace: row.enlace || '',
      categoria: row.categoria || 'Otros',
      
      // Especificaciones detalladas
      motor: row.motor || null,
      cilindrada: row.cilindrada || null,
      potencia: row.potencia || null,
      torque: row.torque || null,
      enfriamiento: row.enfriamiento || null,
      transmision: row.transmision || null,
      embrague: row.embrague || null,
      suspension_delantera: row.suspension_delantera || null,
      suspension_trasera: row.suspension_trasera || null,
      frenos_delanteros: row.frenos_delanteros || null,
      frenos_traseros: row.frenos_traseros || null,
      frenado: row.frenado || null,
      caucho_delantero: row.caucho_delantero || null,
      caucho_trasero: row.caucho_trasero || null,
      capacidad_combustible: row.capacidad_combustible || null,
      colores: row.colores || null,
      sistema_arranque: row.sistema_arranque || null,
      encendido: row.encendido || null,
      peso: row.peso || null,
      capacidad_carga: row.capacidad_carga || null,
      garantia: row.garantia || null,
      velocidad_maxima: row.velocidad_maxima || null,
      rendimiento_gasolina: row.rendimiento_gasolina || null,
      
      // Nuevas especificaciones Bera (vienen vacías para TVS)
      inclinacion_barras: row.inclinacion_barras || null,
      capacidad_ascenso: row.capacidad_ascenso || null,
      bateria: row.bateria || null,
      fusibles: row.fusibles || null,
      aforo_aceite_motor: row.aforo_aceite_motor || null,
      
      // Nuevas especificaciones Empire / TVS
      bujias: row.bujias || null,
      faro: row.faro || null,
      luz_freno: row.luz_freno || null,
      luces_cruce: row.luces_cruce || null,
      longitud_total: row.longitud_total || null,
      ancho_total: row.ancho_total || null,
      altura_total: row.altura_total || null,
      distancia_ejes: row.distancia_ejes || null,
      dimension_caja: row.dimension_caja || null,
      unidad_final: row.unidad_final || null,
      diametro_carrera: row.diametro_carrera || null,
      relacion_compresion: row.relacion_compresion || null,
      sistema_combustible: row.sistema_combustible || null
    }));
    
    console.log(`--- API TVS (DB): Enviando ${products.length} productos con detalles homogéneos ---`);
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error en API TVS (DB):", error.message);
    return res.status(500).json({ error: "Error al obtener TVS" });
  } finally {
    if (client) client.release();
  }
};
