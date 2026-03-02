import React from "react";
import {
  LayoutDashboard,
  Bot,
  Camera,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BarChart3,
  GitCommitHorizontal,
  GitBranch,
  GitPullRequest,
  Eye,
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onPageChange,
  collapsed,
  onToggle,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "commits", label: "Commits", icon: GitCommitHorizontal },
    { id: "branches", label: "Branches", icon: GitBranch },
    { id: "pullrequests", label: "Pull Requests", icon: GitPullRequest },
    { id: "blame", label: "Blame", icon: Eye },
    { id: "agent", label: "AI Tutor", icon: Bot, badge: "AI" },
    { id: "vision", label: "Vision Lab", icon: Camera },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-surface-raised border-r border-border-subtle flex flex-col transition-all duration-300 z-30 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b border-border-subtle shrink-0">
        <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <span className="text-sm font-bold text-white whitespace-nowrap">
              Microsoft CoursePilot
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-md transition-all duration-150 group relative ${
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-slate-400 hover:bg-surface-hover hover:text-slate-200"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-accent rounded-r" />
              )}
              <Icon
                className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-accent" : "text-slate-500 group-hover:text-slate-300"}`}
              />
              {!collapsed && (
                <>
                  <span className="ml-3 text-[13px] font-medium">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-auto text-[10px] font-bold bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-subtle p-2 space-y-2">
        {!collapsed && (
          <div className="px-3 py-2.5 rounded-md bg-accent-subtle">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] font-semibold text-accent">
                Powered by OpenAI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              GPT-4o · Vision · Agents
            </p>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-surface-hover transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
