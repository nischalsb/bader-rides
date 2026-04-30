import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { api } from "../utils/api";
import BackgroundOrbs from "../components/BackgroundOrbs";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
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
            Reset your <span className="text-gradient">password</span>
          </h1>
          <p className="text-text-secondary mt-2">
            We'll email you a link to set a new one.
          </p>
        </div>

        <div className="glass rounded-3xl p-6 md:p-8 space-y-5">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-text-primary">
                If <span className="font-semibold">{email}</span> is registered, a reset link is on its way.
              </p>
              <p className="text-text-tertiary text-sm">
                Check your inbox (and spam folder). The link expires in 1 hour.
              </p>
              <Link
                to="/"
                className="inline-block mt-2 text-cardinal text-sm font-medium"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <Form onSubmit={handleSubmit} className="space-y-5">
              <Form.Group controlId="forgot-email">
                <Form.Label className="text-[10px] uppercase tracking-widest text-text-tertiary mb-2 font-medium">
                  Email
                </Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@wisc.edu"
                  className="px-4 py-3 rounded-xl text-sm input-dark border-0"
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
                {loading ? <Spinner animation="border" size="sm" /> : "Send reset link"}
              </Button>

              <p className="text-center">
                <Link to="/" className="text-xs text-text-tertiary hover:text-cardinal">
                  ← Back to sign in
                </Link>
              </p>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
