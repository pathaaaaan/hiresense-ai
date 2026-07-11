import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getResults } from "@/services/interview";
import { getErrorMessage } from "@/services/api";
import type { InterviewReport, QuestionType } from "@/types";

const RUBRIC_LABELS: Record<string, string> = {
  technical_accuracy: "Technical",
  communication: "Communication",
  clarity: "Clarity",
  confidence: "Confidence",
  completeness: "Completeness",
};

const TYPE_STYLES: Record<QuestionType, string> = {
  HR: "bg-signal-soft text-signal border-signal/30",
  TECHNICAL: "bg-amber-soft text-amber border-amber/30",
  PROJECT: "bg-base-overlay text-ink border-base-border",
};

export default function InterviewResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      setReport(await getResults(sessionId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const radarData = report
    ? Object.entries(RUBRIC_LABELS).map(([key, label]) => ({
        dimension: label,
        score: report.rubric_averages[key] ?? 0,
      }))
    : [];

  const answered = report?.results.filter((r) => r.evaluation) ?? [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-14">
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-72" />
            <Skeleton className="h-48" />
          </div>
        )}

        {error && !isLoading && (
          <Card className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-danger">{error}</p>
            <Button variant="secondary" onClick={load}>
              Retry
            </Button>
          </Card>
        )}

        {report && !isLoading && !error && (
          <div className="space-y-8">
            {/* Header */}
            <Card className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border-4 border-signal/40 bg-signal-soft">
                <span className="font-display text-3xl font-semibold text-signal">
                  {report.overall_score ?? "—"}
                </span>
                <span className="text-xs text-ink-muted">/10</span>
              </div>
              <div>
                <h1 className="mb-1 text-xl font-semibold sm:text-2xl">
                  Interview report · {report.target_role}
                </h1>
                <p className="mb-3 text-sm text-ink-muted">
                  {report.answered_questions} of {report.total_questions} questions answered ·{" "}
                  {new Date(report.created_at).toLocaleDateString()}
                </p>
                {report.overall_feedback && (
                  <p className="text-sm text-ink-muted">{report.overall_feedback}</p>
                )}
              </div>
            </Card>

            {/* Radar */}
            <Card>
              <h2 className="mb-4 font-display font-semibold">Performance by dimension</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="score" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>

            {/* Question breakdown */}
            <div>
              <h2 className="mb-4 font-display font-semibold">Question breakdown</h2>
              {answered.length === 0 ? (
                <Card className="py-10 text-center text-ink-muted">
                  <p>No answered questions in this session.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {answered.map((result, i) => (
                    <Card key={result.question.id}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-ink-muted">Q{i + 1}</span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 font-mono text-xs ${TYPE_STYLES[result.question.question_type]}`}
                          >
                            {result.question.question_type}
                          </span>
                        </div>
                        <span className="font-mono text-signal">
                          {result.evaluation!.overall_score}/10
                        </span>
                      </div>

                      <p className="mb-3 font-medium">{result.question.question_text}</p>

                      {result.answer_text && (
                        <p className="mb-3 rounded-lg border border-base-border bg-base-overlay/40 px-3 py-2 text-sm text-ink-muted">
                          {result.answer_text}
                        </p>
                      )}

                      {result.evaluation!.feedback && (
                        <p className="mb-2 text-sm">
                          <span className="font-medium">Feedback: </span>
                          <span className="text-ink-muted">{result.evaluation!.feedback}</span>
                        </p>
                      )}

                      {result.evaluation!.improvement_suggestions && (
                        <p className="mb-2 text-sm">
                          <span className="font-medium">Improve: </span>
                          <span className="text-ink-muted">
                            {result.evaluation!.improvement_suggestions}
                          </span>
                        </p>
                      )}

                      {result.evaluation!.ideal_answer && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-signal">
                            Show ideal answer
                          </summary>
                          <p className="mt-2 text-sm text-ink-muted">
                            {result.evaluation!.ideal_answer}
                          </p>
                        </details>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to={`/roadmap/${report.resume_id}`} className="flex-1">
                <Button className="w-full">View your learning roadmap</Button>
              </Link>
              <Link to="/dashboard" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Back to dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
