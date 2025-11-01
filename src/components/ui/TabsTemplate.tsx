import React, { useState } from "react";

interface TabItem {
  key: string;
  label: string;
  count?: number;
}

interface TabsTemplateProps {
  tabs: TabItem[];
  loading?: boolean;
  children?: React.ReactNode | ((activeTab: string) => React.ReactNode);
}

/**
 * 🧩 TabsTemplate
 * مكون Template جاهز لإنشاء نظام تابات احترافي مع نفس التصميم الرائع.
 *
 * 📌 الاستخدام:
 * <TabsTemplate
 *   tabs={[
 *     { key: "all", label: "All", count: 12 },
 *     { key: "pending", label: "Pending", count: 5 },
 *     { key: "approved", label: "Approved", count: 7 },
 *     { key: "rejected", label: "Rejected", count: 2 },
 *     { key: "log", label: "Approval Log", count: 0 },
 *   ]}
 * >
 *   {activeTab === "all" && <AllComponent />}
 *   {activeTab === "pending" && <PendingComponent />}
 *   ...
 * </TabsTemplate>
 */

export const TabsTemplate: React.FC<TabsTemplateProps> = ({
  tabs,
  loading = false,
  children,
}) => {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key || "all");

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden min-h-[400px]">
      {/* Tabs Header */}
      <div className="border-b border-white/10">
        <div className="flex flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-white border-b-2 border-blue-500 bg-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" && ` (${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm sm:text-base">Loading data...</p>
          </div>
        ) : (
          <>
            {/* Render children with activeTab prop if it's a function */}
            {typeof children === 'function' ? children(activeTab) : children || (
              <div className="text-gray-400 text-center py-8">
                <p>
                  🧱 ضع مكونات التبويبات هنا حسب الحالة{" "}
                  <code>activeTab</code>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};


