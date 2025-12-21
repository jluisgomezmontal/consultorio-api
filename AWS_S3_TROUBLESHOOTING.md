# AWS S3 Signature Error - Troubleshooting Guide

## Error Description
```
SignatureDoesNotMatch: The request signature we calculated does not match the signature you provided. Check your key and signing method.
```

## Common Causes

### 1. **Incorrect AWS Credentials**
The most common cause is incorrect or expired AWS credentials in your `.env` file.

**Solution:**
- Verify your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env`
- Make sure there are no extra spaces or quotes around the values
- Ensure the IAM user has `s3:PutObject` permissions

### 2. **Wrong AWS Region**
The bucket might be in a different region than specified.

**Solution:**
- Check your bucket's actual region in AWS Console
- Update `AWS_REGION` in `.env` to match
- Common regions: `us-east-1`, `us-west-2`, `eu-west-1`

### 3. **Bucket Name Mismatch**
The bucket name in `.env` doesn't match the actual bucket.

**Solution:**
- Verify `AWS_S3_BUCKET` matches your actual bucket name
- Bucket names are case-sensitive

### 4. **IAM Permissions**
The IAM user doesn't have sufficient permissions.

**Required IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### 5. **System Clock Skew**
Your server's time is significantly different from AWS time.

**Solution:**
- Ensure your system clock is synchronized
- On Windows: Run `w32tm /resync` as administrator
- On Linux: Run `sudo ntpdate -s time.nist.gov`

## How to Fix

### Step 1: Verify Environment Variables
Check your `.env` file:
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Step 2: Test AWS Credentials
Create a test script to verify credentials:
```javascript
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

const testCredentials = async () => {
  const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    const command = new ListBucketsCommand({});
    const response = await client.send(command);
    console.log('✅ Credentials are valid!');
    console.log('Buckets:', response.Buckets.map(b => b.Name));
  } catch (error) {
    console.error('❌ Credentials test failed:', error.message);
  }
};

testCredentials();
```

### Step 3: Check IAM Permissions
1. Go to AWS IAM Console
2. Find your IAM user
3. Check attached policies
4. Ensure the policy includes S3 permissions for your bucket

### Step 4: Verify Bucket Configuration
1. Go to AWS S3 Console
2. Find your bucket
3. Check:
   - Bucket region matches `.env`
   - Bucket name matches `.env`
   - Block public access settings (if needed)

### Step 5: Check CORS Configuration (REQUIRED for image display)

**This is REQUIRED** for images to display in the browser. Without CORS, you'll see errors like:
- `A resource is blocked by OpaqueResponseBlocking`
- `NS_BINDING_ABORTED`
- Images won't load in the frontend

**How to configure CORS:**

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Select your bucket (e.g., `consultorio-documentos`)
3. Go to **Permissions** tab
4. Scroll to **Cross-origin resource sharing (CORS)**
5. Click **Edit**
6. Paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:3001",
      "http://localhost:3000",
      "https://yourdomain.com",
      "https://miconsultorio.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

7. Click **Save changes**
8. Wait 1-2 minutes for changes to propagate
9. Refresh your application

**Note:** Replace `https://yourdomain.com` with your actual production domain.

## Alternative: Use Presigned URLs
If you continue having issues, consider using presigned URLs for uploads:

```javascript
// Backend generates presigned URL
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const url = await getSignedUrl(s3Client, new PutObjectCommand({
  Bucket: 'your-bucket',
  Key: 'path/to/file.jpg',
  ContentType: 'image/jpeg',
}), { expiresIn: 300 });

// Frontend uploads directly to S3 using the presigned URL
await fetch(url, {
  method: 'PUT',
  body: fileBuffer,
  headers: { 'Content-Type': 'image/jpeg' },
});
```

## Debugging Tips

1. **Enable detailed logging** (already added to `s3.service.js`)
2. **Check server logs** for the exact error details
3. **Verify credentials format** - no spaces, no quotes
4. **Test with AWS CLI** to isolate the issue:
   ```bash
   aws s3 ls s3://your-bucket-name --region us-east-1
   ```

## Still Having Issues?

If none of the above solutions work:

1. **Create new IAM credentials**
   - Go to IAM Console
   - Create new access key
   - Update `.env` with new credentials

2. **Try a different bucket**
   - Create a new test bucket
   - Use it temporarily to isolate the issue

3. **Check AWS Service Health**
   - Visit https://status.aws.amazon.com/
   - Ensure S3 service is operational in your region

## Contact Support
If the issue persists, contact AWS Support with:
- Request ID from error logs
- Timestamp of failed request
- Bucket name and region
- IAM user ARN
