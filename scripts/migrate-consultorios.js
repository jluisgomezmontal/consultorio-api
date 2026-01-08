import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Consultorio from '../src/models/Consultorio.model.js';

dotenv.config();

async function migrateConsultorios() {
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

    // Buscar consultorios sin campo paquete
    const consultoriosSinPaquete = await Consultorio.find({
      $or: [
        { paquete: { $exists: false } },
        { suscripcion: { $exists: false } }
      ]
    });

    console.log(`📊 Encontrados ${consultoriosSinPaquete.length} consultorios para migrar`);

    if (consultoriosSinPaquete.length === 0) {
      console.log('✅ Todos los consultorios ya tienen paquete asignado');
      return;
    }

    // Calcular fecha de vencimiento (30 días de trial)
    const fechaInicio = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    // Actualizar consultorios
    const result = await Consultorio.updateMany(
      {
        $or: [
          { paquete: { $exists: false } },
          { suscripcion: { $exists: false } }
        ]
      },
      {
        $set: {
          paquete: 'basico',
          suscripcion: {
            estado: 'trial',
            fechaInicio: fechaInicio,
            fechaVencimiento: fechaVencimiento,
            tipoPago: 'mensual'
          }
        }
      }
    );

    console.log(`✅ ${result.modifiedCount} consultorios migrados exitosamente`);
    console.log(`   - Paquete asignado: Básico`);
    console.log(`   - Estado: Trial (30 días)`);
    console.log(`   - Fecha de vencimiento: ${fechaVencimiento.toLocaleDateString()}`);

    // Mostrar resumen de consultorios migrados
    console.log('\n📋 Consultorios migrados:');
    const consultoriosMigrados = await Consultorio.find({
      paquete: 'basico',
      'suscripcion.estado': 'trial'
    }).select('name paquete suscripcion');

    consultoriosMigrados.forEach((consultorio, index) => {
      console.log(`   ${index + 1}. ${consultorio.name}`);
      console.log(`      - Paquete: ${consultorio.paquete}`);
      console.log(`      - Estado: ${consultorio.suscripcion.estado}`);
      console.log(`      - Vence: ${new Date(consultorio.suscripcion.fechaVencimiento).toLocaleDateString()}`);
    });

    console.log('\n🎉 Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar
migrateConsultorios();
