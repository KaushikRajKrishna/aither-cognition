import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Lock, Phone, Building2, FileText,
  Eye, EyeOff, CheckCircle2, ChevronDown, X, Stethoscope,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { doctorApi } from "@/lib/api";

// ── Expertise → Common Areas mapping ──────────────────────────────────────────
const EXPERTISE_MAP: Record<string, string[]> = {
  Psychiatrist: [
    "Depression", "Anxiety Disorders", "Bipolar Disorder", "Schizophrenia",
    "OCD", "Panic Disorders", "Sleep Disorders", "Substance Abuse",
  ],
  "Clinical Psychologist": [
    "Depression", "Anxiety", "Personality Disorders", "Trauma/PTSD",
    "Behavioral Issues", "Emotional Regulation", "Phobias",
  ],
  "Counseling Psychologist": [
    "Stress Management", "Relationship Issues", "Career Guidance",
    "Self-Esteem Issues", "Academic Stress", "Work-Life Balance",
  ],
  "Child & Adolescent Specialist": [
    "ADHD", "Autism Spectrum Disorder", "Learning Disabilities",
    "Behavioral Problems", "School Stress", "Social Anxiety in Children",
  ],
  Neuropsychologist: [
    "Brain Injury", "Memory Disorders", "Dementia", "Stroke Recovery", "Cognitive Impairment",
  ],
  "Addiction Specialist": [
    "Alcohol Addiction", "Drug Abuse", "Smoking Addiction",
    "Gaming Addiction", "Gambling Addiction",
  ],
  "Geriatric Psychiatrist": [
    "Alzheimer's Disease", "Dementia", "Depression in Elderly", "Anxiety in Elderly",
  ],
  "Forensic Psychologist": [
    "Criminal Behavior Assessment", "Court Evaluations", "Rehabilitation Therapy",
  ],
};

const ALL_EXPERTISE = Object.keys(EXPERTISE_MAP);
const CONSULTATION_MODES = ["online", "offline", "both"];
const GENDER_OPTIONS = ["male", "female", "other"];

interface Props {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

interface FormState {
  name: string; email: string; password: string; confirmPassword: string;
  phone: string; gender: string; qualification: string;
  experience: string; licenseNumber: string; hospitalName: string;
  consultationMode: string[]; expertise: string[]; commonAreas: string[];
}

const INIT: FormState = {
  name: "", email: "", password: "", confirmPassword: "",
  phone: "", gender: "", qualification: "",
  experience: "", licenseNumber: "", hospitalName: "",
  consultationMode: [], expertise: [], commonAreas: [],
};

export default function DoctorRegisterModal({ open, onClose, onSwitchToLogin }: Props) {
  const [form, setForm] = useState<FormState>(INIT);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Dynamic common areas based on selected expertise ──────────────────────
  const availableCommonAreas = useMemo(() => {
    const merged = new Set<string>();
    form.expertise.forEach((exp) => EXPERTISE_MAP[exp]?.forEach((a) => merged.add(a)));
    return Array.from(merged);
  }, [form.expertise]);

  // When expertise changes, remove any common areas no longer available
  const toggleExpertise = (exp: string) => {
    setForm((prev) => {
      const next = prev.expertise.includes(exp)
        ? prev.expertise.filter((e) => e !== exp)
        : [...prev.expertise, exp];
      const nextAreas = new Set<string>();
      next.forEach((e) => EXPERTISE_MAP[e]?.forEach((a) => nextAreas.add(a)));
      return {
        ...prev,
        expertise: next,
        commonAreas: prev.commonAreas.filter((a) => nextAreas.has(a)),
      };
    });
  };

  const toggleCommonArea = (area: string) => {
    setForm((prev) => ({
      ...prev,
      commonAreas: prev.commonAreas.includes(area)
        ? prev.commonAreas.filter((a) => a !== area)
        : [...prev.commonAreas, area],
    }));
  };

  const toggleConsultation = (mode: string) => {
    setForm((prev) => ({
      ...prev,
      consultationMode: prev.consultationMode.includes(mode)
        ? prev.consultationMode.filter((m) => m !== mode)
        : [...prev.consultationMode, mode],
    }));
  };

  const field = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = (): string => {
    if (!form.name.trim())       return "Full name is required";
    if (!form.email.trim())      return "Email is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    if (!form.phone.trim())      return "Phone number is required";
    if (!form.gender)            return "Gender is required";
    if (!form.qualification.trim()) return "Qualification is required";
    if (!form.experience)        return "Years of experience is required";
    if (!form.licenseNumber.trim()) return "Medical license number is required";
    if (!form.hospitalName.trim()) return "Hospital/Clinic name is required";
    if (!form.expertise.length)  return "Select at least one area of expertise";
    if (!form.commonAreas.length) return "Select at least one common area treated";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      await doctorApi.register({
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, gender: form.gender, qualification: form.qualification,
        experience: Number(form.experience), licenseNumber: form.licenseNumber,
        hospitalName: form.hospitalName, consultationMode: form.consultationMode,
        expertise: form.expertise, commonAreas: form.commonAreas,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(INIT);
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border border-glass-border bg-card p-0">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
              <Stethoscope className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Doctor Registration</h2>
              <p className="text-xs text-muted-foreground">Join as a mental health professional</p>
            </div>
          </div>
        </div>

        {/* ── Success state ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">Registration Submitted!</h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                Your profile is under review. We'll notify you at <strong>{form.email}</strong> once approved.
              </p>
              <button onClick={handleClose} className="glow-button mt-2 text-sm">
                Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Form ────────────────────────────────────────────────────────── */}
        {!success && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

            {/* Section 1: Basic Information */}
            <Section step="1" title="Basic Information" accent="emerald" />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" required>
                <InputRow icon={<User className="h-4 w-4" />}>
                  <input type="text" value={form.name} onChange={field("name")}
                    placeholder="Dr. Jane Smith" className="input-field" />
                </InputRow>
              </Field>

              <Field label="Email" required>
                <InputRow icon={<Mail className="h-4 w-4" />}>
                  <input type="email" value={form.email} onChange={field("email")}
                    placeholder="doctor@example.com" className="input-field" />
                </InputRow>
              </Field>

              <Field label="Password" required>
                <InputRow icon={<Lock className="h-4 w-4" />} suffix={
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }>
                  <input type={showPass ? "text" : "password"} value={form.password}
                    onChange={field("password")} placeholder="Min 6 characters" className="input-field" />
                </InputRow>
              </Field>

              <Field label="Confirm Password" required>
                <InputRow icon={<Lock className="h-4 w-4" />} suffix={
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }>
                  <input type={showConfirm ? "text" : "password"} value={form.confirmPassword}
                    onChange={field("confirmPassword")} placeholder="Repeat password" className="input-field" />
                </InputRow>
              </Field>

              <Field label="Phone Number" required>
                <InputRow icon={<Phone className="h-4 w-4" />}>
                  <input type="tel" value={form.phone} onChange={field("phone")}
                    placeholder="+91 99999 99999" className="input-field" />
                </InputRow>
              </Field>

              <Field label="Gender" required>
                <InputRow icon={<ChevronDown className="h-4 w-4" />}>
                  <select value={form.gender} onChange={field("gender")} className="input-field appearance-none">
                    <option value="">Select…</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                    ))}
                  </select>
                </InputRow>
              </Field>
            </div>

            {/* Section 2: Professional Details */}
            <div className="border-t border-border pt-4">
              <Section step="2" title="Professional Details" accent="emerald" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Qualification" required>
                <InputRow icon={<FileText className="h-4 w-4" />}>
                  <input type="text" value={form.qualification} onChange={field("qualification")}
                    placeholder="MD, MBBS, PhD…" className="input-field" />
                </InputRow>
              </Field>

              <Field label="Years of Experience" required>
                <InputRow icon={<span className="text-xs font-bold text-muted-foreground">YRS</span>}>
                  <input type="number" min={0} max={60} value={form.experience} onChange={field("experience")}
                    placeholder="e.g. 8" className="input-field" />
                </InputRow>
              </Field>

              <Field label="Medical License Number" required>
                <InputRow icon={<FileText className="h-4 w-4" />}>
                  <input type="text" value={form.licenseNumber} onChange={field("licenseNumber")}
                    placeholder="MCI-XXXX-XXXX" className="input-field" />
                </InputRow>
              </Field>

              <Field label="Hospital / Clinic Name" required>
                <InputRow icon={<Building2 className="h-4 w-4" />}>
                  <input type="text" value={form.hospitalName} onChange={field("hospitalName")}
                    placeholder="City Mental Health Clinic" className="input-field" />
                </InputRow>
              </Field>
            </div>

            {/* Consultation Mode */}
            <Field label="Consultation Mode">
              <div className="flex flex-wrap gap-2">
                {CONSULTATION_MODES.map((m) => (
                  <button key={m} type="button" onClick={() => toggleConsultation(m)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition-all ${
                      form.consultationMode.includes(m)
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-500"
                        : "border-border text-muted-foreground hover:border-emerald-500/50"
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </Field>

            {/* Section 3: Specialization */}
            <div className="border-t border-border pt-4">
              <Section step="3" title="Specialization" accent="emerald" />
            </div>

            {/* Areas of Expertise */}
            <Field label="Areas of Expertise" required>
              <div className="flex flex-wrap gap-2">
                {ALL_EXPERTISE.map((exp) => (
                  <button key={exp} type="button" onClick={() => toggleExpertise(exp)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      form.expertise.includes(exp)
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-500"
                        : "border-border text-muted-foreground hover:border-emerald-500/50 hover:text-foreground"
                    }`}>
                    {form.expertise.includes(exp) && (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {exp}
                  </button>
                ))}
              </div>
              {form.expertise.length > 0 && (
                <p className="mt-1.5 text-xs text-emerald-500">
                  {form.expertise.length} selected — {availableCommonAreas.length} treatment areas unlocked
                </p>
              )}
            </Field>

            {/* Common Areas Treated – dynamic */}
            <Field label="Common Areas Treated" required>
              {form.expertise.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                  Select at least one area of expertise above to see available treatment areas.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableCommonAreas.map((area) => (
                    <button key={area} type="button" onClick={() => toggleCommonArea(area)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        form.commonAreas.includes(area)
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}>
                      {form.commonAreas.includes(area) && (
                        <X className="h-3 w-3" />
                      )}
                      {area}
                    </button>
                  ))}
                </div>
              )}
              {form.commonAreas.length > 0 && (
                <p className="mt-1.5 text-xs text-primary">{form.commonAreas.length} area(s) selected</p>
              )}
            </Field>

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
            <div className="border-t border-border pt-4 pb-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3 font-display text-sm font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Submitting Registration…
                  </span>
                ) : "Submit Doctor Registration"}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Already registered?{" "}
                <button type="button" onClick={onSwitchToLogin}
                  className="text-primary underline-offset-2 hover:underline">
                  Login
                </button>
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ step, title }: { step: string; title: string; accent?: string }) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 font-display text-xs font-bold text-emerald-500">
        {step}
      </span>
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h3>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">
        {label} {required && <span className="text-emerald-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function InputRow({
  icon, suffix, children,
}: { icon: React.ReactNode; suffix?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative flex items-center rounded-lg border border-border bg-background/60 px-3 py-0 ring-emerald-500 transition-all focus-within:ring-1">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <div className="flex-1 pl-2">{children}</div>
      {suffix && <span className="shrink-0 pl-2">{suffix}</span>}
    </div>
  );
}
