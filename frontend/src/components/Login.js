import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "./Login.css";

function Login() {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (error) {
      console.error("Auth error:", error);

      // User-friendly error messages
      if (error.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else if (error.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password");
      } else if (error.code === "auth/email-already-in-use") {
        setError("Email already in use");
      } else if (error.code === "auth/weak-password") {
        setError("Password should be at least 6 characters");
      } else if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password");
      } else {
        setError(error.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>RentRedi</h1>
          <p className="login-subtitle">Tenant & Landlord Management Platform</p>
        </div>

        <div className="login-content">
          <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p>
            {isSignup ? "Sign up to get started" : "Sign in to manage your properties and tenants"}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength="6"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div className="toggle-mode">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
              className="toggle-button"
            >
              {isSignup ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>

          <div className="login-footer">
            <p>Secure authentication powered by Firebase</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
