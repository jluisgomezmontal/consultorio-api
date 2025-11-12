# Setup Guide - API Consultorio

This guide will help you set up the Medical Clinic Management System API from scratch.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase account** (free tier is sufficient)
- A code editor (VS Code recommended)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

#### Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Name:** `consultorio-api` (or your preferred name)
   - **Database Password:** Choose a strong password
   - **Region:** Select closest to you
5. Wait for the project to be created (~2 minutes)

#### Get Your Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key**
   - **service_role key** (⚠️ Keep this secret!)
3. Go to **Project Settings** → **Database**
4. Copy the **Connection String** (URI format)
   - Should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your Supabase credentials:

```env
# Database - Use your Supabase connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Supabase
SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# JWT - Generate a secure random string
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=3000
NODE_ENV="development"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ Important:** 
- Replace `[YOUR-PASSWORD]` with your actual database password
- Never commit `.env` to git
- Use a strong, unique `JWT_SECRET`

### 4. Set Up Database

Run the automated setup script:

```bash
npm run setup
```

This will:
1. Install all dependencies
2. Generate Prisma Client
3. Push the database schema to Supabase
4. Seed the database with sample data

**Or** do it manually:

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed with sample data
npm run prisma:seed
```

### 5. Start the Server

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

### 6. Test the API

#### Health Check
```bash
curl http://localhost:3000/api/health
```

#### Login with Sample User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@consultorio.com",
    "password": "Admin123!"
  }'
```

**Sample Test Credentials:**
- **Admin:** `admin@consultorio.com` / `Admin123!`
- **Doctor:** `doctor@consultorio.com` / `Doctor123!`
- **Receptionist:** `recepcion@consultorio.com` / `Recep123!`

## 📚 Next Steps

### Explore the API

1. **Read the documentation:** Check `API_DOCUMENTATION.md` for all available endpoints
2. **Use Prisma Studio:** Run `npm run prisma:studio` to view and manage your database
3. **Check logs:** Monitor the console for structured logs

### Optional Tools

#### Install Postman
Download from [https://www.postman.com/downloads/](https://www.postman.com/downloads/)

You can import the API endpoints manually or use the provided documentation.

#### Use Thunder Client (VS Code Extension)
Install Thunder Client in VS Code for an integrated API testing experience.

## 🔧 Useful Commands

```bash
# Development
npm run dev                    # Start with hot reload
npm run prisma:studio          # Open Prisma Studio (database GUI)

# Database
npm run prisma:generate        # Generate Prisma Client
npm run prisma:push            # Push schema changes
npm run prisma:migrate         # Create a migration
npm run prisma:seed            # Seed database

# Production
npm start                      # Start server
```

## 🐛 Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solutions:**
1. Check your `DATABASE_URL` in `.env`
2. Verify your Supabase project is running
3. Check if your IP is allowed (Supabase → Settings → Database → Connection Pooling)
4. Ensure your database password is correct

### Prisma Client Issues

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
npm run prisma:generate
```

### Authentication Issues

**Error:** `Invalid Supabase credentials`

**Solutions:**
1. Verify `SUPABASE_URL` and keys in `.env`
2. Check if keys are correct in Supabase dashboard
3. Ensure you're using the service role key for admin operations

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solutions:**
1. Change `PORT` in `.env` to another port (e.g., 3001)
2. Or stop the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:3000 | xargs kill -9
   ```

## 📖 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Supabase Documentation](https://supabase.com/docs)
- [Zod Validation](https://zod.dev/)

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Use a strong, unique `JWT_SECRET`
- [ ] Never commit `.env` to version control
- [ ] Enable HTTPS/TLS
- [ ] Set up proper CORS configuration
- [ ] Review and adjust rate limits
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Set up monitoring and logging
- [ ] Use environment-specific configurations
- [ ] Back up your database regularly

## 🆘 Getting Help

If you encounter issues:

1. Check the console logs for detailed error messages
2. Review `API_DOCUMENTATION.md` for endpoint specifications
3. Verify all environment variables are set correctly
4. Check Prisma Studio to inspect database state
5. Review the error handling in `src/middlewares/errorHandler.js`

## 🎉 Success!

If you see this in your console, you're ready to go:

```
🚀 Server is running on http://localhost:3000
📚 API endpoints available at http://localhost:3000/api
❤️  Health check: http://localhost:3000/api/health
```

Happy coding! 🚀
