// 📁 src/components/admin/DashboardTab.tsx

const DashboardTab = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">📊 Quick Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 shadow">
          <h3 className="text-yellow-400 font-bold text-lg">Total Users</h3>
          <p className="text-white text-2xl mt-2">-</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 shadow">
          <h3 className="text-yellow-400 font-bold text-lg">Total Admins</h3>
          <p className="text-white text-2xl mt-2">-</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 shadow">
          <h3 className="text-yellow-400 font-bold text-lg">Pending KYC</h3>
          <p className="text-white text-2xl mt-2">-</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 shadow">
          <h3 className="text-yellow-400 font-bold text-lg">Total FSN</h3>
          <p className="text-white text-2xl mt-2">-</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
