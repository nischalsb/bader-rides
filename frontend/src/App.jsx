import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import Spinner from "react-bootstrap/Spinner";

import { AuthContext, UserContext } from "./contexts";
import { API_BASE, api } from "./utils/api";
import { useToast } from "./hooks/useToast";

import BackgroundOrbs from "./components/BackgroundOrbs";
import AppToasts from "./components/AppToasts";
import AppNavbar from "./components/AppNavbar";

import AuthPage from "./pages/AuthPage";
import BrowseRides from "./pages/BrowseRides";
import PostRide from "./pages/PostRide";
import MyRides from "./pages/MyRides";
import Messages from "./pages/Messages";
import Matching from "./pages/Matching";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [socket, setSocket] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setChecking(false); return; }
    api("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const s = io(API_BASE || undefined, { query: { token } });
    s.on("connect", () => console.log("[Socket] Connected"));
    s.on("connect_error", (err) => console.error("[Socket] Error:", err.message));
    setSocket(s);
    return () => s.disconnect();
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    socket?.disconnect();
    setSocket(null);
  }, [socket]);

  const handleRequestJoin = useCallback(async (rideId) => {
    try {
      const data = await api(`/api/rides/${rideId}/join`, { method: "POST" });
      addToast("You're in! The driver has been notified.");
      if (data.conversationId && socket) {
        socket.emit("join-conversation", data.conversationId);
      }
    } catch (err) {
      addToast(err.message, "error");
    }
  }, [addToast, socket]);

  if (checking) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <BackgroundOrbs />
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <AppToasts toasts={toasts} removeToast={removeToast} />
        <AuthPage onAuth={setUser} addToast={addToast} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AuthContext.Provider value={{ logout }}>
        <UserContext.Provider value={user}>
          <div className="min-h-screen bg-surface text-text-primary">
            <BackgroundOrbs />
            <AppNavbar />
            <AppToasts toasts={toasts} removeToast={removeToast} />
            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">
              <AppRoutes socket={socket} onRequest={handleRequestJoin} addToast={addToast} />
            </main>
          </div>
        </UserContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

function AppRoutes({ socket, onRequest, addToast }) {
  const navigate = useNavigate();

  const handlePostRide = useCallback(async (data) => {
    try {
      await api("/api/rides", { method: "POST", body: JSON.stringify(data) });
      addToast("Ride posted! Badgers can now find you.");
      navigate("/my-rides");
    } catch (err) {
      addToast(err.message, "error");
    }
  }, [addToast, navigate]);

  return (
    <Routes>
      <Route path="/" element={<BrowseRides onRequest={onRequest} />} />
      <Route path="/post" element={<PostRide onPost={handlePostRide} />} />
      <Route path="/my-rides" element={<MyRides />} />
      <Route path="/messages" element={<Messages socket={socket} />} />
      <Route path="/match" element={<Matching onRequest={onRequest} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
