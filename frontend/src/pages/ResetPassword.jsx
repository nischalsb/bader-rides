import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { api } from "../utils/api";
import BackgroundOrbs from "../components/BackgroundOrbs";
import PasswordInput from "../components/PasswordInput";

export default function ResetPassword({ addToast }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      addToast?.("Password reset! Sign in with your new password.");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <BackgroundOrbs />
        <div className="relative z-10 w-full max-w-md glass rounded-3xl p-8 text-center space-y-4">
          <p className="text-text-primary">This reset link is invalid.</p>
          <Link to="/forgot-password" className="text-cardinal text-sm font-medium">
            Request a new link →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <BackgroundOrbs />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🦡</span>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-primary">
            Choose a <span className="text-gradient">new password</span>
          </h1>
        </div>

        <Form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8 space-y-5">
          <Form.Group controlId="reset-password">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">
              New password
            </Form.Label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Form.Group>

          <Form.Group controlId="reset-confirm">
            <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">
              Confirm password
            </Form.Label>
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Form.Group>

          {error && (
            <p className="text-cardinal-light text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="btn-glow w-full py-3 bg-gradient-to-r from-cardinal to-cardinal-dark text-white font-semibold rounded-2xl text-sm border-0"
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Reset password"}
          </Button>
        </Form>
      </div>
    </div>
  );
}
