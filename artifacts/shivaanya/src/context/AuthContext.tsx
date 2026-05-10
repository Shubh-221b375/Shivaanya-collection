import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_ACCOUNTS = "shivaanya_accounts_v1";
const STORAGE_SESSION = "shivaanya_session_email_v1";

export type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
};

type StoredAccount = {
  email: string;
  passwordDigest: string;
  profile: UserProfile;
};

async function digestPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${email.toLowerCase().trim()}:${password}:shivaanya`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(STORAGE_ACCOUNTS, JSON.stringify(accounts));
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (email: string, password: string, profile: UserProfile) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
  updateProfile: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  const hydrate = useCallback(() => {
    const email = localStorage.getItem(STORAGE_SESSION)?.trim().toLowerCase();
    if (!email) {
      setUser(null);
      return;
    }
    const accounts = loadAccounts();
    const acc = accounts.find((a) => a.email.toLowerCase() === email);
    setUser(acc ? { ...acc.profile, email: acc.email } : null);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const e = email.trim().toLowerCase();
    const accounts = loadAccounts();
    const acc = accounts.find((a) => a.email.toLowerCase() === e);
    if (!acc) return { ok: false as const, error: "No account found for this email." };
    const dig = await digestPassword(e, password);
    if (dig !== acc.passwordDigest) return { ok: false as const, error: "Incorrect password." };
    localStorage.setItem(STORAGE_SESSION, acc.email);
    setUser({ ...acc.profile, email: acc.email });
    return { ok: true as const };
  }, []);

  const signUp = useCallback(async (email: string, password: string, profile: UserProfile) => {
    const e = email.trim().toLowerCase();
    if (!e) return { ok: false as const, error: "Email is required." };
    if (password.length < 6) return { ok: false as const, error: "Password must be at least 6 characters." };
    const accounts = loadAccounts();
    if (accounts.some((a) => a.email.toLowerCase() === e)) {
      return { ok: false as const, error: "An account with this email already exists. Sign in instead." };
    }
    const passwordDigest = await digestPassword(e, password);
    const next: StoredAccount = {
      email: e,
      passwordDigest,
      profile: { ...profile, email: e },
    };
    saveAccounts([...accounts, next]);
    localStorage.setItem(STORAGE_SESSION, e);
    setUser(next.profile);
    return { ok: true as const };
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_SESSION);
    setUser(null);
  }, []);

  const updateProfile = useCallback((profile: UserProfile) => {
    const e = profile.email.trim().toLowerCase();
    const accounts = loadAccounts();
    const idx = accounts.findIndex((a) => a.email.toLowerCase() === e);
    if (idx === -1) return;
    const prev = accounts[idx]!;
    accounts[idx] = { ...prev, profile: { ...profile, email: e } };
    saveAccounts(accounts);
    if (localStorage.getItem(STORAGE_SESSION)?.toLowerCase() === e) {
      setUser({ ...profile, email: e });
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, signIn, signUp, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
