// 📁 Settings.tsx (translated and updated with corrected translation keys)

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { auth, db, storage } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [plan, setPlan] = useState("economy");
  const [subscriptionEnd, setSubscriptionEnd] = useState("");
  const [language, setLanguage] = useState(i18n.language || "en");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
        setLanguage(data.language || i18n.language);
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

  const uploadImageToFirebase = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    return new Promise((resolve, reject) => {
      const user = auth.currentUser;
      if (!user) return reject("User not authenticated");

      const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          setIsUploading(false);
          reject(error);
        },
        async () => {
          setIsUploading(false);
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile) {
      toast.error(t("settingsSection.selectImage"));
      return;
    }

    try {
      const imageUrl = await uploadImageToFirebase(selectedFile);
      if (!imageUrl) throw new Error("No image URL returned");

      if (!auth.currentUser) return;

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { avatarUrl: imageUrl });
      setAvatarUrl(imageUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success(t("settingsSection.avatarUpdated"));
      setUploadProgress(0);
    } catch (error) {
      toast.error(t("settingsSection.uploadFailed"));
      setUploadProgress(0);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("settingsSection.fillAllFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("settingsSection.passwordMismatch"));
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error(t("settingsSection.notAuthenticated"));
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("settingsSection.passwordUpdated"));
    } catch {
      toast.error(t("settingsSection.updateFailed"));
    }
  };

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    i18n.changeLanguage(newLang);

    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { language: newLang });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 bg-[#0B1622] text-white rounded-lg overflow-hidden">
      {/* Profile Section */}
      <section className="mb-10">
        <h2 className="text-yellow-400 text-2xl mb-4 font-bold">{t("settingsSection.profileTitle")}</h2>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
          {(previewUrl || avatarUrl) ? (
            <img
              src={previewUrl || avatarUrl}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-yellow-400 shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-yellow-400 flex items-center justify-center text-sm text-gray-400 bg-gray-800">
              {t("settingsSection.noImage")}
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
              {t("settingsSection.saveAvatar")}
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
          <label className="block mb-1">{t("settingsSection.fullName")}</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-1">{t("settingsSection.email")}</label>
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
        <h2 className="text-yellow-400 text-2xl mb-4 font-bold">{t("settingsSection.accountTitle")}</h2>
        <p className="mb-2">
          {t("settingsSection.currentPlan")} <span className="font-semibold text-yellow-400">{plan}</span>
        </p>
        {subscriptionEnd && (
          <p className="mb-4">
            {t("settingsSection.subscriptionEnds")} <span>{subscriptionEnd}</span>
          </p>
        )}
        {!(plan === "first" || plan === "first-lifetime" || plan === "first_lifetime") && (
          <button
            onClick={() => navigate("/membership")}
            className="bg-yellow-400 text-black px-4 py-2 rounded"
          >
            {t("settingsSection.upgrade")}
          </button>
        )}
      </section>

      {/* Password Change */}
      <section className="mb-10">
        <h2 className="text-yellow-400 text-2xl mb-4 font-bold">{t("settingsSection.passwordTitle")}</h2>
        <div className="mb-4">
          <label className="block mb-1">{t("settingsSection.currentPassword")}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">{t("settingsSection.newPassword")}</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1">{t("settingsSection.confirmPassword")}</label>
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
          {t("settingsSection.changePassword")}
        </button>
      </section>

      {/* Language Selection */}
      <section>
        <h2 className="text-yellow-400 text-2xl mb-4 font-bold">{t("settingsSection.languageTitle")}</h2>
        <select
          value={language}
          onChange={handleLanguageChange}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </section>
    </div>
  );
};

export default Settings;