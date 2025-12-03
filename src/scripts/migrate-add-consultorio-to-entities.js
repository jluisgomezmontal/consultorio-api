import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Paciente, Cita, Pago, Consultorio } from '../models/index.js';

dotenv.config();

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/consultorio';

async function migrateData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get default consultorio (first one) to use as fallback
    const defaultConsultorio = await Consultorio.findOne().lean();
    
    if (!defaultConsultorio) {
      console.error('❌ No consultorio found. Please create at least one consultorio first.');
      process.exit(1);
    }

    const defaultConsultorioId = defaultConsultorio._id;
    console.log(`📌 Default consultorio: ${defaultConsultorio.name} (${defaultConsultorioId})\n`);

    // ==========================================
    // MIGRATE PACIENTES
    // ==========================================
    console.log('👥 Migrating Pacientes...');
    const pacientesWithoutConsultorio = await Paciente.find({ 
      $or: [
        { consultorioId: { $exists: false } },
        { consultorioId: null }
      ]
    }).lean();

    console.log(`Found ${pacientesWithoutConsultorio.length} pacientes without consultorioId\n`);

    let pacientesMigrated = 0;
    let pacientesSkipped = 0;

    for (const paciente of pacientesWithoutConsultorio) {
      // Try to get consultorioId from the first cita
      const firstCita = await Cita.findOne({ pacienteId: paciente._id })
        .sort({ createdAt: 1 })
        .lean();

      const consultorioId = firstCita?.consultorioId || defaultConsultorioId;

      await Paciente.updateOne(
        { _id: paciente._id },
        { $set: { consultorioId } }
      );

      if (firstCita?.consultorioId) {
        console.log(`  ✓ Paciente "${paciente.fullName}" → consultorioId from first cita`);
      } else {
        console.log(`  ⚠ Paciente "${paciente.fullName}" → default consultorio (no citas found)`);
      }

      pacientesMigrated++;
    }

    console.log(`\n✅ Pacientes migrated: ${pacientesMigrated}`);
    console.log(`⏭️  Pacientes skipped: ${pacientesSkipped}\n`);

    // ==========================================
    // MIGRATE PAGOS
    // ==========================================
    console.log('💰 Migrating Pagos...');
    const pagosWithoutConsultorio = await Pago.find({ 
      $or: [
        { consultorioId: { $exists: false } },
        { consultorioId: null }
      ]
    }).lean();

    console.log(`Found ${pagosWithoutConsultorio.length} pagos without consultorioId\n`);

    let pagosMigrated = 0;
    let pagosSkipped = 0;

    for (const pago of pagosWithoutConsultorio) {
      // Get consultorioId from the cita
      const cita = await Cita.findById(pago.citaId).lean();

      if (!cita) {
        console.log(`  ⚠ Pago ${pago._id} → Cita not found, using default consultorio`);
        await Pago.updateOne(
          { _id: pago._id },
          { $set: { consultorioId: defaultConsultorioId } }
        );
        pagosMigrated++;
        continue;
      }

      await Pago.updateOne(
        { _id: pago._id },
        { $set: { consultorioId: cita.consultorioId } }
      );

      console.log(`  ✓ Pago ${pago._id} → consultorioId from cita`);
      pagosMigrated++;
    }

    console.log(`\n✅ Pagos migrated: ${pagosMigrated}`);
    console.log(`⏭️  Pagos skipped: ${pagosSkipped}\n`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Migration completed!');
    console.log(`  - Pacientes migrated: ${pacientesMigrated}`);
    console.log(`  - Pagos migrated: ${pagosMigrated}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
    console.log('✓ Migration script finished successfully');
  }
}

migrateData();
