import { useContext } from "react";
import { NavLink } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import BSNavbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";
import { AuthContext, UserContext } from "../contexts";
import { YEAR_LABELS } from "../utils/constants";
import Avatar from "./Avatar";

const tabs = [
  { to: "/", label: "Browse", icon: (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>) },
  { to: "/post", label: "Post", icon: (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>) },
  { to: "/my-rides", label: "My Rides", icon: (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 5H6.3a2 2 0 0 0-1.6.9L2 9.5 .5 11c-.3.5-.5.9-.5 1.5V16c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>) },
  { to: "/messages", label: "Chat", icon: (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>) },
  { to: "/match", label: "Match", icon: (<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>) },
];

export default function AppNavbar() {
  const user = useContext(UserContext);
  const { logout } = useContext(AuthContext);

  return (
    <>
      <BSNavbar sticky="top" className="glass-nav z-50 !border-0">
        <Container fluid className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BSNavbar.Brand as={NavLink} to="/" className="flex items-center gap-2.5 group m-0 p-0">
            <span aria-hidden="true" className="text-2xl group-hover:scale-110 transition-transform">🦡</span>
            <span className="text-lg font-bold font-display tracking-tight text-text-primary">Badger<span className="text-gradient">Rides</span></span>
          </BSNavbar.Brand>
          <Nav className="hidden md:flex items-center gap-0.5 p-1 rounded-2xl glass-light">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.to === "/"} className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive ? "bg-cardinal text-white shadow-lg shadow-cardinal/20" : "text-text-secondary hover:text-text-primary"}`
              }>
                {t.icon}<span>{t.label}</span>
              </NavLink>
            ))}
          </Nav>
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right mr-1">
              <div className="text-sm font-medium text-text-primary">{user?.name?.split(" ")[0]}</div>
              <div className="text-[10px] text-text-tertiary uppercase tracking-wide">{YEAR_LABELS[user?.year] || user?.year}</div>
            </div>
            <Avatar initials={user?.avatar || "?"} size="sm" glow />
            <Button variant="link" onClick={logout} className="ml-1 text-text-tertiary hover:text-cardinal-light p-0" title="Sign out" aria-label="Sign out">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </Button>
          </div>
        </Container>
      </BSNavbar>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav" style={{ borderBottom: "none", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex justify-around py-1.5 px-2">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === "/"} className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all duration-300 ${isActive ? "text-cardinal-light" : "text-text-tertiary"}`
            }>
              {({ isActive }) => (
                <>
                  <div className={`transition-transform duration-300 ${isActive ? "scale-110" : ""}`}>{t.icon}</div>
                  {t.label}
                  {isActive && <div className="w-1 h-1 rounded-full bg-cardinal-light mt-0.5" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
