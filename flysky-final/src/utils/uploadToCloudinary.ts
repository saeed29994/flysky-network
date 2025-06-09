// src/utils/uploadToCloudinary.ts

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = 'dkl4uneh2';
  const uploadPreset = 'kyc_upload';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await res.json();
  return data.secure_url; // Return the image URL
};

export default uploadToCloudinary;
