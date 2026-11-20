import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Code2, Copy, LockKeyhole, Menu, ShieldCheck, Sparkles, WalletCards, X } from "lucide-react";

const sections = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "how-it-works", label: "How it works", icon: ChevronRight },
  { id: "features", label: "Features", icon: Check },
  { id: "architecture", label: "Architecture", icon: Code2 },
  { id: "getting-started", label: "Getting started", icon: BookOpen },
  { id: "api", label: "API reference", icon: Code2 },
  { id: "faq", label: "FAQ", icon: ShieldCheck },
];

const endpointRows = [
  ["POST", "/api/plans", "Create a new plan from a user request."],
  ["GET", "/api/plans/:id", "Read an itinerary and its payment receipt."],
  ["POST", "/api/plans/:id/refine", "Change the budget, vibe, or one stop."],
  ["GET", "/api/agent/status", "Read Self Agent ID proof status."],
  ["GET", "/api/payments/:id", "Read x402 settlement status."],
];

export default function Docs() {
  const [location] = useLocation();
  const initial = location === "/docs/api" ? "api" : "overview";
  const [active, setActive] = useState(initial);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = useMemo(() => sections.find((section) => section.id === active) ?? sections[0], [active]);

  const goTo = (id: string) => {
    setActive(id);
    setMobileOpen(false);
    window.history.replaceState({}, "", id === "api" ? "/docs/api" : "/docs");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="docs-shell">
      <header className="docs-header"><Link href="/" className="brand"><span className="brand-mark"><Sparkles size={16} /></span>PlanPal</Link><div className="docs-header-center"><span className="docs-kicker">PlanPal docs</span><span className="docs-divider" />{current.label}</div><div className="docs-header-actions"><Link href="/app" className="header-cta">Try PlanPal <ArrowRight size={15} /></Link><button className="menu-button docs-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle docs navigation">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button></div></header>
      <div className="docs-layout">
        <aside className={`docs-sidebar ${mobileOpen ? "open" : ""}`}><div className="docs-sidebar-top"><Link href="/" className="back-link"><ArrowLeft size={15} /> Back to PlanPal</Link><p className="docs-sidebar-title">Build with confidence.</p></div><nav>{sections.map((section) => { const Icon = section.icon; return <button key={section.id} className={active === section.id ? "active" : ""} onClick={() => goTo(section.id)}><Icon size={15} />{section.label}{active === section.id && <ChevronRight size={14} className="sidebar-chevron" />}</button>; })}</nav><div className="docs-sidebar-foot"><div className="docs-status"><span className="status-dot" /> Mainnet-ready foundation</div><small>Self Agent ID · x402 · Celo</small></div></aside>
        <main className="docs-content"><section className="docs-hero" id="overview"><span className="eyebrow-pill"><BookOpen size={13} /> Product guide</span><h1>Build plans people<br /><em>actually use.</em></h1><p>PlanPal is a human-backed AI concierge that turns a few words into a real-world plan. This guide explains the product, the trust layer, and the payment flow underneath it.</p><div className="docs-hero-actions"><Link href="/app" className="primary-button">Try the planner <ArrowRight size={17} /></Link><a href="#architecture" className="text-link">Jump to architecture <ChevronRight size={16} /></a></div></section>
          <section className="docs-section" id="how-it-works"><div className="docs-section-label">01 · How it works</div><div className="docs-section-copy"><h2>A small idea becomes a <em>good plan.</em></h2><p>The surface is simple. PlanPal takes care of the live research, policy checks, and per-request payment so the user can focus on what they want to do.</p><div className="docs-steps"><div><span>01</span><h3>Share the feeling</h3><p>Location, budget, time, and the kind of energy you want.</p></div><div><span>02</span><h3>PlanPal researches</h3><p>The agent checks live recommendations and only pays for premium details it needs.</p></div><div><span>03</span><h3>Explore the result</h3><p>A usable timeline with prices, links, and easy ways to change your mind.</p></div></div></div></section>
          <section className="docs-section" id="features"><div className="docs-section-label">02 · Features</div><div className="docs-section-copy"><h2>Useful first. <em>Technical second.</em></h2><p>Every infrastructure feature has a human benefit. The UI keeps the complex parts close at hand without putting them in the way.</p><div className="feature-list"><div><span className="feature-icon lime"><Sparkles size={18} /></span><div><h3>AI planning</h3><p>Turn a natural-language request into a thoughtful, budget-aware itinerary.</p></div></div><div><span className="feature-icon coral"><WalletCards size={18} /></span><div><h3>Pay per useful detail</h3><p>x402 lets the agent pay for live information one request at a time.</p></div></div><div><span className="feature-icon lavender"><ShieldCheck size={18} /></span><div><h3>Human-backed access</h3><p>Self Agent ID decides whether premium recommendations are available.</p></div></div></div></div></section>
          <section className="docs-section" id="architecture"><div className="docs-section-label">03 · Architecture</div><div className="docs-section-copy"><h2>Trust and payment,<br /><em>working together.</em></h2><p>Self answers “who is behind the agent?” x402 answers “did it pay?” PlanPal’s policy engine connects those two decisions to a useful service.</p><div className="architecture-diagram"><div className="arch-node user-node"><span>01</span><strong>User</strong><small>Idea + budget</small></div><div className="arch-arrow"><ArrowRight size={17} /></div><div className="arch-node plan-node"><span>02</span><strong>PlanPal</strong><small>Orchestrator + policy</small></div><div className="arch-arrow"><ArrowRight size={17} /></div><div className="arch-stack"><div className="arch-node self-node"><LockKeyhole size={15} /><strong>Self Agent ID</strong><small>Human proof</small></div><div className="arch-node x402-node"><WalletCards size={15} /><strong>x402 / Celo</strong><small>Payment receipt</small></div></div></div></div></section>
          <section className="docs-section" id="getting-started"><div className="docs-section-label">04 · Getting started</div><div className="docs-section-copy"><h2>From zero to <em>first plan.</em></h2><p>PlanPal’s local foundation is ready for the integration work. Keep live transactions disabled until the dedicated wallet and attribution wiring are reviewed.</p><div className="code-block"><div className="code-top"><span>terminal</span><button aria-label="Copy setup command"><Copy size={14} /></button></div><pre><code>pnpm install{`\n`}pnpm dev{`\n`}{`# live Celo transactions stay disabled by default`}</code></pre></div><div className="note-card"><ShieldCheck size={17} /><div><strong>Privacy by design</strong><p>Self proof status is visible; passport data and personal identity documents are never stored by PlanPal.</p></div></div></div></section>
          <section className="docs-section api-section" id="api"><div className="docs-section-label">05 · API reference</div><div className="docs-section-copy"><h2>Small endpoints,<br /><em>clear contracts.</em></h2><p>The first API surface stays focused on the planning job. Authentication and payment details are kept server-side.</p><div className="endpoint-table">{endpointRows.map(([method, path, description]) => <div className="endpoint-row" key={path}><span className={`method ${method.toLowerCase()}`}>{method}</span><code>{path}</code><span>{description}</span><ChevronRight size={15} /></div>)}</div></div></section>
          <section className="docs-section faq-section" id="faq"><div className="docs-section-label">06 · FAQ</div><div className="docs-section-copy"><h2>Good questions<br /><em>deserve clear answers.</em></h2><div className="faq-list"><details open><summary>Does PlanPal see my identity?</summary><p>No. Self Agent ID proves that a real person stands behind the agent without giving PlanPal the person’s passport or identity document.</p></details><details><summary>What is x402?</summary><p>x402 is an HTTP-native payment flow. A paid service returns a price, the agent signs a stablecoin authorization, and the request is retried with payment attached.</p></details><details><summary>Why does verification matter?</summary><p>Premium live services can choose to serve only fresh, human-backed agents, helping reduce bot abuse and making autonomous payments more accountable.</p></details></div></div></section>
          <footer className="docs-footer"><Link href="/" className="brand"><span className="brand-mark"><Sparkles size={15} /></span>PlanPal</Link><span>Plans worth leaving the house for.</span></footer>
        </main>
      </div>
    </div>
  );
}
