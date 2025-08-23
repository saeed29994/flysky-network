import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      {/* ✅ FlySky Network Logo */}
      <div className="flex items-center justify-center mb-10 space-x-4">
        <img
          src="/fsn-logo.png"
          alt="FSN Logo"
          className="w-12 h-12 sm:w-16 sm:h-16"
        />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center">
          <span className="text-yellow-400">Fly</span>
          <span className="text-sky-400">Sky</span>{' '}
          <span className="text-yellow-400">Network</span>
        </h1>
      </div>

      <div className="max-w-4xl mx-auto ">
        <h2 className="text-2xl font-bold mb-4 text-start text-yellow-400">
          Privacy Policy
        </h2>
        <p className="text-sm text-gray-300 mb-6 text-start">Last Updated: January 2025</p>

        <div className="space-y-6 text-sm leading-6 text-gray-200">
          <p className="text-base text-gray-100">
            At FlySky Network, we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, and safeguard your data when using our platform.
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">1. Information We Collect</h3>
              <p className="mb-3">We may collect the following information from users:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-gray-300">
                <li>Email address</li>
                <li>Wallet address</li>
                <li>KYC documents and identity verification data</li>
                <li>Subscription details and activity logs</li>
                <li>Technical information via third-party services such as Firebase and Metamask</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">2. How We Use Your Information</h3>
              <p className="mb-3">We use the collected data for the following purposes:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-gray-300">
                <li>To operate, improve, and secure our services</li>
                <li>To verify user identity (KYC)</li>
                <li>To provide access to mining, staking, subscription, and rewards features</li>
                <li>To send system notifications and updates</li>
                <li>To comply with legal and regulatory obligations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">3. Data Sharing</h3>
              <ul className="list-disc list-inside space-y-1 ml-4 text-gray-300">
                <li>We may share limited data with trusted technical partners only for the purpose of service operation.</li>
                <li>We do not sell, rent, or trade personal data to third parties.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">4. User Rights</h3>
              <ul className="list-disc list-inside space-y-1 ml-4 text-gray-300">
                <li>You can access and update your account information at any time from within the app.</li>
                <li>You have the right to request deletion of your account and associated data through multiple methods:</li>
                <ul className="list-disc list-inside space-y-1 ml-8 mt-2">
                  <li><strong>In-App:</strong> Settings → Privacy & Data tab</li>
                  <li><strong>Web Portal:</strong> <a href="/data-deletion" className="text-blue-400 hover:text-blue-300 underline">Public Data Deletion Request Form</a></li>
                  <li><strong>Email:</strong> support@fsncrew.io</li>
                </ul>
                <li>Data deletion requests are processed within 90 days and you will receive email confirmation at each stage.</li>
                <li>You can contact us at <span className="text-yellow-400 font-semibold">support@fsncrew.io</span> for any privacy-related inquiries.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">5. Data Security</h3>
              <p className="text-gray-300">
                We implement reasonable technical and organizational measures to protect your information from unauthorized access, alteration, or disclosure. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">6. Third-Party Services</h3>
              <p className="text-gray-300">
                Our platform may use third-party services (such as Firebase, Metamask, and others). Please note that these services operate under their own privacy policies, and we are not responsible for their practices.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">7. Age Restriction</h3>
              <p className="text-gray-300">
                Our services are intended for users aged 18 years or older. By using the platform, you confirm that you meet this minimum age requirement.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">8. Changes to this Policy</h3>
              <p className="text-gray-300">
                We may update this Privacy Policy from time to time. Any changes will be published on this page, and continued use of the platform indicates your acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">9. Contact Us</h3>
              <p className="text-gray-300 mb-2">
                If you have any questions or concerns about this Privacy Policy, please contact us at:
              </p>
              <p className="text-yellow-400 font-semibold">📧 support@fsncrew.io</p>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mt-8">
            <p className="text-center font-bold text-yellow-400">
              🔒 By using FlySky Network, you agree that you have read, understood, and accepted this Privacy Policy.
            </p>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link to="/" className="text-sky-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
