import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getAuthErrorMessage = (error) => {
    const code = error?.code || "";
    const message = String(error?.message || "").toLowerCase();

    if (
      code === "auth/firebase-app-check-token-is-invalid" ||
      message.includes("firebase-app-check-token-is-invalid")
    ) {
      return "App Check verification failed. Refresh the page and try again. If this continues, verify the Firebase App Check site key and allowed domains.";
    }

    return error?.message || "Unable to sign in. Please try again.";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="login-container">
        <div className="login-card card">
          <div className="login-header">
            <h1 className="login-title">Insurance Analytics</h1>
            <p className="login-subtitle">Analytics Platform for Insurance Handbook Statistics</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <h3 className="login-form-title">Sign In</h3>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="error-box card">
                {error}
                {error.includes("App Check verification failed") && (
                  <button
                    type="button"
                    className="login-button"
                    style={{ marginTop: 8, background: "#0ea5a4", color: "#fff", fontSize: 13, padding: "6px 16px", borderRadius: 8 }}
                    onClick={() => {
                      window.localStorage.removeItem("firebase-app-check-debug-token");
                      window.localStorage.removeItem("firebase-app-check-token");
                      window.location.reload();
                    }}
                  >
                    Reset App Check & Retry
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="help-text">
              Enter your credentials to access the dashboard.
            </p>
          </form>

          <div className="login-footer">
            <p className="footer-text">Developed by InsurTech Team</p>
          </div>
        </div>
      </div>
    </div>
  );
}


