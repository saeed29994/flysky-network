import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase'; // تأكد أن لديك تهيئة Firebase

const storage = getStorage(app);

export const uploadBanner = async (file: File): Promise<string> => {
  const storageRef = ref(storage, `banners/fsn-banner1.png`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};
