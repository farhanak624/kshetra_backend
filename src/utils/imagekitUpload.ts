import imagekit from '../config/imagekit';

export interface ImageUploadOptions {
  folder: string;
  fileName?: string;
  useUniqueFileName?: boolean;
  transformation?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

export const uploadImageToImageKit = async (
  buffer: Buffer,
  options: ImageUploadOptions
): Promise<string> => {
  // Check if ImageKit is configured
  if (!process.env.IMAGEKIT_PRIVATE_KEY || process.env.IMAGEKIT_PRIVATE_KEY === 'your-imagekit-private-key') {
    console.warn('⚠️ ImageKit not configured - skipping image upload');
    return 'https://via.placeholder.com/800x600?text=No+Image';
  }

  try {
    const uploadOptions: any = {
      file: buffer,
      fileName: options.fileName || `image_${Date.now()}`,
      folder: options.folder,
      useUniqueFileName: options.useUniqueFileName !== false,
    };

    // Add transformation if provided
    if (options.transformation) {
      const transformations = [];
      if (options.transformation.width || options.transformation.height) {
        transformations.push(`w-${options.transformation.width || 'auto'},h-${options.transformation.height || 'auto'}`);
      }
      if (options.transformation.quality) {
        transformations.push(`q-${options.transformation.quality}`);
      }
      if (transformations.length > 0) {
        uploadOptions.transformation = {
          pre: transformations.join(',')
        };
      }
    }

    const result = await imagekit.upload(uploadOptions);
    return result.url;
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw new Error('Failed to upload image to ImageKit');
  }
};

export const uploadMultipleImages = async (
  files: Express.Multer.File[],
  options: ImageUploadOptions
): Promise<string[]> => {
  const uploadPromises = files.map((file, index) => {
    const fileOptions = {
      ...options,
      fileName: options.fileName ? `${options.fileName}_${index + 1}` : undefined,
    };
    return uploadImageToImageKit(file.buffer, fileOptions);
  });

  return Promise.all(uploadPromises);
};

export const deleteImageFromImageKit = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file ID from ImageKit URL
    const fileId = extractFileIdFromUrl(imageUrl);
    if (fileId) {
      await imagekit.deleteFile(fileId);
    }
  } catch (error) {
    console.error('Error deleting image from ImageKit:', error);
  }
};

const extractFileIdFromUrl = (url: string): string | null => {
  // ImageKit URL pattern: https://ik.imagekit.io/your_imagekit_id/path/filename.ext
  // We need to extract the path after the imagekit ID to get the fileId
  try {
    const urlParts = url.split('/');
    const imagekitIndex = urlParts.findIndex(part => part.includes('imagekit.io'));
    if (imagekitIndex !== -1 && urlParts.length > imagekitIndex + 2) {
      // Join the path parts after the imagekit ID
      const filePath = urlParts.slice(imagekitIndex + 2).join('/');
      return filePath;
    }
  } catch (error) {
    console.error('Error extracting file ID from URL:', error);
  }
  return null;
};

// Predefined folder constants
export const IMAGE_FOLDERS = {
  DRIVERS: {
    LICENSES: '/drivers/licenses',
    PROFILES: '/drivers/profiles'
  },
  VEHICLES: '/vehicles',
  YOGA: {
    TEACHERS: '/yoga/teachers',
    COURSES: '/yoga/courses'
  },
  RESORTS: {
    ROOMS: '/resorts/rooms'
  }
} as const;

// Predefined transformation presets
export const IMAGE_TRANSFORMATIONS = {
  PROFILE_PHOTO: {
    width: 400,
    height: 400,
    quality: 90
  },
  VEHICLE_PHOTO: {
    width: 800,
    height: 600,
    quality: 85
  },
  COURSE_THUMBNAIL: {
    width: 600,
    height: 400,
    quality: 80
  },
  LICENSE_DOCUMENT: {
    width: 1200,
    height: 800,
    quality: 95
  }
} as const;