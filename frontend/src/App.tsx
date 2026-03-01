import React, { useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { AgentPage } from "./pages/AgentPage";
import { VisionPage } from "./pages/VisionPage";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "agent":
        return <AgentPage />;
      case "vision":
        return <VisionPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activePage={currentPage} onPageChange={setCurrentPage} />

      <div className="ml-64">
        <Header />

        <main className="p-8">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
