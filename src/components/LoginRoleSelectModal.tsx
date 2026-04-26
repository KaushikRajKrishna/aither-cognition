import { motion } from "framer-motion";
import { User2, Stethoscope } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onPatient: () => void;
  onDoctor: () => void;
}

export default function LoginRoleSelectModal({ open, onClose, onPatient, onDoctor }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold gradient-text text-center">
            Login As
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground pt-1">
            Choose your account type to continue
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 pt-2 pb-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onPatient}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-foreground">User</p>
              <p className="text-xs text-muted-foreground mt-0.5">User account</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onDoctor}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-500/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <Stethoscope className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-display font-bold text-foreground">Doctor</p>
              <p className="text-xs text-muted-foreground mt-0.5">Medical professional</p>
            </div>
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
