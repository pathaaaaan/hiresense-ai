import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRoadmap } from "@/services/roadmap";
import { getErrorMessage } from "@/services/api";
import type { Roadmap, RoadmapPlanItem } from "@/types";

function PlanTimeline({ title, items }: { title: string; items: RoadmapPlanItem[] }) {
  return (
    <Card>
      <h2 className="mb-4 font-display font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">Nothing planned at this level.</p>
      ) : (
        <ol className="space-y-4 border-l border-base-border pl-4">
          {items.map((item, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-signal" />
              <p className="text-sm font-medium">{item.title ?? `Step ${i + 1}`}</p>
              {item.description && (
                <p className="mt-1 text-sm text-ink-muted">{item.description}</p>
              )}
              {item.duration && (
                <p className="mt-1 font-mono text-xs text-signal">{item.duration}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default function RoadmapPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!resumeId) return;
    setIsLoading(true);
    setError(null);
    try {
      setRoadmap(await getRoadmap(resumeId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    load();
  }, [load]);

  // Weak interview skills first, then ATS-missing skills = priority order.
  const prioritySkills = roadmap
    ? [...new Set([...roadmap.weak_skills, ...roadmap.missing_skills])]
    : [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 py-14">
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
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

        {roadmap && !isLoading && !error && (
          <div className="space-y-8">
            <div>
              <h1 className="mb-2 text-2xl font-semibold sm:text-3xl">Learning roadmap</h1>
              <p className="text-ink-muted">
                Personalized plan for the <span className="text-ink">{roadmap.target_role}</span>{" "}
                role
                {roadmap.estimated_duration && (
                  <>
                    {" "}
                    · estimated{" "}
                    <span className="font-mono text-signal">{roadmap.estimated_duration}</span>
                  </>
                )}
              </p>
            </div>

            {/* Priority skills */}
            <Card>
              <h2 className="mb-3 font-display font-semibold">Skills to close, by priority</h2>
              {prioritySkills.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No skill gaps detected. Keep sharpening your strengths!
                </p>
              ) : (
                <ol className="flex flex-wrap gap-2">
                  {prioritySkills.map((skill, i) => (
                    <li
                      key={skill}
                      className="flex items-center gap-2 rounded-full border border-amber/30 bg-amber-soft px-3 py-1 font-mono text-xs text-amber"
                    >
                      <span className="font-semibold">#{i + 1}</span>
                      {skill}
                    </li>
                  ))}
                </ol>
              )}
              {roadmap.strong_skills.length > 0 && (
                <div className="mt-4 border-t border-base-border pt-4">
                  <p className="mb-2 text-sm font-medium text-ink-muted">Already strong</p>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.strong_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-signal/30 bg-signal-soft px-3 py-1 font-mono text-xs text-signal"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Plans */}
            <PlanTimeline title="Beginner" items={roadmap.beginner_plan} />
            <PlanTimeline title="Intermediate" items={roadmap.intermediate_plan} />
            <PlanTimeline title="Advanced" items={roadmap.advanced_plan} />

            {/* Resources */}
            <Card>
              <h2 className="mb-4 font-display font-semibold">Learning resources</h2>
              {roadmap.resources.length === 0 ? (
                <p className="text-sm text-ink-muted">No resources suggested yet.</p>
              ) : (
                <ul className="space-y-3">
                  {roadmap.resources.map((resource, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="font-mono text-signal">→</span>
                      <span>
                        {resource.skill && (
                          <span className="font-medium">{resource.skill}: </span>
                        )}
                        {resource.url ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-signal hover:underline"
                          >
                            {resource.title ?? resource.url}
                          </a>
                        ) : (
                          <span className="text-ink-muted">{resource.title}</span>
                        )}
                        {resource.type && (
                          <span className="ml-2 font-mono text-xs text-ink-muted">
                            [{resource.type}]
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
