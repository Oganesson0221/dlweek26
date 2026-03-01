import React from "react";
import { Bot, Camera, Activity, Clock, Zap } from "lucide-react";

export const Dashboard: React.FC = () => {
  const stats = [
    { label: "API Calls", value: "0", icon: Activity, color: "blue" },
    { label: "Tokens Used", value: "0", icon: Zap, color: "green" },
    { label: "Active Agents", value: "3", icon: Bot, color: "purple" },
    { label: "Images Processed", value: "0", icon: Camera, color: "orange" },
  ];

  const recentActivity = [
    { time: "Just now", action: "System ready", status: "active" },
    {
      time: "Setup",
      action: "OpenAI credits activated ($100)",
      status: "completed",
    },
  ];

  const quickActions = [
    { name: "Start Agent Chat", page: "agent", icon: Bot },
    { name: "Analyze Image", page: "vision", icon: Camera },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to your DLW AI Starter Kit</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = {
            blue: "bg-blue-50 text-blue-600",
            green: "bg-green-50 text-green-600",
            purple: "bg-purple-50 text-purple-600",
            orange: "bg-orange-50 text-orange-600",
          };

          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${colors[stat.color as keyof typeof colors]}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </span>
              </div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.name}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
                  >
                    <Icon className="w-8 h-8 text-gray-400 group-hover:text-primary-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                      {action.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
                {activity.status === "active" && (
                  <span className="ml-auto flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Zap className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-primary-900">
              OpenAI Credits Active
            </h3>
            <p className="text-sm text-primary-700 mt-1">
              Your $100 in credits are ready to use. Start building with Agentic
              AI and Computer Vision!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
