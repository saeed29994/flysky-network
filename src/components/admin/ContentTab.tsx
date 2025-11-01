// 📁 src/components/admin/ContentTab.tsx

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  FaImage,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaCheck,
  FaTimes,
  FaBullhorn,
  FaNewspaper,
  FaVideo,
  FaLink,
  FaCalendarAlt,
  FaEye as FaVisibility,
} from "react-icons/fa";
import CustomSelect from "../ui/CustomSelect";
import CustomSearch from "../ui/CustomSearch";

interface Content {
  id: string;
  title: string;
  type: "banner" | "announcement" | "promotion" | "video" | "news";
  status: "active" | "inactive" | "draft";
  imageUrl: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: number;
  views: number;
  clicks: number;
}

const ContentTab = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Placeholder data
  const contents: Content[] = [
    {
      id: "CONT001",
      title: t("admin.content.sampleData.welcomeTitle"),
      type: "banner",
      status: "active",
      imageUrl: "/src/assets/banner1.jpg",
      description: t("admin.content.sampleData.welcomeDescription"),
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      priority: 1,
      views: 15420,
      clicks: 2340,
    },
    {
      id: "CONT002",
      title: t("admin.content.sampleData.miningRewardsTitle"),
      type: "announcement",
      status: "active",
      imageUrl: "/src/assets/banner2.jpg",
      description: t("admin.content.sampleData.miningRewardsDescription"),
      startDate: "2024-12-01",
      endDate: "2024-12-31",
      priority: 2,
      views: 8920,
      clicks: 1560,
    },
    {
      id: "CONT003",
      title: t("admin.content.sampleData.referralProgramTitle"),
      type: "promotion",
      status: "active",
      imageUrl: "/src/assets/Referral_Program.jpg",
      description: t("admin.content.sampleData.referralProgramDescription"),
      startDate: "2024-11-15",
      endDate: "2024-12-31",
      priority: 3,
      views: 6780,
      clicks: 890,
    },
    {
      id: "CONT004",
      title: t("admin.content.sampleData.tutorialVideoTitle"),
      type: "video",
      status: "active",
      imageUrl: "/src/assets/play_mobile.jpg",
      description: t("admin.content.sampleData.tutorialVideoDescription"),
      startDate: "2024-10-01",
      endDate: "2024-12-31",
      priority: 4,
      views: 12340,
      clicks: 2100,
    },
    {
      id: "CONT005",
      title: t("admin.content.sampleData.holidayEventTitle"),
      type: "promotion",
      status: "draft",
      imageUrl: "/src/assets/banner5.jpg",
      description: t("admin.content.sampleData.holidayEventDescription"),
      startDate: "2024-12-20",
      endDate: "2024-12-31",
      priority: 1,
      views: 0,
      clicks: 0,
    },
  ];

  // Filter content
  const filteredContents = contents.filter((content) => {
    const matchesSearch =
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || content.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || content.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Statistics
  const totalContent = contents.length;
  const activeContent = contents.filter((c) => c.status === "active").length;
  const totalViews = contents.reduce((sum, c) => sum + c.views, 0);
  const totalClicks = contents.reduce((sum, c) => sum + c.clicks, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "banner":
        return <FaImage className="w-4 h-4" />;
      case "announcement":
        return <FaBullhorn className="w-4 h-4" />;
      case "promotion":
        return <FaNewspaper className="w-4 h-4" />;
      case "video":
        return <FaVideo className="w-4 h-4" />;
      case "news":
        return <FaNewspaper className="w-4 h-4" />;
      default:
        return <FaImage className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "banner":
        return "text-blue-400 bg-blue-400/10";
      case "announcement":
        return "text-green-400 bg-green-400/10";
      case "promotion":
        return "text-purple-400 bg-purple-400/10";
      case "video":
        return "text-red-400 bg-red-400/10";
      case "news":
        return "text-yellow-400 bg-yellow-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/10";
      case "inactive":
        return "text-red-400 bg-red-400/10";
      case "draft":
        return "text-yellow-400 bg-yellow-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaImage className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">
                {t("admin.content.stats.totalContent")}
              </p>
              <p className="text-white font-bold text-lg">{totalContent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaCheck className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">
                {t("admin.content.stats.activeContent")}
              </p>
              <p className="text-white font-bold text-lg">{activeContent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaVisibility className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-sm">
                {t("admin.content.stats.totalViews")}
              </p>
              <p className="text-white font-bold text-lg">
                {totalViews.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-3">
            <FaLink className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-gray-400 text-sm">
                {t("admin.content.stats.totalClicks")}
              </p>
              <p className="text-white font-bold text-lg">
                {totalClicks.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Content Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg"
        >
          <FaPlus className="w-4 h-4" />
          {t("admin.content.actions.createContent")}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* حقل البحث */}
          <CustomSearch
            placeholder={t("admin.content.search.placeholder")}
            onSearch={(value) => setSearchQuery(value)}
            onCancel={() => setSearchQuery("")}
          />

          {/* الفلتر الأول */}
          <div className="flex items-center">
            <CustomSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: t("admin.content.filters.allTypes") },
                { value: "banner", label: t("admin.content.types.banner") },
                {
                  value: "announcement",
                  label: t("admin.content.types.announcement"),
                },
                {
                  value: "promotion",
                  label: t("admin.content.types.promotion"),
                },
                { value: "video", label: t("admin.content.types.video") },
                { value: "news", label: t("admin.content.types.news") },
              ]}
              placeholder={t("admin.content.filters.allTypes")}
            />
          </div>

          {/* الفلتر الثاني */}
          <div className="flex items-center">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: t("admin.content.filters.allStatus") },
                { value: "active", label: t("admin.content.status.active") },
                {
                  value: "inactive",
                  label: t("admin.content.status.inactive"),
                },
                { value: "draft", label: t("admin.content.status.draft") },
              ]}
              placeholder={t("admin.content.filters.allStatus")}
            />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredContents.map((content, index) => (
          <motion.div
            key={content.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl relative ${
              content.status !== "active" ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  {getTypeIcon(content.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {content.title}
                  </h3>
                  <div className="flex gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        content.type
                      )}`}
                    >
                      {t(`admin.content.types.${content.type}`)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        content.status
                      )}`}
                    >
                      {t(`admin.content.status.${content.status}`)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {t("admin.content.priority")}
                </p>
                <p className="text-white font-bold">{content.priority}</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-4">{content.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">
                  {t("admin.content.views")}
                </p>
                <p className="text-white font-bold">
                  {content.views.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">
                  {t("admin.content.clicks")}
                </p>
                <p className="text-white font-bold">
                  {content.clicks.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <FaCalendarAlt className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300 text-xs">
                {content.startDate} - {content.endDate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedContent(content);
                  setShowDetailsModal(true);
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <FaEye className="w-3 h-3" />
                {t("admin.content.actions.view")}
              </button>
              <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                <FaEdit className="w-3 h-3" />
                {t("admin.content.actions.edit")}
              </button>
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                <FaTrash className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Details Modal */}
      {showDetailsModal && selectedContent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaEye className="w-4 h-4 text-blue-400" />
              {t("admin.content.details.title")}: {selectedContent.title}
            </h3>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">
                  {t("admin.content.details.basicInformation")}
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-400">
                      {t("admin.content.details.id")}:
                    </span>{" "}
                    <span className="text-white">{selectedContent.id}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">
                      {t("admin.content.details.type")}:
                    </span>{" "}
                    <span className="text-white capitalize">
                      {t(`admin.content.types.${selectedContent.type}`)}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">
                      {t("admin.content.details.status")}:
                    </span>{" "}
                    <span
                      className={`${getStatusColor(selectedContent.status)}`}
                    >
                      {t(`admin.content.status.${selectedContent.status}`)}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">
                      {t("admin.content.details.priority")}:
                    </span>{" "}
                    <span className="text-white">
                      {selectedContent.priority}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">
                  {t("admin.content.details.description")}
                </h4>
                <p className="text-gray-300 text-sm">
                  {selectedContent.description}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">
                  {t("admin.content.details.performance")}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">{t("admin.content.views")}</p>
                    <p className="text-white font-bold">
                      {selectedContent.views.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">{t("admin.content.clicks")}</p>
                    <p className="text-white font-bold">
                      {selectedContent.clicks.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">
                  {t("admin.content.details.schedule")}
                </h4>
                <p className="text-gray-300 text-sm">
                  {selectedContent.startDate} - {selectedContent.endDate}
                </p>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes className="w-4 h-4" />
                {t("admin.content.actions.close")}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Content Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FaPlus className="w-4 h-4 text-purple-400" />
              {t("admin.content.createModal.title")}
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder={t("admin.content.createModal.titlePlaceholder")}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <textarea
                placeholder={t(
                  "admin.content.createModal.descriptionPlaceholder"
                )}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />

              <CustomSelect
                value=""
                onChange={() => {}}
                options={[
                  { value: "banner", label: t("admin.content.types.banner") },
                  {
                    value: "announcement",
                    label: t("admin.content.types.announcement"),
                  },
                  {
                    value: "promotion",
                    label: t("admin.content.types.promotion"),
                  },
                  { value: "video", label: t("admin.content.types.video") },
                  { value: "news", label: t("admin.content.types.news") },
                ]}
                placeholder={t("admin.content.createModal.selectType")}
              />

              <input
                type="number"
                placeholder={t("admin.content.createModal.priorityPlaceholder")}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-2">
                <button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <FaCheck className="w-4 h-4" />
                  {t("admin.content.actions.create")}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  {t("admin.content.actions.cancel")}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ContentTab;
