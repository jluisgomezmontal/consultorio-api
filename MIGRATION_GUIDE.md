# Migration from Prisma to MongoDB/Mongoose

This guide documents the migration from Prisma with PostgreSQL to Mongoose with MongoDB.

## What Was Changed

### 1. Dependencies
- **Removed**: `@prisma/client`, `prisma`
- **Added**: `mongoose@^8.0.0`

### 2. Configuration
- **Database Connection**: Changed from `src/config/database.js` (Prisma) to Mongoose connection
- **Environment Variables**: Changed from `DATABASE_URL` to `MONGO_URI`

### 3. Models Created
New Mongoose models were created in `src/models/`:
- `Consultorio.model.js`
- `User.model.js`
- `Paciente.model.js`
- `Cita.model.js`
- `Pago.model.js`
- `index.js` (model exports)

### 4. Service Files Migrated
All service files were updated to use Mongoose:
- `src/services/auth.service.js`
- `src/services/cita.service.js`
- `src/services/consultorio.service.js`
- `src/services/paciente.service.js`
- `src/services/pago.service.js`
- `src/services/reporte.service.js`
- `src/services/user.service.js`

### 5. Key Schema Changes

#### UUID to ObjectId
- Prisma used UUID strings for IDs
- MongoDB uses ObjectId for `_id` fields
- Referenced fields now use ObjectId (e.g., `consultorioId`, `pacienteId`)

#### Field Mappings
- All Prisma enums converted to String enums in Mongoose
- `@db.Text` fields converted to regular String fields in MongoDB
- Cascading deletes handled manually in service layer
- Indexes maintained on key fields

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

This will install Mongoose and remove Prisma dependencies.

### 2. Environment Variables
The `.env` file has been updated with:
```env
MONGO_URI="mongodb+srv://luis:220690@ejido.lpplq.mongodb.net/consultorio"
```

### 3. Clean Up (Optional)
You can safely delete the Prisma directory and related files:
```bash
# These files are no longer needed:
# - prisma/
# - node_modules/@prisma/
# - node_modules/prisma/
```

### 4. Start the Server
```bash
npm run dev
```

The server will automatically connect to MongoDB on startup.

## Important Notes

### Data Migration
**WARNING**: This migration changes the database technology. Your existing PostgreSQL data will NOT automatically migrate to MongoDB.

If you need to migrate existing data:
1. Export data from PostgreSQL
2. Transform UUIDs to match MongoDB ObjectId references
3. Import data into MongoDB collections

### API Compatibility
The API endpoints remain the same. However, note:
- ID fields are now MongoDB ObjectIds (different format than UUIDs)
- Response structures are maintained for compatibility
- Populated references return the same structure as Prisma includes

### Cascade Deletes
Mongoose doesn't have built-in cascade deletes like Prisma. These are now handled manually in the service layer:
- Deleting a `Consultorio` cascades to `Users`, `Citas`, and `Pagos`
- Deleting a `Paciente` cascades to `Citas` and their `Pagos`
- Deleting a `Cita` cascades to `Pagos`
- Deleting a `User` (doctor) is restricted if they have existing `Citas`

### Aggregations
Complex Prisma aggregations were converted to MongoDB aggregation pipelines:
- Reports use MongoDB's `$group`, `$lookup`, `$match` stages
- Date grouping uses `$dateToString`
- Joins use `$lookup` with `$unwind`

## Testing

After migration, test:
1. All CRUD operations
2. Authentication flow
3. Reports and statistics
4. Cascade deletes
5. Search functionality
6. Pagination

## Rollback

If you need to rollback:
1. Restore the original `package.json`
2. Run `npm install`
3. Restore Prisma configuration files
4. Revert service files to use Prisma
5. Update `.env` to use `DATABASE_URL`

## Support

For issues or questions about this migration, refer to:
- Mongoose Documentation: https://mongoosejs.com/docs/
- MongoDB Documentation: https://docs.mongodb.com/
