import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Paquete from '../src/models/Paquete.model.js';

dotenv.config();

const paquetesDefault = [
  {
    nombre: 'basico',
    displayName: 'Básico',
    descripcion: 'Plan inicial para consultorios pequeños',
    precio: {
      mensual: 299,
      anual: 2990,
    },
    limites: {
      consultorios: 1,
      doctores: 1,
      recepcionistas: 1,
      pacientes: null,
      citas: null,
    },
    features: {
      uploadDocumentos: false,
      uploadImagenes: false,
      reportesAvanzados: false,
      integraciones: false,
      soportePrioritario: false,
    },
    activo: true,
    orden: 1,
  },
  {
    nombre: 'profesional',
    displayName: 'Profesional',
    descripcion: 'Plan completo para profesionales independientes',
    precio: {
      mensual: 599,
      anual: 5990,
    },
    limites: {
      consultorios: 1,
      doctores: 1,
      recepcionistas: 1,
      pacientes: null,
      citas: null,
    },
    features: {
      uploadDocumentos: true,
      uploadImagenes: true,
      reportesAvanzados: true,
      integraciones: false,
      soportePrioritario: false,
    },
    activo: true,
    orden: 2,
  },
  {
    nombre: 'clinica',
    displayName: 'Clínica',
    descripcion: 'Plan avanzado para clínicas y equipos médicos',
    precio: {
      mensual: 1199,
      anual: 11990,
    },
    limites: {
      consultorios: 1,
      doctores: 2,
      recepcionistas: 2,
      pacientes: null,
      citas: null,
    },
    features: {
      uploadDocumentos: true,
      uploadImagenes: true,
      reportesAvanzados: true,
      integraciones: true,
      soportePrioritario: true,
    },
    activo: true,
    orden: 3,
  },
];

async function initPaquetes() {
  try {
    // Usar MONGO_URI o MONGODB_URI (compatibilidad)
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: Variable de entorno MONGO_URI o MONGODB_URI no encontrada');
      console.error('');
      console.error('Por favor, asegúrate de tener un archivo .env con:');
      console.error('MONGO_URI=mongodb://localhost:27017/tu-base-de-datos');
      console.error('o');
      console.error('MONGODB_URI=mongodb://localhost:27017/tu-base-de-datos');
      process.exit(1);
    }

    console.log('🔌 Conectando a MongoDB...');
    console.log(`   URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existen paquetes
    const existingCount = await Paquete.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} paquetes en la base de datos`);
      console.log('¿Deseas continuar? Esto eliminará los paquetes existentes y creará nuevos.');
      
      // En producción, podrías querer hacer un update en lugar de delete
      console.log('🗑️  Eliminando paquetes existentes...');
      await Paquete.deleteMany({});
      console.log('✅ Paquetes existentes eliminados');
    }

    console.log('📦 Creando paquetes por defecto...');
    const result = await Paquete.insertMany(paquetesDefault);
    
    console.log(`✅ ${result.length} paquetes creados exitosamente:`);
    result.forEach(paquete => {
      console.log(`   - ${paquete.displayName} (${paquete.nombre})`);
    });

    console.log('\n🎉 Inicialización completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar
initPaquetes();
