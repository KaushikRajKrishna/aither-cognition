import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Stethoscope } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSwitchToRegister: () => void;
}

export default function DoctorLoginModal({ open, onClose, onBack, onSwitchToRegister }: Props) {
  const { doctorLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await doctorLogin(email, password);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
              <Stethoscope className="h-5 w-5 text-emerald-500" />
            </div>
            <DialogTitle className="font-display text-xl font-bold text-emerald-500">
              Doctor Login
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your appointments and availability
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="doctor@hospital.com"
              className="w-full rounded-lg border border-emerald-500/30 bg-background px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your password"
              className="w-full rounded-lg border border-emerald-500/30 bg-background px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Login as Doctor"}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-emerald-600 underline-offset-2 hover:underline"
            >
              Register as Doctor
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
