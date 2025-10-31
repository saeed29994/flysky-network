import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClipboard, FaCopy, FaPaste, FaTrash, FaTimes, FaPlus } from 'react-icons/fa';
// import { toast } from 'react-toastify';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';

interface ClipboardItem {
  id: string;
  text: string;
  timestamp: Date;
  adminId?: string;
}

interface PanelClipboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PanelClipboard = ({ isOpen, onClose }: PanelClipboardProps) => {
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [currentInput, setCurrentInput] = useState('');

  // Load clipboard items from Firestore on mount
  useEffect(() => {
    if (isOpen) {
      loadClipboardItems();
    }
  }, [isOpen]);

  const loadClipboardItems = async () => {
    try {
      const q = query(
        collection(db, 'clipboard'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as ClipboardItem[];
      setClipboardItems(items);
    } catch (error) {
      console.error('Error loading clipboard items:', error);
      // toast.error('Failed to load clipboard items', {
      //   position: "top-right",
      //   autoClose: 3000,
      // });
    }
  };

  // Listen for paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text');
      if (text && text.trim()) {
        e.preventDefault();
        addToClipboard(text.trim());
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const addToClipboard = async (text: string) => {
    try {
      const newItem = {
        text: text,
        timestamp: new Date(),
        adminId: 'admin' // You can replace this with actual admin ID
      };

      await addDoc(collection(db, 'clipboard'), newItem);
      await loadClipboardItems(); // Reload items

      // toast.success('Text added to clipboard', {
      //   position: "top-right",
      //   autoClose: 2000,
      // });
    } catch (error) {
      console.error('Error adding to clipboard:', error);
      // toast.error('Failed to add text to clipboard', {
      //   position: "top-right",
      //   autoClose: 3000,
      // });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onClose(); // Close the panel after copying
      // toast.success('text copyed to clipboard', {
      //   position: "top-right",
      //   autoClose: 2000,
      // });
    } catch (error) {
      // toast.error('can not copy text to clipboard', {
      //   position: "top-right",
      //   autoClose: 2000,
      // });
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCurrentInput(text);
      // toast.success('text paste from clipboard', {
      //   position: "top-right",
      //   autoClose: 2000,
      // });
    } catch (error) {
      // toast.error('text can not paste from clipboard', {
      //   position: "top-right",
      //   autoClose: 2000,
      // });
    }
  };

  const addCurrentInput = () => {
    if (currentInput.trim()) {
      addToClipboard(currentInput.trim());
      setCurrentInput('');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clipboard', id));
      await loadClipboardItems(); // Reload items
      // toast.success('Item deleted', {
      //   position: "top-right",
      //   autoClose: 2000,
      // });
    } catch (error) {
      console.error('Error deleting item:', error);
      // toast.error('Failed to delete item', {
      //   position: "top-right",
      //   autoClose: 3000,
      // });
    }
  };

  const clearAll = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'clipboard'));
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      await loadClipboardItems(); // Reload items
      // toast.success('All items cleared', {
      //   position: "top-right",
      //   autoClose: 2000,
      // });
    } catch (error) {
      console.error('Error clearing all items:', error);
      // toast.error('Failed to clear all items', {
      //   position: "top-right",
      //   autoClose: 3000,
      // });
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100001]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-md sm:max-w-lg bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 shadow-2xl z-[100002] border-l border-white/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <FaClipboard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Clipboard</h2>
                  <p className="text-xs text-gray-400">{clipboardItems.length} items</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <FaTimes className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col h-[calc(100%-80px)]">
              {/* Input Section */}
              <div className="p-4 border-b border-white/10">
                <div className="space-y-3">
                  <textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Type text or paste from clipboard..."
                    className="w-full h-20 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={pasteFromClipboard}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <FaPaste className="w-3 h-3" />
                     Paste
                    </button>
                    <button
                      onClick={addCurrentInput}
                      disabled={!currentInput.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                    >
                      <FaPlus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Clear All Button */}
              {clipboardItems.length > 0 && (
                <div className="p-4 border-b border-white/10">
                  <button
                    onClick={clearAll}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                  >
                    <FaTrash className="w-3 h-3" />
                    Clear All
                  </button>
                </div>
              )}

              {/* Clipboard Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {clipboardItems.length === 0 ? (
                  <div className="text-center py-8">
                    <FaClipboard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Clipboard is empty</p>
                    <p className="text-xs text-gray-500 mt-2">Copy any text to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clipboardItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white/5 rounded-lg p-3 border border-white/10"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-white text-sm flex-1 break-words">{item.text}</p>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                          >
                            <FaTimes className="w-3 h-3 text-white" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(item.timestamp)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(item.text)}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                          >
                            <FaCopy className="w-3 h-3" />
                            Copy
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PanelClipboard;