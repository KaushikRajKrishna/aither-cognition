import { motion } from "framer-motion";
import { User, Stethoscope, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectUser: () => void;
  onSelectDoctor: () => void;
}

export default function RoleSelectModal({ open, onClose, onSelectUser, onSelectDoctor }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-glass-border bg-card">
        {/* Header */}
        <div className="relative border-b border-border px-6 py-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="font-display text-xl font-bold gradient-text">Register As…</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose how you'd like to join Aither Cognition</p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-4 p-6">
          {/* User card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelectUser}
            className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-background/60 p-6 text-center transition-all hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-foreground">User</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Seek support, track moods, chat with AI
              </p>
            </div>
          </motion.button>

          {/* Doctor card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelectDoctor}
            className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-background/60 p-6 text-center transition-all hover:border-emerald-500 hover:bg-emerald-500/5 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Stethoscope className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-foreground">Doctor</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Join as a mental health professional
              </p>
            </div>
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
