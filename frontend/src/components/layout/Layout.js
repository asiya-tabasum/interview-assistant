import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';

function Layout() {
  const location = useLocation();

  const tabs = [
    { name: 'Interviewee', path: '/interview/chat' },
    { name: 'Interviewer', path: '/interview/dashboard' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex space-x-8">
                {tabs.map((tab) => (
                  <Link
                    key={tab.name}
                    to={tab.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === tab.path
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {tab.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;