// Demo authentication is a local UX implementation, NOT an authorization boundary.
// Production must use server sessions, server validation and protected APIs.
import { request } from "./http";
export const AUTH_MODE =
  import.meta.env.VITE_AUTH_MODE === "backend" ? "backend" : "demo";
const ACCOUNTS = "mechmedic.demo.accounts.v1",
  SESSION = "mechmedic.demo.session.v1";
export const demoCredentials = {
  email: "staff@mechmedic.demo",
  password: "MechMedicDemo!",
};
function read(key, store = localStorage, fallback = null) {
  try {
    return JSON.parse(store.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
async function digest(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
}
function publicUser(account) {
  return { id: account.id, name: account.name, email: account.email };
}
function persist(user, remember) {
  localStorage.removeItem(SESSION);
  sessionStorage.removeItem(SESSION);
  (remember ? localStorage : sessionStorage).setItem(
    SESSION,
    JSON.stringify({
      user,
      expires: Date.now() + (remember ? 7 : 1) * 86400000,
    }),
  );
  return user;
}
export async function getSession() {
  if (AUTH_MODE === "backend")
    return (await request("/api/auth/session"))?.user || null;
  const session = read(SESSION) || read(SESSION, sessionStorage);
  if (!session || session.expires < Date.now()) {
    localStorage.removeItem(SESSION);
    sessionStorage.removeItem(SESSION);
    return null;
  }
  return session.user;
}
export async function signIn({ email, password, remember }) {
  if (AUTH_MODE === "backend")
    return (
      await request("/api/auth/login", {
        method: "POST",
        body: { email, password, remember },
      })
    ).user;
  const normalized = email.trim().toLowerCase();
  if (
    normalized === demoCredentials.email &&
    password === demoCredentials.password
  )
    return persist(
      {
        id: "demo-staff",
        name: read("mechmedic.demo.profile")?.name || "Laboratory Staff",
        email: normalized,
      },
      remember,
    );
  const account = read(ACCOUNTS, localStorage, []).find(
    (a) => a.email === normalized,
  );
  if (!account || (await digest(password, account.salt)) !== account.hash)
    throw new Error("Email or password is incorrect.");
  return persist(publicUser(account), remember);
}
export async function register({ name, email, password }) {
  if (!name.trim()) throw new Error("Full name is required.");
  if (password.length < 8)
    throw new Error("Password must contain at least 8 characters.");
  if (AUTH_MODE === "backend")
    return request("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
  const accounts = read(ACCOUNTS, localStorage, []),
    normalized = email.trim().toLowerCase();
  if (
    normalized === demoCredentials.email ||
    accounts.some((a) => a.email === normalized)
  )
    throw new Error("An account with this email already exists.");
  const salt = crypto.randomUUID();
  accounts.push({
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    salt,
    hash: await digest(password, salt),
  });
  localStorage.setItem(ACCOUNTS, JSON.stringify(accounts));
}
export async function signOut() {
  if (AUTH_MODE === "backend")
    await request("/api/auth/logout", { method: "POST" });
  localStorage.removeItem(SESSION);
  sessionStorage.removeItem(SESSION);
}
export async function forgotPassword(email) {
  if (AUTH_MODE === "backend")
    await request("/api/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  return AUTH_MODE === "demo"
    ? "Demo mode: no reset email was sent. Use the demo credentials, or connect the authentication backend."
    : "If an account exists, password reset instructions will be sent.";
}
export async function updateProfile(user, profile) {
  if (AUTH_MODE === "backend")
    return (
      await request("/api/auth/profile", { method: "PATCH", body: profile })
    ).user;
  const next = {
    ...user,
    name: profile.name.trim(),
    email: profile.email.trim().toLowerCase(),
  };
  const accounts = read(ACCOUNTS, localStorage, []);
  if (
    next.email !== user.email &&
    (next.email === demoCredentials.email ||
      accounts.some((a) => a.email === next.email && a.id !== user.id))
  )
    throw new Error("This email is already in use.");
  // The shared preview account keeps its documented login address.
  if (user.id === "demo-staff") {
    next.email = demoCredentials.email;
    localStorage.setItem("mechmedic.demo.profile", JSON.stringify(next));
  }
  localStorage.setItem(
    ACCOUNTS,
    JSON.stringify(
      accounts.map((a) => (a.id === user.id ? { ...a, ...next } : a)),
    ),
  );
  return persist(next, !!localStorage.getItem(SESSION));
}
