import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../firebase';

const UploadBanner = () => {
  const [uploading, setUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, 'banners/fsn-banner1.png');
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setDownloadURL(url);
      alert("✅ Banner uploaded successfully!");
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert("❌ Failed to upload image");
    }
    setUploading(false);
  };

  return (
    <div className="p-6 text-white max-w-lg mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">Upload FSN Banner</h2>

      <input
        type="file"
        accept="image/png"
        onChange={handleUpload}
        className="mb-4"
      />

      {uploading && <p className="text-yellow-400">Uploading...</p>}

      {downloadURL && (
        <div className="mt-4">
          <p className="text-green-400 font-semibold mb-2">✅ Uploaded Successfully!</p>
          <a
            href={downloadURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline break-all"
          >
            {downloadURL}
          </a>
        </div>
      )}
    </div>
  );
};

export default UploadBanner;
