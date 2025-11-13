# Next Steps After Migration

## 1. Install Dependencies
Run the following command to install Mongoose and remove Prisma:
```bash
npm install
```

## 2. Optional: Clean Up Prisma Files
You can delete these files/folders as they're no longer needed:
```bash
# Prisma directory
rmdir /s prisma

# Or manually delete:
# - prisma/schema.prisma
# - prisma/seed.js (if exists)
```

## 3. Test the Migration
Start the development server:
```bash
npm run dev
```

The server should connect to MongoDB successfully. You should see:
```
MongoDB Connected: ejido.lpplq.mongodb.net
🚀 Server is running on http://localhost:3000
```

## 4. Test Key Endpoints

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Create a Consultorio (if starting fresh)
```bash
curl -X POST http://localhost:3000/api/consultorios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Consultorio Demo",
    "address": "123 Main St",
    "phone": "555-0123"
  }'
```

### Authentication Test
First create a user, then test login:
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "your-password"
  }'
```

## 5. Verify Data Access
- Test CRUD operations for each model
- Check that relationships (populate) work correctly
- Verify cascade deletes function properly
- Test search and pagination

## 6. Monitor for Issues
Watch for:
- ObjectId validation errors (ensure all IDs are valid ObjectIds)
- Populate/reference errors
- Aggregation query issues
- Date formatting differences

## 7. Data Migration (If Needed)
If you have existing data in PostgreSQL that needs to be migrated:

1. Export from PostgreSQL
2. Convert UUID references to ObjectId format
3. Adjust field names if needed
4. Import into MongoDB using mongoimport or a custom script

## 8. Update Documentation
Update your API documentation if it references:
- Database technology (now MongoDB)
- ID format (now ObjectId instead of UUID)
- Any schema-specific details

## Troubleshooting

### Connection Issues
If MongoDB connection fails:
- Verify MONGO_URI in .env is correct
- Check MongoDB Atlas network access (IP whitelist)
- Ensure database user has correct permissions

### Schema Validation Errors
- Check that all required fields are provided
- Verify enum values match model definitions
- Ensure ObjectId references are valid

### Performance Issues
- Add indexes for frequently queried fields
- Use `.lean()` for read-only queries
- Implement pagination for large datasets
- Use aggregation pipelines for complex queries

## Optional Prisma Cleanup
If you want to completely remove Prisma traces:

1. Delete prisma directory: `rm -rf prisma`
2. Check package.json scripts - already updated ✓
3. Remove any Prisma references in documentation

## Success Indicators
✅ Server starts without errors
✅ MongoDB connection successful
✅ All API endpoints respond correctly
✅ Relationships populate properly
✅ CRUD operations work
✅ Authentication functions
✅ Reports and statistics generate correctly

## Questions or Issues?
Refer to:
- `MIGRATION_GUIDE.md` - Detailed migration information
- `README.md` - General project documentation
- `API_DOCUMENTATION.md` - API endpoint details
