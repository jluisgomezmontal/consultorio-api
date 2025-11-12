import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🌱 Starting seed...');

  // Create consultorios
  const consultorio1 = await prisma.consultorio.create({
    data: {
      name: 'Consultorio Médico San José',
      address: 'Av. Principal 123, Ciudad',
      phone: '+52 555 1234567',
      description: 'Consultorio médico general',
      openHour: '08:00',
      closeHour: '18:00',
    },
  });

  const consultorio2 = await prisma.consultorio.create({
    data: {
      name: 'Clínica Familiar Guadalupe',
      address: 'Calle Reforma 456, Colonia Centro',
      phone: '+52 555 7654321',
      description: 'Atención médica familiar',
      openHour: '09:00',
      closeHour: '20:00',
    },
  });

  const consultorio3 = await prisma.consultorio.create({
    data: {
      name: 'Centro Médico Los Arcos',
      address: 'Av. Insurgentes Sur 1500, Ciudad',
      phone: '+52 555 9876543',
      description: 'Especialidades médicas y diagnósticos',
      openHour: '07:00',
      closeHour: '21:00',
    },
  });

  const consultorio4 = await prisma.consultorio.create({
    data: {
      name: 'MediCare Especialistas',
      address: 'Blvd. Valle Dorado 200, Zona Norte',
      phone: '+52 555 2468101',
      description: 'Consultas de especialistas y terapias',
      openHour: '10:00',
      closeHour: '19:00',
    },
  });

  console.log('✅ Consultorios created');

  // Create admin user in Supabase Auth
  const adminEmail = 'admin@consultorio.com';
  const adminPassword = 'Admin123!';

  let doctorPrincipal;
  let doctorGuadalupe;
  let doctorLosArcos;
  let doctorMediCare;

  const { data: adminAuthData, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (adminAuthError) {
    console.error('Error creating admin auth user:', adminAuthError);
  } else {
    // Create admin user in database
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Administrador Principal',
        role: 'admin',
        consultorioId: consultorio1.id,
      },
    });
    console.log('✅ Admin user created:', adminEmail, '/', adminPassword);
  }

  // Create doctor user
  const doctorEmail = 'doctor@consultorio.com';
  const doctorPassword = 'Doctor123!';

  const { data: doctorAuthData, error: doctorAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: doctorEmail,
    password: doctorPassword,
    email_confirm: true,
  });

  if (doctorAuthError) {
    console.error('Error creating doctor auth user:', doctorAuthError);
  } else {
    doctorPrincipal = await prisma.user.create({
      data: {
        email: doctorEmail,
        name: 'Dr. Juan Pérez',
        role: 'doctor',
        consultorioId: consultorio1.id,
      },
    });
    console.log('✅ Doctor user created:', doctorEmail, '/', doctorPassword);
  }

  // Create receptionist user
  const recepEmail = 'recepcion@consultorio.com';
  const recepPassword = 'Recep123!';

  const { data: recepAuthData, error: recepAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: recepEmail,
    password: recepPassword,
    email_confirm: true,
  });

  if (recepAuthError) {
    console.error('Error creating receptionist auth user:', recepAuthError);
  } else {
    const recep = await prisma.user.create({
      data: {
        email: recepEmail,
        name: 'María García',
        role: 'recepcionista',
        consultorioId: consultorio1.id,
      },
    });
    console.log('✅ Receptionist user created:', recepEmail, '/', recepPassword);
  }

  // Additional doctors for other consultorios
  const doctorGuadalupeEmail = 'doctora.guadalupe@consultorio.com';
  const doctorGuadalupePassword = 'Doctor456!';

  const { error: doctorGuadalupeAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: doctorGuadalupeEmail,
    password: doctorGuadalupePassword,
    email_confirm: true,
  });

  if (doctorGuadalupeAuthError) {
    console.error('Error creating Guadalupe doctor auth user:', doctorGuadalupeAuthError);
  } else {
    doctorGuadalupe = await prisma.user.create({
      data: {
        email: doctorGuadalupeEmail,
        name: 'Dra. Fernanda López',
        role: 'doctor',
        consultorioId: consultorio2.id,
      },
    });
    console.log('✅ Doctor user created:', doctorGuadalupeEmail, '/', doctorGuadalupePassword);
  }

  const doctorLosArcosEmail = 'doctor.losarcos@consultorio.com';
  const doctorLosArcosPassword = 'Doctor789!';

  const { error: doctorLosArcosAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: doctorLosArcosEmail,
    password: doctorLosArcosPassword,
    email_confirm: true,
  });

  if (doctorLosArcosAuthError) {
    console.error('Error creating Los Arcos doctor auth user:', doctorLosArcosAuthError);
  } else {
    doctorLosArcos = await prisma.user.create({
      data: {
        email: doctorLosArcosEmail,
        name: 'Dr. Alejandro Ruiz',
        role: 'doctor',
        consultorioId: consultorio3.id,
      },
    });
    console.log('✅ Doctor user created:', doctorLosArcosEmail, '/', doctorLosArcosPassword);
  }

  const doctorMediCareEmail = 'doctor.medicare@consultorio.com';
  const doctorMediCarePassword = 'Doctor321!';

  const { error: doctorMediCareAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: doctorMediCareEmail,
    password: doctorMediCarePassword,
    email_confirm: true,
  });

  if (doctorMediCareAuthError) {
    console.error('Error creating MediCare doctor auth user:', doctorMediCareAuthError);
  } else {
    doctorMediCare = await prisma.user.create({
      data: {
        email: doctorMediCareEmail,
        name: 'Dra. Valeria Martínez',
        role: 'doctor',
        consultorioId: consultorio4.id,
      },
    });
    console.log('✅ Doctor user created:', doctorMediCareEmail, '/', doctorMediCarePassword);
  }

  // Ensure doctor records exist even if auth creation failed (e.g., already seeded)
  doctorPrincipal =
    doctorPrincipal ||
    (await prisma.user.findUnique({ where: { email: doctorEmail } }));
  doctorGuadalupe =
    doctorGuadalupe ||
    (await prisma.user.findUnique({ where: { email: doctorGuadalupeEmail } }));
  doctorLosArcos =
    doctorLosArcos ||
    (await prisma.user.findUnique({ where: { email: doctorLosArcosEmail } }));
  doctorMediCare =
    doctorMediCare ||
    (await prisma.user.findUnique({ where: { email: doctorMediCareEmail } }));

  if (!doctorPrincipal) {
    console.warn('⚠️  Doctor principal not found, skipping appointments creation');
    return;
  }
  if (!doctorGuadalupe) {
    console.warn('⚠️  Doctor Guadalupe not found, using principal doctor as fallback');
    doctorGuadalupe = doctorPrincipal;
  }
  if (!doctorLosArcos) {
    console.warn('⚠️  Doctor Los Arcos not found, using principal doctor as fallback');
    doctorLosArcos = doctorPrincipal;
  }
  if (!doctorMediCare) {
    console.warn('⚠️  Doctor MediCare not found, using principal doctor as fallback');
    doctorMediCare = doctorPrincipal;
  }

  // Create sample patients
  const pacientesData = [
    {
      fullName: 'Carlos Rodríguez López',
      age: 35,
      gender: 'masculino',
      phone: '+52 555 1112233',
      email: 'carlos.rodriguez@example.com',
      address: 'Calle Luna 789',
      medicalHistory: 'Hipertensión controlada',
      allergies: 'Penicilina',
      notes: 'Paciente regular',
    },
    {
      fullName: 'Ana María Martínez',
      age: 28,
      gender: 'femenino',
      phone: '+52 555 4445566',
      email: 'ana.martinez@example.com',
      address: 'Av. Sol 321',
      medicalHistory: 'Sin antecedentes relevantes',
      allergies: 'Ninguna',
    },
    {
      fullName: 'Roberto Sánchez',
      age: 45,
      gender: 'masculino',
      phone: '+52 555 7778899',
      email: 'roberto.sanchez@example.com',
      address: 'Calle Estrella 654',
      medicalHistory: 'Diabetes tipo 2',
      allergies: 'Ninguna conocida',
    },
    {
      fullName: 'Laura Hernández Torres',
      age: 32,
      gender: 'femenino',
      phone: '+52 555 9988776',
      email: 'laura.hernandez@example.com',
      address: 'Calle Jardín 102',
      medicalHistory: 'Asma leve',
      allergies: 'Polen',
      notes: 'Usa inhalador según necesidad',
    },
    {
      fullName: 'Miguel Ángel Prieto',
      age: 52,
      gender: 'masculino',
      phone: '+52 555 1239874',
      email: 'miguel.prieto@example.com',
      address: 'Av. Bosque 890',
      medicalHistory: 'Dolor lumbar crónico',
      allergies: 'Ibuprofeno',
    },
    {
      fullName: 'Sofía Delgado Ruiz',
      age: 41,
      gender: 'femenino',
      phone: '+52 555 3692580',
      email: 'sofia.delgado@example.com',
      address: 'Calle Río Verde 45',
      medicalHistory: 'Arritmia leve',
      allergies: 'Ninguna',
    },
    {
      fullName: 'Eduardo Gómez Ponce',
      age: 29,
      gender: 'masculino',
      phone: '+52 555 7412589',
      email: 'eduardo.gomez@example.com',
      address: 'Calle Horizonte 223',
      medicalHistory: 'Próximo a cirugía de rodilla',
      allergies: 'Latex',
    },
    {
      fullName: 'Lucía Fernández Alba',
      age: 37,
      gender: 'femenino',
      phone: '+52 555 8529637',
      email: 'lucia.fernandez@example.com',
      address: 'Av. Central 765',
      medicalHistory: 'Lesión de hombro en rehabilitación',
      allergies: 'Ninguna',
    },
    {
      fullName: 'Javier Morales Nieto',
      age: 48,
      gender: 'masculino',
      phone: '+52 555 1472583',
      email: 'javier.morales@example.com',
      address: 'Calle del Lago 12',
      medicalHistory: 'Cirugía reciente de cadera',
      allergies: 'Aspirina',
      notes: 'Requiere sesiones de rehabilitación',
    },
  ];

  // Create or find existing patients
  const pacientes = await Promise.all(
    pacientesData.map(async (data) => {
      const existing = await prisma.paciente.findUnique({ where: { email: data.email } });
      if (existing) {
        console.log(`ℹ️  Patient ${data.fullName} already exists, skipping`);
        return existing;
      }
      return prisma.paciente.create({ data });
    })
  );

  const [
    pacienteCarlos,
    pacienteAna,
    pacienteRoberto,
    pacienteLaura,
    pacienteMiguel,
    pacienteSofia,
    pacienteEduardo,
    pacienteLucia,
    pacienteJavier,
  ] = pacientes;

  console.log('✅ Patients created');

  // Create sample appointments
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  const addDays = (days) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + days);
    return date;
  };

  const citasData = [
    {
      pacienteId: pacienteCarlos.id,
      doctorId: doctorPrincipal.id,
      consultorioId: consultorio1.id,
      date: addDays(0),
      time: '09:00',
      motivo: 'Consulta general',
      estado: 'confirmada',
      costo: 500,
      notas: 'Paciente acudió puntual.',
    },
    {
      pacienteId: pacienteAna.id,
      doctorId: doctorPrincipal.id,
      consultorioId: consultorio1.id,
      date: addDays(1),
      time: '11:30',
      motivo: 'Chequeo preventivo',
      estado: 'pendiente',
      costo: 480,
    },
    {
      pacienteId: pacienteRoberto.id,
      doctorId: doctorPrincipal.id,
      consultorioId: consultorio1.id,
      date: addDays(-2),
      time: '16:00',
      motivo: 'Control de diabetes',
      diagnostico: 'Diabetes tipo 2 controlada',
      tratamiento: 'Continuar con medicación actual',
      estado: 'completada',
      costo: 600,
      notas: 'Paciente estable',
    },
    {
      pacienteId: pacienteLaura.id,
      doctorId: doctorGuadalupe.id,
      consultorioId: consultorio2.id,
      date: addDays(2),
      time: '10:15',
      motivo: 'Revisión pediátrica',
      estado: 'confirmada',
      costo: 350,
    },
    {
      pacienteId: pacienteMiguel.id,
      doctorId: doctorGuadalupe.id,
      consultorioId: consultorio2.id,
      date: addDays(3),
      time: '13:45',
      motivo: 'Dolor de espalda crónico',
      estado: 'pendiente',
      costo: 520,
      notas: 'Requiere estudios de imagen.',
    },
    {
      pacienteId: pacienteSofia.id,
      doctorId: doctorLosArcos.id,
      consultorioId: consultorio3.id,
      date: addDays(-1),
      time: '12:00',
      motivo: 'Estudio cardiológico',
      estado: 'completada',
      diagnostico: 'Arritmia leve controlada',
      tratamiento: 'Seguir medicación beta-bloqueadora',
      costo: 850,
    },
    {
      pacienteId: pacienteEduardo.id,
      doctorId: doctorLosArcos.id,
      consultorioId: consultorio3.id,
      date: addDays(4),
      time: '09:30',
      motivo: 'Revisión preoperatoria',
      estado: 'cancelada',
      costo: 0,
      notas: 'Paciente canceló por motivos personales.',
    },
    {
      pacienteId: pacienteLucia.id,
      doctorId: doctorMediCare.id,
      consultorioId: consultorio4.id,
      date: addDays(1),
      time: '17:00',
      motivo: 'Sesión de fisioterapia',
      estado: 'confirmada',
      costo: 400,
    },
    {
      pacienteId: pacienteJavier.id,
      doctorId: doctorMediCare.id,
      consultorioId: consultorio4.id,
      date: addDays(-3),
      time: '15:30',
      motivo: 'Seguimiento postoperatorio',
      estado: 'completada',
      diagnostico: 'Recuperación favorable',
      tratamiento: 'Continuar terapia física 2 veces por semana',
      costo: 750,
    },
  ];

  // Create appointments, skip if already exist for same patient/doctor/date/time
  const citas = [];
  for (const data of citasData) {
    const existing = await prisma.cita.findFirst({
      where: {
        pacienteId: data.pacienteId,
        doctorId: data.doctorId,
        date: data.date,
        time: data.time,
      },
    });
    if (existing) {
      console.log(`ℹ️  Appointment for patient at ${data.date.toISOString().split('T')[0]} ${data.time} already exists, skipping`);
      citas.push(existing);
    } else {
      const cita = await prisma.cita.create({ data });
      citas.push(cita);
    }
  }

  console.log('✅ Appointments created');

  // Create sample payments
  const pagosData = [
    {
      citaId: citas[0].id,
      monto: 500,
      metodo: 'efectivo',
      estatus: 'pagado',
    },
    {
      citaId: citas[2].id,
      monto: 600,
      metodo: 'tarjeta',
      estatus: 'pagado',
    },
    {
      citaId: citas[3].id,
      monto: 350,
      metodo: 'transferencia',
      estatus: 'pagado',
    },
    {
      citaId: citas[5].id,
      monto: 850,
      metodo: 'tarjeta',
      estatus: 'pagado',
    },
    {
      citaId: citas[7].id,
      monto: 400,
      metodo: 'efectivo',
      estatus: 'pendiente',
    },
    {
      citaId: citas[8].id,
      monto: 750,
      metodo: 'transferencia',
      estatus: 'pagado',
    },
  ];

  // Create payments, skip if already exist for same cita
  for (const pagoData of pagosData) {
    const existing = await prisma.pago.findFirst({
      where: { citaId: pagoData.citaId },
    });
    if (existing) {
      console.log(`ℹ️  Payment for cita ${pagoData.citaId} already exists, skipping`);
    } else {
      await prisma.pago.create({ data: pagoData });
    }
  }

  console.log('✅ Payments created');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📝 Test credentials:');
  console.log('   Admin:        admin@consultorio.com / Admin123!');
  console.log('   Doctor:       doctor@consultorio.com / Doctor123!');
  console.log('   Receptionist: recepcion@consultorio.com / Recep123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
