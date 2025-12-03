import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  resourceType: string;
}

/*** Upload file to Cloudinary*/
export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string = 'chat-app/attachments'
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip'],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            resourceType: result.resource_type,
          });
        } else {
          reject(new Error('Upload failed'));
        }
      }
    );

    // Convert buffer to stream and pipe to cloudinary
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
}

/*** Delete file from Cloudinary*/
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
}
