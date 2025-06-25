"use client";

import { HiMenu } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import { User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { mockUser } from "../data/mockData";
import NotificationBell from "../notifications/NotificationBell";

export default function Header({ isOpen, setIsOpen, Navigation }) {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Load user data
    setUser(mockUser);
  }, []);

  const handleLogout = () => {
    console.log("Logout");
    // In real app, would clear session and redirect to login
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-50 shadow">
      <div className="flex h-20 w-full items-center justify-between">
        <div className="ml-8">
          <div className="w-40 h-12 bg-gray-50">
            <img src="/image_icon/iconcpkku.png" alt="Logo" />
          </div>
        </div>

        <div className="flex flex-row items-center">
          <div className="flex flex-row items-center gap-4 mr-6">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="hidden md:flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {user ? user.user_fname.charAt(0) : 'U'}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-800">
                    {user ? `${user.user_fname} ${user.user_lname}` : 'Loading...'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {user ? user.position : ''}
                  </div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b">
                      <div className="font-medium text-gray-800">
                        {user?.user_fname} {user?.user_lname}
                      </div>
                      <div className="text-sm text-gray-600">{user?.email}</div>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md text-gray-700">
                        <User size={18} />
                        <span>ข้อมูลส่วนตัว</span>
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 rounded-md text-red-600"
                      >
                        <LogOut size={18} />
                        <span>ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className={`${
              !isOpen ? "block" : "hidden"
            } inline-flex items-center justify-center me-4 ms-3 p-2 w-10 h-10 text-sm text-gray-500 rounded-lg
        md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <HiMenu className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-gray-200/50 z-40"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="absolute top-0 pt-5 right-0 h-screen z-50 w-64 bg-white shadow p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-3">
                <button onClick={() => setIsOpen(false)}>
                  <RxCross2 className="w-7 h-7 text-gray-600 hover:text-red-500" />
                </button>
              </div>
              
              {/* Mobile User Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg md:hidden">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {user ? user.user_fname.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {user ? `${user.user_fname} ${user.user_lname}` : 'Loading...'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {user ? user.position : ''}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left text-sm text-red-600 hover:text-red-700"
                >
                  ออกจากระบบ
                </button>
              </div>
              
              <Navigation />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}