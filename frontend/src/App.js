import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "@/pages/Landing";
import AdminLogin from "@/pages/AdminLogin";
import Admin from "@/pages/Admin";
import { ContentProvider } from "@/context/ContentContext";

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
