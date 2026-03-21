import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  User, Mail, Lock, Calendar, ChevronDown,
  Eye, EyeOff, Brain, ArrowLeft, ArrowRight, CheckCircle2,
} from "lucide-react";

const GENDER_OPTIONS = [
  { value: "male",              label: "Male" },
  { value: "female",            label: "Female" },
  { value: "other",             label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const WHY_HERE_OPTIONS = [
  "Managing stress & anxiety",
  "Dealing with depression",
  "Improving relationships",
  "Building better habits",
  "Personal growth",
  "Grief or loss",
  "Work-life balance",
  "Just exploring",
];

const FEELING_OPTIONS = [
  { emoji: "😊", label: "Great" },
  { emoji: "🙂", label: "Good" },
  { emoji: "😐", label: "Okay" },
  { emoji: "😔", label: "Low" },
  { emoji: "😰", label: "Anxious" },
  { emoji: "😢", label: "Sad" },
];

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  gender: string;
  whyHere: string;
  feelingToday: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

const INITIAL: FormData = {
  name: "", email: "", password: "", confirmPassword: "",
  dateOfBirth: "", gender: "", whyHere: "", feelingToday: "",
  agreeTerms: false, agreePrivacy: false,
};

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState<FormData>(INITIAL);
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm,  setShowConfirm]    = useState(false);
  const [error,  setError]  = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: (e.target as HTMLInputElement).type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value }));

  const validate = (): string => {
    if (!form.name.trim())       return "Full name is required";
    if (!form.email.trim())      return "Email is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    if (!form.dateOfBirth)       return "Date of birth is required";
    if (!form.gender)            return "Please select a gender";
    if (!form.agreeTerms)        return "You must agree to the Terms & Conditions";
    if (!form.agreePrivacy)      return "You must agree to the Privacy Policy";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setError("");
    setLoading(true);
    try {
      await register(
        form.name, form.email, form.password,
        form.dateOfBirth, form.gender,
        form.whyHere, form.feelingToday,
      );
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <CheckCircle2 className="mx-auto mb-4 h-20 w-20 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">Account Created!</h2>
          <p className="mt-2 text-muted-foreground">Redirecting you to the platform…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(hsl(210 100% 56% / 0.15) 1px, transparent 1px), linear-gradient(90deg, hsl(210 100% 56% / 0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="container relative mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-center justify-between"
        >
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-display text-sm font-bold tracking-widest text-foreground">
              AITHER COGNITION
            </span>
          </div>
        </motion.div>

        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 text-center"
          >
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Begin Your{" "}
              <span className="gradient-text">Wellness Journey</span>
            </h1>
            <p className="mt-3 text-muted-foreground">
              Create your account and start your path to better mental health
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl"
          >
            {/* ── Section 1: Core Info ─────────────────────────────── */}
            <SectionLabel step={1} title="Account Information" />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <Field label="Full Name" required>
                <InputWrap icon={<User className="h-4 w-4" />}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={set("name")}
                    placeholder="John Doe"
                    className="input-field"
                  />
                </InputWrap>
              </Field>

              {/* Email */}
              <Field label="Email Address" required>
                <InputWrap icon={<Mail className="h-4 w-4" />}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@example.com"
                    className="input-field"
                  />
                </InputWrap>
              </Field>

              {/* Password */}
              <Field label="Password" required>
                <InputWrap
                  icon={<Lock className="h-4 w-4" />}
                  suffix={
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Min 6 characters"
                    className="input-field"
                  />
                </InputWrap>
              </Field>

              {/* Confirm Password */}
              <Field label="Confirm Password" required>
                <InputWrap
                  icon={<Lock className="h-4 w-4" />}
                  suffix={
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                >
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    placeholder="Repeat password"
                    className="input-field"
                  />
                </InputWrap>
              </Field>
            </div>

            {/* ── Section 2: Personal Details ──────────────────────── */}
            <div className="border-t border-border pt-6">
              <SectionLabel step={2} title="Personal Details" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Date of Birth */}
              <Field label="Date of Birth" required>
                <InputWrap icon={<Calendar className="h-4 w-4" />}>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={set("dateOfBirth")}
                    max={new Date().toISOString().split("T")[0]}
                    className="input-field [color-scheme:dark]"
                  />
                </InputWrap>
              </Field>

              {/* Gender */}
              <Field label="Gender" required>
                <div className="relative">
                  <InputWrap icon={<ChevronDown className="h-4 w-4" />}>
                    <select
                      value={form.gender}
                      onChange={set("gender")}
                      className="input-field appearance-none"
                    >
                      <option value="">Select gender…</option>
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </InputWrap>
                </div>
              </Field>
            </div>

            {/* ── Section 3: Optional Onboarding ───────────────────── */}
            <div className="border-t border-border pt-6">
              <SectionLabel step={3} title="Tell Us About Yourself" badge="Optional" />
            </div>

            {/* Why here */}
            <Field label="What brings you here?">
              <div className="flex flex-wrap gap-2">
                {WHY_HERE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, whyHere: p.whyHere === opt ? "" : opt }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      form.whyHere === opt
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Field>

            {/* How feeling today */}
            <Field label="How are you feeling today?">
              <div className="flex flex-wrap gap-3">
                {FEELING_OPTIONS.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, feelingToday: p.feelingToday === f.label ? "" : f.label }))}
                    className={`flex flex-col items-center rounded-xl border px-4 py-2 text-xs transition-all ${
                      form.feelingToday === f.label
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    <span className="text-xl">{f.emoji}</span>
                    <span className="mt-0.5">{f.label}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* ── Section 4: Agreements ─────────────────────────────── */}
            <div className="border-t border-border pt-6 space-y-3">
              <CheckboxField
                id="terms"
                checked={form.agreeTerms}
                onChange={(v) => setForm((p) => ({ ...p, agreeTerms: v }))}
                label={
                  <>
                    I agree to the{" "}
                    <a href="#" className="text-primary underline-offset-2 hover:underline">
                      Terms & Conditions
                    </a>
                  </>
                }
              />
              <CheckboxField
                id="privacy"
                checked={form.agreePrivacy}
                onChange={(v) => setForm((p) => ({ ...p, agreePrivacy: v }))}
                label={
                  <>
                    I agree to the{" "}
                    <a href="#" className="text-primary underline-offset-2 hover:underline">
                      Privacy Policy
                    </a>
                  </>
                }
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="glow-button pulse-glow flex w-full items-center justify-center gap-2 font-display text-sm font-semibold tracking-wider disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating Account…
                </span>
              ) : (
                <>Create My Account <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/" className="text-primary underline-offset-2 hover:underline">
                Sign In
              </Link>
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function SectionLabel({
  step, title, badge,
}: { step: number; title: string; badge?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 font-display text-xs font-bold text-primary">
        {step}
      </span>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h3>
      {badge && (
        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {badge}
        </span>
      )}
    </div>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}

function InputWrap({
  icon, suffix, children,
}: { icon: React.ReactNode; suffix?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative flex items-center rounded-lg border border-border bg-background/60 px-3 py-0 ring-primary transition-all focus-within:ring-1">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <div className="flex-1 pl-2">{children}</div>
      {suffix && <span className="shrink-0 pl-2">{suffix}</span>}
    </div>
  );
}

function CheckboxField({
  id, checked, onChange, label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="h-5 w-5 rounded border border-border bg-background transition-all peer-checked:border-primary peer-checked:bg-primary/20" />
        {checked && (
          <CheckCircle2 className="pointer-events-none absolute h-3.5 w-3.5 text-primary" />
        )}
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </label>
  );
}
