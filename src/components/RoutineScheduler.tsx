import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, BellRing, Clock } from "lucide-react";

type RoutineTaskType = "work" | "medication" | "exercise" | "sleep" | "custom";

type RoutineTask = {
  id: string;
  title: string;
  type: RoutineTaskType;
  time: string; // HH:mm
  enabled: boolean;
  lastNotifiedAt?: string;
};

const defaultTypes: { value: RoutineTaskType; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "medication", label: "Medication" },
  { value: "exercise", label: "Exercise" },
  { value: "sleep", label: "Sleep" },
  { value: "custom", label: "Custom" },
];

const STORAGE_KEY = "routine_scheduler_tasks";

export default function RoutineScheduler() {
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<RoutineTaskType>("exercise");
  const [time, setTime] = useState("07:00");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as RoutineTask[];
        setTasks(parsed);
      } catch (error) {
        console.error("Failed to parse routine tasks", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (!task.enabled) return task;
          if (task.time !== currentTime) return task;

          const last = task.lastNotifiedAt ? new Date(task.lastNotifiedAt) : null;
          const isNotifiedToday = last ? last.toDateString() === now.toDateString() : false;

          if (!isNotifiedToday) {
            const message = `Time for ${task.type === "custom" ? task.title || "your task" : task.type}!`;
            toast.success(message);

            if ("Notification" in window && Notification.permission === "granted") {
              try {
                new Notification("Routine Reminder", {
                  body: message,
                });
              } catch (err) {
                console.error("Browser notification error", err);
              }
            }

            return { ...task, lastNotifiedAt: now.toISOString() };
          }

          return task;
        })
      );
    }, 15000); // check every 15 seconds

    return () => clearInterval(interval);
  }, [tasks]);

  const saveTask = () => {
    if (!title.trim()) {
      toast.error("Please enter a task name");
      return;
    }

    if (!time) {
      toast.error("Please set a time");
      return;
    }

    const newTask: RoutineTask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: title.trim(),
      type: selectedType,
      time,
      enabled: true,
    };

    setTasks((prev) => [...prev, newTask]);
    setTitle("");
    setSelectedType("exercise");
    setTime("07:00");
    toast.success("Task added");
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    toast.success("Task removed");
  };

  const toggleEnabled = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        return { ...task, enabled: !task.enabled };
      })
    );
  };

  const nextReminders = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();

    return tasks
      .filter((task) => task.enabled)
      .map((task) => {
        const [hour, minute] = task.time.split(":").map(Number);
        const scheduled = new Date(now);
        scheduled.setHours(hour, minute, 0, 0);

        if (scheduled.toDateString() !== today) {
          return { ...task, diffMs: 0 };
        }

        const diff = scheduled.getTime() - now.getTime();
        return { ...task, diffMs: diff >= 0 ? diff : Number.POSITIVE_INFINITY };
      })
      .sort((a, b) => (a.diffMs ?? Number.POSITIVE_INFINITY) - (b.diffMs ?? Number.POSITIVE_INFINITY));
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
          <CardDescription>Tasks are saved in your browser and run every day at the selected time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 && <p className="text-muted-foreground">No tasks configured yet.</p>}

          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-3 p-4 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{task.title}</span>
                  <Badge>{task.type}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Time: {task.time}</div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox checked={task.enabled} onCheckedChange={() => toggleEnabled(task.id)} />
                <Button size="sm" variant="destructive" onClick={() => removeTask(task.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {nextReminders && nextReminders[0] && (
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
          <CardDescription>Browser notifications require permission.</CardDescription>
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
          <p className="text-xs text-muted-foreground">Local notification delivery is also powered by toast messages in the app.</p>
        </CardContent>
      </Card>
    </div>
  );
}
