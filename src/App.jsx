import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { io } from "socket.io-client";

// ─── Contexts ───────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const UserContext = createContext(null);

// ─── Constants ──────────────────────────────────────────────────────────────
const DESTINATIONS = [
  "O'Hare Airport (ORD)", "Midway Airport (MDW)", "Chicago Downtown",
  "Milwaukee", "Minneapolis", "Madison Airport (MSN)", "Green Bay", "Rockford",
];
const PICKUP_LOCATIONS = [
  "Union South", "Dejope Residence Hall", "Sellery Residence Hall",
  "Memorial Union", "Engineering Hall", "Camp Randall",
  "Witte Residence Hall", "Lakeshore Path & Observatory Dr",
];

// ─── API Helper ─────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── Formatting ─────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(typeof dateStr === "string" && !dateStr.includes("T") ? dateStr + "T00:00:00" : dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function formatTime(timeStr) {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}
function formatTimestamp(ts) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function getSeatsLeft(r) { return r.totalSeats - r.takenSeats; }

// ─── Background Orbs ────────────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-[20%] -right-[10%] w-[700px] h-[700px] rounded-full bg-cardinal/[0.03] blur-[180px] animate-float" />
      <div className="absolute top-[30%] -left-[15%] w-[600px] h-[600px] rounded-full bg-accent-blue/[0.03] blur-[160px] animate-float-slow" />
      <div className="absolute -bottom-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-cardinal/[0.02] blur-[150px] animate-pulse-glow" />
    </div>
  );
}

// ─── Toast System ───────────────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`${t.exiting ? "toast-exit" : "toast-enter"} glass flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium shadow-2xl`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${t.type === "success" ? "bg-accent-green" : "bg-cardinal-light"}`} />
          <span className="text-text-primary">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="ml-2 text-text-tertiary hover:text-text-primary transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts((p) => p.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 300);
    }, 3000);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((p) => p.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 300);
  }, []);
  return { toasts, addToast, removeToast };
}

// ─── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ initials, size = "md", glow }) {
  const sizes = { sm: "w-8 h-8 text-[10px]", md: "w-10 h-10 text-xs", lg: "w-12 h-12 text-sm" };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-cardinal to-cardinal-dark text-white font-bold flex items-center justify-center shrink-0 ${glow ? "ring-2 ring-cardinal/30 shadow-[0_0_20px_rgba(197,5,12,0.2)]" : ""}`}>
      {initials}
    </div>
  );
}

// ─── Countdown ──────────────────────────────────────────────────────────────
function Countdown() {
  const springBreak = new Date("2026-03-14T00:00:00");
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const diff = springBreak - now;
  const d = Math.max(0, Math.floor(diff / 86400000));
  const h = Math.max(0, Math.floor((diff % 86400000) / 3600000));
  const m = Math.max(0, Math.floor((diff % 3600000) / 60000));
  const s = Math.max(0, Math.floor((diff % 60000) / 1000));
  const B = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="glass-light rounded-xl px-3 py-2 min-w-[52px] text-center">
        <span className="text-2xl font-bold font-display text-text-primary tabular-nums">{String(value).padStart(2, "0")}</span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-text-tertiary mt-1.5">{label}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2.5">
      <B value={d} label="days" /><span className="text-text-tertiary text-lg font-light mb-5">:</span>
      <B value={h} label="hrs" /><span className="text-text-tertiary text-lg font-light mb-5">:</span>
      <B value={m} label="min" /><span className="text-text-tertiary text-lg font-light mb-5">:</span>
      <B value={s} label="sec" />
    </div>
  );
}

// ─── Login / Register ───────────────────────────────────────────────────────
function AuthPage({ onAuth, addToast }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "", year: "Junior" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, year: form.year };
      const data = await api(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST", body: JSON.stringify(body),
      });
      localStorage.setItem("token", data.token);
      onAuth(data.user);
      addToast(mode === "login" ? `Welcome back, ${data.user.name.split(" ")[0]}!` : "Account created!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <BackgroundOrbs />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🦡</span>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">
            Badger<span className="text-gradient">Rides</span>
          </h1>
          <p className="text-text-secondary mt-2">Carpooling for UW Madison students</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8 space-y-5">
          <div className="flex gap-1 p-1 rounded-2xl glass-light mb-2">
            {["login", "register"].map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${mode === m ? "bg-cardinal text-white shadow-lg shadow-cardinal/20" : "text-text-secondary"}`}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Name</label>
              <input type="text" value={form.name} onChange={set("name")} required placeholder="Your full name" className="w-full px-4 py-3 rounded-xl text-sm input-dark" />
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Email</label>
            <input type="email" value={form.email} onChange={set("email")} required placeholder="you@wisc.edu" className="w-full px-4 py-3 rounded-xl text-sm input-dark" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Password</label>
            <input type="password" value={form.password} onChange={set("password")} required placeholder="••••••••" minLength={6} className="w-full px-4 py-3 rounded-xl text-sm input-dark" />
          </div>
          {mode === "register" && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Year</label>
              <select value={form.year} onChange={set("year")} className="w-full px-4 py-3 rounded-xl text-sm input-dark">
                {["Freshman", "Sophomore", "Junior", "Senior"].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {error && <p className="text-cardinal-light text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading} className="btn-glow w-full py-4 bg-gradient-to-r from-cardinal to-cardinal-dark text-white font-bold rounded-2xl text-base">
            {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
          </button>

          {mode === "register" && (
            <p className="text-xs text-text-tertiary text-center">Only @wisc.edu emails are accepted</p>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────────────
function Navbar({ activeTab, setActiveTab }) {
  const user = useContext(UserContext);
  const { logout } = useContext(AuthContext);
  const tabs = [
    { id: "browse", label: "Browse", icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>) },
    { id: "post", label: "Post", icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>) },
    { id: "myrides", label: "My Rides", icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 5H6.3a2 2 0 0 0-1.6.9L2 9.5 .5 11c-.3.5-.5.9-.5 1.5V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>) },
    { id: "messages", label: "Chat", icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>) },
    { id: "match", label: "Match", icon: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>) },
  ];
  return (
    <>
      <nav className="sticky top-0 z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => setActiveTab("browse")} className="flex items-center gap-2.5 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🦡</span>
            <span className="text-lg font-bold font-display tracking-tight text-text-primary">Badger<span className="text-gradient">Rides</span></span>
          </button>
          <div className="hidden md:flex items-center gap-0.5 p-1 rounded-2xl glass-light">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === t.id ? "bg-cardinal text-white shadow-lg shadow-cardinal/20" : "text-text-secondary hover:text-text-primary"}`}>
                {t.icon}<span>{t.label}</span>
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right mr-1">
              <div className="text-sm font-medium text-text-primary">{user?.name?.split(" ")[0]}</div>
              <div className="text-[10px] text-text-tertiary uppercase tracking-wide">{user?.year}</div>
            </div>
            <Avatar initials={user?.avatar || "?"} size="sm" glow />
            <button onClick={logout} className="ml-1 text-text-tertiary hover:text-cardinal-light transition-colors" title="Sign out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
        </div>
      </nav>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav" style={{ borderBottom: "none", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex justify-around py-1.5 px-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all duration-300 ${activeTab === t.id ? "text-cardinal-light" : "text-text-tertiary"}`}>
              <div className={`transition-transform duration-300 ${activeTab === t.id ? "scale-110" : ""}`}>{t.icon}</div>
              {t.label}
              {activeTab === t.id && <div className="w-1 h-1 rounded-full bg-cardinal-light mt-0.5" />}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

// ─── Ride Card ──────────────────────────────────────────────────────────────
function RideCard({ ride, onRequest, index = 0 }) {
  const user = useContext(UserContext);
  const seatsLeft = getSeatsLeft(ride);
  const isOwn = ride.driverId === user.id;
  const hasJoined = ride.riders?.includes(user.id);
  const isFull = seatsLeft <= 0;
  return (
    <div className={`glass card-hover rounded-2xl p-5 fade-in stagger-${(index % 4) + 1}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar initials={ride.avatar} />
          <div>
            <h3 className="font-semibold text-text-primary text-[15px]">{ride.driver}</h3>
            <p className="text-xs text-text-tertiary mt-0.5">{ride.pickup}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwn && <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">You</span>}
          {isFull && <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-surface-hover text-text-tertiary border border-border-subtle">Full</span>}
          {hasJoined && !isFull && <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20">Joined</span>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-cardinal/10 text-cardinal-light border border-cardinal/15">{ride.destination}</span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-hover text-text-secondary border border-border-subtle">{formatDate(ride.date)}</span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-hover text-text-secondary border border-border-subtle">{formatTime(ride.time)}</span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${seatsLeft === 0 ? "bg-text-tertiary" : seatsLeft <= 1 ? "bg-accent-warm animate-pulse" : "bg-accent-green"}`} />
            <span className={`text-sm font-medium ${seatsLeft === 0 ? "text-text-tertiary" : seatsLeft <= 1 ? "text-accent-warm" : "text-text-secondary"}`}>{seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left</span>
          </div>
          <span className="text-sm font-bold text-accent-green">${ride.price}</span>
        </div>
        {!isOwn && !hasJoined && !isFull && (
          <button onClick={() => onRequest(ride.id)} className="btn-glow px-5 py-2 bg-cardinal text-white text-sm font-semibold rounded-xl">Join ride</button>
        )}
      </div>
      {ride.notes && <p className="mt-3 pt-3 border-t border-border-subtle text-sm text-text-tertiary leading-relaxed">{ride.notes}</p>}
    </div>
  );
}

// ─── Browse Rides (API) ─────────────────────────────────────────────────────
function BrowseRides({ onRequest }) {
  const [rides, setRides] = useState([]);
  const [search, setSearch] = useState("");
  const [destFilter, setDestFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [seatsFilter, setSeatsFilter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRides = useCallback(async () => {
    try {
      const data = await api("/api/rides");
      setRides(data.rides);
    } catch { /* toast handled upstream */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  const filtered = rides.filter((r) => {
    if (destFilter && r.destination !== destFilter) return false;
    if (dateFilter && r.date !== dateFilter) return false;
    if (seatsFilter > 0 && getSeatsLeft(r) < seatsFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.destination.toLowerCase().includes(q) || (r.driver || "").toLowerCase().includes(q) || r.pickup.toLowerCase().includes(q);
    }
    return true;
  });
  const openRides = rides.filter((r) => getSeatsLeft(r) > 0).length;

  const handleJoin = async (id) => {
    await onRequest(id);
    fetchRides();
  };

  return (
    <div className="fade-in">
      <div className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-light text-xs font-medium text-text-secondary mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />{openRides} rides available now
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight">
          <span className="text-text-primary">ditch the bus.</span><br /><span className="text-gradient">ride with badgers.</span>
        </h1>
        <p className="text-text-secondary mt-3 text-lg max-w-md">Find your ride home for spring break — cheaper than a bus, better than begging your parents.</p>
        <div className="mt-6 mb-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary mb-3 font-medium">Spring break countdown</p>
          <Countdown />
        </div>
      </div>
      <div className="flex flex-col gap-3 mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search rides..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm input-dark" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${showFilters ? "bg-cardinal text-white shadow-lg shadow-cardinal/20" : "glass-light text-text-secondary hover:text-text-primary"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>
          </button>
        </div>
        {showFilters && (
          <div className="slide-up glass rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Destination</label><select value={destFilter} onChange={(e) => setDestFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm input-dark"><option value="">All</option>{DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Date</label><input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm input-dark" /></div>
            <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Min seats</label><select value={seatsFilter} onChange={(e) => setSeatsFilter(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl text-sm input-dark"><option value={0}>Any</option><option value={1}>1+</option><option value={2}>2+</option><option value={3}>3+</option></select></div>
          </div>
        )}
      </div>
      <p className="text-xs text-text-tertiary mb-4 uppercase tracking-widest font-medium">{loading ? "Loading..." : `${filtered.length} ride${filtered.length !== 1 ? "s" : ""} found`}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.length === 0 && !loading ? (
          <div className="md:col-span-2 text-center py-20">
            <div className="text-5xl mb-4 opacity-40">{rides.length === 0 ? "🦡" : "🚗"}</div>
            <p className="font-medium text-text-secondary">{rides.length === 0 ? "No rides posted yet" : "No rides match your filters"}</p>
            <p className="text-sm text-text-tertiary mt-1">{rides.length === 0 ? "Be the first — post a ride and get the ball rolling!" : "Try adjusting your search or filters"}</p>
          </div>
        ) : filtered.map((r, i) => <RideCard key={r.id} ride={r} onRequest={handleJoin} index={i} />)}
      </div>
    </div>
  );
}

// ─── Post a Ride (API) ──────────────────────────────────────────────────────
function PostRide({ onPost }) {
  const [form, setForm] = useState({ destination: "", customDest: "", date: "", time: "", pickup: "", totalSeats: 4, notes: "", venmo: "", price: "" });
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    const dest = form.destination === "__custom" ? form.customDest : form.destination;
    if (!dest || !form.date || !form.time || !form.pickup) return;
    await onPost({ destination: dest, date: form.date, time: form.time, pickup: form.pickup, totalSeats: Number(form.totalSeats), notes: form.notes, venmo: form.venmo, price: Number(form.price) || 0 });
    setForm({ destination: "", customDest: "", date: "", time: "", pickup: "", totalSeats: 4, notes: "", venmo: "", price: "" });
  };
  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="mb-8 text-center"><h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-text-primary">share the road</h1><p className="text-text-secondary mt-2 text-lg">Post your ride. Split the cost. Make friends.</p></div>
      <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2"><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Where to?</label><select value={form.destination} onChange={set("destination")} required className="w-full px-4 py-3 rounded-xl text-sm input-dark"><option value="">Select destination...</option>{DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}<option value="__custom">Somewhere else...</option></select>{form.destination === "__custom" && <input type="text" placeholder="Type your destination..." value={form.customDest} onChange={set("customDest")} required className="mt-2 w-full px-4 py-3 rounded-xl text-sm input-dark" />}</div>
          <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Date</label><input type="date" value={form.date} onChange={set("date")} required className="w-full px-4 py-3 rounded-xl text-sm input-dark" /></div>
          <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Time</label><select value={form.time} onChange={set("time")} required className="w-full px-4 py-3 rounded-xl text-sm input-dark"><option value="">Select time...</option>{Array.from({ length: 36 }, (_, i) => { const h = Math.floor(i / 2) + 5; const m = i % 2 === 0 ? "00" : "30"; if (h > 22) return null; const val = `${String(h).padStart(2, "0")}:${m}`; const hr = h > 12 ? h - 12 : h === 0 ? 12 : h; return <option key={val} value={val}>{`${hr}:${m} ${h >= 12 ? "PM" : "AM"}`}</option>; }).filter(Boolean)}</select></div>
          <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Pickup spot</label><select value={form.pickup} onChange={set("pickup")} required className="w-full px-4 py-3 rounded-xl text-sm input-dark"><option value="">Select pickup...</option>{PICKUP_LOCATIONS.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Seats</label><select value={form.totalSeats} onChange={set("totalSeats")} className="w-full px-4 py-3 rounded-xl text-sm input-dark">{[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
          <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Price per person</label><input type="number" min="0" placeholder="$0" value={form.price} onChange={set("price")} className="w-full px-4 py-3 rounded-xl text-sm input-dark" /></div>
          <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Venmo (optional)</label><input type="text" placeholder="@your-handle" value={form.venmo} onChange={set("venmo")} className="w-full px-4 py-3 rounded-xl text-sm input-dark" /></div>
          <div className="sm:col-span-2"><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Notes</label><textarea rows={3} placeholder="Trunk space, vibes, stops along the way..." value={form.notes} onChange={set("notes")} className="w-full px-4 py-3 rounded-xl text-sm input-dark resize-none" /></div>
        </div>
        <button type="submit" className="btn-glow w-full py-4 bg-gradient-to-r from-cardinal to-cardinal-dark text-white font-bold rounded-2xl text-base tracking-wide">Post your ride</button>
      </form>
    </div>
  );
}

// ─── My Rides (API) ─────────────────────────────────────────────────────────
function MyRides() {
  const user = useContext(UserContext);
  const [posted, setPosted] = useState([]);
  const [joined, setJoined] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api("/api/rides/mine/driving"), api("/api/rides/mine/riding")])
      .then(([d, r]) => { setPosted(d.rides); setJoined(r.rides); })
      .finally(() => setLoading(false));
  }, []);

  const StatusBadge = ({ ride }) => {
    if (ride.status === "full" || getSeatsLeft(ride) <= 0) return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-surface-hover text-text-tertiary border border-border-subtle">Full</span>;
    if (ride.riders?.includes(user.id) || ride.driverId === user.id) return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20">Confirmed</span>;
    return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20">Pending</span>;
  };
  const RideRow = ({ ride, i }) => (
    <div className={`glass card-hover rounded-2xl p-4 flex items-center justify-between gap-4 fade-in stagger-${(i % 4) + 1}`}>
      <div className="flex items-center gap-3 min-w-0"><Avatar initials={ride.avatar} size="sm" /><div className="min-w-0"><p className="font-medium text-text-primary text-sm truncate">{ride.destination}</p><p className="text-xs text-text-tertiary mt-0.5 truncate">{formatDate(ride.date)} &middot; {formatTime(ride.time)} &middot; {ride.pickup}</p></div></div>
      <div className="flex items-center gap-3 shrink-0"><span className="text-sm text-text-tertiary hidden sm:inline">{getSeatsLeft(ride)} left</span><StatusBadge ride={ride} /></div>
    </div>
  );
  const Empty = ({ text }) => <div className="text-center py-12 glass rounded-2xl"><div className="text-3xl mb-2 opacity-30">🛣️</div><p className="text-sm text-text-tertiary">{text}</p></div>;

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="mb-8 text-center"><h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-text-primary">your rides</h1><p className="text-text-secondary mt-2">Everything in one place.</p></div>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[{ label: "Driving", val: posted.length, color: "cardinal" }, { label: "Riding", val: joined.length, color: "accent-blue" }, { label: "Total", val: posted.length + joined.length, color: "accent-green" }].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center"><div className={`text-2xl font-bold font-display text-${s.color}`}>{s.val}</div><div className="text-[10px] uppercase tracking-widest text-text-tertiary mt-1">{s.label}</div></div>
        ))}
      </div>
      {loading ? <p className="text-text-tertiary text-center py-8">Loading...</p> : (
        <>
          <section className="mb-8"><h2 className="text-xs uppercase tracking-widest text-text-tertiary font-medium mb-3">Rides you&apos;re driving ({posted.length})</h2>{posted.length === 0 ? <Empty text="No rides posted yet" /> : <div className="grid gap-2">{posted.map((r, i) => <RideRow key={r.id} ride={r} i={i} />)}</div>}</section>
          <section><h2 className="text-xs uppercase tracking-widest text-text-tertiary font-medium mb-3">Rides you&apos;ve joined ({joined.length})</h2>{joined.length === 0 ? <Empty text="No rides joined yet" /> : <div className="grid gap-2">{joined.map((r, i) => <RideRow key={r.id} ride={r} i={i} />)}</div>}</section>
        </>
      )}
    </div>
  );
}

// ─── Messages / Chat (API + Socket.IO) ──────────────────────────────────────
function Messages({ socket }) {
  const user = useContext(UserContext);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api("/api/conversations").then((d) => {
      setConversations(d.conversations);
      if (d.conversations.length > 0 && !activeConvo) setActiveConvo(d.conversations[0].id);
    });
  }, []);

  useEffect(() => {
    if (!activeConvo) return;
    api(`/api/conversations/${activeConvo}/messages`).then((d) => setMessages(d.messages));
  }, [activeConvo]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  // Socket.IO: listen for new messages
  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if (msg.conversationId === activeConvo) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      setConversations((prev) => prev.map((c) =>
        c.id === msg.conversationId ? { ...c, lastMessage: { text: msg.text, ts: msg.ts, from: msg.fromUser?.name } } : c
      ));
    };
    socket.on("new-message", handler);
    return () => socket.off("new-message", handler);
  }, [socket, activeConvo]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConvo) return;
    const text = input.trim();
    setInput("");
    try {
      await api(`/api/conversations/${activeConvo}/messages`, { method: "POST", body: JSON.stringify({ text }) });
    } catch { /* message will arrive via socket or we re-fetch */ }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const selectConvo = (id) => { setActiveConvo(id); setMobileShowChat(true); };
  const convo = conversations.find((c) => c.id === activeConvo);

  return (
    <div className="fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-text-primary">
            {mobileShowChat && <button onClick={() => setMobileShowChat(false)} className="md:hidden mr-3 text-text-tertiary hover:text-text-primary text-lg">&larr;</button>}
            messages
          </h1>
          <p className="text-text-secondary mt-1 hidden md:block">Coordinate with your crew</p>
        </div>
      </div>
      <div className="glass rounded-3xl overflow-hidden" style={{ height: "calc(100vh - 230px)", minHeight: 420 }}>
        <div className="flex h-full">
          <div className={`${mobileShowChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-border-subtle`}>
            <div className="p-4 border-b border-border-subtle"><p className="text-[10px] uppercase tracking-widest text-text-tertiary font-medium">{conversations.length} conversations</p></div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="text-3xl mb-2 opacity-30">💬</div>
                  <p className="text-sm text-text-tertiary">No conversations yet</p>
                  <p className="text-xs text-text-tertiary/60 mt-1">Join a ride to start chatting with the driver</p>
                </div>
              )}
              {conversations.map((c) => {
                const isActive = activeConvo === c.id;
                return (
                  <button key={c.id} onClick={() => selectConvo(c.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 ${isActive ? "bg-cardinal/5 border-l-2 border-cardinal" : "hover:bg-surface-hover border-l-2 border-transparent"}`}>
                    <Avatar initials={c.with?.avatar || "?"} size="sm" glow={isActive} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className={`text-sm font-medium ${isActive ? "text-text-primary" : "text-text-secondary"}`}>{c.with?.name}</span>
                        {c.lastMessage && <span className="text-[10px] text-text-tertiary">{formatTimestamp(c.lastMessage.ts)}</span>}
                      </div>
                      <p className="text-[10px] text-cardinal-light/60 mt-0.5">{c.rideLabel}</p>
                      {c.lastMessage && <p className="text-xs text-text-tertiary truncate mt-0.5">{c.lastMessage.text}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className={`${!mobileShowChat ? "hidden md:flex" : "flex"} flex-col flex-1`}>
            {convo ? (
              <>
                <div className="px-5 py-3.5 border-b border-border-subtle flex items-center gap-3 glass-light">
                  <Avatar initials={convo.with?.avatar || "?"} size="sm" glow />
                  <div><p className="font-medium text-sm text-text-primary">{convo.with?.name}</p><p className="text-[10px] text-cardinal-light/60">{convo.rideLabel}</p></div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.map((m) => {
                    const isMe = m.from === user.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${isMe ? "bg-cardinal text-white rounded-2xl rounded-br-lg" : "bg-surface-hover rounded-2xl rounded-bl-lg text-text-primary"}`}>
                          <p>{m.text}</p>
                          <p className={`text-[10px] mt-1.5 ${isMe ? "text-white/40" : "text-text-tertiary"}`}>{formatTimestamp(m.ts)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-border-subtle">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type something..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} className="flex-1 px-4 py-3 rounded-xl text-sm input-dark" />
                    <button onClick={sendMessage} disabled={!input.trim()} className="px-5 py-3 bg-cardinal text-white text-sm font-semibold rounded-xl btn-glow disabled:opacity-30 disabled:cursor-not-allowed">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
                    </button>
                  </div>
                </div>
              </>
            ) : <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">Select a conversation</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Matching (API) ─────────────────────────────────────────────────────────
function Matching({ onRequest }) {
  const user = useContext(UserContext);
  const [dest, setDest] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const findMatches = async (e) => {
    e.preventDefault();
    if (!dest || !date) return;
    setSearching(true); setResults(null);
    try {
      const data = await api(`/api/rides/match?destination=${encodeURIComponent(dest)}&date=${date}`);
      setResults(data.rides);
    } catch { setResults([]); }
    finally { setSearching(false); }
  };

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="mb-8 text-center"><h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-text-primary">find your <span className="text-gradient">perfect match</span></h1><p className="text-text-secondary mt-2 text-lg">Tell us where and when. We&apos;ll do the rest.</p></div>
      <form onSubmit={findMatches} className="glass rounded-3xl p-6 md:p-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Where to?</label><select value={dest} onChange={(e) => setDest(e.target.value)} required className="w-full px-4 py-3 rounded-xl text-sm input-dark"><option value="">Select destination...</option>{DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
          <div><label className="block text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">When?</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-3 rounded-xl text-sm input-dark" /></div>
        </div>
        <button type="submit" disabled={searching} className="btn-glow w-full py-4 bg-gradient-to-r from-cardinal to-cardinal-dark text-white font-bold rounded-2xl text-base tracking-wide disabled:opacity-60">
          {searching ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round"/></svg>Scanning...</span> : "Find my match"}
        </button>
      </form>
      {results !== null && (
        <div className="slide-up">
          {results.length === 0 ? (
            <div className="text-center py-16 glass rounded-3xl"><div className="text-5xl mb-4 opacity-30">😔</div><p className="font-medium text-text-secondary">No matches found</p></div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-text-tertiary uppercase tracking-widest font-medium">{results.length} match{results.length !== 1 ? "es" : ""} found</p>
              {results.map((r, i) => (
                <div key={r.id} className={`fade-in stagger-${(i % 4) + 1} relative`}>
                  {i === 0 && <div className="absolute -top-2 right-4 z-10 px-3 py-1 bg-gradient-to-r from-accent-yellow to-accent-warm text-black text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-accent-yellow/20">Best match</div>}
                  <div className={`glass rounded-2xl p-5 ${i === 0 ? "ring-1 ring-accent-yellow/30 shadow-[0_0_40px_rgba(255,214,10,0.06)]" : ""}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3"><Avatar initials={r.avatar} glow={i === 0} /><div><h3 className="font-semibold text-text-primary">{r.driver}</h3><p className="text-xs text-text-tertiary">{r.pickup}</p></div></div>
                      <div className="text-right"><div className={`text-3xl font-bold font-display ${i === 0 ? "text-gradient" : "text-cardinal-light"}`}>{r.score}</div><div className="text-[10px] uppercase tracking-widest text-text-tertiary">score</div></div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-cardinal/10 text-cardinal-light border border-cardinal/15">{r.destination}</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-hover text-text-secondary border border-border-subtle">{formatDate(r.date)} &middot; {formatTime(r.time)}</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-surface-hover text-text-secondary border border-border-subtle">{r.seatsLeft || getSeatsLeft(r)} seats</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-accent-green/10 text-accent-green border border-accent-green/20">${r.price}</span>
                    </div>
                    <button onClick={() => onRequest(r.id)} className="btn-glow w-full py-3 bg-cardinal text-white text-sm font-bold rounded-xl">Join this ride</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("browse");
  const [socket, setSocket] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setChecking(false); return; }
    api("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setChecking(false));
  }, []);

  // Connect Socket.IO when authenticated
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const s = io({ query: { token } });
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

  const handlePostRide = useCallback(async (data) => {
    try {
      await api("/api/rides", { method: "POST", body: JSON.stringify(data) });
      addToast("Ride posted! Badgers can now find you.");
      setActiveTab("myrides");
    } catch (err) {
      addToast(err.message, "error");
    }
  }, [addToast]);

  if (checking) {
    return <div className="min-h-screen bg-surface flex items-center justify-center"><BackgroundOrbs /><div className="text-text-tertiary text-sm animate-pulse">Loading...</div></div>;
  }

  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <AuthPage onAuth={setUser} addToast={addToast} />
      </>
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case "browse": return <BrowseRides onRequest={handleRequestJoin} />;
      case "post": return <PostRide onPost={handlePostRide} />;
      case "myrides": return <MyRides />;
      case "messages": return <Messages socket={socket} />;
      case "match": return <Matching onRequest={handleRequestJoin} />;
      default: return <BrowseRides onRequest={handleRequestJoin} />;
    }
  };

  return (
    <AuthContext.Provider value={{ logout }}>
      <UserContext.Provider value={user}>
        <div className="min-h-screen bg-surface text-text-primary">
          <BackgroundOrbs />
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
          <ToastContainer toasts={toasts} removeToast={removeToast} />
          <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">
            {renderPage()}
          </main>
        </div>
      </UserContext.Provider>
    </AuthContext.Provider>
  );
}
