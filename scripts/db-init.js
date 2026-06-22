// scripts/db-init.js
require('dotenv').config();
const { getDbPool } = require('../api/_db.js');

async function init() {
  console.log("--- Conectando a Supabase ---");
  const pool = getDbPool();
  let client;
  try {
    client = await pool.connect();
    console.log("--- Conexión establecida ---");
    
    console.log("--- Eliminando tabla 'motos' si existe ---");
    await client.query("DROP TABLE IF EXISTS public.motos;");
    
    const query = `
      CREATE TABLE public.motos (
          id SERIAL PRIMARY KEY,
          marca VARCHAR(50) NOT NULL,
          nombre VARCHAR(255) NOT NULL,
          precio NUMERIC(10, 2) NOT NULL,
          imagen TEXT,
          imagenes TEXT[], -- Array de URLs de imágenes
          categoria VARCHAR(100),
          enlace TEXT,
          active BOOLEAN DEFAULT TRUE,
          
          -- Especificaciones técnicas (Homogéneas para Bera y Empire)
          motor TEXT,
          cilindrada TEXT,
          potencia TEXT,
          torque TEXT,
          enfriamiento TEXT,
          transmision TEXT,
          embrague TEXT,
          suspension_delantera TEXT,
          suspension_trasera TEXT,
          frenos_delanteros TEXT,
          frenos_traseros TEXT,
          frenado TEXT, -- Nuevo (Bera)
          caucho_delantero TEXT,
          caucho_trasero TEXT,
          capacidad_combustible TEXT,
          colores TEXT,
          sistema_arranque TEXT,
          encendido TEXT,
          peso TEXT,
          capacidad_carga TEXT,
          garantia TEXT,
          velocidad_maxima TEXT,
          rendimiento_gasolina TEXT,
          
          -- Nuevos campos de especificaciones Bera
          inclinacion_barras TEXT,
          capacidad_ascenso TEXT,
          bateria TEXT,
          fusibles TEXT,
          aforo_aceite_motor TEXT,
          
          -- Nuevos campos de especificaciones Empire
          bujias TEXT,
          faro TEXT,
          luz_freno TEXT,
          luces_cruce TEXT,
          longitud_total TEXT,
          ancho_total TEXT,
          altura_total TEXT,
          distancia_ejes TEXT,
          dimension_caja TEXT,
          unidad_final TEXT,
          diametro_carrera TEXT,
          relacion_compresion TEXT,
          sistema_combustible TEXT,
          
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          CONSTRAINT unique_marca_nombre UNIQUE (marca, nombre)
      );
    `;
    
    console.log("--- Creando tabla 'motos' con especificaciones homogéneas expandidas ---");
    await client.query(query);
    console.log("--- Tabla 'motos' creada exitosamente ---");
  } catch (error) {
    console.error("❌ Error durante la migración de base de datos:", error.message);
  } finally {
    if (client) client.release();
    await pool.end();
    console.log("--- Conexión de base de datos cerrada ---");
  }
}

init();
