"use client";

import { useEffect, useMemo, useState } from "react";
import type { CriterionResult, VerityReport } from "../../verity/types";
import "./verity.css";

type Task = { name: string; title: string; specFile: string; spec: string; criteria: string[] };
type Run = { report: VerityReport; markdown: string; exitCode: number; output: string };

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState("admin-csv-export");
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"results" | "spec" | "guide">("results");
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/verity").then(async response => {
      if (!response.ok) throw new Error("Could not load tasks.");
      return response.json();
    }).then(data => setTasks(data.tasks)).catch(err => setError(err.message));
  }, []);
  const task = tasks.find(item => item.name === selected);
  const report = run?.report;
  const results = useMemo(() => report?.results.filter(item => filter === "ALL" || item.status === filter) ?? [], [report, filter]);
  async function audit() {
    setBusy(true); setError(""); setRun(null); setFilter("ALL"); setExpanded(null); setTab("results");
    try {
      const response = await fetch("/api/verity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: selected }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Audit failed.");
      setRun(body);
    } catch (err) { setError(err instanceof Error ? err.message : "Audit failed."); }
    finally { setBusy(false); }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">V<span>·</span></div><div><strong>verity</strong><small>REQUIREMENT AUDITS</small></div></div>
        <div className="side-label">WORKSPACE <span>01</span></div>
        <nav aria-label="Audit tasks">
          {tasks.map(item => <button className={`task-link ${selected === item.name ? "active" : ""}`} key={item.name} onClick={() => { setSelected(item.name); setRun(null); setError(""); setTab("results"); setExpanded(null); }}>
            <span className="task-glyph">{item.name === "admin-csv-export" ? "↗" : item.name === "pagination-api" ? "≡" : "{}"}</span><span>{item.title}</span><span className="task-count">{item.criteria.length}</span>
          </button>)}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-note"><span className="pulse"/> LOCAL PROJECT<br/><small>Checks execute against this checkout.</small></div><a href="https://github.com/abdoulore/Verity" target="_blank" rel="noreferrer">View repository <span>↗</span></a></div>
      </aside>
      <main className="workspace">
        <header className="topbar"><span>WORKSPACE <b>/</b> AUDITS <b>/</b> <strong>{task?.title ?? "Loading"}</strong></span><span className="topbar-right">VERITY <span className="version">v0.1</span></span></header>
        <div className="main-content">
          <div className="eyebrow"><span className="eyebrow-line"/> ACCEPTANCE CRITERIA VERIFICATION</div>
          <div className="hero-row"><div><h1>{task?.title ?? "Loading tasks…"}</h1><p className="lead">Run executable checks against the implementation. Inspect the evidence behind every verdict.</p></div><button className="run-button" onClick={audit} disabled={busy || !task}>{busy ? <><span className="spinner"/> Running audit…</> : <>Run audit <span>↗</span></>}</button></div>
          <div className="meta-row"><span><em>SPECIFICATION</em> <code>{task?.specFile ?? "—"}</code></span><span><em>CRITERIA</em> {task?.criteria.length ?? "—"} defined</span><span><em>MODE</em> Executable checks</span></div>
          {error && <div className="error-banner" role="alert"><strong>Audit error</strong><span>{error}</span></div>}
          <section className="overview" aria-label="Audit summary"><div className="overview-heading"><span>RUN SUMMARY</span><span>{report ? new Date(report.generatedAt).toLocaleString() : "AWAITING FIRST RUN"}</span></div><div className="metrics"><div className="metric"><span>CRITERIA</span><strong>{report?.summary.total ?? task?.criteria.length ?? "—"}</strong><small>in this audit</small></div><div className="metric good"><span>VERIFIED</span><strong>{report?.summary.verified ?? "—"}</strong><small>requirements met</small></div><div className="metric bad"><span>FAILED</span><strong>{report?.summary.failed ?? "—"}</strong><small>needs attention</small></div><div className="metric caution"><span>UNCERTAIN</span><strong>{report?.summary.uncertain ?? "—"}</strong><small>insufficient evidence</small></div></div></section>
          <div className="content-heading"><div className="tabs" role="tablist"><button className={tab === "results" ? "on" : ""} onClick={() => setTab("results")}>Results {report && <span>{report.summary.total}</span>}</button><button className={tab === "spec" ? "on" : ""} onClick={() => setTab("spec")}>Specification</button><button className={tab === "guide" ? "on" : ""} onClick={() => setTab("guide")}>Developer guide</button></div>{report && tab === "results" && <div className="downloads"><button onClick={() => download(`${selected}-report.json`, JSON.stringify(report, null, 2), "application/json")}>↓ JSON</button><button onClick={() => download(`${selected}-report.md`, run!.markdown, "text/markdown")}>↓ Markdown</button></div>}</div>
          {tab === "results" && <><div className="filter-row"><span>{report ? `${results.length} of ${report.summary.total} results` : "VERIFICATION RESULTS"}</span>{report && <div className="filter-buttons">{["ALL", "VERIFIED", "FAILED", "UNCERTAIN"].map(name => <button key={name} onClick={() => setFilter(name)} className={filter === name ? "chosen" : ""}>{name === "ALL" ? "All" : name.charAt(0) + name.slice(1).toLowerCase()}</button>)}</div>}</div>
            {!report ? <div className="empty"><div className="empty-icon">⌕</div><h2>Ready to verify.</h2><p>Select an audit and run its checks to see criterion level verdicts and evidence from the actual code.</p><button onClick={audit} disabled={busy || !task}>Run this audit →</button></div> : results.length ? <div className="result-list">{results.map((item: CriterionResult, index) => <article className={`result-card ${item.status.toLowerCase()}`} key={`${item.id}-${index}`}><button className="result-toggle" onClick={() => setExpanded(expanded === `${item.id}-${index}` ? null : `${item.id}-${index}`)} aria-expanded={expanded === `${item.id}-${index}`}><span className="result-id">{item.id}</span><span className="result-title">{item.text}</span><span className={`badge ${item.status.toLowerCase()}`}><span className="badge-dot"/>{item.status}</span><span className="chevron">{expanded === `${item.id}-${index}` ? "−" : "+"}</span></button>{expanded === `${item.id}-${index}` && <div className="result-details"><p className="reason">{item.reason}</p><h3>EVIDENCE <span>{item.evidence.length}</span></h3>{item.evidence.length ? item.evidence.map((evidence, i) => <div className="evidence" key={i}><strong>{evidence.description}</strong>{evidence.filePath && <code>{evidence.filePath}</code>}{evidence.snippet && <pre>{evidence.snippet}</pre>}</div>) : <p>No evidence was returned by this check.</p>}</div>}</article>)}</div> : <div className="empty short">No results match this filter.</div>}
          </>}
          {tab === "spec" && <section className="document"><div className="document-top"><span>SOURCE DOCUMENT</span><code>{task?.specFile}</code></div><pre>{task?.spec || "Specification unavailable."}</pre></section>}
          {tab === "guide" && <section className="guide"><div className="guide-intro"><span className="guide-number">01 / 03</span><h2>Bring your own feature.</h2><p>Verity runs inside a developer&apos;s project. The browser dashboard uses the same runner as the CLI and reads specifications and check files from this checkout.</p></div><div className="guide-step"><span>01</span><div><h3>Define the requirement</h3><p>Create <code>docs/my-task.md</code>. Write each acceptance criterion under a heading such as <code>### AC-01</code>.</p></div></div><div className="guide-step"><span>02</span><div><h3>Write executable checks</h3><p>Add one check per criterion in <code>verity/tasks/my-task/</code>. Each check must execute the code and return a verdict with evidence. Ask IBM Bob to help draft the checks, then review them.</p></div></div><div className="guide-step"><span>03</span><div><h3>Run and inspect</h3><p>Run <code>node --import tsx verity/run.ts --task my-task</code>, or open this dashboard locally and select your new task. Missing checks are marked UNCERTAIN.</p></div></div><div className="guide-footer">VERIFIED = the check passed · FAILED = the check found a mismatch · UNCERTAIN = the requirement could not be confirmed.</div></section>}
          <footer>VERITY <span>·</span> REQUIREMENTS, CHECKED AGAINST CODE <span className="footer-right">Built with IBM Bob IDE</span></footer>
        </div>
      </main>
    </div>
  );
}
