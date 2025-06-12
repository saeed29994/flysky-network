import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Settings = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [plan, setPlan] = useState("economy");
  const [subscriptionEnd, setSubscriptionEnd] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setEmail(user.email || "");

      const userDoc = doc(db, "users", user.uid);
      const snap = await getDoc(userDoc);
      if (snap.exists()) {
        const data = snap.data();
        setFullName(data.fullName || "");
        setAvatarUrl(data.avatarUrl || "");
        setPlan(data.membership?.plan || "economy");
        if (data.membership?.subscriptionEnd) {
          setSubscriptionEnd(new Date(data.membership.subscriptionEnd).toLocaleDateString());
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    const url = "https://api.cloudinary.com/v1_1/dytflr9cy/image/upload";
    const preset = "Avatar";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        reject(new Error("Upload error"));
      };

      xhr.send(formData);
    });
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first.");
      return;
    }

    try {
      const imageUrl = await uploadImageToCloudinary(selectedFile);
      if (!imageUrl) throw new Error("No image URL returned");

      if (!auth.currentUser) return;

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { avatarUrl: imageUrl });
      setAvatarUrl(imageUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success("Avatar updated successfully!");
      setUploadProgress(0);
    } catch (error) {
      toast.error("Failed to upload avatar.");
      setUploadProgress(0);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error("User not authenticated.");
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully!");
    } catch {
      toast.error("Failed to update password. Please check your current password.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 bg-[#0B1622] text-white rounded-lg overflow-hidden">
      {/* Profile Section */}
      <section className="mb-10">
        <h2 className="text-yellow-400 text-2xl mb-4 font-bold">Profile Information</h2>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
          {(previewUrl || avatarUrl) ? (
            <img
              src={previewUrl || avatarUrl}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-yellow-400 shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-yellow-400 flex items-center justify-center text-sm text-gray-400 bg-gray-800">
              No Image
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
        {selectedFile && (
          <div className="mb-4 w-full">
            <button
              onClick={handleSaveAvatar}
              disabled={isUploading}
              className={`px-4 py-2 rounded bg-yellow-400 text-black font-semibold w-full sm:w-auto ${isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-500"}`}
            >
              Save Avatar
            </button>
            {isUploading && (
              <div className="mt-2 bg-gray-700 h-2 rounded overflow-hidden">
                <div
                  className="bg-yellow-400 h-2 rounded"
                  style={{ width: `${uploadProgress}%`, transition: "width 0.3s ease" }}
                />
              </div>
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full bg-gray-800 text-gray-400 border border-gray-600 rounded px-3 py-2 cursor-not-allowed"
          />
        </div>
      </section>

      {/* Account Status */}
      <section className="mb-10">
        <h2 className="text-yellow-400 text-2xl mb-4 font-bold">Account Status</h2>
        <p className="mb-2">
          Current Plan: <span className="font-semibold text-yellow-400">{plan}</span>
        </p>
        {subscriptionEnd && (
          <p className="mb-4">
            Subscription Ends On: <span>{subscriptionEnd}</span>
          </p>
        )}
        {!(plan === "first" || plan === "first-lifetime" || plan === "first_lifetime") && (
          <button
            onClick={() => navigate("/membership")}
            className="bg-yellow-400 text-black px-4 py-2 rounded"
          >
            Upgrade Plan
          </button>
        )}
      </section>

      {/* Password Change */}
      <section>
        <h2 className="text-yellow-400 text-2xl mb-4 font-bold">Change Password</h2>
        <div className="mb-4">
          <label className="block mb-1">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
        </div>
        <button
          onClick={handleChangePassword}
          className="bg-yellow-400 text-black px-4 py-2 rounded"
        >
          Change Password
        </button>
      </section>
    </div>
  );
};

export default Settings;
