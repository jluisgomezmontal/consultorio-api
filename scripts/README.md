# 🚀 Scripts de Inicialización y Migración

Scripts para configurar el sistema de paquetes en tu SaaS médico.

---

## 📦 Scripts Disponibles

### 1. `init-paquetes.js`
Inicializa los 3 paquetes por defecto en la base de datos.

### 2. `migrate-consultorios.js`
Migra consultorios existentes para asignarles un paquete.

---

## 🔧 Requisitos Previos

1. Tener MongoDB corriendo
2. Variables de entorno configuradas en `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/tu-base-de-datos
   ```

---

## 🚀 Ejecución

### Opción 1: Ejecutar directamente con Node

```bash
# Desde la carpeta api-consultorio

# 1. Inicializar paquetes
node scripts/init-paquetes.js

# 2. Migrar consultorios existentes
node scripts/migrate-consultorios.js
```

### Opción 2: Agregar scripts a package.json

Agrega estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "init:paquetes": "node scripts/init-paquetes.js",
    "migrate:consultorios": "node scripts/migrate-consultorios.js",
    "setup:paquetes": "npm run init:paquetes && npm run migrate:consultorios"
  }
}
```

Luego ejecuta:

```bash
# Inicializar paquetes
npm run init:paquetes

# Migrar consultorios
npm run migrate:consultorios

# O ejecutar ambos en secuencia
npm run setup:paquetes
```

---

## 📊 Qué hace cada script

### `init-paquetes.js`

1. ✅ Conecta a MongoDB
2. ✅ Verifica si ya existen paquetes
3. ✅ Elimina paquetes existentes (si los hay)
4. ✅ Crea 3 paquetes por defecto:
   - **Básico** ($299/mes)
   - **Profesional** ($599/mes)
   - **Clínica** ($1,199/mes)
5. ✅ Muestra resumen de paquetes creados

**Salida esperada:**
```
🔌 Conectando a MongoDB...
✅ Conectado a MongoDB
📦 Creando paquetes por defecto...
✅ 3 paquetes creados exitosamente:
   - Básico (basico)
   - Profesional (profesional)
   - Clínica (clinica)

🎉 Inicialización completada exitosamente
🔌 Conexión cerrada
```

### `migrate-consultorios.js`

1. ✅ Conecta a MongoDB
2. ✅ Busca consultorios sin paquete asignado
3. ✅ Asigna paquete "Básico" a todos
4. ✅ Configura suscripción en estado "trial" por 30 días
5. ✅ Muestra resumen de consultorios migrados

**Salida esperada:**
```
🔌 Conectando a MongoDB...
✅ Conectado a MongoDB
📊 Encontrados 5 consultorios para migrar
✅ 5 consultorios migrados exitosamente
   - Paquete asignado: Básico
   - Estado: Trial (30 días)
   - Fecha de vencimiento: 06/02/2026

📋 Consultorios migrados:
   1. Consultorio Dr. García
      - Paquete: basico
      - Estado: trial
      - Vence: 06/02/2026
   2. Clínica Salud Total
      - Paquete: basico
      - Estado: trial
      - Vence: 06/02/2026
   ...

🎉 Migración completada exitosamente
🔌 Conexión cerrada
```

---

## ⚠️ Consideraciones Importantes

### Antes de ejecutar en producción:

1. **Backup de la base de datos**
   ```bash
   mongodump --uri="mongodb://localhost:27017/tu-base-de-datos" --out=backup
   ```

2. **Ejecutar en ambiente de desarrollo primero**
   - Prueba los scripts en tu base de datos local
   - Verifica que todo funcione correctamente

3. **Revisar consultorios existentes**
   - Verifica cuántos consultorios tienes
   - Decide si todos deben empezar en "trial" o algunos en "activa"

### Personalización:

Si quieres que algunos consultorios empiecen con un plan diferente:

```javascript
// En migrate-consultorios.js, puedes hacer algo como:

// Asignar plan Profesional a consultorios específicos
await Consultorio.updateOne(
  { _id: 'ID_DEL_CONSULTORIO' },
  {
    $set: {
      paquete: 'profesional',
      suscripcion: {
        estado: 'activa',
        fechaInicio: new Date(),
        fechaVencimiento: new Date('2026-12-31'),
        tipoPago: 'anual'
      }
    }
  }
);
```

---

## 🔄 Re-ejecutar Scripts

### Si necesitas volver a inicializar paquetes:

El script `init-paquetes.js` detecta si ya existen paquetes y los elimina antes de crear nuevos. Esto es útil si:
- Quieres actualizar precios
- Quieres cambiar límites
- Quieres agregar nuevas features

### Si necesitas re-migrar consultorios:

El script `migrate-consultorios.js` solo actualiza consultorios que NO tengan paquete. Si quieres forzar una re-migración:

```javascript
// Modificar la query en migrate-consultorios.js
const consultoriosSinPaquete = await Consultorio.find({});
// Esto migrará TODOS los consultorios
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to MongoDB"
- Verifica que MongoDB esté corriendo
- Verifica la variable `MONGODB_URI` en `.env`
- Prueba la conexión: `mongosh "mongodb://localhost:27017"`

### Error: "Module not found"
- Asegúrate de estar en la carpeta `api-consultorio`
- Verifica que las rutas de importación sean correctas
- Ejecuta `npm install` si es necesario

### Los consultorios no se migran
- Verifica que existan consultorios en la base de datos
- Revisa los logs para ver qué consultorios se encontraron
- Verifica que los consultorios no tengan ya el campo `paquete`

---

## ✅ Verificación Post-Ejecución

### Verificar paquetes creados:

```javascript
// En MongoDB shell o Compass
db.paquetes.find().pretty()
```

Deberías ver 3 documentos con los paquetes Básico, Profesional y Clínica.

### Verificar consultorios migrados:

```javascript
// En MongoDB shell o Compass
db.consultorios.find({ paquete: 'basico' }).pretty()
```

Deberías ver todos tus consultorios con:
- Campo `paquete: 'basico'`
- Campo `suscripcion` con estado `trial`

---

## 🎯 Próximos Pasos

Después de ejecutar estos scripts:

1. ✅ Reinicia tu servidor API
2. ✅ Prueba el endpoint `/api/paquetes/mi-paquete`
3. ✅ Verifica que el frontend muestre el badge del plan
4. ✅ Prueba crear un usuario y verifica límites
5. ✅ Prueba subir una foto y verifica features

---

¿Necesitas ayuda con la ejecución? 🚀
