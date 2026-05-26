import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "@/pages/Landing";
import AdminLogin from "@/pages/AdminLogin";
import Admin from "@/pages/Admin";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import { ContentProvider } from "@/context/ContentContext";

function GlobalExitIntent() {
  const loc = useLocation();
  // Disable on admin routes
  if (loc.pathname.startsWith("/admin")) return null;
  return <ExitIntentPopup />;
}

function App() {
  return (
    <div className="App">
      <ContentProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <GlobalExitIntent />
        </BrowserRouter>
      </ContentProvider>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#0A0A0A",
            color: "#FFFFFF",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "0px",
          },
        }}
      />
    </div>
  );
}

export default App;
