# Resumen de Funcionalidades - Sistema de Consultorio Médico

## 📋 Descripción General
Sistema de gestión integral para consultorios médicos que permite administrar citas, pacientes, pagos y generar reportes. Incluye autenticación JWT, control de roles y límites de peticiones.

---

## 🔐 Autenticación y Seguridad
- **Login con JWT**: Autenticación mediante tokens de acceso y refresco
- **Gestión de sesiones**: Endpoint para obtener usuario actual y refrescar tokens
- **Control de roles**: Permisos diferenciados para admin, doctor y recepcionista
- **Rate limiting**: 
  - Endpoints generales: 100 peticiones/15 min
  - Endpoints de autenticación: 5 peticiones/15 min

---

## 👥 Gestión de Usuarios
- **CRUD completo** de usuarios (requiere rol admin)
- **Roles disponibles**: admin, doctor, recepcionista
- **Filtrado por consultorio**: Listar usuarios por consultorio específico
- **Búsqueda de doctores**: Endpoint especializado para obtener lista de médicos
- **Paginación**: Soporte para listados con paginación configurable

---

## 🏥 Gestión de Consultorios
- **CRUD completo** de consultorios
- **Configuración de horarios**: Definir hora de apertura y cierre
- **Resumen ejecutivo**: Dashboard con métricas clave:
  - Total de citas (hoy, pendientes, total)
  - Total de pacientes
  - Ingresos totales
  - Cantidad de personal
- **Información completa**: Nombre, dirección, teléfono, descripción

---

## 🩺 Gestión de Pacientes
- **CRUD completo** de pacientes
- **Búsqueda avanzada**: Por nombre, teléfono o email
- **Historial médico completo**:
  - Todas las citas del paciente
  - Médicos que lo han atendido
  - Historial de pagos
- **Información detallada**:
  - Datos personales (nombre, edad, género, contacto)
  - Historial médico
  - Alergias
  - Notas adicionales
- **Paginación y filtros**: Listados optimizados con búsqueda

---

## 📅 Gestión de Citas
- **CRUD completo** de citas médicas
- **Validación automática**: Detección de conflictos de horarios
- **Estados de cita**: pendiente, confirmada, completada, cancelada
- **Vista de calendario**: Visualización mensual por doctor o consultorio
- **Filtros múltiples**:
  - Por doctor, paciente o consultorio
  - Por estado
  - Por rango de fechas
- **Información completa**:
  - Motivo de consulta
  - Diagnóstico
  - Tratamiento
  - Costo
  - Notas
- **Cancelación de citas**: Endpoint específico para cancelar

---

## 💰 Gestión de Pagos
- **CRUD completo** de pagos
- **Métodos de pago**: efectivo, tarjeta, transferencia
- **Estados**: pagado, pendiente
- **Reporte de ingresos**:
  - Total de ingresos
  - Cantidad de pagos
  - Desglose por método de pago
  - Filtrado por doctor y consultorio
- **Filtros avanzados**:
  - Por cita
  - Por estado
  - Por rango de fechas
- **Vinculación**: Cada pago está asociado a una cita específica

---

## 📊 Sistema de Reportes

### Dashboard Principal
Resumen ejecutivo con métricas del día:
- Citas de hoy
- Citas pendientes
- Total de pacientes
- Ingresos del día

### Reporte de Citas
Análisis completo de citas:
- Total de citas en período
- Distribución por estado
- Distribución por doctor
- Distribución por mes

### Reporte de Ingresos
Análisis financiero detallado:
- Total de ingresos
- Total de pagos procesados
- Desglose por método de pago
- Ingresos por doctor
- Filtrado por consultorio y período

### Reporte de Pacientes
Estadísticas de pacientes:
- Total de pacientes registrados
- Pacientes nuevos (últimos 30 días)
- Pacientes recurrentes
- Distribución por género

---

## 🔧 Características Técnicas

### Paginación
Todos los listados incluyen:
- Número de página actual
- Límite de items por página
- Total de registros
- Total de páginas
- Indicadores de página siguiente/anterior

### Manejo de Errores
Respuestas estandarizadas con:
- Código HTTP apropiado (200, 201, 400, 401, 403, 404, 409, 422, 429, 500)
- Mensaje descriptivo del error
- Detalles de validación por campo (cuando aplica)

### Filtros y Búsquedas
- Búsqueda por texto en múltiples campos
- Filtrado por fechas (desde/hasta)
- Filtrado por relaciones (doctor, paciente, consultorio)
- Filtrado por estados
- Ordenamiento configurable

---

## 🎯 Casos de Uso Principales

1. **Recepción de Pacientes**
   - Registrar nuevo paciente
   - Agendar cita con doctor disponible
   - Verificar horarios en calendario
   - Registrar pago de consulta

2. **Consulta Médica**
   - Ver citas del día
   - Consultar historial del paciente
   - Actualizar diagnóstico y tratamiento
   - Marcar cita como completada

3. **Administración**
   - Gestionar usuarios y permisos
   - Configurar consultorios
   - Generar reportes financieros
   - Analizar estadísticas de operación

4. **Seguimiento Financiero**
   - Registrar pagos de citas
   - Consultar ingresos por período
   - Analizar métodos de pago
   - Revisar pagos pendientes

---

## 🔒 Seguridad y Permisos

- **Autenticación obligatoria**: Todos los endpoints requieren token JWT
- **Control de acceso basado en roles**:
  - **Admin**: Acceso completo al sistema
  - **Doctor**: Gestión de citas, pacientes y consultas
  - **Recepcionista**: Agendamiento y gestión básica
- **Protección contra ataques**: Rate limiting implementado
- **Validación de datos**: Validación estricta en todos los endpoints

---

## 📱 Integraciones y Extensibilidad

El sistema está diseñado con arquitectura por capas que facilita:
- Integración con sistemas externos
- Extensión de funcionalidades
- Mantenimiento y escalabilidad
- Separación clara de responsabilidades (routes/controllers/services/models)
