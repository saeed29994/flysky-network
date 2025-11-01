import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  X,
  Send,
  Smile,
  User,
  Shield,
  Calendar
} from 'lucide-react';
import { db } from '../../../firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import data from '@emoji-mart/data';
import { init } from 'emoji-mart';
import EmojiPicker from 'emoji-picker-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'admin';
  timestamp: Timestamp;
  userId?: string;
  userName?: string;
}

interface MessagePageReplyProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  userName: string;
  userEmail: string;
  originalMessage: string;
  onReplySent?: () => void;
}

const MessagePageReply: React.FC<MessagePageReplyProps> = ({
  isOpen,
  onClose,
  messageId,
  userName,
  userEmail,
  originalMessage,
  onReplySent
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const doubleClickRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messageId) {
      // Initialize emoji-mart
      init({ data });

      // Load conversation history
      const conversationRef = collection(db, 'contactMessages', messageId, 'replies');
      const q = query(conversationRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const replies: Message[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Message));

        // Add original message as first message
        const originalMsg: Message = {
          id: 'original',
          content: originalMessage,
          sender: 'user',
          timestamp: Timestamp.now(), // This should be the actual timestamp
          userId: messageId,
          userName: userName
        };

        setMessages([originalMsg, ...replies]);
        setTimeout(scrollToBottom, 100);
      });

      return () => unsubscribe();
    }
  }, [isOpen, messageId, originalMessage, userName]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const conversationRef = collection(db, 'contactMessages', messageId, 'replies');

      await addDoc(conversationRef, {
        content: newMessage.trim(),
        sender: 'admin',
        timestamp: Timestamp.now(),
        userId: messageId
      });

      // Update the main message status to 'replied'
      await updateDoc(doc(db, 'contactMessages', messageId), {
        status: 'replied'
      });

      // Send notification to user
      try {
        // Get user data to find userId
        const messageDoc = await getDoc(doc(db, 'contactMessages', messageId));
        const messageData = messageDoc.data();

        if (messageData?.userId) {
          const userInboxRef = collection(db, 'users', messageData.userId, 'inbox');

          await addDoc(userInboxRef, {
            title: 'Admin Reply',
            message: newMessage.trim(),
            type: 'admin_reply',
            read: false,
            createdAt: Timestamp.now(),
            fromNotification: true // Prevent duplicate notifications
          });

          console.log('Admin reply notification sent to user:', messageData.userId);
        }
      } catch (notificationError) {
        console.error('Error sending notification to user:', notificationError);
        // Don't fail the reply if notification fails
      }

      setNewMessage('');
      setShowEmojiPicker(false);
      inputRef.current?.focus();

      onReplySent?.();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(t('MessagePage.replyError'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + emoji.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    setMessages([]);
    setNewMessage('');
    setShowEmojiPicker(false);
    setLoading(false);
    onClose();
  };

  const formatTime = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleString();
  };

  const handleHeaderClick = () => {
    const now = Date.now();
    if (now - doubleClickRef.current < 300) {
      // Double click detected
      setPosition({ x: 0, y: 0 });
    }
    doubleClickRef.current = now;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* الخلفية */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100001]"
            onClick={handleClose}
          />

          {/* المودال المركزي */}
          <motion.div
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={{ left: -window.innerWidth / 2, right: window.innerWidth / 2, top: -window.innerHeight / 2, bottom: window.innerHeight / 2 }}
            initial={{ opacity: 0, scale: 0.95, x: position.x, y: position.y }}
            animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onDragEnd={(_, info) => {
              setPosition({ x: position.x + info.offset.x, y: position.y + info.offset.y });
            }}
            className="
              fixed inset-0 flex items-center justify-center p-4
              z-[100002]
              cursor-move
            "
          >
            <div className="
              w-full max-w-4xl h-[80vh]
              bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90
              border border-white/20
              rounded-2xl shadow-2xl
              overflow-hidden backdrop-blur-md
              flex flex-col
            ">
              {/* Header */}
              <header
                className="flex items-center justify-between p-4 border-b border-white/20 min-h-[60px] cursor-move select-none"
                onPointerDown={(e) => {
                  dragControls.start(e);
                  handleHeaderClick();
                }}
                onClick={handleHeaderClick}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{userName}</h2>
                    <p className="text-blue-100 text-sm">{userEmail}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </header>

              {/* Body */}
              <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-800/50">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[60%] ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
                      <div className={`flex items-start gap-2 mb-1 ${message.sender === 'user' ? '' : 'flex-row-reverse'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.sender === 'user'
                            ? 'bg-gray-200'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}>
                          {message.sender === 'user' ? (
                            <User className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Shield className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className={`px-4 py-2 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-gray-200 text-gray-800'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 text-xs text-gray-500 px-10 ${
                        message.sender === 'user' ? '' : 'justify-end'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </main>

              {/* Footer */}
              <footer className="flex items-end gap-3 p-4 border-t border-white/20 min-h-[60px] bg-slate-900/50">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('MessagePage.typeReply')}
                    className="w-full px-4 py-3 border border-white/20 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/10 text-white placeholder-white/50"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2 z-10">
                      <EmojiPicker
                        onEmojiClick={handleEmojiSelect}
                        previewConfig={{ showPreview: false }}
                        skinTonesDisabled={true}
                        width={300}
                        height={400}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  title={t('MessagePage.addEmoji')}
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {t('MessagePage.send')}
                </button>
              </footer>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MessagePageReply;