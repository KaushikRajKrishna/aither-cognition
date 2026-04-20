import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Calendar,
  BarChart3,
  MessageSquare,
  CheckCircle,
  XCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface MoodAlert {
  alertId: string;
  alertType: 'HIGH_STRESS_ALERT' | 'LOW_MOOD_ALERT';
  message: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MoodEntry {
  moodId: string;
  mood: string;
  moodScore: number;
  note: string;
  detectedMood?: string;
  sentimentScore?: number;
  createdAt: string;
}

interface MoodAnalysis {
  averageMoodScore: number;
  dominantMood: string;
  moodDistribution: Record<string, number>;
  stressFrequency: number;
  trend: "improving" | "stable" | "declining";
  alerts: MoodAlert[];
  analysisDays: number;
  analyzedAt: string;
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  totalEntries: number;
  averageMoodScore: number;
  dominantMood: string;
  stressDays: number;
  weekTrend: string;
  recommendations: string[];
  moodEntries: MoodEntry[];
  generatedAt: string;
}

interface Alert {
  alertId: string;
  alertType: string;
  message: string;
  resolved: boolean;
  createdAt: string;
}

const moodOptions = [
  { value: "happy", label: "Happy", emoji: "😊", color: "text-yellow-500" },
  { value: "calm", label: "Calm", emoji: "😌", color: "text-blue-500" },
  { value: "neutral", label: "Neutral", emoji: "😐", color: "text-gray-500" },
  { value: "stressed", label: "Stressed", emoji: "😰", color: "text-orange-500" },
  { value: "sad", label: "Sad", emoji: "😢", color: "text-red-500" },
];

const trendIcons = {
  improving: <TrendingUp className="h-4 w-4 text-green-500" />,
  stable: <Minus className="h-4 w-4 text-blue-500" />,
  declining: <TrendingDown className="h-4 w-4 text-red-500" />,
};

export default function MoodTracker() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("log");

  // Fetch initial data
  useEffect(() => {
    fetchMoodHistory();
    fetchAnalysis();
    fetchAlerts();
  }, []);

  const fetchMoodHistory = async (limit = 10, offset = 0) => {
    try {
      const response = await fetch(`/api/mood/history?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setMoodHistory(data.entries || []);
    } catch (error) {
      console.error('Failed to fetch mood history:', error);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch('/api/mood/analysis?days=30', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    }
  };

  const fetchWeeklyReport = async (weekOffset = 0) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mood/weekly-report?weekOffset=${weekOffset}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setWeeklyReport(data);
    } catch (error) {
      console.error('Failed to fetch weekly report:', error);
      toast.error("Failed to load weekly report");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/mood/alerts', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const handleSubmitMood = async () => {
    if (!selectedMood) {
      toast.error("Please select a mood");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/mood/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify({ mood: selectedMood, note }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Mood logged successfully!");
        setSelectedMood("");
        setNote("");
        fetchMoodHistory();
        fetchAnalysis();
        fetchAlerts();
      } else {
        toast.error(data.error || "Failed to log mood");
      }
    } catch (error) {
      console.error('Failed to submit mood:', error);
      toast.error("Failed to log mood");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/mood/alerts/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success("Alert resolved");
        fetchAlerts();
      } else {
        toast.error("Failed to resolve alert");
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast.error("Failed to resolve alert");
    }
  };

  const getMoodEmoji = (mood: string) => {
    const option = moodOptions.find(opt => opt.value === mood);
    return option?.emoji || "😐";
  };

  const getMoodColor = (mood: string) => {
    const option = moodOptions.find(opt => opt.value === mood);
    return option?.color || "text-gray-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-8 w-8 text-pink-500" />
        <div>
          <h1 className="font-display text-3xl font-bold">Mood Tracker</h1>
          <p className="text-muted-foreground">Track your emotional well-being and get personalized insights</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="log">Log Mood</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How are you feeling today?</CardTitle>
              <CardDescription>
                Select your current mood and optionally add a note about your feelings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedMood(option.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedMood === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.emoji}</div>
                    <div className={`text-sm font-medium ${option.color}`}>{option.label}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="How are you feeling? What's on your mind?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {note.length}/500 characters
                </div>
              </div>

              <Button
                onClick={handleSubmitMood}
                disabled={isSubmitting || !selectedMood}
                className="w-full"
              >
                {isSubmitting ? "Logging..." : "Log Mood"}
              </Button>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert) => (
                  <Alert key={alert.alertId}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{alert.message}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.alertId)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Mood Entries</CardTitle>
              <CardDescription>Your mood history and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              {moodHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No mood entries yet. Start logging your moods to see your history here.
                </p>
              ) : (
                <div className="space-y-4">
                  {moodHistory.map((entry) => (
                    <div key={entry.moodId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                        <div>
                          <div className="font-medium capitalize">{entry.mood}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </div>
                          {entry.note && (
                            <div className="text-sm text-muted-foreground mt-1 max-w-md truncate">
                              {entry.note}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">Score: {entry.moodScore}/5</Badge>
                        {entry.detectedMood && entry.detectedMood !== entry.mood && (
                          <div className="text-xs text-muted-foreground mt-1">
                            AI detected: {entry.detectedMood}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {analysis ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Average Mood</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{analysis.averageMoodScore.toFixed(1)}</div>
                    <Progress value={(analysis.averageMoodScore / 5) * 100} className="mt-2" />
                    <p className="text-sm text-muted-foreground mt-2">Out of 5.0</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Dominant Mood</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getMoodEmoji(analysis.dominantMood)}</span>
                      <span className="text-xl font-bold capitalize">{analysis.dominantMood}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Overall Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {trendIcons[analysis.trend]}
                      <span className="text-xl font-bold capitalize">{analysis.trend}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>How often you've felt each mood</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analysis.moodDistribution).map(([mood, count]) => (
                      <div key={mood} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{getMoodEmoji(mood)}</span>
                          <span className="capitalize">{mood}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(count / Math.max(...Object.values(analysis.moodDistribution))) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stress Analysis</CardTitle>
                  <CardDescription>Your stress levels over the analysis period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{analysis.stressFrequency.toFixed(1)}%</div>
                  <Progress value={analysis.stressFrequency} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Percentage of days with stressed or sad moods
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">
                  Loading analysis data...
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Report
                </CardTitle>
                <CardDescription>Get insights for the current or past weeks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => fetchWeeklyReport(0)}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    Current Week
                  </Button>
                  <Button
                    onClick={() => fetchWeeklyReport(1)}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    Last Week
                  </Button>
                </div>

                {weeklyReport && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Week:</span>
                        <div className="font-medium">{weeklyReport.weekNumber}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Entries:</span>
                        <div className="font-medium">{weeklyReport.totalEntries}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Average:</span>
                        <div className="font-medium">{weeklyReport.averageMoodScore.toFixed(1)}/5</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Trend:</span>
                        <div className="font-medium capitalize flex items-center gap-1">
                          {trendIcons[weeklyReport.weekTrend as keyof typeof trendIcons]}
                          {weeklyReport.weekTrend}
                        </div>
                      </div>
                    </div>

                    {weeklyReport.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations:</h4>
                        <ul className="space-y-1">
                          {weeklyReport.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{moodHistory.length}</div>
                    <div className="text-sm text-muted-foreground">Total Entries</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{alerts.length}</div>
                    <div className="text-sm text-muted-foreground">Active Alerts</div>
                  </div>
                </div>

                {analysis && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Most Common Mood:</span>
                      <span className="capitalize">{analysis.dominantMood}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Current Trend:</span>
                      <span className="capitalize flex items-center gap-1">
                        {trendIcons[analysis.trend]}
                        {analysis.trend}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Stress Level:</span>
                      <span>{analysis.stressFrequency.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}