import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullName: string;
  email: string;
  plan: 'economy' | 'business' | 'first' | string;
  kycStatus: 'Not Actived' | 'Pending' | 'Approved';
  subscriptionEnd?: string;
  onUpgrade: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  fullName,
  email,
  plan,
  kycStatus,
  subscriptionEnd,
  onUpgrade
}) => {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showUploadInput, setShowUploadInput] = useState(false);

  const isOwner = auth.currentUser?.email === email;

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const data = userSnap.data();
      if (data?.avatarUrl) {
        setAvatarUrl(data.avatarUrl);
      }
    };
    fetchAvatar();
  }, []);

  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'Avatar');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dytflr9cy/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      return data.secure_url || null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    const imageUrl = await uploadImageToCloudinary(file);
    if (!imageUrl) {
      toast.error("❌ Failed to upload image");
      return;
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { avatarUrl: imageUrl });
      setAvatarUrl(imageUrl);
      toast.success("✅ Avatar updated successfully!");
      setShowUploadInput(false);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to save avatar URL");
    }
  };

  if (!isOpen) return null;

  const getPlanBadge = () => {
    if (plan === 'first' || plan === 'first-lifetime' || plan === 'first-6')
      return <span className="bg-yellow-400 text-black text-xs px-3 py-1 rounded-full">First Class</span>;
    if (plan === 'business')
      return <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Business Class</span>;
    return <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded-full">Economy Class</span>;
  };

  const getKYCStatus = () => {
    if (kycStatus === 'Approved')
      return <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">✅ Approved</span>;
    if (kycStatus === 'Pending')
      return <span className="bg-yellow-400 text-black text-xs px-3 py-1 rounded-full">🕓 Pending</span>;
    return (
      <button
        onClick={() => navigate('/kyc')}
        className="bg-red-500 text-white text-xs px-3 py-1 rounded-full hover:bg-red-600 transition"
      >
        ❌ Not Verified – Complete KYC
      </button>
    );
  };

  const statusMessage = () => {
    if (kycStatus !== 'Approved') return '⚠️ Complete your KYC to access full features.';
    if (plan === 'economy') return '🚀 You are on the free plan. Upgrade to unlock more benefits.';
    if (plan === 'business') return '🎯 Business Class gives you enhanced access. First Class unlocks full potential.';
    return '👑 You are enjoying full access with First Class membership.';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md text-white relative shadow-2xl border border-yellow-500">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-300 hover:text-white">
          <X size={20} />
        </button>

        <div className="text-center mb-4">
          <div className="relative w-20 h-20 mx-auto mb-2">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                onClick={() => isOwner && setShowUploadInput(true)}
                className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400 cursor-pointer"
              />
            ) : (
              <div
                onClick={() => isOwner && setShowUploadInput(true)}
                className="w-20 h-20 rounded-full bg-yellow-500 text-black flex items-center justify-center text-3xl font-bold border-2 border-yellow-400 cursor-pointer"
              >
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}

            {/* ✏️ أيقونة القلم */}
            {isOwner && (
              <div
                className="absolute bottom-0 right-0 bg-gray-800 border border-white p-1 rounded-full shadow-md cursor-pointer"
                title="Change avatar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-yellow-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M17.414 2.586a2 2 0 00-2.828 0l-1.172 1.172 2.828 2.828 1.172-1.172a2 2 0 000-2.828zM2 13.586V17h3.414l9.173-9.172-2.828-2.828L2 13.586z" />
                </svg>
              </div>
            )}

            {/* زر اختيار الصورة */}
            {showUploadInput && isOwner && (
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 mt-2 text-xs text-gray-300 bg-gray-800 p-1 rounded shadow-md"
              />
            )}
          </div>

          <h2 className="text-xl font-semibold">{fullName}</h2>
          <p className="text-sm text-gray-400">{email}</p>
        </div>

        <div className="space-y-3 mt-6 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Membership</span>
            {getPlanBadge()}
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">KYC Status</span>
            {getKYCStatus()}
          </div>

          {subscriptionEnd && (
            <div className="flex justify-between">
              <span className="text-gray-400">Expires On</span>
              <span className="text-white">{subscriptionEnd}</span>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300 italic">{statusMessage()}</p>

          {(plan !== 'first' && plan !== 'first-lifetime' && plan !== 'first-6') && (
            <button
              onClick={onUpgrade}
              className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-400"
            >
              🚀 Upgrade Membership
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
