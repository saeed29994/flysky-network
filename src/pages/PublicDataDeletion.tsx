// 📁 src/pages/PublicDataDeletion.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Mail, 
  Shield, 
  Clock,
  User,
  FileText,
  Database,
  Bell,
  Gift,
  CreditCard,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PublicDataDeletion: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    reason: '',
    confirmDeletion: false,
    confirmPermanent: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.confirmDeletion || !formData.confirmPermanent) {
      setError('Please confirm both checkboxes to proceed');
      return;
    }

    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Create a public deletion request using the deployed Firebase function
      const response = await fetch('https://us-central1-flysky-site.cloudfunctions.net/publicDataDeletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          reason: formData.reason.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsSubmitted(true);
        } else {
          throw new Error(result.error || 'Failed to submit request');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again or contact support directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      reason: '',
      confirmDeletion: false,
      confirmPermanent: false
    });
    setIsSubmitted(false);
    setError('');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full border border-white/20 text-center"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">Request Submitted Successfully</h2>
          
          <p className="text-gray-300 mb-6">
            Your data deletion request has been submitted. You will receive a confirmation email within 24 hours.
          </p>
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <h3 className="text-blue-400 font-semibold mb-2">What Happens Next?</h3>
            <ul className="text-sm text-blue-300 space-y-1 text-left">
              <li>• Request reviewed within 30 days</li>
              <li>• Email confirmation when processing begins</li>
              <li>• Data deletion completed within 90 days</li>
              <li>• Final confirmation when complete</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={resetForm}
              className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Submit Another Request
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Return to App
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Data Deletion Request</h1>
                  <p className="text-gray-300">FlySky Network - Account & Data Deletion</p>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Return to App
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Trash2 className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-semibold text-white">Request Account Deletion</h2>
              </div>

              {/* Warning */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-red-400 font-semibold mb-1">⚠️ Important Warning</h3>
                    <p className="text-red-300 text-sm">
                      This action will permanently delete your account and all associated data. 
                      This cannot be undone. Please ensure you have backed up any important information.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please let us know why you're requesting deletion (optional)"
                  />
                </div>

                {/* Confirmations */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="confirmDeletion"
                      name="confirmDeletion"
                      checked={formData.confirmDeletion}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                    />
                    <label htmlFor="confirmDeletion" className="text-sm text-gray-300">
                      I understand that this will permanently delete my account and all associated data
                    </label>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="confirmPermanent"
                      name="confirmPermanent"
                      checked={formData.confirmPermanent}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                    />
                    <label htmlFor="confirmPermanent" className="text-sm text-gray-300">
                      I understand that this action cannot be undone and I have backed up any important information
                    </label>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.confirmDeletion || !formData.confirmPermanent}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Deletion Request'}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* What Will Be Deleted */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                What Will Be Deleted
              </h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <User className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Account profile & personal information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Transaction history & financial data</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Mining & staking records</span>
                </li>
                <li className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Notification preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <Gift className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>Referral relationships & rewards</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>KYC verification data</span>
                </li>
                <li className="flex items-start gap-2">
                  <Settings className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span>All app preferences & settings</span>
                </li>
              </ul>
            </motion.div>

            {/* Process Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-400" />
                Process Timeline
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    1
                  </div>
                  <span>Request reviewed within 30 days</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    2
                  </div>
                  <span>Email confirmation when processing begins</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    3
                  </div>
                  <span>Data deletion completed within 90 days</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                    4
                  </div>
                  <span>Final confirmation when complete</span>
                </div>
              </div>
            </motion.div>

            {/* Alternative Methods */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-yellow-400" />
                Alternative Methods
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">📱</span>
                  <span>In-App: Settings → Privacy & Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-yellow-400" />
                  <span>Email: support@fsncrew.io</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">💬</span>
                  <span>Support: Contact our team</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDataDeletion;
