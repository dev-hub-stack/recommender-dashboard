import React from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";

export const DashboardHeaderSection = (): JSX.Element => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex w-full items-center gap-2.5 p-6">
      <div className="inline-flex flex-col items-start justify-center flex-1">
        <h1 className="font-semibold text-black text-xl">
          MasterGroup Recommendation Analytics Dashboard
        </h1>

      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 text-sm font-medium">Engine Online</span>
        </div>

        {user && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">{user.full_name || user.email}</span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </header>
  );
};
