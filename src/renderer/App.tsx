import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { CampaignsPage } from "./routes/CampaignsPage";
import { DashboardPage } from "./routes/DashboardPage";
import { HomePage } from "./routes/HomePage";
import { InsightsPage } from "./routes/InsightsPage";
import { MappingPage } from "./routes/MappingPage";
import { ProjectsPage } from "./routes/ProjectsPage";
import { ReportsPage } from "./routes/ReportsPage";
import { SettingsPage } from "./routes/SettingsPage";
import { UploadPage } from "./routes/UploadPage";
import { CampaignProvider } from "./state/CampaignContext";

export function App() {
  return (
    <HashRouter>
      <CampaignProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/mapping" element={<MappingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </CampaignProvider>
    </HashRouter>
  );
}
