// 📁 Settings.tsx (translated and updated with corrected translation keys)

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { auth, db, storage } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Camera, 
  Crown, 
  Calendar, 
  ArrowRight,
  Upload,
  Eye,
  EyeOff,
  Bell,
  Palette,
  Shield,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  ChevronRight,
  Edit3,
  Save,
  X
} from 'lucide-react';
import PushNotificationManager from '../components/PushNotificationManager';

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
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    inApp: true,      // Added in-app notifications toggle
    marketing: false,
    security: true,
    rewards: true
  });

  // Appearance settings
  const [theme, setTheme] = useState('dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // UI States
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

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
        setTheme(data.theme || 'dark');
        setSoundEnabled(data.soundEnabled !== false);

        if (data.notifications) {
          setNotifications(prev => ({
            ...prev,
            ...data.notifications
          }));
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
      toast.error(t('settingsSection.pleaseSelectImageFirst'));
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
      toast.success(t('settingsSection.avatarUpdated'));
      setUploadProgress(0);
    } catch (error) {
      toast.error(t('settingsSection.uploadFailed'));
      setUploadProgress(0);
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { fullName });
      setEditingProfile(false);
      toast.success(t('settingsSection.profileUpdatedSuccessfully'));
    } catch (error) {
      toast.error(t('settingsSection.failedToUpdateProfile'));
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('settingsSection.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('settingsSection.passwordsDontMatch'));
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error(t('settingsSection.notAuthenticated'));
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t('settingsSection.passwordUpdated'));
    } catch {
      toast.error(t('settingsSection.failedToUpdatePassword'));
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

  const handleNotificationChange = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newValue }));

    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { 
        [`notifications.${key}`]: newValue 
      });
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.className = newTheme;

    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { theme: newTheme });
    }
  };

  const handleToggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);

    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { soundEnabled: newValue });
    }
  };

  const getPlanBadge = () => {
    if (plan === 'first' || plan === 'first-lifetime' || plan === 'first-6') {
      return (
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-3 py-1 rounded-full font-semibold">
            {t('settingsSection.firstClass')}
          </span>
        </div>
      );
    }
    if (plan === 'business') {
      return (
        <div className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
            {t('settingsSection.businessClass')}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="bg-gray-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
          {t('settingsSection.economyClass')}
        </span>
      </div>
    );
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const tabs = [
    { id: 'profile', label: t('settingsSection.profile'), icon: User },
    { id: 'security', label: t('settingsSection.securityTitle'), icon: Shield },
    { id: 'notifications', label: t('settingsSection.notificationsTitle'), icon: Bell },
    { id: 'appearance', label: t('settingsSection.appearanceTitle'), icon: Palette },
    { id: 'account', label: t('settingsSection.account'), icon: Crown }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {(previewUrl || avatarUrl) ? (
                      <img
                        src={previewUrl || avatarUrl}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                      />
                    ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center text-2xl font-bold border-2 border-white/20">
                        {fullName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <button
                      onClick={() => document.getElementById('avatar-input')?.click()}
                    className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>

                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />

                    {selectedFile && (
                      <div className="space-y-3">
                        <button
                          onClick={handleSaveAvatar}
                          disabled={isUploading}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4" />
                        {t('settingsSection.saveAvatar')}
                        </button>
                        
                        {isUploading && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-gray-300">
                              <span>{t('settingsSection.uploading')}</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="bg-white/10 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
                  </div>
                </div>

            {/* Profile Info */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{t('settingsSection.profileInformation')}</h3>
                {editingProfile ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('settingsSection.fullName')}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                    disabled={!editingProfile}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={t('settingsSection.enterFullName')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('settingsSection.emailAddress')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-gray-400 cursor-not-allowed"
                      placeholder={t('settingsSection.yourEmailAddress')}
                    />
                  </div>
                </div>
              </div>
                </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">{t('settingsSection.changePassword')}</h3>
                <div className="space-y-4">
                          <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('settingsSection.currentPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10"
                      placeholder={t('settingsSection.enterCurrentPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('settingsSection.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10"
                      placeholder={t('settingsSection.enterNewPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('settingsSection.confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-10"
                      placeholder={t('settingsSection.confirmNewPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {t('settingsSection.changePassword')}
                </button>
              </div>
                </div>
              </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">{t('settingsSection.notificationPreferences')}</h3>
              <div className="space-y-4">
                {/* Push Notification Permission UI */}
                <div className="mb-6">
                  <h4 className="text-white font-medium mb-3">{t('settingsSection.pushNotificationPermission')}</h4>
                  <PushNotificationManager />
                </div>
                
                {/* Notification toggles */}
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium capitalize">
                        {key === 'inApp' ? t('settingsSection.inAppNotifications') :
                         key === 'email' ? t('settingsSection.emailNotifications') : 
                         key === 'push' ? t('settingsSection.pushNotifications') :
                         key === 'marketing' ? t('settingsSection.marketingEmails') :
                         key === 'security' ? t('settingsSection.securityAlerts') :
                         key === 'rewards' ? t('settingsSection.rewardNotifications') : key}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {key === 'inApp' ? t('settingsSection.showNotificationsInsideApp') :
                         key === 'email' ? t('settingsSection.receiveNotificationsViaEmail') :
                         key === 'push' ? t('settingsSection.receivePushNotificationsOnDevice') :
                         key === 'marketing' ? t('settingsSection.receivePromotionalEmails') :
                         key === 'security' ? t('settingsSection.getNotifiedAboutSecurityEvents') :
                         key === 'rewards' ? t('settingsSection.getNotifiedAboutNewRewards') : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-green-500' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">{t('settingsSection.themeSettings')}</h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                      onClick={() => handleThemeChange('light')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all duration-200 ${
                        theme === 'light'
                      ? 'bg-white/20 border-white/40 shadow-lg'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                  <Sun className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('settingsSection.light')}</span>
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all duration-200 ${
                        theme === 'dark'
                      ? 'bg-white/20 border-white/40 shadow-lg'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                  <Moon className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('settingsSection.dark')}</span>
                    </button>
                    <button
                      onClick={() => handleThemeChange('system')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border transition-all duration-200 ${
                        theme === 'system'
                      ? 'bg-white/20 border-white/40 shadow-lg'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                  <Monitor className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('settingsSection.system')}</span>
                    </button>
                </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                  <h4 className="text-white font-medium">{t('settingsSection.soundEffects')}</h4>
                  <p className="text-sm text-gray-400">{t('settingsSection.enableSoundEffectsForInteractions')}</p>
                    </div>
                    <button
                      onClick={handleToggleSound}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        soundEnabled ? 'bg-green-500' : 'bg-gray-700'
                      }`}
                    >
                      {soundEnabled ? (
                        <Volume2 className="absolute left-1 w-4 h-4 text-white" />
                      ) : (
                        <VolumeX className="absolute left-1 w-4 h-4 text-white" />
                      )}
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          soundEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">{t('settingsSection.accountInformation')}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-300">{t('settingsSection.currentPlan')}</span>
                  {getPlanBadge()}
                </div>

                {subscriptionEnd && (
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <span className="text-gray-300">{t('settingsSection.subscriptionEnds')}</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium">{subscriptionEnd}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-300">{t('settingsSection.language')}</span>
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="ar">🇸🇦 العربية</option>
                    <option value="zh">🇨🇳 中文</option>
                  </select>
                </div>
              </div>
            </div>

            {!(plan === "first" || plan === "first-lifetime" || plan === "first_lifetime") && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">{t('settingsSection.upgradeYourPlan')}</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  {t('settingsSection.unlockPremiumFeatures')}
                </p>
                <button
                  onClick={() => navigate("/membership")}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-3 rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  {t('settingsSection.upgradeNow')}
                  <ArrowRight className="w-4 h-4" />
                </button>
                    </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t('settingsSection.title')}</h1>
                <p className="text-gray-300">{t('settingsSection.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                      <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${
                        activeTab === tab.id ? 'rotate-90' : ''
                      }`} />
                    </button>
                  );
                })}
              </nav>
                  </div>
                </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;