import React, { useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { AgentPage } from "./pages/AgentPage";
import { VisionPage } from "./pages/VisionPage";
import { SettingsPage } from "./pages/SettingsPage";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} />;
      case "agent":
        return <AgentPage />;
      case "vision":
        return <VisionPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        activePage={currentPage}
        onPageChange={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-60"}`}
      >
        <Header />
        <main className="p-6">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
