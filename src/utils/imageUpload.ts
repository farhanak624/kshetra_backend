import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

export const uploadImageToCloudinary = async (
  buffer: Buffer,
  folder: string = 'resort-rooms'
): Promise<string> => {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'your-api-key') {
    console.warn('⚠️ Cloudinary not configured - skipping image upload');
    return 'https://via.placeholder.com/800x600?text=No+Image';
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

export const uploadMultipleImages = async (
  files: Express.Multer.File[],
  folder: string = 'resort-rooms'
): Promise<string[]> => {
  const uploadPromises = files.map(file => 
    uploadImageToCloudinary(file.buffer, folder)
  );
  
  return Promise.all(uploadPromises);
};

export const deleteImageFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
  }
};

const extractPublicIdFromUrl = (url: string): string | null => {
  const regex = /\/([^/]+)\.(jpg|jpeg|png|gif|webp)$/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};