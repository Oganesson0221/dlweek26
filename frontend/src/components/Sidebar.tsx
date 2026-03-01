import React from "react";
import { Bot, Camera, LayoutDashboard, Settings, History } from "lucide-react";

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onPageChange,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "agent", label: "Agentic AI", icon: Bot },
    { id: "vision", label: "Computer Vision", icon: Camera },
    { id: "history", label: "History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">DLW</span>
          </div>
          <span className="font-semibold text-gray-900">AI Studio</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-primary-600" : "text-gray-400"}`}
                />
                <span className="text-sm font-medium">{item.label}</span>
                {item.id === "agent" && (
                  <span className="ml-auto bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                    Live
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">Credits Remaining</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: "100%" }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">$100 / $100 available</p>
        </div>
      </div>
    </aside>
  );
};
