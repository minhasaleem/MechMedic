import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  AUTH_MODE,
  demoCredentials,
  register,
  forgotPassword,
} from "../services/auth";
import { Brand, Icon } from "../components/ui";
export default function AuthPage({ page }) {
  const signup = page === "register",
    forgot = page === "forgot-password";
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    remember: false,
  });
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  const { login } = useAuth();
  const change = (e) =>
    setValues((v) => ({
      ...v,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (signup && values.password !== values.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (forgot) setMessage(await forgotPassword(values.email));
      else if (signup) {
        await register(values);
        setMessage("Account created. You can now sign in.");
        setValues((v) => ({ ...v, password: "", confirm: "" }));
      } else await login(values);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-story">
        <a href="#login" className="brand">
          <Brand />
        </a>
        <div className="auth-story-copy">
          <span className="eyebrow">LABORATORY EQUIPMENT MONITORING</span>
          <h1>
            Stay ahead.
            <br />
            <span>Keep equipment ready.</span>
          </h1>
          <p>
            A focused workspace for equipment condition, sensor signals and
            maintenance decisions.
          </p>
          <div className="auth-visual" aria-hidden="true">
            <div className="auth-orbit orbit-one" />
            <div className="auth-orbit orbit-two" />
            <div className="auth-core">
              <Icon name="equipment" size={66} />
            </div>
            <span className="auth-signal signal-one">
              <Icon name="activity" /> Vibration
            </span>
            <span className="auth-signal signal-two">
              <Icon name="thermometer" /> Temperature
            </span>
            <span className="auth-signal signal-three">
              <Icon name="zap" /> Current
            </span>
          </div>
        </div>
        <div className="auth-story-footer">
          <Icon name="shield" size={17} /> Your laboratory. One clear view.
        </div>
      </section>
      <section className="auth-form-side">
        <div className="auth-card">
          <span className="auth-lock">
            <Icon name={signup ? "user" : forgot ? "mail" : "lock"} size={23} />
          </span>
          <h2>
            {signup
              ? "Create your account"
              : forgot
                ? "Reset your password"
                : "Welcome back"}
          </h2>
          <p>
            {signup
              ? "Register for the laboratory workspace."
              : forgot
                ? "Enter the email associated with your account."
                : "Sign in to your MechMedic workspace."}
          </p>
          <form onSubmit={submit}>
            {signup && (
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                  value={values.name}
                  onChange={change}
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={150}
                value={values.email}
                onChange={change}
                placeholder="you@laboratory.edu"
              />
            </label>
            {!forgot && (
              <>
                <label>
                  Password
                  <div className="password-field">
                    <input
                      aria-label="Password"
                      name="password"
                      type={show ? "text" : "password"}
                      autoComplete={
                        signup ? "new-password" : "current-password"
                      }
                      required
                      minLength={signup ? 8 : undefined}
                      maxLength={128}
                      value={values.password}
                      onChange={change}
                    />
                    <button
                      type="button"
                      aria-label={show ? "Hide password" : "Show password"}
                      onClick={() => setShow(!show)}
                    >
                      <Icon name="eye" size={18} />
                    </button>
                  </div>
                  {signup && <small>At least 8 characters.</small>}
                </label>
                {signup && (
                  <label>
                    Confirm password
                    <input
                      name="confirm"
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      value={values.confirm}
                      onChange={change}
                    />
                  </label>
                )}
                {!signup && (
                  <div className="auth-options">
                    <label className="check-label">
                      <input
                        name="remember"
                        type="checkbox"
                        checked={values.remember}
                        onChange={change}
                      />
                      Remember me
                    </label>
                    <a href="#forgot-password">Forgot password?</a>
                  </div>
                )}
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="form-success" role="status">
                {message}
              </p>
            )}
            <button className="primary-button auth-submit" disabled={busy}>
              {busy
                ? "Please wait…"
                : signup
                  ? "Register"
                  : forgot
                    ? "Request reset"
                    : "Sign In"}
              <Icon name="right" size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {signup || forgot
              ? "Already have an account?"
              : "New to MechMedic?"}{" "}
            <a href={signup || forgot ? "#login" : "#register"}>
              {signup || forgot ? "Back to Login" : "Register"}
            </a>
          </p>
          {AUTH_MODE === "demo" && (
            <div className="demo-auth-note">
              <strong>Frontend demo authentication</strong>
              <p>
                Accounts and sessions stay in this browser. A backend is
                required for secure access.
              </p>
              {!signup && !forgot && (
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    setValues((v) => ({ ...v, ...demoCredentials }))
                  }
                >
                  Use demo credentials <Icon name="arrow" size={13} />
                </button>
              )}
            </div>
          )}
        </div>
        <p className="auth-copyright">
          MechMedic · Keeping Machines One Step Ahead
        </p>
      </section>
    </main>
  );
}
