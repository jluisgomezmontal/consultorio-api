# API Documentation - Consultorio Médico

Base URL: `http://localhost:3000/api`

## 📌 Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Consultorios](#consultorios)
- [Pacientes](#pacientes)
- [Citas](#citas)
- [Pagos](#pagos)
- [Reportes](#reportes)

---

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "doctor@consultorio.com",
  "password": "Doctor123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "Dr. Juan Pérez",
      "email": "doctor@consultorio.com",
      "role": "doctor",
      "consultorio": { }
    }
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

---

## Users

**Note:** All user endpoints require authentication. Most require admin role.

### List All Users
```http
GET /api/users?page=1&limit=10&consultorioId=uuid
Authorization: Bearer {token}
Role: admin
```

### Get User by ID
```http
GET /api/users/{id}
Authorization: Bearer {token}
```

### Create User
```http
POST /api/users
Authorization: Bearer {token}
Role: admin
Content-Type: application/json

{
  "name": "Dr. María López",
  "email": "maria@consultorio.com",
  "role": "doctor",
  "consultorioId": "uuid",
  "password": "SecurePass123!"
}
```

### Update User
```http
PUT /api/users/{id}
Authorization: Bearer {token}
Role: admin
Content-Type: application/json

{
  "name": "Dr. María López Sánchez",
  "role": "doctor"
}
```

### Delete User
```http
DELETE /api/users/{id}
Authorization: Bearer {token}
Role: admin
```

### Get Doctors
```http
GET /api/users/doctors?consultorioId=uuid
Authorization: Bearer {token}
```

---

## Consultorios

### List All Consultorios
```http
GET /api/consultorios?page=1&limit=10
Authorization: Bearer {token}
```

### Get Consultorio by ID
```http
GET /api/consultorios/{id}
Authorization: Bearer {token}
```

### Get Consultorio Summary
```http
GET /api/consultorios/{id}/resumen
Authorization: Bearer {token}
```

**Response includes:**
- Consultorio details
- Total appointments
- Today's appointments
- Pending appointments
- Total patients
- Total income
- Staff count

### Create Consultorio
```http
POST /api/consultorios
Authorization: Bearer {token}
Role: admin
Content-Type: application/json

{
  "name": "Clínica San Rafael",
  "address": "Av. Juárez 123",
  "phone": "+52 555 1234567",
  "description": "Consultorio médico general",
  "openHour": "08:00",
  "closeHour": "18:00"
}
```

### Update Consultorio
```http
PUT /api/consultorios/{id}
Authorization: Bearer {token}
Role: admin
Content-Type: application/json

{
  "name": "Clínica San Rafael Actualizada",
  "phone": "+52 555 9876543"
}
```

### Delete Consultorio
```http
DELETE /api/consultorios/{id}
Authorization: Bearer {token}
Role: admin
```

---

## Pacientes

### List All Pacientes
```http
GET /api/pacientes?page=1&limit=10&search=carlos
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `search` - Search by name, phone, or email

### Search Pacientes
```http
GET /api/pacientes/search?q=carlos
Authorization: Bearer {token}
```

### Get Paciente by ID
```http
GET /api/pacientes/{id}
Authorization: Bearer {token}
```

### Get Paciente History
```http
GET /api/pacientes/{id}/historial
Authorization: Bearer {token}
```

**Returns:** Patient details with all appointments, doctors, and payments

### Create Paciente
```http
POST /api/pacientes
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "Carlos Rodríguez López",
  "age": 35,
  "gender": "masculino",
  "phone": "+52 555 1112233",
  "email": "carlos@example.com",
  "address": "Calle Luna 789",
  "medicalHistory": "Hipertensión controlada",
  "allergies": "Penicilina",
  "notes": "Paciente regular"
}
```

### Update Paciente
```http
PUT /api/pacientes/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "+52 555 9998888",
  "notes": "Actualización de contacto"
}
```

### Delete Paciente
```http
DELETE /api/pacientes/{id}
Authorization: Bearer {token}
```

---

## Citas

### List All Citas
```http
GET /api/citas?page=1&limit=10&doctorId=uuid&estado=pendiente&dateFrom=2024-01-01&dateTo=2024-12-31
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `doctorId` - Filter by doctor
- `pacienteId` - Filter by patient
- `consultorioId` - Filter by consultorio
- `estado` - Filter by status (pendiente, confirmada, completada, cancelada)
- `dateFrom` - Start date
- `dateTo` - End date

### Get Calendar View
```http
GET /api/citas/calendario?doctorId=uuid&consultorioId=uuid&month=11&year=2024
Authorization: Bearer {token}
```

### Get Cita by ID
```http
GET /api/citas/{id}
Authorization: Bearer {token}
```

### Create Cita
```http
POST /api/citas
Authorization: Bearer {token}
Content-Type: application/json

{
  "pacienteId": "uuid",
  "doctorId": "uuid",
  "consultorioId": "uuid",
  "date": "2024-11-15",
  "time": "10:00",
  "motivo": "Consulta general",
  "costo": 500,
  "notas": "Primera consulta"
}
```

**Note:** System automatically checks for scheduling conflicts

### Update Cita
```http
PUT /api/citas/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "time": "11:00",
  "diagnostico": "Gripe común",
  "tratamiento": "Paracetamol cada 8 horas",
  "estado": "completada"
}
```

### Cancel Cita
```http
PATCH /api/citas/{id}/cancelar
Authorization: Bearer {token}
```

### Delete Cita
```http
DELETE /api/citas/{id}
Authorization: Bearer {token}
```

---

## Pagos

### List All Pagos
```http
GET /api/pagos?page=1&limit=10&citaId=uuid&estatus=pagado&dateFrom=2024-01-01&dateTo=2024-12-31
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `citaId` - Filter by appointment
- `estatus` - Filter by status (pagado, pendiente)
- `dateFrom` - Start date
- `dateTo` - End date

### Get Income Report
```http
GET /api/pagos/ingresos?dateFrom=2024-01-01&dateTo=2024-12-31&doctorId=uuid&consultorioId=uuid
Authorization: Bearer {token}
```

**Returns:**
- Total income
- Total payments
- Payments by method (efectivo, tarjeta, transferencia)
- Payment details

### Get Pago by ID
```http
GET /api/pagos/{id}
Authorization: Bearer {token}
```

### Create Pago
```http
POST /api/pagos
Authorization: Bearer {token}
Content-Type: application/json

{
  "citaId": "uuid",
  "monto": 500,
  "metodo": "efectivo",
  "fechaPago": "2024-11-12",
  "estatus": "pagado",
  "comentarios": "Pago en efectivo"
}
```

### Update Pago
```http
PUT /api/pagos/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "estatus": "pagado",
  "comentarios": "Pago confirmado"
}
```

### Delete Pago
```http
DELETE /api/pagos/{id}
Authorization: Bearer {token}
```

---

## Reportes

### Dashboard Summary
```http
GET /api/reportes/dashboard?consultorioId=uuid
Authorization: Bearer {token}
```

**Returns:**
- Today's appointments
- Pending appointments
- Total patients
- Today's income

### Citas Report
```http
GET /api/reportes/citas?dateFrom=2024-01-01&dateTo=2024-12-31&consultorioId=uuid
Authorization: Bearer {token}
```

**Returns:**
- Total appointments
- Appointments by status
- Appointments by doctor
- Appointments by month

### Income Report
```http
GET /api/reportes/ingresos?dateFrom=2024-01-01&dateTo=2024-12-31&consultorioId=uuid&doctorId=uuid
Authorization: Bearer {token}
```

**Returns:**
- Total income
- Total payments
- Payments by method
- Income by doctor

### Pacientes Report
```http
GET /api/reportes/pacientes?consultorioId=uuid
Authorization: Bearer {token}
```

**Returns:**
- Total patients
- New patients (last 30 days)
- Recurring patients
- Patients by gender

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limiting

- **General endpoints:** 100 requests per 15 minutes
- **Auth endpoints:** 5 requests per 15 minutes

---

## Authentication

Include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Pagination

Paginated responses follow this format:

```json
{
  "success": true,
  "data": [ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```
