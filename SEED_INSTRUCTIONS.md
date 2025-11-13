# Instrucciones para usar Seed con MongoDB

## Problema Resuelto ✅

El archivo `.env` tenía problemas de codificación que impedían que se leyera `MONGO_URI`. Esto ha sido corregido.

## Pasos para Ejecutar el Seed

### 1. Instalar Dependencias (si no lo has hecho)
```bash
npm install
```

### 2. Ejecutar el Seed
```bash
npm run seed
```

Esto creará:
- ✅ **4 Consultorios** (San José, Guadalupe, Los Arcos, MediCare)
- ✅ **7 Usuarios** (1 admin, 4 doctores, 1 recepcionista)
- ✅ **9 Pacientes** con datos completos
- ✅ **9 Citas** (algunas completadas, pendientes, confirmadas)
- ✅ **6 Pagos** asociados a las citas

### 3. Credenciales de Prueba

Después de ejecutar el seed, puedes usar estas credenciales para login:

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `admin@consultorio.com` | `Admin123!` |
| Doctor Principal | `doctor@consultorio.com` | `Doctor123!` |
| Recepcionista | `recepcion@consultorio.com` | `Recep123!` |
| Doctor Guadalupe | `doctora.guadalupe@consultorio.com` | `Doctor456!` |
| Doctor Los Arcos | `doctor.losarcos@consultorio.com` | `Doctor789!` |
| Doctor MediCare | `doctor.medicare@consultorio.com` | `Doctor321!` |

### 4. Verificar que Funcionó

Inicia el servidor:
```bash
npm run dev
```

Deberías ver:
```
✅ MongoDB Connected: ejido.lpplq.mongodb.net
🚀 Server is running on http://localhost:3000
```

Luego prueba el login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"doctor@consultorio.com\",\"password\":\"Doctor123!\"}"
```

## Características del Seed

### Re-ejecutable
- El seed es **idempotente**: puedes ejecutarlo múltiples veces
- Actualiza registros existentes en lugar de crear duplicados
- Usa `email` como identificador único para usuarios y pacientes

### Integración con Supabase
- Crea usuarios en **Supabase Auth** automáticamente
- Si un usuario ya existe en Supabase, solo muestra una advertencia
- Los usuarios se sincronizan entre MongoDB y Supabase

### Datos Realistas
- Pacientes con historial médico y alergias
- Citas con diferentes estados (pendiente, confirmada, completada, cancelada)
- Pagos con diferentes métodos (efectivo, tarjeta, transferencia)
- Horarios y consultorios variados

## Troubleshooting

### Error: "uri parameter must be a string"
**Solución**: El archivo `.env` ya fue corregido. Reinicia tu terminal o el servidor.

### Error: "User already exists in Supabase"
**Solución**: Es normal si ejecutas el seed múltiples veces. Los usuarios se actualizarán en MongoDB.

### Error de conexión a MongoDB
**Solución**: Verifica que la URI sea correcta y que tu IP esté en la whitelist de MongoDB Atlas:
```
MONGO_URI=mongodb+srv://luis:220690@ejido.lpplq.mongodb.net/consultorio
```

### Limpiar la Base de Datos
Si quieres empezar desde cero:
```javascript
// Usando MongoDB Compass o mongo shell:
use consultorio
db.dropDatabase()
```

Luego ejecuta el seed nuevamente:
```bash
npm run seed
```

## Ubicación de Archivos

- **Seed para MongoDB**: `/seed.js` (raíz del proyecto)
- **Seed original Prisma**: `/prisma/seed.js` (ya no se usa)
- **Modelos Mongoose**: `/src/models/`
- **Variables de entorno**: `/.env`

## Datos Creados

### Consultorios
1. **Consultorio Médico San José** - Av. Principal 123
2. **Clínica Familiar Guadalupe** - Calle Reforma 456
3. **Centro Médico Los Arcos** - Av. Insurgentes Sur 1500
4. **MediCare Especialistas** - Blvd. Valle Dorado 200

### Pacientes de Ejemplo
- Carlos Rodríguez López (35 años, Hipertensión)
- Ana María Martínez (28 años, Sin antecedentes)
- Roberto Sánchez (45 años, Diabetes tipo 2)
- Laura Hernández Torres (32 años, Asma leve)
- Miguel Ángel Prieto (52 años, Dolor lumbar)
- Y más...

### Citas de Ejemplo
- Consultas generales
- Chequeos preventivos
- Controles de enfermedades crónicas
- Revisiones especializadas
- Sesiones de fisioterapia

Todas con fechas relativas a hoy (algunas en el pasado, algunas futuras).
