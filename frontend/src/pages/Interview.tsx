import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { finishInterview, getQuestions, submitAnswer } from "@/services/interview";
import { getErrorMessage } from "@/services/api";
import type { Evaluation, InterviewQuestion, QuestionType } from "@/types";

const TYPE_STYLES: Record<QuestionType, string> = {
  HR: "bg-signal-soft text-signal border-signal/30",
  TECHNICAL: "bg-amber-soft text-amber border-amber/30",
  PROJECT: "bg-base-overlay text-ink border-base-border",
};

const RUBRIC_LABELS: Record<string, string> = {
  technical_accuracy: "Technical accuracy",
  communication: "Communication",
  clarity: "Clarity",
  confidence: "Confidence",
  completeness: "Completeness",
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [seconds, setSeconds] = useState(0);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getQuestions(sessionId);
      setQuestions(data);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Per-question count-up timer, paused while feedback is open.
  useEffect(() => {
    if (evaluation || isLoading) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [evaluation, isLoading, index]);

  const question = questions[index];
  const isLast = index + 1 >= questions.length;

  async function handleSubmit() {
    if (!sessionId || !question) return;
    if (!answer.trim()) {
      toast("Write an answer before submitting.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitAnswer(sessionId, question.id, answer.trim());
      setEvaluation(result.evaluation);
    } catch (err) {
      toast(getErrorMessage(err), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFinish() {
    if (!sessionId) return;
    setIsFinishing(true);
    try {
      await finishInterview(sessionId);
      navigate(`/interview/${sessionId}/results`);
    } catch (err) {
      toast(getErrorMessage(err), "error");
      setIsFinishing(false);
    }
  }

  async function handleNext() {
    setEvaluation(null);
    setAnswer("");
    setSeconds(0);
    if (isLast) {
      await handleFinish();
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-14">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-40" />
            <Skeleton className="h-48" />
          </div>
        )}

        {loadError && !isLoading && (
          <Card className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-danger">{loadError}</p>
            <Button variant="secondary" onClick={load}>
              Retry
            </Button>
          </Card>
        )}

        {!isLoading && !loadError && questions.length === 0 && (
          <Card className="py-12 text-center text-ink-muted">
            <p>No questions found for this session.</p>
          </Card>
        )}

        {!isLoading && !loadError && question && (
          <>
            {/* Progress header */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm text-ink-muted">
                <span>
                  Question {index + 1} of {questions.length}
                </span>
                <span className="font-mono">{formatTime(seconds)}</span>
              </div>
              <Progress value={(index / questions.length) * 100} />
            </div>

            <Card>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 font-mono text-xs ${TYPE_STYLES[question.question_type]}`}
                >
                  {question.question_type}
                </span>
                <span className="rounded-full border border-base-border px-3 py-1 font-mono text-xs text-ink-muted">
                  {question.difficulty}
                </span>
              </div>

              <h1 className="mb-6 text-lg font-semibold leading-relaxed">
                {question.question_text}
              </h1>

              <label className="label">Your answer</label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer as if you were in a real interview. Be specific and use examples."
                disabled={isSubmitting}
              />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Evaluating your answer…" : "Submit answer"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleFinish}
                  disabled={isSubmitting || isFinishing}
                >
                  {isFinishing ? "Generating report…" : "Finish early"}
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Feedback modal */}
      {evaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="max-h-[85vh] w-full max-w-lg overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">AI feedback</h2>
              <span className="font-mono text-2xl font-semibold text-signal">
                {evaluation.overall_score}/10
              </span>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(RUBRIC_LABELS).map(([key, label]) => (
                <div key={key} className="rounded-lg border border-base-border px-3 py-2">
                  <p className="text-xs text-ink-muted">{label}</p>
                  <p className="font-mono text-sm text-signal">
                    {evaluation[key as keyof Evaluation] as number}/10
                  </p>
                </div>
              ))}
            </div>

            {evaluation.feedback && (
              <div className="mb-4">
                <p className="mb-1 text-sm font-medium">Feedback</p>
                <p className="text-sm text-ink-muted">{evaluation.feedback}</p>
              </div>
            )}

            {evaluation.improvement_suggestions && (
              <div className="mb-4">
                <p className="mb-1 text-sm font-medium">How to improve</p>
                <p className="text-sm text-ink-muted">{evaluation.improvement_suggestions}</p>
              </div>
            )}

            <Button onClick={handleNext} disabled={isFinishing} className="mt-2 w-full">
              {isFinishing
                ? "Generating report…"
                : isLast
                  ? "Finish & view report"
                  : "Next question"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
