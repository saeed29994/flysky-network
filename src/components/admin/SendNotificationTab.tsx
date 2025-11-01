import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNotifications } from '../../hooks/useNotifications';
import { FaBell, FaUsers, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import CustomSelect from '../ui/CustomSelect';

const SendNotificationTab = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'all' | 'premium' | 'new' | 'inactive'>('all');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['mobile', 'web']);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { sendAdvancedNotification } = useNotifications();

  // Fetch user count based on filter
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const usersRef = collection(db, 'users');
        let usersQueryRef;
        
        if (targetAudience === 'premium') {
          usersQueryRef = query(usersRef, where('membership.planName', 'in', ['business', 'first-6', 'first-lifetime']));
        } else if (targetAudience === 'new') {
          // Users created in the last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          usersQueryRef = query(usersRef, where('createdAt', '>=', sevenDaysAgo));
        } else if (targetAudience === 'inactive') {
          // Users who haven't logged in for 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          usersQueryRef = query(usersRef, where('lastLogin', '<=', thirtyDaysAgo));
        } else {
          usersQueryRef = usersRef;
        }
        
        const snapshot = await getDocs(usersQueryRef);
        setUserCount(snapshot.size);
      } catch (err) {
        console.error('Error fetching user count:', err);
        setUserCount(0);
      }
    };

    fetchUserCount();
  }, [targetAudience]);

  const sendNotification = async () => {
    if (!title || !body) {
      setErrorMessage('Please enter both title and body.');
      return;
    }

    setSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await sendAdvancedNotification({
        title,
        body,
        targetAudience,
        platforms: selectedPlatforms,
        scheduledFor: scheduleDate,
      });

      // Handle scheduled notifications (which return a simple boolean)
      if (result === true) {
        setSuccessMessage('Notification scheduled successfully!');
        // Reset form
        setTitle('');
        setBody('');
        setTargetAudience('all');
        setSelectedPlatforms(['mobile', 'web']);
        setScheduleDate(null);
        return;
      }

      // Handle immediate notifications, which return a detailed object
      if (result && result.success) {
        const { successCount, errorCount, deliveryStatus } = result;
        if (deliveryStatus === 'partial_success') {
          setSuccessMessage(`Notification sent with partial success: ${successCount} successful, ${errorCount} failed.`);
        } else {
          setSuccessMessage(`Notification sent successfully to ${successCount} recipient(s).`);
        }
        // Reset form
        setTitle('');
        setBody('');
        setTargetAudience('all');
        setSelectedPlatforms(['mobile', 'web']);
        setScheduleDate(null);
      } else {
        setErrorMessage(result.error || 'Failed to send notification. No recipients were reached.');
      }
    } catch (error) {
      console.error('Send notification error:', error);
      setErrorMessage('Error sending notification: ' + (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <FaBell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Send Notification</h2>
          <p className="text-gray-400 text-xs sm:text-sm">Create and send notifications to your users</p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-500/20 border border-green-500/30 rounded-xl p-3">
          <p className="text-green-400 text-sm">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-3">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Title
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
            placeholder="Notification Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Message
          </label>
          <textarea
            rows={4}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm resize-none"
            placeholder="Notification Message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-2">
              <FaUsers className="text-purple-400" />
              Target Audience
            </label>
            <CustomSelect
              value={targetAudience}
              onChange={(value) => setTargetAudience(value as any)}
              options={[
                { value: 'all', label: `All Users (${userCount})` },
                { value: 'premium', label: 'Premium Users' },
                { value: 'new', label: 'New Users (Last 7 days)' },
                { value: 'inactive', label: 'Inactive Users (30+ days)' }
              ]}
              placeholder="Select Target Audience"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-2">
              <FaCalendarAlt className="text-purple-400" />
              Schedule (Optional)
            </label>
            <input
              type="datetime-local"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm"
              value={scheduleDate ? scheduleDate.toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setScheduleDate(date);
              }}
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty to send immediately</p>
          </div>
        </div>

        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-2">
            <FaFilter className="text-purple-400" />
            Platforms
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes('mobile')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPlatforms([...selectedPlatforms, 'mobile']);
                  } else {
                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== 'mobile'));
                  }
                }}
                className="rounded text-purple-500 focus:ring-purple-500 bg-white/10 border-white/20"
              />
              <span className="text-white">Mobile</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes('web')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPlatforms([...selectedPlatforms, 'web']);
                  } else {
                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== 'web'));
                  }
                }}
                className="rounded text-purple-500 focus:ring-purple-500 bg-white/10 border-white/20"
              />
              <span className="text-white">Web</span>
            </label>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={sendNotification}
            disabled={sending}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-xl shadow transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>{scheduleDate ? 'Scheduling...' : 'Sending...'}</span>
              </>
            ) : (
              <>
                <FaBell className="w-4 h-4" />
                <span>{scheduleDate ? 'Schedule Notification' : 'Send Notification'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendNotificationTab;