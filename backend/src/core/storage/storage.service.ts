import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    mimeType: string,
  ): Promise<{ s3Key: string; size: number }> {
    try {
      const publicId = `${folder}/${uuidv4()}`;
      const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw';

      const result = await new Promise<{ public_id: string; bytes: number }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              public_id: publicId,
              resource_type: resourceType,
              folder: undefined, // folder is already in publicId
            },
            (error, result) => {
              if (error || !result) {
                reject(error || new Error('Upload failed'));
              } else {
                resolve({ public_id: result.public_id, bytes: result.bytes });
              }
            },
          );
          const readable = Readable.from(buffer);
          readable.pipe(uploadStream);
        },
      );

      return { s3Key: result.public_id, size: result.bytes };
    } catch {
      throw new InternalServerErrorException(
        'Failed to upload file to Cloudinary',
      );
    }
  }

  async getPresignedUrl(s3Key: string, expiresIn = 3600): Promise<string> {
    // Determine resource type from the key path
    const resourceType =
      s3Key.includes('profile') || s3Key.includes('logo') ? 'image' : 'raw';

    // Generate a signed URL with expiration
    const timestamp = Math.round(Date.now() / 1000) + expiresIn;
    const url = cloudinary.utils.private_download_url(s3Key, '', {
      resource_type: resourceType,
      type: 'upload',
      expires_at: timestamp,
    });
    return url;
  }

  async deleteObject(s3Key: string): Promise<void> {
    // Try both resource types since we may not know which it is
    try {
      await cloudinary.uploader.destroy(s3Key, { resource_type: 'raw' });
    } catch {
      await cloudinary.uploader.destroy(s3Key, { resource_type: 'image' });
    }
  }
}
