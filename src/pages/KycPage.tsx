import { useState } from 'react';
import { Upload } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import uploadToCloudinary from '../utils/uploadToCloudinary';
import IDFront from '../assets/id_front.jpg';
import IDBack from '../assets/id_back.jpg';
import IDSelfie from '../assets/selfie-sample.jpg';
import { useTranslation } from 'react-i18next';

const KycPage = () => {
  const { t } = useTranslation();
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!idFront || !idBack || !selfie) {
      setMessage(t('kyc.uploadAllDocuments'));
      return;
    }

    setUploading(true);
    try {
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadToCloudinary(idFront),
        uploadToCloudinary(idBack),
        uploadToCloudinary(selfie),
      ]);

      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        kycStatus: 'Pending',
        kycDocuments: {
          idFront: frontUrl,
          idBack: backUrl,
          selfie: selfieUrl,
        },
      });

      setMessage(t('kyc.uploadSuccess'));
    } catch (err) {
      console.error(err);
      setMessage(t('kyc.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10 md:px-10">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">{t('kyc.title')}</h1>

      <section className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">{t('kyc.idsAccepted.title')}</h2>
          <ul className="list-disc pl-6 text-gray-300 space-y-1">
            <li>{t('kyc.idsAccepted.option1')}</li>
            <li>{t('kyc.idsAccepted.option2')}</li>
            <li>{t('kyc.idsAccepted.option3')}</li>
            <li>{t('kyc.idsAccepted.option4')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">{t('kyc.idPhotos.title')}</h2>
          <ul className="list-disc pl-6 text-gray-300 space-y-1">
            <li>{t('kyc.idPhotos.option1')}</li>
            <li>{t('kyc.idPhotos.option2')}</li>
            <li>{t('kyc.idPhotos.option3')}</li>
            <li>{t('kyc.idPhotos.option4')}</li>
          </ul>
          <div className="flex gap-4 mt-4">
            <div>
              <img src={IDFront} alt="ID Front Sample" className="rounded-lg shadow w-60" />
              <p className="text-sm text-center text-gray-400 mt-2">{t('kyc.samples.front')}</p>
            </div>
            <div>
              <img src={IDBack} alt="ID Back Sample" className="rounded-lg shadow w-60" />
              <p className="text-sm text-center text-gray-400 mt-2">{t('kyc.samples.back')}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">{t('kyc.selfie.title')}</h2>
          <ul className="list-disc pl-6 text-gray-300 space-y-1">
            <li>{t('kyc.selfie.option1')}</li>
            <li>{t('kyc.selfie.option2')}</li>
            <li>{t('kyc.selfie.option3')}</li>
            <li>{t('kyc.selfie.option4')}</li>
            <li>{t('kyc.selfie.option5')}</li>
          </ul>
          <div className="mt-4">
            <img src={IDSelfie} alt="Selfie Sample" className="rounded-lg shadow w-60" />
            <p className="text-sm text-center text-gray-400 mt-2">{t('kyc.samples.selfie')}</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">{t('kyc.uploadSection.title')}</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm mb-1">
                <Upload size={16} className="text-yellow-400" />
                {t('kyc.uploadSection.front')}
              </label>
              <input type="file" accept="image/*" onChange={(e) => setIdFront(e.target.files?.[0] || null)} className="bg-gray-800 p-2 rounded w-full" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm mb-1">
                <Upload size={16} className="text-yellow-400" />
                {t('kyc.uploadSection.back')}
              </label>
              <input type="file" accept="image/*" onChange={(e) => setIdBack(e.target.files?.[0] || null)} className="bg-gray-800 p-2 rounded w-full" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm mb-1">
                <Upload size={16} className="text-yellow-400" />
                {t('kyc.uploadSection.selfie')}
              </label>
              <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} className="bg-gray-800 p-2 rounded w-full" />
            </div>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6 py-2 rounded mt-4"
            >
              {uploading ? t('kyc.uploading') : t('kyc.submit')}
            </button>
            {message && <p className="text-sm text-green-400 mt-2">{message}</p>}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-10 border-t pt-4">
          <h3 className="text-yellow-400 font-bold mb-2">{t('kyc.disclaimer.title')}</h3>
          <p>{t('kyc.disclaimer.content')}</p>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">{t('kyc.faq.title')}</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <p className="font-semibold">{t('kyc.faq.q1')}</p>
              <p>{t('kyc.faq.a1')}</p>
            </div>
            <div>
              <p className="font-semibold">{t('kyc.faq.q2')}</p>
              <p>{t('kyc.faq.a2')}</p>
            </div>
            <div>
              <p className="font-semibold">{t('kyc.faq.q3')}</p>
              <p>{t('kyc.faq.a3')}</p>
            </div>
            <div>
              <p className="font-semibold">{t('kyc.faq.q4')}</p>
              <p>{t('kyc.faq.a4')}</p>
            </div>
            <div>
              <p className="font-semibold">{t('kyc.faq.q5')}</p>
              <p>{t('kyc.faq.a5')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KycPage;
