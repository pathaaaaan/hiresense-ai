import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getDashboard } from "@/services/analytics";
import { createInterview, listInterviews } from "@/services/interview";
import { listResumes } from "@/services/resume";
import { getErrorMessage } from "@/services/api";
import type { DashboardAnalytics, InterviewListItem, ResumeListItem } from "@/types";

const ROLE_OPTIONS = ["Software Engineer", "Full Stack Developer", "AI/ML Engineer", "Data Analyst"];

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <Card>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-signal">
        {value}
        {suffix && <span className="ml-1 text-base text-ink-muted">{suffix}</span>}
      </p>
    </Card>
  );
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState("");
  const [targetRole, setTargetRole] = useState(ROLE_OPTIONS[0]);
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [analyticsData, interviewData, resumeData] = await Promise.all([
        getDashboard(),
        listInterviews(),
        listResumes(),
      ]);
      setAnalytics(analyticsData);
      setInterviews(interviewData);
      setResumes(resumeData);
      if (resumeData.length > 0) setSelectedResume((prev) => prev || resumeData[0].id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStartInterview() {
    if (!selectedResume) {
      toast("Upload a resume first to start a mock interview.", "error");
      return;
    }
    setIsStarting(true);
    try {
      const { session_id } = await createInterview(selectedResume, targetRole);
      toast("Interview created. Good luck!", "success");
      navigate(`/interview/${session_id}`);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setIsStarting(false);
    }
  }

  const trendData = (analytics?.progress_history ?? []).map((p) => ({
    date: new Date(p.date).toLocaleDateString(),
    score: p.score,
    role: p.target_role,
  }));

  const atsTrendData = [...resumes]
    .reverse()
    .filter((r) => r.ats_score !== null)
    .map((r) => ({ date: new Date(r.created_at).toLocaleDateString(), score: r.ats_score }));

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="mb-2 text-2xl font-semibold sm:text-3xl">Dashboard</h1>
        <p className="mb-10 text-ink-muted">
          Track your ATS scores, interview performance, and progress over time.
        </p>

        {error && (
          <Card className="mb-8 flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-danger">{error}</p>
            <Button variant="secondary" onClick={load}>
              Retry
            </Button>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-72" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          !error && (
            <div className="space-y-8">
              {/* Stat cards */}
              <div className="grid gap-6 sm:grid-cols-3">
                <StatCard label="Average ATS score" value={analytics?.average_ats_score ?? 0} suffix="/100" />
                <StatCard label="Interviews taken" value={analytics?.interviews_taken ?? 0} />
                <StatCard label="Average interview score" value={analytics?.average_score ?? 0} suffix="/10" />
              </div>

              {/* Start interview */}
              <Card>
                <h2 className="mb-4 font-display font-semibold">Start a mock interview</h2>
                {resumes.length === 0 ? (
                  <div className="py-4 text-center text-ink-muted">
                    <p className="mb-4">You have no analyzed resumes yet.</p>
                    <Link to="/resume">
                      <Button>Analyze a resume first</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
                    <div>
                      <label className="label">Resume</label>
                      <select
                        value={selectedResume}
                        onChange={(e) => setSelectedResume(e.target.value)}
                        className="input-field"
                      >
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.filename}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Target role</label>
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="input-field"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={handleStartInterview} disabled={isStarting}>
                      {isStarting ? "Generating questions…" : "Start interview"}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <h2 className="mb-4 font-display font-semibold">Interview score trend</h2>
                  {trendData.length === 0 ? (
                    <p className="py-12 text-center text-sm text-ink-muted">
                      Complete your first interview to see your progress trend.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Card>
                <Card>
                  <h2 className="mb-4 font-display font-semibold">ATS score over time</h2>
                  {atsTrendData.length === 0 ? (
                    <p className="py-12 text-center text-sm text-ink-muted">
                      Analyze a resume to see your ATS performance here.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={atsTrendData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

              {/* Weak / strong areas */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <h2 className="mb-3 font-display font-semibold">Weak areas</h2>
                  {(analytics?.weak_areas ?? []).length === 0 ? (
                    <p className="text-sm text-ink-muted">No weak areas detected yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analytics!.weak_areas.map((a) => (
                        <span
                          key={a}
                          className="rounded-full border border-amber/30 bg-amber-soft px-3 py-1 font-mono text-xs text-amber"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
                <Card>
                  <h2 className="mb-3 font-display font-semibold">Strong areas</h2>
                  {(analytics?.strong_areas ?? []).length === 0 ? (
                    <p className="text-sm text-ink-muted">Complete an interview to reveal your strengths.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analytics!.strong_areas.map((a) => (
                        <span
                          key={a}
                          className="rounded-full border border-signal/30 bg-signal-soft px-3 py-1 font-mono text-xs text-signal"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Recent lists */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <h2 className="mb-4 font-display font-semibold">Recent interviews</h2>
                  {interviews.length === 0 ? (
                    <p className="text-sm text-ink-muted">No interviews yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {interviews.slice(0, 5).map((i) => (
                        <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{i.target_role}</p>
                            <p className="text-xs text-ink-muted">
                              {new Date(i.created_at).toLocaleDateString()} · {i.status}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="font-mono text-signal">
                              {i.overall_score !== null ? `${i.overall_score}/10` : "—"}
                            </span>
                            <Link
                              to={
                                i.status === "COMPLETED"
                                  ? `/interview/${i.id}/results`
                                  : `/interview/${i.id}`
                              }
                              className="text-signal hover:underline"
                            >
                              {i.status === "COMPLETED" ? "Report" : "Continue"}
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                <Card>
                  <h2 className="mb-4 font-display font-semibold">Recent resumes</h2>
                  {resumes.length === 0 ? (
                    <p className="text-sm text-ink-muted">No resumes uploaded yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {resumes.slice(0, 5).map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{r.filename}</p>
                            <p className="text-xs text-ink-muted">
                              {new Date(r.created_at).toLocaleDateString()}
                              {r.target_role ? ` · ${r.target_role}` : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="font-mono text-signal">
                              {r.ats_score !== null ? Math.round(r.ats_score) : "—"}
                            </span>
                            <Link to={`/roadmap/${r.id}`} className="text-signal hover:underline">
                              Roadmap
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
