// 📁 src/components/admin/Gifts/GiftHistory.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  History,
  Gift,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';
import { GiftDistribution, GiftStats } from './types';
import GiftService from './GiftService';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';

interface GiftHistoryProps {
  // onViewDetails prop removed as it's no longer used
}

const GiftHistory: React.FC<GiftHistoryProps> = () => {
  const { t } = useTranslation();
  const [gifts, setGifts] = useState<GiftDistribution[]>([]);
  const [stats, setStats] = useState<GiftStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGift, setExpandedGift] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingGift, setDeletingGift] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [giftToDelete, setGiftToDelete] = useState<GiftDistribution | null>(null);
  const giftsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [giftsData, statsData] = await Promise.all([
        GiftService.getGiftHistory(100),
        GiftService.getGiftStats()
      ]);
      setGifts(giftsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading gift data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (gift: GiftDistribution) => {
    setGiftToDelete(gift);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!giftToDelete) return;

    setShowDeleteModal(false);
    setDeletingGift(giftToDelete.id);

    try {
      await deleteDoc(doc(db, 'giftDistributions', giftToDelete.id));

      // Refresh the data
      await loadData();
    } catch (error) {
      console.error('Error deleting gift:', error);
      // You could add a toast notification here instead of alert
    } finally {
      setDeletingGift(null);
      setGiftToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setGiftToDelete(null);
  };

  const getStatusIcon = (status: GiftDistribution['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: GiftDistribution['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/20';
      case 'processing':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const totalPages = Math.ceil(gifts.length / giftsPerPage);
  const startIndex = (currentPage - 1) * giftsPerPage;
  const endIndex = startIndex + giftsPerPage;
  const currentGifts = gifts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-8">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="ml-3 text-white">Loading gift history...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Gift className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('gifttabtexts.history.stats.totalGifts')}</p>
                <p className="text-white text-2xl font-bold">{stats.totalGiftsSent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('gifttabtexts.history.stats.totalDistributed')}</p>
                <p className="text-white text-2xl font-bold">{stats.totalAmountDistributed.toLocaleString()} FSN</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('gifttabtexts.history.stats.totalRecipients')}</p>
                <p className="text-white text-2xl font-bold">{stats.totalRecipients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{t('gifttabtexts.history.stats.successRate')}</p>
                <p className="text-white text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gift History Table - No card wrapper */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">

        <div className="overflow-x-auto">
          {currentGifts.length === 0 ? (
            <div className="p-12 text-center">
              <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">{t('gifttabtexts.history.empty.title')}</p>
              <p className="text-gray-500 text-sm">{t('gifttabtexts.history.empty.subtitle')}</p>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <History className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{t('gifttabtexts.history.title')}</h2>
                    <p className="text-gray-300 text-sm">{t('gifttabtexts.history.subtitle')}</p>
                  </div>
                </div>
              </div>
              <table className="w-full">
                <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('gifttabtexts.history.tableHeaders.giftDetails')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('gifttabtexts.history.tableHeaders.recipients')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('gifttabtexts.history.tableHeaders.amount')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('gifttabtexts.history.tableHeaders.status')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('gifttabtexts.history.tableHeaders.date')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {t('gifttabtexts.history.tableHeaders.actions')}
                  </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                {currentGifts.map((gift) => (
                  <React.Fragment key={gift.id}>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{gift.title}</div>
                          <div className="text-sm text-gray-400 truncate max-w-xs">{gift.reason}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {gift.successfulDeliveries}/{gift.totalRecipients}
                        </div>
                        <div className="text-xs text-gray-400">{t('gifttabtexts.history.details.status')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {gift.totalAmountDistributed.toLocaleString()} FSN
                        </div>
                        <div className="text-xs text-gray-400">
                          {gift.amount} FSN each
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(gift.status)}`}>
                          {getStatusIcon(gift.status)}
                          {gift.status.charAt(0).toUpperCase() + gift.status.slice(1)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {formatDate(gift.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedGift(expandedGift === gift.id ? null : gift.id)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title={t('gifttabtexts.history.actions.viewDetails')}
                          >
                            {expandedGift === gift.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(gift)}
                            disabled={deletingGift === gift.id}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('gifttabtexts.history.actions.deleteGift')}
                          >
                            {deletingGift === gift.id ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedGift === gift.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-800/30">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-white mb-2">{t('gifttabtexts.history.details.message')}</h4>
                              <p className="text-sm text-gray-300 bg-gray-900/50 p-3 rounded-lg">
                                {gift.message}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">{t('gifttabtexts.history.details.target')}:</span>
                                <span className="text-white ml-2 capitalize">{gift.target.type}</span>
                              </div>
                              {gift.target.planName && (
                                <div>
                                  <span className="text-gray-400">{t('gifttabtexts.history.details.plan')}:</span>
                                  <span className="text-white ml-2">{gift.target.planName}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-400">{t('gifttabtexts.history.details.createdBy')}:</span>
                                <span className="text-white ml-2">{gift.createdBy}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">{t('gifttabtexts.history.details.failures')}:</span>
                                <span className="text-red-400 ml-2">{gift.failedDeliveries}</span>
                              </div>
                            </div>

                            {gift.logs && gift.logs.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-white mb-2">{t('gifttabtexts.history.details.recentLogs')}</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {gift.logs.slice(0, 5).map((log, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-900/50 rounded text-xs">
                                      <span className="text-gray-300">{log.userEmail}</span>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded ${
                                          log.status === 'success'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                          {log.status}
                                        </span>
                                        {log.claimed && <CheckCircle className="w-3 h-3 text-green-400" />}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, gifts.length)} of {gifts.length} gifts
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && giftToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 mb-4">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">{t('gifttabtexts.history.deleteModal.title')}</h3>
              <p className="text-gray-300 text-sm mb-4">
                {t('gifttabtexts.history.deleteModal.message', { title: giftToDelete.title })}
                {t('gifttabtexts.history.deleteModal.warning')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  {t('gifttabtexts.history.deleteModal.cancel')}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  {t('gifttabtexts.history.deleteModal.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftHistory;