import { useState } from 'react';
import { Upload } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import uploadToCloudinary from '../utils/uploadToCloudinary';
import IDFront from '../assets/id_front.jpg';
import IDBack from '../assets/id_back.jpg';
import IDSelfie from '../assets/selfie-sample.jpg';

const KycPage = () => {
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!idFront || !idBack || !selfie) {
      setMessage('Please upload all required documents.');
      return;
    }

    setUploading(true);
    try {
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadToCloudinary(idFront),
        uploadToCloudinary(idBack),
        uploadToCloudinary(selfie)
      ]);

      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        kycStatus: 'Pending',
        kycDocuments: {
          idFront: frontUrl,
          idBack: backUrl,
          selfie: selfieUrl
        }
      });

      setMessage('✅ Documents uploaded successfully! Your KYC status is now Pending.');
    } catch (err) {
      console.error(err);
      setMessage('❌ Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10 md:px-10">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">KYC Verification Guide</h1>

      <section className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Which IDs are acceptable?</h2>
          <ul className="list-disc pl-6 text-gray-300 space-y-1">
            <li>Passport, national ID card, driver’s license, or any government-issued ID.</li>
            <li>ID must be valid and unexpired.</li>
            <li>Must show profile photo and date of birth.</li>
            <li>All information must be clear and readable.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">How to properly take photos of your ID?</h2>
          <ul className="list-disc pl-6 text-gray-300 space-y-1">
            <li>Photos must be in color.</li>
            <li>ID must be original — no screenshots, copies, or photos of screens.</li>
            <li>All corners of the document must be visible.</li>
            <li>Both front and back must be uploaded (unless ID has one side only).</li>
          </ul>
          <div className="flex gap-4 mt-4">
            <div>
              <img src={IDFront} alt="ID Front Sample" className="rounded-lg shadow w-60" />
              <p className="text-sm text-center text-gray-400 mt-2">Front ID Sample</p>
            </div>
            <div>
              <img src={IDBack} alt="ID Back Sample" className="rounded-lg shadow w-60" />
              <p className="text-sm text-center text-gray-400 mt-2">Back ID Sample</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Selfie Holding ID Instructions</h2>
          <ul className="list-disc pl-6 text-gray-300 space-y-1">
            <li>Use same ID submitted above.</li>
            <li>ID must be facing camera clearly and fully visible.</li>
            <li>Your face must be unobstructed (no masks, glasses, hats, etc.).</li>
            <li>Use a well-lit environment.</li>
            <li>Ensure ID and face are clear and not blocked.</li>
          </ul>
          <div className="mt-4">
            <img src={IDSelfie} alt="Selfie Sample" className="rounded-lg shadow w-60" />
            <p className="text-sm text-center text-gray-400 mt-2">Selfie Sample</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Upload Documents</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm mb-1">
                <Upload size={16} className="text-yellow-400" />
                Front of ID
              </label>
              <input type="file" accept="image/*" onChange={(e) => setIdFront(e.target.files?.[0] || null)} className="bg-gray-800 p-2 rounded w-full" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm mb-1">
                <Upload size={16} className="text-yellow-400" />
                Back of ID
              </label>
              <input type="file" accept="image/*" onChange={(e) => setIdBack(e.target.files?.[0] || null)} className="bg-gray-800 p-2 rounded w-full" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm mb-1">
                <Upload size={16} className="text-yellow-400" />
                Selfie Holding ID
              </label>
              <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} className="bg-gray-800 p-2 rounded w-full" />
            </div>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6 py-2 rounded mt-4"
            >
              {uploading ? 'Uploading...' : 'Submit Documents'}
            </button>
            {message && <p className="text-sm text-green-400 mt-2">{message}</p>}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-10 border-t pt-4">
          <h3 className="text-yellow-400 font-bold mb-2">Disclaimer</h3>
          <p>
            This guide is provided by <strong>FlySky Network</strong> for informational purposes only. The information collected is used solely for identity verification. Crypto/digital asset investments involve risk. Consult your legal/tax/investment professional if needed.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">FAQ</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <p className="font-semibold">What happens after I upload my documents?</p>
              <p>Our team will review them within 1–3 business days. You’ll be notified of approval or rejection.</p>
            </div>
            <div>
              <p className="font-semibold">Can I use my driver’s license?</p>
              <p>Yes, as long as it’s government-issued and shows your photo and date of birth.</p>
            </div>
            <div>
              <p className="font-semibold">What if my ID has no back side?</p>
              <p>If your ID (like a passport) has only one side, just upload the front only.</p>
            </div>
            <div>
              <p className="font-semibold">What file formats are accepted?</p>
              <p>We accept images in JPG, PNG, or JPEG format.</p>
            </div>
            <div>
              <p className="font-semibold">What if my KYC was rejected?</p>
              <p>You will receive a reason. You can re-upload corrected documents.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KycPage;
