# Migración Multi-Consultorio - Guía de Implementación

## 📋 Resumen de Cambios

Se ha implementado la funcionalidad de **múltiples consultorios por usuario**, permitiendo que doctores y recepcionistas puedan estar asignados a varios consultorios y solo vean/gestionen los recursos de esos consultorios.

### Cambios Principales

#### 🔧 Backend (API)

1. **Modelo User** (`src/models/User.model.js`)
   - Cambio de `consultorioId` (ObjectId) a `consultoriosIds` (Array de ObjectIds)
   - Usuarios ahora pueden pertenecer a múltiples consultorios

2. **Middleware de Autorización** (`src/middlewares/auth.js`)
   - Actualizado `authenticate` para cargar array de consultorios
   - Actualizado `checkConsultorioAccess` para verificar array
   - **Nuevo middleware** `applyConsultorioFilter`: filtra automáticamente recursos por consultorios asignados

3. **Servicios Actualizados**
   - **CitaService**: Todos los métodos ahora aceptan `consultorioFilter` para filtrar por consultorios
   - **PacienteService**: `getPacienteHistory` filtra citas por consultorios asignados
   - **UserService**: Métodos actualizados para manejar `consultoriosIds` (array)
   - **AuthService**: Login y registro ahora retornan `consultoriosIds` y `consultorios`

4. **Controladores Actualizados**
   - **CitaController**: Pasa `req.consultorioFilter` a todos los métodos del servicio
   - **PacienteController**: Pasa `req.consultorioFilter` al historial del paciente

5. **Rutas Actualizadas**
   - `src/routes/cita.routes.js`: Aplica `applyConsultorioFilter` middleware
   - `src/routes/paciente.routes.js`: Aplica `applyConsultorioFilter` middleware

#### 💻 Frontend (Web)

1. **Tipos Actualizados**
   - `src/services/user.service.ts`: Interface `User` ahora tiene `consultoriosIds: string[]` y `consultorios?: Consultorio[]`
   - `src/services/auth.service.ts`: Interface `User` actualizada de la misma forma

2. **Comportamiento**
   - El frontend ya está preparado para recibir arrays de consultorios
   - Los formularios y componentes seguirán funcionando (los cambios son compatibles)

---

## 🚀 Pasos para Migrar

### 1. Detener la Aplicación

```bash
# Detener el servidor backend si está corriendo
```

### 2. Ejecutar el Script de Migración

El script migrará todos los usuarios existentes de `consultorioId` a `consultoriosIds`:

```bash
cd api-consultorio
node src/scripts/migrate-consultorios.js
```

**Salida esperada:**
```
✓ Connected to MongoDB

Found X users with consultorioId field
  ✓ Migrated user user@example.com
  ✓ Migrated user doctor@example.com
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Migration completed!
  - Migrated: X users
  - Skipped: 0 users
  - Total: X users processed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Disconnected from MongoDB
✓ Migration script finished successfully
```

### 3. Reiniciar la Aplicación

```bash
# Backend
cd api-consultorio
npm run dev

# Frontend (en otra terminal)
cd web-consultorio
npm run dev
```

---

## 🧪 Testing

### Pruebas de Funcionalidad

#### 1. **Login y Verificación de Consultorios**

```bash
# Login como usuario migrado
POST /api/auth/login
{
  "email": "doctor@example.com",
  "password": "password"
}

# Respuesta debe incluir:
{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {
      "id": "...",
      "name": "Dr. Example",
      "email": "doctor@example.com",
      "role": "doctor",
      "consultoriosIds": ["60d5ec49f1a2c8b9f8e4e123"],  // Array ✅
      "consultorios": [{ "id": "...", "name": "Consultorio A" }]
    }
  }
}
```

#### 2. **Filtrado de Citas por Consultorio**

Como **doctor/recepcionista**:
- Solo debe ver citas de los consultorios asignados
- No debe poder ver/editar citas de otros consultorios

```bash
GET /api/citas
# Retorna solo citas donde consultorioId está en consultoriosIds del usuario
```

Como **admin**:
- Debe ver todas las citas sin filtro

#### 3. **Filtrado de Pacientes**

El historial del paciente (`GET /api/pacientes/:id/historial`) solo debe mostrar citas de los consultorios asignados al usuario que hace la petición.

#### 4. **Asignar Múltiples Consultorios a un Usuario**

```bash
# Actualizar usuario para asignarle múltiples consultorios
PUT /api/users/:userId
{
  "consultoriosIds": [
    "60d5ec49f1a2c8b9f8e4e123",
    "60d5ec49f1a2c8b9f8e4e456"
  ]
}
```

#### 5. **Crear Nuevo Usuario con Múltiples Consultorios**

```bash
POST /api/users
{
  "name": "Nueva Recepcionista",
  "email": "recep@example.com",
  "password": "password123",
  "role": "recepcionista",
  "consultoriosIds": [
    "60d5ec49f1a2c8b9f8e4e123",
    "60d5ec49f1a2c8b9f8e4e456"
  ]
}
```

---

## 🔍 Validaciones

### ✅ Checklist de Verificación

- [ ] Script de migración ejecutado sin errores
- [ ] Todos los usuarios tienen `consultoriosIds` (array)
- [ ] No quedan usuarios con `consultorioId` (campo antiguo)
- [ ] Login funciona correctamente
- [ ] Recepcionista/Doctor solo ve citas de sus consultorios
- [ ] Admin ve todas las citas
- [ ] Crear cita funciona para recepcionista
- [ ] Editar cita funciona respetando permisos
- [ ] Historial de paciente filtra correctamente por consultorio

---

## 📝 Notas Importantes

### Permisos por Rol

| Rol | Permisos |
|-----|----------|
| **Admin** | Acceso total a todos los recursos de todos los consultorios |
| **Doctor** | Solo puede ver/editar pacientes y citas de sus consultorios asignados |
| **Recepcionista** | Solo puede ver/editar pacientes y citas de sus consultorios asignados |

### Compatibilidad

- ✅ Los cambios son **compatibles hacia atrás** en el frontend
- ✅ El frontend seguirá funcionando sin cambios adicionales
- ⚠️ **Ejecutar migración antes de desplegar** para evitar errores

### Rollback

Si necesitas revertir los cambios:

1. Restaurar backup de la base de datos
2. Revertir commits del código
3. Reiniciar servicios

---

## 🛠️ Troubleshooting

### Error: "consultorioId is not defined"

**Causa**: El modelo User todavía tiene referencias al campo antiguo.

**Solución**: Asegúrate de que la migración se haya ejecutado correctamente y reinicia el servidor.

### Error: "Cita not found or access denied"

**Causa**: Usuario intenta acceder a una cita de un consultorio al que no tiene acceso.

**Solución**: Esto es el comportamiento esperado. Verifica que el usuario tenga los consultorios correctos asignados.

### Los filtros no funcionan correctamente

**Causa**: El middleware `applyConsultorioFilter` no se está aplicando.

**Solución**: Verifica que las rutas de citas y pacientes tengan `router.use(applyConsultorioFilter)`.

---

## 📞 Soporte

Si encuentras algún problema durante la migración o testing, revisa:

1. Logs del servidor backend
2. Respuestas de la API en el navegador (DevTools > Network)
3. Base de datos directamente con MongoDB Compass o mongosh

---

## ✨ Mejoras Futuras (Opcionales)

- [ ] Agregar UI en el frontend para gestionar múltiples consultorios por usuario
- [ ] Selector de consultorio activo en la interfaz
- [ ] Dashboard de métricas por consultorio
- [ ] Reportes filtrados por consultorio
