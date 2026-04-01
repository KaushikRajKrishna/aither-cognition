import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Clock } from "lucide-react";
import { routineApi, RoutineTask } from "@/lib/api";

type RoutineTaskType = "work" | "medication" | "exercise" | "sleep" | "custom";

const defaultTypes: { value: RoutineTaskType; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "medication", label: "Medication" },
  { value: "exercise", label: "Exercise" },
  { value: "sleep", label: "Sleep" },
  { value: "custom", label: "Custom" },
];

export default function RoutineScheduler() {
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<RoutineTaskType>("exercise");
  const [time, setTime] = useState("07:00");
  const [loading, setLoading] = useState(true);

  // Load routines from backend on mount
  useEffect(() => {
    routineApi.list()
      .then(({ routines }) => setTasks(routines))
      .catch(() => toast.error("Failed to load routines"))
      .finally(() => setLoading(false));
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(console.error);
    }
  }, []);

  // In-browser toast + browser notification while app is open
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      tasks.forEach((task) => {
        if (!task.enabled || task.time !== currentTime) return;
        const message = `Time for ${task.type === "custom" ? task.title || "your task" : task.type}!`;
        toast.success(message);
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("Routine Reminder", { body: message });
          } catch (err) {
            console.error("Browser notification error", err);
          }
        }
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [tasks]);

  const saveTask = async () => {
    if (!title.trim()) {
      toast.error("Please enter a task name");
      return;
    }
    if (!time) {
      toast.error("Please set a time");
      return;
    }

    const taskId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const { routine } = await routineApi.add({ taskId, title: title.trim(), type: selectedType, time });
      setTasks((prev) => [...prev, routine]);
      setTitle("");
      setSelectedType("exercise");
      setTime("07:00");
      toast.success("Task added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add task");
    }
  };

  const removeTask = async (taskId: string) => {
    try {
      await routineApi.remove(taskId);
      setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
      toast.success("Task removed");
    } catch {
      toast.error("Failed to remove task");
    }
  };

  const toggleEnabled = async (taskId: string) => {
    try {
      const { routine } = await routineApi.toggle(taskId);
      setTasks((prev) => prev.map((t) => (t.taskId === taskId ? routine : t)));
    } catch {
      toast.error("Failed to update task");
    }
  };

  const nextReminders = useMemo(() => {
    const now = new Date();
    return tasks
      .filter((task) => task.enabled)
      .map((task) => {
        const [hour, minute] = task.time.split(":").map(Number);
        const scheduled = new Date(now);
        scheduled.setHours(hour, minute, 0, 0);
        const diff = scheduled.getTime() - now.getTime();
        return { ...task, diffMs: diff >= 0 ? diff : Number.POSITIVE_INFINITY };
      })
      .sort((a, b) => a.diffMs - b.diffMs);
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Clock className="h-8 w-8 text-indigo-500" />
        <div>
          <h1 className="font-display text-3xl font-bold">Routine Scheduler</h1>
          <p className="text-muted-foreground">Add reminders for work, medication, exercise, sleep or custom tasks and get notifications at the scheduled time.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a Routine Task</CardTitle>
          <CardDescription>Daily reminders for your schedule.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Task Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as RoutineTaskType)}>
            <SelectTrigger>
              <SelectValue placeholder="Task Type" />
            </SelectTrigger>
            <SelectContent>
              {defaultTypes.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />

          <Button className="w-full" onClick={saveTask}>
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Tasks</CardTitle>
          <CardDescription>Tasks are saved to your account and run every day at the selected time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-muted-foreground">Loading tasks…</p>}
          {!loading && tasks.length === 0 && <p className="text-muted-foreground">No tasks configured yet.</p>}

          {tasks.map((task) => (
            <div key={task.taskId} className="flex items-center justify-between gap-3 p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{task.title}</span>
                  <Badge>{task.type}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Time: {task.time}</div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox checked={task.enabled} onCheckedChange={() => toggleEnabled(task.taskId)} />
                <Button size="sm" variant="destructive" onClick={() => removeTask(task.taskId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {nextReminders[0] && (
            <div className="p-3 border rounded-lg bg-slate-50">
              <p className="text-sm font-medium">Next reminder:</p>
              <p className="text-sm">
                {nextReminders[0].title} @ {nextReminders[0].time}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Browser notifications require permission. Email alerts are sent automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={() => {
              if ("Notification" in window && Notification.permission !== "granted") {
                Notification.requestPermission().then((state) => {
                  toast.success(`Notifications: ${state}`);
                });
              } else {
                toast.info("Notifications already granted or not supported");
              }
            }}
          >
            Enable Browser Notifications
          </Button>
          <p className="text-xs text-muted-foreground">
            At the scheduled time you will receive a browser push notification, an in-app toast, and an email to your registered address.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
