# Configuración del Sistema de Documentos con AWS S3

## 1. Instalar Dependencias

Ejecuta el siguiente comando en la carpeta `api-consultorio`:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
```

## 2. Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=consultorio-documentos
```

## 3. Crear Bucket en AWS S3

### Opción A: Usando AWS Console
1. Ve a https://console.aws.amazon.com/s3/
2. Haz clic en "Create bucket"
3. Nombre del bucket: `consultorio-documentos` (o el que prefieras)
4. Región: `us-east-1` (o la que prefieras)
5. Desbloquea "Block all public access" (necesitamos acceso controlado)
6. Habilita "Bucket Versioning" (opcional pero recomendado)
7. Crea el bucket

### Configurar CORS en el Bucket
En la pestaña "Permissions" del bucket, agrega esta configuración CORS:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:3001", "https://tu-dominio.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

### Configurar Política del Bucket (Bucket Policy)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::consultorio-documentos/*"
        }
    ]
}
```

## 4. Crear Usuario IAM con Permisos

1. Ve a IAM en AWS Console
2. Crea un nuevo usuario: `consultorio-app`
3. Tipo de acceso: "Programmatic access"
4. Adjunta la política: `AmazonS3FullAccess` (o crea una política personalizada más restrictiva)
5. Guarda el `Access Key ID` y `Secret Access Key`

### Política IAM Personalizada (Más Segura)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::consultorio-documentos",
                "arn:aws:s3:::consultorio-documentos/*"
            ]
        }
    ]
}
```

## 5. Estructura de Archivos en S3

Los archivos se organizarán así:
```
consultorio-documentos/
└── documentos/
    ├── 1701234567890-a1b2c3d4.pdf
    ├── 1701234567891-e5f6g7h8.jpg
    └── ...
```

## 6. Tipos de Documentos Permitidos

- PDF: `application/pdf`
- Imágenes: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Excel: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

## 7. Límites

- Tamaño máximo por archivo: 10MB
- URLs firmadas válidas por: 1 hora (descarga) / 5 minutos (subida)

## 8. Endpoints de la API

### Subir Documento
```
POST /api/documentos
Content-Type: multipart/form-data

Body:
- file: archivo
- citaId: ID de la cita
- pacienteId: ID del paciente
- tipo: tipo de documento (receta, laboratorio, imagen, etc.)
- nombre: nombre del documento (opcional)
- descripcion: descripción (opcional)
```

### Obtener Documentos por Cita
```
GET /api/documentos/cita/:citaId
```

### Obtener Documentos por Paciente
```
GET /api/documentos/paciente/:pacienteId?page=1&limit=20
```

### Obtener Documento por ID
```
GET /api/documentos/:id
```

### Eliminar Documento
```
DELETE /api/documentos/:id
```

### Actualizar Información del Documento
```
PUT /api/documentos/:id
Body: { nombre, descripcion, tipo }
```

## 9. Seguridad

- Todos los endpoints requieren autenticación (JWT)
- Los usuarios solo pueden acceder a documentos de su consultorio
- Las URLs de descarga son firmadas y expiran en 1 hora
- Los archivos se validan por tipo y tamaño antes de subir

## 10. Costos Estimados de AWS S3

Para un consultorio pequeño/mediano:
- Almacenamiento: ~$0.023 por GB/mes
- Transferencia: Primeros 100GB gratis/mes
- Solicitudes: ~$0.0004 por 1000 solicitudes PUT
- Ejemplo: 1000 documentos (500MB) + 10,000 descargas/mes ≈ $1-2 USD/mes

## 11. Alternativas Gratuitas (Para Desarrollo)

Si no quieres usar AWS aún, puedes usar:
- **MinIO**: S3-compatible, self-hosted
- **Cloudinary**: 25GB gratis/mes
- **Supabase Storage**: 1GB gratis

## 12. Próximos Pasos

1. Instalar dependencias: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer`
2. Configurar variables de entorno en `.env`
3. Crear bucket en AWS S3
4. Reiniciar el servidor: `npm run dev`
5. Probar con Postman o el frontend
