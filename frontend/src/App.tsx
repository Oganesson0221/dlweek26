import React, { useState } from "react";
import { NavHeader } from "./components/NavHeader";
import { CopilotCompanion } from "./components/CopilotCompanion";
import { OverviewPage } from "./pages/OverviewPage";
import { JourneyMapPage } from "./pages/JourneyMapPage";
import { QuizPage } from "./pages/QuizPage";
import { SubmissionsPage } from "./pages/SubmissionsPage";
import { TrackingPage } from "./pages/TrackingPage";
import { ConceptMapPage } from "./pages/ConceptMapPage";

function App() {
  const [currentPage, setCurrentPage] = useState("overview");

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return <OverviewPage onNavigate={setCurrentPage} />;
      case "journey":
        return <JourneyMapPage />;
      case "quiz":
        return <QuizPage />;
      case "submissions":
        return <SubmissionsPage />;
      case "tracking":
        return <TrackingPage />;
      case "concepts":
        return <ConceptMapPage />;
      default:
        return <OverviewPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <NavHeader activePage={currentPage} onNavigate={setCurrentPage} />
      <main className="pt-[72px] px-6 pb-10 max-w-[1440px] mx-auto">
        {renderPage()}
      </main>
      <CopilotCompanion />
    </div>
  );
}

export default App;
