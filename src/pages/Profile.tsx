import { useState } from 'react';

const Profile = () => {
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [kycFile, setKycFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setKycFile(e.target.files[0]);
      setTimeout(() => setIsKycVerified(true), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 text-white bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-yellow-400">Your Profile</h1>

      <div className="bg-gray-800/70 backdrop-blur-lg p-6 rounded-2xl shadow-2xl space-y-6">
        <div>
          <p className="text-gray-400 text-sm">Email:</p>
          <p className="text-lg font-semibold">user@example.com</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Registered on:</p>
          <p className="text-lg">April 2025</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">Current Plan:</p>
          <p className="text-yellow-400 font-bold">Economy Class</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm">FSN Balance:</p>
          <p className="text-2xl font-extrabold text-yellow-300">1200 FSN</p>
        </div>

        <div className="pt-4 border-t border-gray-700">
          <p className="text-gray-400 text-sm mb-2">KYC Verification:</p>
          {isKycVerified ? (
            <p className="text-green-400 font-semibold">✅ Verified</p>
          ) : (
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-yellow-500 file:text-white hover:file:bg-yellow-400"
              />
              {kycFile && <p className="text-sm text-gray-400">File uploaded: {kycFile.name}</p>}
              <p className="text-red-400">⛔ Not Verified</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-700 flex flex-col sm:flex-row gap-4 justify-between">
          <button className="bg-yellow-500 hover:bg-yellow-400 text-black py-2 px-6 rounded-md font-semibold transition">
            Change Plan
          </button>
          <button className="bg-red-600 hover:bg-red-500 text-white py-2 px-6 rounded-md font-semibold transition">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;