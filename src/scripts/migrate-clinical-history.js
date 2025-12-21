import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Consultorio, Paciente } from '../models/index.js';

dotenv.config();

const DEFAULT_CONFIG = {
  antecedentesHeredofamiliares: true,
  antecedentesPersonalesPatologicos: true,
  antecedentesPersonalesNoPatologicos: true,
  ginecoObstetricos: true,
};

async function migrateConsultorios() {
  console.log('🔄 Migrando configuración de consultorios...');
  
  const consultorios = await Consultorio.find({ clinicalHistoryConfig: { $exists: false } });
  
  if (consultorios.length === 0) {
    console.log('✅ Todos los consultorios ya tienen configuración');
    return;
  }

  let updated = 0;
  for (const consultorio of consultorios) {
    await Consultorio.findByIdAndUpdate(consultorio._id, {
      clinicalHistoryConfig: DEFAULT_CONFIG,
    });
    updated++;
  }

  console.log(`✅ ${updated} consultorios actualizados con configuración por defecto`);
}

async function migratePacientes() {
  console.log('🔄 Verificando pacientes...');
  
  const pacientes = await Paciente.find({ clinicalHistory: { $exists: false } });
  
  if (pacientes.length === 0) {
    console.log('✅ Todos los pacientes tienen campo clinicalHistory');
    return;
  }

  let updated = 0;
  for (const paciente of pacientes) {
    await Paciente.findByIdAndUpdate(paciente._id, {
      clinicalHistory: {},
    });
    updated++;
  }

  console.log(`✅ ${updated} pacientes actualizados con clinicalHistory vacío`);
}

async function runMigration() {
  try {
    console.log('🚀 Iniciando migración de Historia Clínica...\n');

    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    await migrateConsultorios();
    console.log('');
    await migratePacientes();

    console.log('\n✨ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

runMigration();
