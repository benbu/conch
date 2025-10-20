// Image upload and processing service
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { getFirebaseStorage } from '../lib/firebase';

const storage = getFirebaseStorage();
const MAX_IMAGE_SIZE = 1920; // Max width or height
const COMPRESSION_QUALITY = 0.8;

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

/**
 * Request camera permissions
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Pick image from gallery
 */
export async function pickImageFromGallery(): Promise<ImagePicker.ImagePickerAsset | null> {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) {
    throw new Error('Media library permission denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
}

/**
 * Take photo with camera
 */
export async function takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    throw new Error('Camera permission denied');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
}

/**
 * Compress and resize image
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    const manipulateResult = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMAGE_SIZE } }],
      {
        compress: COMPRESSION_QUALITY,
        format: SaveFormat.JPEG,
      }
    );

    return manipulateResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

/**
 * Upload image to Firebase Storage
 */
export async function uploadImage(
  uri: string,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    // Compress image first
    const compressedUri = await compressImage(uri);

    // Convert URI to blob
    const response = await fetch(compressedUri);
    const blob = await response.blob();

    // Create storage reference
    const storageRef = ref(storage, path);

    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress callback
          if (onProgress) {
            const progress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            };
            onProgress(progress);
          }
        },
        (error) => {
          // Error callback
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Success callback
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Upload image for conversation
 */
export async function uploadConversationImage(
  conversationId: string,
  uri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}.jpg`;
  const path = `conversations/${conversationId}/images/${fileName}`;
  
  return uploadImage(uri, path, onProgress);
}

/**
 * Upload user profile image
 */
export async function uploadProfileImage(
  userId: string,
  uri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const path = `users/${userId}/profile.jpg`;
  return uploadImage(uri, path, onProgress);
}

/**
 * Generate thumbnail URL (placeholder - would need backend processing)
 */
export function getThumbnailUrl(imageUrl: string): string {
  // For now, return the same URL
  // In production, you might want to generate thumbnails on the server
  // or use a service like Firebase Extensions for image resizing
  return imageUrl;
}

