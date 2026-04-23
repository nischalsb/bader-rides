import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { api } from "../utils/api";
import BackgroundOrbs from "../components/BackgroundOrbs";

export default function AuthPage({ onAuth, addToast }) {
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

        <Form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8 space-y-5">
          <div className="flex gap-1 p-1 rounded-2xl glass-light mb-2">
            {["login", "register"].map((m) => (
              <Button key={m} type="button" variant="link" onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-300 text-cardinal ${mode === m ? "bg-cardinal/10 shadow-sm" : ""}`}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </Button>
            ))}
          </div>

          {mode === "register" && (
            <Form.Group>
              <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Name</Form.Label>
              <Form.Control type="text" value={form.name} onChange={set("name")} required placeholder="Your full name" className="px-4 py-3 rounded-xl text-sm input-dark border-0" />
            </Form.Group>
          )}
          <Form.Group>
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Email</Form.Label>
            <Form.Control type="email" value={form.email} onChange={set("email")} required placeholder="you@wisc.edu" className="px-4 py-3 rounded-xl text-sm input-dark border-0" />
          </Form.Group>
          <Form.Group>
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Password</Form.Label>
            <Form.Control type="password" value={form.password} onChange={set("password")} required placeholder="••••••••" minLength={6} className="px-4 py-3 rounded-xl text-sm input-dark border-0" />
            {mode === "login" && (
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-xs text-cardinal hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}
          </Form.Group>
          {mode === "register" && (
            <Form.Group>
              <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">Year</Form.Label>
              <Form.Select value={form.year} onChange={set("year")} className="px-4 py-3 rounded-xl text-sm input-dark border-0">
                {["Freshman", "Sophomore", "Junior", "Senior"].map((y) => <option key={y} value={y}>{y}</option>)}
              </Form.Select>
            </Form.Group>
          )}

          {error && <p className="text-cardinal-light text-sm text-center">{error}</p>}

          <Button type="submit" disabled={loading} className="btn-glow w-full py-3 bg-gradient-to-r from-cardinal to-cardinal-dark text-white font-semibold rounded-2xl text-sm border-0">
            {loading ? <Spinner animation="border" size="sm" /> : mode === "login" ? "Sign in" : "Create account"}
          </Button>

          {mode === "register" && (
            <p className="text-xs text-text-tertiary text-center">Only @wisc.edu emails are accepted</p>
          )}
        </Form>
      </div>
    </div>
  );
}
