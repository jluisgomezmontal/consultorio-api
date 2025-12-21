import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET, S3_REGION } from '../config/aws.js';
import crypto from 'crypto';

class S3Service {
  /**
   * Genera un nombre único para el archivo
   */
  generateFileName(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  /**
   * Sube un archivo a S3
   */
  async uploadFile(file, folder = 'documentos') {
    try {
      const fileName = this.generateFileName(file.originalname);
      const key = `${folder}/${fileName}`;

      console.log(`📤 Uploading file to S3: ${key}`);
      console.log(`   Bucket: ${S3_BUCKET}, Region: ${S3_REGION}`);

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
        },
      });

      await s3Client.send(command);

      console.log(`✅ File uploaded successfully: ${key}`);

      return {
        key,
        url: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`,
      };
    } catch (error) {
      console.error('❌ S3 Upload Error:', {
        message: error.message,
        code: error.Code || error.code,
        statusCode: error.$metadata?.httpStatusCode,
        bucket: S3_BUCKET,
        region: S3_REGION,
      });
      throw error;
    }
  }

  /**
   * Obtiene una URL firmada para descargar un archivo (válida por 1 hora)
   */
  async getSignedDownloadUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Elimina un archivo de S3
   */
  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * Obtiene una URL firmada para subir un archivo directamente desde el frontend
   */
  async getSignedUploadUrl(fileName, mimeType, folder = 'documentos') {
    const key = `${folder}/${this.generateFileName(fileName)}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: mimeType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutos

    return {
      uploadUrl: signedUrl,
      key,
      url: `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`,
    };
  }
}

export default new S3Service();
