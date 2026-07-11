import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { ATSGauge } from "@/components/ATSGauge";

const FEATURES = [
  {
    title: "ATS Resume Scoring",
    body: "Upload a PDF and get the same signal an applicant-tracking system reads — keyword coverage, structure, and quantified impact.",
  },
  {
    title: "AI Mock Interviews",
    body: "Role-specific HR, technical, and project questions, generated from your actual resume — not a generic question bank.",
  },
  {
    title: "Answer Evaluation",
    body: "Every answer is scored on technical accuracy, clarity, and confidence, with an ideal-answer comparison.",
  },
  {
    title: "Skill Gap Roadmaps",
    body: "See exactly what's missing for your target role, ranked by priority, with a beginner-to-advanced learning path.",
  },
];

const STEPS = [
  { n: "01", title: "Upload your resume", body: "PDF in, structured profile out — skills, projects, education, experience." },
  { n: "02", title: "Pick a target role", body: "AI/ML Engineer, Full Stack, Data Analyst, or a custom role you define." },
  { n: "03", title: "Run a mock interview", body: "Answer HR, technical, and project questions in a timed, focused session." },
  { n: "04", title: "Close the gap", body: "Get a scored roadmap and track progress across every session." },
];

const TESTIMONIALS = [
  { quote: "I finally understood why my resume wasn't clearing screens. Fixed three things, score jumped 22 points.", name: "Final-year CS student" },
  { quote: "The mock interview questions were built from my actual projects, not generic Leetcode fluff.", name: "Placement candidate" },
  { quote: "The skill gap roadmap gave me a real order to learn things in, not just a wall of links.", name: "Junior data analyst" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-grid-fade">
      <Navbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-signal border border-signal/30 bg-signal-soft rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
            AI interview readiness platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight mb-6">
            Interview readiness,
            <br />
            <span className="text-signal">measured.</span>
          </h1>
          <p className="text-lg text-ink-muted mb-8 max-w-md">
            HireSense AI reads your resume the way a recruiter's ATS does, then builds mock
            interviews and a learning roadmap around exactly what you're missing.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/register" className="btn-primary">
              Analyze my resume
            </Link>
            <Link to="/login" className="btn-secondary">
              I have an account
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex justify-center"
        >
          <div className="card p-10 flex flex-col items-center gap-4">
            <ATSGauge score={78} size={220} />
            <p className="text-sm text-ink-muted text-center max-w-[220px]">
              A live read on your resume — this is the first thing a recruiter's system sees.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-base-border">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-10">Everything between "applied" and "hired"</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 hover:border-signal/40 transition-colors">
              <h3 className="font-display font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-ink-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-base-border">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-10">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.n}>
              <span className="font-mono text-signal text-sm">{s.n}</span>
              <h3 className="font-display font-semibold mt-2 mb-2">{s.title}</h3>
              <p className="text-sm text-ink-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-base-border">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-10">From people prepping right now</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <p className="text-ink mb-4">&ldquo;{t.quote}&rdquo;</p>
              <p className="text-sm text-ink-muted">— {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-base-border text-center">
        <h2 className="text-3xl font-semibold mb-4">Find out what your resume is actually saying.</h2>
        <p className="text-ink-muted mb-8">Free to start. No credit card required.</p>
        <Link to="/register" className="btn-primary text-base px-8 py-3">
          Get your ATS score
        </Link>
      </section>

      <footer className="border-t border-base-border py-8 text-center text-sm text-ink-faint">
        HireSense AI — built for people getting ready for the next interview.
      </footer>
    </div>
  );
}
