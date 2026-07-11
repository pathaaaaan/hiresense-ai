import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { ATSGauge } from "@/components/ATSGauge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { analyzeResume, listResumes } from "@/services/resume";
import { getErrorMessage } from "@/services/api";
import type { ResumeAnalysis, ResumeListItem } from "@/types";

const ROLE_OPTIONS = [
  "Software Engineer",
  "Full Stack Developer",
  "AI/ML Engineer",
  "Data Analyst",
  "Custom Role",
];

export default function ResumeAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState(ROLE_OPTIONS[0]);
  const [customRole, setCustomRole] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<ResumeListItem[]>([]);

  useEffect(() => {
    listResumes().then(setHistory).catch(() => {});
  }, [result]);

  const handleFile = useCallback((f: File | null) => {
    setError(null);
    if (f && f.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    setFile(f);
  }, []);

  async function handleSubmit() {
    if (!file) {
      setError("Please choose a PDF resume first.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const role = targetRole === "Custom Role" ? customRole : targetRole;
      const analysis = await analyzeResume(file, role || undefined);
      setResult(analysis);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-14">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Resume Analysis</h1>
        <p className="text-ink-muted mb-10">
          Upload a PDF resume to get an ATS score, extracted skills, and specific suggestions.
        </p>

        <div className="grid md:grid-cols-[1fr_1.4fr] gap-8">
          {/* Upload panel */}
          <Card className="h-fit">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className={`rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors ${
                isDragging ? "border-signal bg-signal-soft" : "border-base-border"
              }`}
            >
              <input
                id="resume-file"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <label htmlFor="resume-file" className="cursor-pointer">
                <p className="font-medium mb-1">
                  {file ? file.name : "Drop your resume PDF here"}
                </p>
                <p className="text-sm text-ink-muted">or click to browse — max 5MB</p>
              </label>
            </div>

            <div className="mt-6">
              <label className="label">Target role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="input-field"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {targetRole === "Custom Role" && (
              <div className="mt-4">
                <label className="label">Specify role</label>
                <Input
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. DevOps Engineer"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 mt-4">
                {error}
              </p>
            )}

            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-6">
              {isSubmitting ? "Analyzing…" : "Analyze resume"}
            </Button>

            {history.length > 0 && (
              <div className="mt-8 pt-6 border-t border-base-border">
                <p className="text-sm font-medium text-ink-muted mb-3">Past analyses</p>
                <ul className="space-y-2">
                  {history.slice(0, 5).map((h) => (
                    <li key={h.id} className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[160px] text-ink-muted">{h.filename}</span>
                      <span className="font-mono text-signal">
                        {h.ats_score !== null ? Math.round(h.ats_score) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Results panel */}
          <div>
            {!result && !isSubmitting && (
              <Card className="h-full flex items-center justify-center text-center text-ink-muted py-20">
                <p>Your ATS score and breakdown will appear here.</p>
              </Card>
            )}

            {isSubmitting && (
              <Card className="h-full flex items-center justify-center py-20">
                <p className="text-ink-muted animate-pulse">Reading your resume like an ATS would…</p>
              </Card>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <Card className="flex flex-col sm:flex-row items-center gap-8">
                  <ATSGauge score={result.ats_score ?? 0} size={160} />
                  <div>
                    <h2 className="font-display font-semibold text-lg mb-1">
                      {result.target_role ? `Scored for ${result.target_role}` : "General ATS score"}
                    </h2>
                    <p className="text-sm text-ink-muted">
                      Based on keyword coverage, structure, and quantified impact in{" "}
                      <span className="text-ink">{result.filename}</span>.
                    </p>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-display font-semibold mb-3">Extracted skills</h3>
                  {result.skills.length === 0 ? (
                    <p className="text-sm text-ink-muted">No skills were confidently extracted.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {result.skills.map((s) => (
                        <span key={s} className="text-xs font-mono bg-signal-soft text-signal border border-signal/30 rounded-full px-3 py-1">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>

                {result.missing_skills.length > 0 && (
                  <Card>
                    <h3 className="font-display font-semibold mb-3">Missing skills for this role</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.missing_skills.map((s) => (
                        <span key={s} className="text-xs font-mono bg-amber-soft text-amber border border-amber/30 rounded-full px-3 py-1">
                          {s}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}

                <Card>
                  <h3 className="font-display font-semibold mb-3">Weaknesses</h3>
                  <ul className="space-y-3">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm">
                        <span className="text-ink font-medium">{w.area}: </span>
                        <span className="text-ink-muted">{w.issue}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card>
                  <h3 className="font-display font-semibold mb-3">Suggestions</h3>
                  <ul className="space-y-3">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="text-signal font-mono">→</span>
                        <span>
                          <span className="text-ink font-medium">{s.area}: </span>
                          <span className="text-ink-muted">{s.suggestion}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
