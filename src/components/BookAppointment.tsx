import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope, Building2, Calendar, CheckCircle2,
  Clock, X, ChevronRight, AlertCircle, User,
} from "lucide-react";
import { doctorApi, appointmentApi, type DoctorProfile, type Appointment } from "@/lib/api";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function dayOfWeekFromISO(iso: string) {
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return DAYS[new Date(iso).getDay()];
}

// ── DoctorCard ─────────────────────────────────────────────────────────────────
function DoctorCard({
  doctor, onSelect,
}: { doctor: DoctorProfile; onSelect: () => void }) {
  const availableDays = doctor.availability?.map((a) => a.day) ?? [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
          <Stethoscope className="h-6 w-6 text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-foreground">{doctor.name}</p>
          <p className="text-xs text-muted-foreground">{doctor.qualification} · {doctor.experience} yrs exp</p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
          {doctor.consultationMode?.join(" / ") || "—"}
        </span>
      </div>

      {/* Hospital */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{doctor.hospitalName}</span>
      </div>

      {/* Expertise tags */}
      <div className="flex flex-wrap gap-1.5">
        {doctor.expertise?.slice(0, 3).map((e) => (
          <span key={e} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {e}
          </span>
        ))}
        {(doctor.expertise?.length ?? 0) > 3 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            +{doctor.expertise.length - 3} more
          </span>
        )}
      </div>

      {/* Common Areas tags */}
      {(doctor.commonAreas?.length ?? 0) > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Treats</p>
          <div className="flex flex-wrap gap-1.5">
            {doctor.commonAreas.map((area) => (
              <span key={area} className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Available days */}
      {availableDays.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {WEEKDAYS.map((d) => (
            <span key={d} className={`rounded px-2 py-0.5 text-xs font-medium ${
              availableDays.includes(d)
                ? "bg-emerald-500/15 text-emerald-500"
                : "bg-muted text-muted-foreground line-through"
            }`}>
              {d.slice(0, 3)}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-emerald-500/80 italic">Open schedule — book any day</p>
      )}

      <button
        onClick={onSelect}
        className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/20"
      >
        Book Appointment <ChevronRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ── BookingPanel ───────────────────────────────────────────────────────────────
function BookingPanel({
  doctor, onClose, onBooked,
}: { doctor: DoctorProfile; onClose: () => void; onBooked: (a: Appointment) => void }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [slotInfo, setSlotInfo] = useState<{ available: boolean; slotsLeft: number | null; limit?: number | null; dayOfWeek: string; onLeave?: boolean; openSchedule?: boolean } | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availableDays = doctor.availability?.map((a) => a.day) ?? [];
  const hasAvailability = availableDays.length > 0;

  // Check slots whenever date changes
  useEffect(() => {
    if (!selectedDate) { setSlotInfo(null); return; }
    setChecking(true);
    appointmentApi.checkAvailability(doctor._id, selectedDate)
      .then(setSlotInfo)
      .catch(() => setSlotInfo(null))
      .finally(() => setChecking(false));
  }, [selectedDate]);

  const handleBook = async () => {
    if (!selectedDate) { setError("Please select a date"); return; }
    if (slotInfo && !slotInfo.available) { setError("No slots available on this date"); return; }
    setError("");
    setLoading(true);
    try {
      const { appointment } = await appointmentApi.book(doctor._id, selectedDate, notes);
      onBooked(appointment);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const dow = selectedDate ? dayOfWeekFromISO(selectedDate) : null;
  // If no availability configured, all days are open
  const isDayAvailable = !hasAvailability ? true : (dow ? availableDays.includes(dow) : null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-5 rounded-xl border border-primary/30 bg-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display font-bold text-foreground">Book with {doctor.name}</p>
          <p className="text-xs text-muted-foreground">{doctor.hospitalName}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-accent">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Available days info */}
      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map((d) => (
          <span key={d} className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            availableDays.includes(d)
              ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
              : "border border-border bg-muted text-muted-foreground"
          }`}>
            {d.slice(0, 3)}
          </span>
        ))}
      </div>

      {/* Date picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Select Date <span className="text-primary">*</span></label>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 focus-within:ring-1 ring-primary">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="date"
            min={todayISO()}
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setError(""); }}
            className="flex-1 bg-transparent text-sm outline-none [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Slot feedback */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
              checking
                ? "border border-border bg-muted/40 text-muted-foreground"
                : slotInfo?.onLeave || isDayAvailable === false
                ? "border border-destructive/30 bg-destructive/10 text-destructive"
                : slotInfo?.available
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                : "border border-amber-500/30 bg-amber-500/10 text-amber-500"
            }`}
          >
            {checking ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : slotInfo?.onLeave || isDayAvailable === false ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : slotInfo?.available ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <Clock className="h-4 w-4 shrink-0" />
            )}
            {checking
              ? "Checking availability…"
              : slotInfo?.onLeave
              ? `Dr. ${doctor.name} is on leave on this date`
              : isDayAvailable === false
              ? `${doctor.name} is not available on ${dow}s`
              : slotInfo?.openSchedule
              ? `Open schedule — you can book on ${dow}`
              : slotInfo?.available
              ? `${slotInfo.slotsLeft} slot${slotInfo.slotsLeft !== 1 ? "s" : ""} left on ${dow}`
              : `Fully booked on ${dow} (limit ${slotInfo?.limit})`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Briefly describe your concern…"
          className="w-full resize-none rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none ring-primary focus:ring-1"
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        onClick={handleBook}
        disabled={loading || checking || !selectedDate || (slotInfo !== null && !slotInfo?.available && isDayAvailable !== true)}
        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3 font-display text-sm font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Booking…
          </>
        ) : "Confirm Appointment"}
      </button>
    </motion.div>
  );
}

// ── Main BookAppointment view ──────────────────────────────────────────────────
export default function BookAppointment() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [successAppt, setSuccessAppt] = useState<Appointment | null>(null);
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    doctorApi.getAll()
      .then(({ doctors }) => setDoctors(doctors))
      .finally(() => setLoadingDoctors(false));
    appointmentApi.mine().then(({ appointments }) => setMyAppointments(appointments)).catch(() => {});
  }, []);

  const filtered = doctors.filter((d) => {
    const q = searchQ.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.hospitalName.toLowerCase().includes(q) ||
      d.expertise?.some((e) => e.toLowerCase().includes(q))
    );
  });

  const handleBooked = (appt: Appointment) => {
    setSuccessAppt(appt);
    setSelectedDoctor(null);
    setMyAppointments((prev) => [appt, ...prev]);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Book Appointment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find a doctor and schedule your consultation</p>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {successAppt && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-500">Appointment Booked!</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(successAppt.date)} — {typeof successAppt.doctorId === "object"
                  ? `Dr. ${(successAppt.doctorId as { name: string }).name}`
                  : ""}
              </p>
            </div>
            <button onClick={() => setSuccessAppt(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {(["browse", "mine"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "browse" ? "Browse Doctors" : `My Appointments (${myAppointments.filter(a => a.status !== "cancelled").length})`}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === "browse" && (
        <div className="flex flex-col gap-5">
          {/* Search */}
          <input
            type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search by name, hospital, expertise…"
            className="w-full max-w-md rounded-lg border border-border bg-background/60 px-4 py-2 text-sm outline-none ring-primary focus:ring-1"
          />

          {loadingDoctors ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading doctors…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No doctors found.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((d) => (
                <DoctorCard
                  key={d._id}
                  doctor={d}
                  onSelect={() => { setSelectedDoctor(d); setSuccessAppt(null); }}
                />
              ))}
            </div>
          )}

          {/* Booking panel */}
          <AnimatePresence>
            {selectedDoctor && (
              <BookingPanel
                doctor={selectedDoctor}
                onClose={() => setSelectedDoctor(null)}
                onBooked={handleBooked}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* My Appointments tab */}
      {tab === "mine" && (
        <div className="flex flex-col gap-3">
          {myAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments yet.</p>
          ) : (
            myAppointments.map((appt) => (
              <AppointmentRow
                key={appt._id}
                appt={appt}
                onCancel={async (id) => {
                  await appointmentApi.cancel(id);
                  setMyAppointments((prev) =>
                    prev.map((a) => a._id === id ? { ...a, status: "cancelled" } : a)
                  );
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── AppointmentRow ─────────────────────────────────────────────────────────────
function AppointmentRow({
  appt, onCancel,
}: { appt: Appointment; onCancel: (id: string) => Promise<void> }) {
  const [cancelling, setCancelling] = useState(false);
  const doc = typeof appt.doctorId === "object" ? appt.doctorId : null;

  const statusColor = {
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    confirmed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
    cancelled: "border-border bg-muted/30 text-muted-foreground",
  }[appt.status];

  return (
    <div className={`flex items-start gap-4 rounded-xl border border-border bg-card p-4 ${appt.status === "cancelled" ? "opacity-50" : ""}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">
          {doc ? `Dr. ${doc.name}` : "Doctor"}
        </p>
        <p className="text-xs text-muted-foreground">{formatDate(appt.date)} · {appt.dayOfWeek}</p>
        {appt.notes && <p className="mt-1 text-xs text-muted-foreground italic truncate">{appt.notes}</p>}
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
          {appt.status}
        </span>
        {appt.status === "pending" && (
          <button
            onClick={async () => { setCancelling(true); await onCancel(appt._id).finally(() => setCancelling(false)); }}
            disabled={cancelling}
            className="text-xs text-destructive hover:underline disabled:opacity-50"
          >
            {cancelling ? "Cancelling…" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}
