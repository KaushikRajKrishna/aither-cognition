import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Calendar, Users, Clock, X,
  Stethoscope, AlertCircle, Save, Ban,
} from "lucide-react";
import { doctorApi, appointmentApi, authApi, type Appointment, type DoctorAvailability } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

// ── Availability Manager ───────────────────────────────────────────────────────
function AvailabilityManager() {
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    authApi.me()
      .then(({ user }) =>
        doctorApi.getById(user.id)
          .then(({ doctor }) => setAvailability(doctor.availability ?? []))
          .catch(() => {})
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isSelected = (day: string) => availability.some((a) => a.day === day);

  const getLimit = (day: string) => availability.find((a) => a.day === day)?.limit ?? 10;

  const toggleDay = (day: string) => {
    setAvailability((prev) => {
      if (prev.some((a) => a.day === day)) return prev.filter((a) => a.day !== day);
      return [...prev, { day, limit: 10 }];
    });
    setSaved(false);
  };

  const setLimit = (day: string, limit: number) => {
    setAvailability((prev) =>
      prev.map((a) => a.day === day ? { ...a, limit: Math.max(1, limit) } : a)
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await doctorApi.updateAvailability(availability);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Manage Availability</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the days you're available and set the maximum number of patients per day.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading your schedule…
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {WEEKDAYS.map((day) => {
              const active = isSelected(day);
              return (
                <motion.div
                  key={day}
                  animate={{ scale: active ? 1 : 0.98 }}
                  className={`rounded-xl border p-4 transition-all ${
                    active
                      ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
                      : "border-border bg-card opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-display text-sm font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                      {day}
                    </span>
                    <button
                      onClick={() => toggleDay(day)}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                        active
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-border bg-background text-muted-foreground hover:border-emerald-500"
                      }`}
                    >
                      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-xs">+</span>}
                    </button>
                  </div>

                  {active && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5"
                    >
                      <label className="block text-xs text-muted-foreground">
                        <Users className="mr-1 inline h-3 w-3" />
                        Max patients / day
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={getLimit(day)}
                        onChange={(e) => setLimit(day, parseInt(e.target.value) || 1)}
                        className="w-full rounded-lg border border-border bg-background/60 px-3 py-1.5 text-sm outline-none ring-emerald-500 focus:ring-1"
                      />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          {availability.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Available <strong className="text-foreground">{availability.length}</strong> day(s) a week ·{" "}
              Total capacity: <strong className="text-foreground">
                {availability.reduce((s, a) => s + a.limit, 0)}
              </strong> patients/week
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-2.5 font-display text-sm font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20 disabled:opacity-60"
            >
              {saving ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Saving…</>
              ) : (
                <><Save className="h-4 w-4" /> Save Availability</>
              )}
            </button>

            <AnimatePresence>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm text-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" /> Saved!
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

// ── Leave Calendar Manager ─────────────────────────────────────────────────────
function LeaveManager() {
  const [leaves, setLeaves] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    authApi.me()
      .then(({ user }) =>
        doctorApi.getById(user.id).then(({ doctor }) => {
          if (doctor.leaves?.length) {
            setLeaves(doctor.leaves.map((l) => new Date(l)));
          }
        }).catch(() => {})
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (days: Date[] | undefined) => {
    setLeaves(days ?? []);
    setSaved(false);
  };

  const removeLeave = (d: Date) => {
    setLeaves((prev) => prev.filter((l) => l.toDateString() !== d.toDateString()));
    setSaved(false);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const leaveStrings = leaves.map((d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      });
      await doctorApi.updateLeaves(leaveStrings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Leave Calendar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Click dates to mark leaves. Patients cannot book appointments on these days.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading your leave calendar…
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Calendar picker */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <CalendarPicker
                mode="multiple"
                selected={leaves}
                onSelect={handleSelect}
                month={month}
                onMonthChange={setMonth}
                disabled={{ before: today }}
                modifiersClassNames={{
                  selected: "!bg-red-500/20 !text-red-400 hover:!bg-red-500/30 border border-red-500/40 rounded-md",
                }}
              />
            </div>

            {/* Selected leaves list */}
            <div className="flex-1 min-w-0">
              {leaves.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                  <Ban className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No leaves marked</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Click on calendar dates to mark leaves</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    <Ban className="inline h-3.5 w-3.5 mr-1 text-red-400" />
                    {leaves.length} leave day{leaves.length !== 1 ? "s" : ""} marked
                  </p>
                  <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                    {[...leaves]
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((d) => {
                        const label = d.toLocaleDateString("en-IN", {
                          weekday: "short", day: "numeric", month: "short", year: "numeric",
                        });
                        return (
                          <div
                            key={d.toISOString()}
                            className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Ban className="h-3.5 w-3.5 shrink-0 text-red-400" />
                              <span className="text-foreground">{label}</span>
                            </div>
                            <button
                              onClick={() => removeLeave(d)}
                              className="rounded p-0.5 text-muted-foreground transition-colors hover:text-red-400"
                              title="Remove leave"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-2.5 font-display text-sm font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20 disabled:opacity-60"
            >
              {saving ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Saving…</>
              ) : (
                <><Save className="h-4 w-4" /> Save Leaves</>
              )}
            </button>
            <AnimatePresence>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-sm text-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4" /> Saved!
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

// ── Appointments List (Doctor view) ───────────────────────────────────────────
function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  // next-visit state: maps appointmentId → { date, notes, saving, error }
  const [nextVisit, setNextVisit] = useState<Record<string, { open: boolean; date: string; notes: string; saving: boolean; error: string }>>({});

  useEffect(() => {
    appointmentApi.doctorAppointments()
      .then(({ appointments }) => setAppointments(appointments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? appointments : appointments.filter((a) => a.status === filter);

  const handleConfirm = async (id: string) => {
    await appointmentApi.confirm(id);
    setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status: "confirmed" } : a));
  };

  const handleCancel = async (id: string) => {
    await appointmentApi.cancel(id);
    setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status: "cancelled" } : a));
  };

  const toggleNextVisit = (id: string) => {
    setNextVisit((prev) => ({
      ...prev,
      [id]: prev[id]?.open
        ? { ...prev[id], open: false }
        : { open: true, date: "", notes: "", saving: false, error: "" },
    }));
  };

  const updateNextVisit = (id: string, patch: Partial<typeof nextVisit[string]>) => {
    setNextVisit((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const handleAssignNextVisit = async (appt: Appointment) => {
    const state = nextVisit[appt._id];
    if (!state?.date) { updateNextVisit(appt._id, { error: "Please select a date" }); return; }

    const patientId = typeof appt.userId === "object" ? appt.userId._id ?? (appt.userId as { id?: string }).id : appt.userId;
    if (!patientId) { updateNextVisit(appt._id, { error: "Cannot resolve patient ID" }); return; }

    updateNextVisit(appt._id, { saving: true, error: "" });
    try {
      const { appointment: newAppt } = await appointmentApi.assignNextVisit(patientId as string, state.date, state.notes);
      setAppointments((prev) => [newAppt, ...prev]);
      updateNextVisit(appt._id, { open: false, saving: false });
    } catch (e: unknown) {
      updateNextVisit(appt._id, { saving: false, error: e instanceof Error ? e.message : "Failed to schedule" });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Patient Appointments</h2>
        <p className="mt-1 text-sm text-muted-foreground">All scheduled appointments from patients</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", count: appointments.length, color: "text-primary" },
          { label: "Pending", count: appointments.filter((a) => a.status === "pending").length, color: "text-amber-500" },
          { label: "Confirmed", count: appointments.filter((a) => a.status === "confirmed").length, color: "text-emerald-500" },
        ].map(({ label, count, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className={`font-display text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        {(["all", "pending", "confirmed", "cancelled"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all ${
              filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {filter === "all" ? "" : filter} appointments.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((appt) => {
            const patient = typeof appt.userId === "object" ? appt.userId : null;
            const statusColor = {
              pending: "border-amber-500/30 bg-amber-500/10 text-amber-500",
              confirmed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
              cancelled: "border-border bg-muted/30 text-muted-foreground",
            }[appt.status];

            return (
              <div key={appt._id}
                className={`flex items-start gap-4 rounded-xl border border-border bg-card p-4 ${appt.status === "cancelled" ? "opacity-50" : ""}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {patient ? patient.name : "Patient"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {patient?.email ?? ""} {patient?.gender ? `· ${patient.gender}` : ""}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(appt.date)} · {appt.dayOfWeek}
                  </div>
                  {appt.notes && (
                    <p className="mt-1 text-xs text-muted-foreground italic truncate">{appt.notes}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
                    {appt.status}
                  </span>
                  {appt.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirm(appt._id)}
                        className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/20"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleCancel(appt._id)}
                        className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {appt.status === "confirmed" && (
                    <button
                      onClick={() => toggleNextVisit(appt._id)}
                      className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      {nextVisit[appt._id]?.open ? "Cancel" : "Next Visit"}
                    </button>
                  )}
                </div>

                {/* Next Visit Scheduler — inline panel */}
                {nextVisit[appt._id]?.open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 flex flex-col gap-2"
                  >
                    <p className="text-xs font-medium text-foreground">Schedule next visit for {patient?.name}</p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="date"
                        value={nextVisit[appt._id].date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => updateNextVisit(appt._id, { date: e.target.value })}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none ring-primary focus:ring-1"
                      />
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={nextVisit[appt._id].notes}
                        onChange={(e) => updateNextVisit(appt._id, { notes: e.target.value })}
                        className="flex-1 min-w-0 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none ring-primary focus:ring-1"
                      />
                      <button
                        onClick={() => handleAssignNextVisit(appt)}
                        disabled={nextVisit[appt._id].saving}
                        className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
                      >
                        {nextVisit[appt._id].saving ? "Saving…" : "Confirm Visit"}
                      </button>
                    </div>
                    {nextVisit[appt._id].error && (
                      <p className="text-xs text-destructive">{nextVisit[appt._id].error}</p>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DoctorDashboardProps {
  initialView?: "availability" | "appointments" | "leaves";
}

// ── DoctorDashboard root ───────────────────────────────────────────────────────
export default function DoctorDashboard({ initialView = "appointments" }: DoctorDashboardProps) {
  const { user } = useAuth();
  const [view, setView] = useState<"availability" | "appointments" | "leaves">(initialView);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
          <Stethoscope className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dr. {user?.name}</h1>
          <p className="text-sm text-muted-foreground">Doctor Dashboard</p>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit flex-wrap">
        {([
          { key: "appointments", label: "Appointments", icon: Users },
          { key: "availability", label: "My Availability", icon: Clock },
          { key: "leaves", label: "Leave Calendar", icon: Ban },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              view === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {view === "appointments" && <DoctorAppointments />}
          {view === "availability" && <AvailabilityManager />}
          {view === "leaves" && <LeaveManager />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
