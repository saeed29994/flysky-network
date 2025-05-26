import { useState } from 'react';
import { Tab } from '@headlessui/react';
import DashboardTab from '../components/admin/DashboardTab';
import UsersManagementTab from '../components/admin/UsersManagementTab';
import KycVerificationTab from '../components/admin/KycVerificationTab';
import SendNotificationTab from '../components/admin/SendNotificationTab';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const AdminDashboard = () => {
  const [tabs] = useState([
    { name: 'Dashboard' },
    { name: 'Users Management' },
    { name: 'KYC Verification' },
    { name: 'Send Notification' },
  ]);

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="text-3xl font-bold text-yellow-400 mb-8">Admin Dashboard</h1>

      <Tab.Group>
        <Tab.List className="flex space-x-2 rounded-xl bg-gray-800 p-2">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  selected
                    ? 'bg-yellow-400 text-black'
                    : 'text-yellow-300 hover:bg-gray-700 hover:text-white'
                )
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <DashboardTab />
          </Tab.Panel>
          <Tab.Panel>
            <UsersManagementTab />
          </Tab.Panel>
          <Tab.Panel>
            <KycVerificationTab />
          </Tab.Panel>
          <Tab.Panel>
            <SendNotificationTab />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AdminDashboard;
