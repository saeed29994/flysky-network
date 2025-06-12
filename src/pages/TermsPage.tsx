import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      {/* ✅ شعار FlySky Network */}
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

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center text-yellow-400">
          Terms and Conditions
        </h2>
        <p className="text-sm text-gray-300 mb-6 text-center">Last Updated: June 2025</p>

        <div className="space-y-6 text-sm leading-6 text-gray-200">
          <p><strong>1. General Information:</strong> FlySky Network is an online platform that offers services related to gaming, token-based mining, subscriptions, digital rewards, NFT marketplace, advertisements, and digital asset storage and transfers. The site is under development and currently does not hold any official license from a financial regulatory authority.</p>

          <p><strong>2. Acceptable Use:</strong> Users agree to use the Site for lawful purposes only and in a way that does not violate any laws, rights, or regulations. It is prohibited to use the Site for any fraudulent activity, money laundering, terrorism financing, or any legally prohibited activity.</p>

          <p><strong>3. Payments and Subscriptions:</strong> Digital assets (such as FSN) will not be transferred to the user's wallet until the token sale is successful and the FSN token is officially listed. If the token sale fails or the token is not listed for any reason, the Site is not obligated to refund or compensate any amounts or allocated tokens. Payments are made using BUSD on the BNB Smart Chain network, and we may add other cryptocurrencies in the future. Payments are non-refundable once the blockchain transaction is confirmed. Users are responsible for verifying transaction details and the selected plan before confirming payment.</p>

          <p><strong>4. Data and Privacy:</strong> We collect data such as email address, wallet address, KYC data, and user activity. We use third-party services such as Firebase, Metamask, and others. We may share data with technical partners solely for the purpose of service operation.</p>

          <p><strong>5. Intellectual Property:</strong> All logos, content, designs, and functionality on the Site are the exclusive property of FlySky Network or its licensors. Reuse or redistribution of any content without explicit written permission is prohibited.</p>

          <p><strong>6. Disclaimer of Liability:</strong> The Site and its services are provided "as is" without any warranties. We are not responsible for any financial, technical, or legal losses resulting from your use of the service. Your use of the Site is at your own risk.</p>

          <p><strong>7. Third-Party Advertising:</strong> The Site may include paid ads or external links. We are not responsible for the content or policies of those websites or advertised products.</p>

          <p><strong>8. User-Generated Content:</strong> Users affirm that any content they upload or publish on the platform (e.g., images, NFTs, usernames) does not violate intellectual property rights, privacy, or any applicable laws. The Site reserves the right to remove any content deemed inappropriate or in violation of these terms without prior notice.</p>

          <p><strong>9. Account Restrictions and Suspension:</strong> We reserve the right to suspend or terminate any user account without notice if fraudulent activity or violation of the terms is suspected. Access to services may be limited temporarily or permanently for operational or security reasons.</p>

          <p><strong>10. Pricing and Service Modifications:</strong> We reserve the right to change pricing, update subscription features, or modify any part of the services at any time. Users will be notified of significant changes via the Site or registered email.</p>

          <p><strong>11. Service Availability and Downtime:</strong> We do not guarantee availability of the Site or its services at all times. Some or all services may be suspended temporarily or permanently without liability for resulting damages or losses.</p>

          <p><strong>12. Technical Liability Limitations:</strong> We do not guarantee that the Site will be free from bugs or technical issues. We are not liable for losses resulting from network problems, wallets, smart contracts, or third-party integrations.</p>

          <p><strong>13. Account Security:</strong> Users are fully responsible for safeguarding their login credentials and linked wallet. The Site is not liable for unauthorized access resulting from user negligence.</p>

          <p><strong>14. No Financial Advice:</strong> The Site and its staff do not provide financial or investment advice. Any participation in financial activities on the platform is done at the user's own risk.</p>

          <p><strong>15. Local Law Compliance:</strong> Users must ensure that their use of the platform does not violate local laws or regulations. The Site is not responsible for illegal use by users in any jurisdiction.</p>

          <p><strong>16. Minimum Legal Age:</strong> Users must be 18 years or older to use the platform. By using the Site, you confirm that you have full legal capacity to participate in digital transactions.</p>

          <p><strong>17. Governing Law:</strong> These terms are governed by the laws of the country in which the site owner is located. In case of dispute, resolution will first be attempted via negotiation, and if unsuccessful, through the competent courts.</p>

          <p><strong>18. Changes to the Terms:</strong> We reserve the right to modify these terms at any time without prior notice. Continued use of the Site after changes indicates acceptance of the updated terms.</p>

          <p><strong>19. Contact Us:</strong> If you have any questions about these terms, you can reach us at: <span className="text-yellow-400 font-semibold">support@fsncrew.io</span></p>

          <p className="text-center font-bold mt-8">
            By using the Site, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
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

export default TermsPage;
