/**
 * Migration script: Convert consultorioId to consultoriosIds array
 * 
 * This script migrates existing User documents from having a single consultorioId
 * to having an array of consultoriosIds.
 * 
 * Run with: node src/scripts/migrate-consultorios.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/index.js';

dotenv.config();

async function migrateConsultorios() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('Missing MongoDB connection string. Set MONGODB_URI or MONGO_URI in your environment variables.');
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Find all users with the old consultorioId field
    const usersWithOldField = await User.find({ consultorioId: { $exists: true } }).lean();
    
    console.log(`\nFound ${usersWithOldField.length} users with consultorioId field`);

    if (usersWithOldField.length === 0) {
      console.log('No users to migrate. Checking for users with consultoriosIds...');
      const usersWithNewField = await User.countDocuments({ consultoriosIds: { $exists: true } });
      console.log(`${usersWithNewField} users already have consultoriosIds field`);
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithOldField) {
      try {
        // Check if user already has consultoriosIds
        if (user.consultoriosIds && user.consultoriosIds.length > 0) {
          console.log(`  ⊘ Skipping user ${user.email} - already has consultoriosIds`);
          skippedCount++;
          continue;
        }

        // Convert consultorioId to array consultoriosIds
        const updateData = {
          $set: {
            consultoriosIds: user.consultorioId ? [user.consultorioId] : [],
          },
          $unset: {
            consultorioId: '',
          },
        };

        await User.updateOne({ _id: user._id }, updateData);
        console.log(`  ✓ Migrated user ${user.email}`);
        migratedCount++;
      } catch (error) {
        console.error(`  ✗ Error migrating user ${user.email}:`, error.message);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Migration completed!`);
    console.log(`  - Migrated: ${migratedCount} users`);
    console.log(`  - Skipped: ${skippedCount} users`);
    console.log(`  - Total: ${usersWithOldField.length} users processed`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

// Run migration
migrateConsultorios()
  .then(() => {
    console.log('\n✓ Migration script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration script failed:', error);
    process.exit(1);
  });
