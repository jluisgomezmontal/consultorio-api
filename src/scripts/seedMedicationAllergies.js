import mongoose from 'mongoose';
import MedicationAllergy from '../models/MedicationAllergy.model.js';
import dotenv from 'dotenv';

dotenv.config();

const commonMedications = [
  {
    name: 'Penicilina',
    category: 'Antibióticos',
    activeIngredient: 'Penicilina',
    commonBrands: ['Penilevel', 'Dicloxacilina', 'Amoxicilina'],
    description: 'Antibiótico betalactámico de amplio espectro',
  },
  {
    name: 'Amoxicilina',
    category: 'Antibióticos',
    activeIngredient: 'Amoxicilina',
    commonBrands: ['Amoxil', 'Amoxidal', 'Clamoxyl'],
    description: 'Antibiótico derivado de la penicilina',
  },
  {
    name: 'Cefalosporinas',
    category: 'Antibióticos',
    activeIngredient: 'Cefalosporina',
    commonBrands: ['Cefadroxilo', 'Cefalexina', 'Ceftriaxona'],
    description: 'Familia de antibióticos betalactámicos',
  },
  {
    name: 'Sulfonamidas',
    category: 'Antibióticos',
    activeIngredient: 'Sulfametoxazol',
    commonBrands: ['Bactrim', 'Septrin', 'Cotrimoxazol'],
    description: 'Antibióticos sintéticos',
  },
  {
    name: 'Aspirina',
    category: 'Analgésicos',
    activeIngredient: 'Ácido acetilsalicílico',
    commonBrands: ['Aspirina', 'Cafiaspirina', 'Mejoral'],
    description: 'Analgésico, antipirético y antiinflamatorio',
  },
  {
    name: 'Paracetamol',
    category: 'Analgésicos',
    activeIngredient: 'Paracetamol',
    commonBrands: ['Tylenol', 'Tempra', 'Panadol'],
    description: 'Analgésico y antipirético',
  },
  {
    name: 'Ibuprofeno',
    category: 'Antiinflamatorios',
    activeIngredient: 'Ibuprofeno',
    commonBrands: ['Advil', 'Motrin', 'Actron'],
    description: 'Antiinflamatorio no esteroideo (AINE)',
  },
  {
    name: 'Naproxeno',
    category: 'Antiinflamatorios',
    activeIngredient: 'Naproxeno',
    commonBrands: ['Flanax', 'Aleve', 'Naprosyn'],
    description: 'Antiinflamatorio no esteroideo (AINE)',
  },
  {
    name: 'Diclofenaco',
    category: 'Antiinflamatorios',
    activeIngredient: 'Diclofenaco',
    commonBrands: ['Voltaren', 'Cataflam', 'Dolotandax'],
    description: 'Antiinflamatorio no esteroideo (AINE)',
  },
  {
    name: 'Dipirona',
    category: 'Analgésicos',
    activeIngredient: 'Metamizol',
    commonBrands: ['Novalgin', 'Neo-Melubrina', 'Conmel'],
    description: 'Analgésico y antipirético',
  },
  {
    name: 'Lidocaína',
    category: 'Anestésicos',
    activeIngredient: 'Lidocaína',
    commonBrands: ['Xylocaína', 'Lignocaína'],
    description: 'Anestésico local',
  },
  {
    name: 'Benzocaína',
    category: 'Anestésicos',
    activeIngredient: 'Benzocaína',
    commonBrands: ['Orajel', 'Anbesol'],
    description: 'Anestésico local tópico',
  },
  {
    name: 'Procaína',
    category: 'Anestésicos',
    activeIngredient: 'Procaína',
    commonBrands: ['Novocaína'],
    description: 'Anestésico local',
  },
  {
    name: 'Loratadina',
    category: 'Antihistamínicos',
    activeIngredient: 'Loratadina',
    commonBrands: ['Clarityne', 'Alerfin', 'Loradine'],
    description: 'Antihistamínico de segunda generación',
  },
  {
    name: 'Cetirizina',
    category: 'Antihistamínicos',
    activeIngredient: 'Cetirizina',
    commonBrands: ['Zyrtec', 'Virlix', 'Alerlisin'],
    description: 'Antihistamínico de segunda generación',
  },
  {
    name: 'Difenhidramina',
    category: 'Antihistamínicos',
    activeIngredient: 'Difenhidramina',
    commonBrands: ['Benadryl', 'Dormidina'],
    description: 'Antihistamínico de primera generación',
  },
  {
    name: 'Fenitoína',
    category: 'Anticonvulsivantes',
    activeIngredient: 'Fenitoína',
    commonBrands: ['Epamin', 'Dilantin'],
    description: 'Anticonvulsivante',
  },
  {
    name: 'Carbamazepina',
    category: 'Anticonvulsivantes',
    activeIngredient: 'Carbamazepina',
    commonBrands: ['Tegretol', 'Carbamazepina'],
    description: 'Anticonvulsivante y estabilizador del ánimo',
  },
  {
    name: 'Enalapril',
    category: 'Cardiovasculares',
    activeIngredient: 'Enalapril',
    commonBrands: ['Renitec', 'Vasotec'],
    description: 'Inhibidor de la ECA para hipertensión',
  },
  {
    name: 'Losartán',
    category: 'Cardiovasculares',
    activeIngredient: 'Losartán',
    commonBrands: ['Cozaar', 'Losacor'],
    description: 'Antagonista de receptores de angiotensina II',
  },
  {
    name: 'Atorvastatina',
    category: 'Cardiovasculares',
    activeIngredient: 'Atorvastatina',
    commonBrands: ['Lipitor', 'Zarator'],
    description: 'Estatina para reducir colesterol',
  },
  {
    name: 'Insulina',
    category: 'Insulinas',
    activeIngredient: 'Insulina humana',
    commonBrands: ['Humulin', 'Novolin', 'Lantus'],
    description: 'Hormona para el tratamiento de diabetes',
  },
  {
    name: 'Metformina',
    category: 'Otros',
    activeIngredient: 'Metformina',
    commonBrands: ['Glucophage', 'Dabex'],
    description: 'Antidiabético oral',
  },
  {
    name: 'Omeprazol',
    category: 'Otros',
    activeIngredient: 'Omeprazol',
    commonBrands: ['Prilosec', 'Losec'],
    description: 'Inhibidor de la bomba de protones',
  },
  {
    name: 'Ranitidina',
    category: 'Otros',
    activeIngredient: 'Ranitidina',
    commonBrands: ['Zantac', 'Ranisen'],
    description: 'Antagonista H2 para acidez estomacal',
  },
  {
    name: 'Azitromicina',
    category: 'Antibióticos',
    activeIngredient: 'Azitromicina',
    commonBrands: ['Zithromax', 'Azitrocin'],
    description: 'Antibiótico macrólido',
  },
  {
    name: 'Ciprofloxacino',
    category: 'Antibióticos',
    activeIngredient: 'Ciprofloxacino',
    commonBrands: ['Cipro', 'Ciproxina'],
    description: 'Antibiótico fluoroquinolona',
  },
  {
    name: 'Clindamicina',
    category: 'Antibióticos',
    activeIngredient: 'Clindamicina',
    commonBrands: ['Dalacin', 'Cleocin'],
    description: 'Antibiótico lincosamida',
  },
  {
    name: 'Tramadol',
    category: 'Analgésicos',
    activeIngredient: 'Tramadol',
    commonBrands: ['Tramal', 'Ultram'],
    description: 'Analgésico opioide',
  },
  {
    name: 'Codeína',
    category: 'Analgésicos',
    activeIngredient: 'Codeína',
    commonBrands: ['Tylenol con Codeína'],
    description: 'Analgésico opioide',
  },
];

async function seedMedicationAllergies() {
  try {
    console.log('🚀 Iniciando seed de alergias a medicamentos...\n');

    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const existingCount = await MedicationAllergy.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  La base de datos ya contiene ${existingCount} alergias a medicamentos`);
      console.log('Saltando seed. Elimina los registros existentes si deseas volver a poblar.\n');
      await mongoose.disconnect();
      console.log('👋 Desconectado de MongoDB');
      return;
    }

    const result = await MedicationAllergy.insertMany(commonMedications);
    console.log(`✅ Se poblaron exitosamente ${result.length} alergias a medicamentos\n`);

    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error durante el seed:', error.message);
    process.exit(1);
  }
}

seedMedicationAllergies();
