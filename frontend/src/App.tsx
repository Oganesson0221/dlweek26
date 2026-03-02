import React, { useState } from "react";
import { NavHeader } from "./components/NavHeader";
import { OverviewPage } from "./pages/OverviewPage";
import { JourneyMapPage } from "./pages/JourneyMapPage";
import { QuizPage } from "./pages/QuizPage";
import { SubmissionsPage } from "./pages/SubmissionsPage";
import { TrackingPage } from "./pages/TrackingPage";
import { ConceptMapPage } from "./pages/ConceptMapPage";
import NotesPage from "./pages/NotesPage";

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
      case "notes":
        return <NotesPage />;
      default:
        return <OverviewPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <NavHeader activePage={currentPage} onNavigate={setCurrentPage} />
      <main className="px-6 py-6 max-w-[1280px] mx-auto">{renderPage()}</main>
    </div>
  );
}

export default App;
