import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Compass,
  Heart,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Utensils,
  WalletCards,
  X,
} from "lucide-react";

const missions = [
  { title: "Date night", note: "Make a memorable evening for two", icon: Heart, color: "coral" },
  { title: "Weekend adventure", note: "A fresh plan without the research", icon: Compass, color: "lime" },
  { title: "Birthday plan", note: "Bring the whole crew together", icon: Sparkles, color: "lavender" },
  { title: "Food crawl", note: "Follow the flavor trail", icon: Utensils, color: "gold" },
];

type PlannerResult = {
  id: string;
  status: "ready" | "limited";
  accessTier: "premium" | "limited";
  title: string;
  totalCents: number;
  items: Array<{ startTime: string; title: string; place: string; detail: string; costCents: number; link: string | null }>;
  agent: { status: string; premiumEligible: boolean; note: string };
  payment: { status: string; amountCents: number; token: string; transactionHash: string | null; liveTransaction: boolean; attributionTag: string };
};

function TrustReceipt({ plan }: { plan: PlannerResult }) {
  const [open, setOpen] = useState(false);
  const verified = plan.agent.premiumEligible;
  const paymentLabel = plan.payment.liveTransaction
    ? `${(plan.payment.amountCents / 100).toFixed(2)} ${plan.payment.token} · settled on Celo`
    : plan.payment.status === "skipped"
      ? "Premium payment skipped"
      : `${(plan.payment.amountCents / 100).toFixed(2)} ${plan.payment.token} · demo receipt`;

  return (
    <div className="trust-receipt">
      <button className="trust-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="trust-icon"><ShieldCheck size={18} /></span>
        <span className="trust-copy"><strong>{verified ? "Human-backed agent" : "Limited agent access"}</strong><small>{verified ? "Private identity · proof fresh" : "Premium details are locked"}</small></span>
        <span className="trust-status"><span className="status-dot" /> {verified ? "Verified" : "Limited"}</span>
        <ChevronDown size={17} className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <div className="trust-details">
          <div><span>Self Agent ID</span><strong>{plan.agent.status}</strong></div>
          <div><span>Payment</span><strong>{paymentLabel}</strong></div>
          <div><span>Your identity</span><strong>Never shared</strong></div>
          <div><span>Receipt</span><code>{plan.payment.transactionHash ?? "Not issued"}</code></div>
          <div><span>Attribution</span><code>{plan.payment.attributionTag}</code></div>
        </div>
      )}
    </div>
  );
}

function Planner() {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState("Lagos");
  const [budget, setBudget] = useState(60);
  const [vibe, setVibe] = useState("Relaxed & memorable");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [plan, setPlan] = useState<PlannerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createPlanMutation = trpc.plans.create.useMutation();
  const refinePlanMutation = trpc.plans.refine.useMutation();

  const startPlanning = () => {
    setLoading(true);
    setError(null);
    createPlanMutation.mutate({
      mission: "date_night",
      location,
      dateTime: "Saturday 18:30",
      budgetCents: budget * 100,
      vibe,
    }, {
      onSuccess: (result) => {
        setPlan(result);
        setLoading(false);
        setDone(true);
      },
      onError: (cause) => {
        setLoading(false);
        setError(cause.message || "We couldn't build that plan. Try again.");
      },
    });
  };

  if (done && plan) {
    const resultIcons = [MapPin, Utensils, Ticket];
    const resultTones = ["lime", "coral", "lavender"];
    return (
      <main className="planner-shell result-shell">
        <div className="result-topline"><span className="eyebrow"><span className="status-dot" /> {plan.status === "ready" ? "Plan ready" : "Limited plan ready"}</span><Link href="/">Start over</Link></div>
        <section className="result-header">
          <div><p className="eyebrow">Saturday · {location} · 2 people</p><h1>{plan.title}</h1><p>{plan.agent.premiumEligible ? "We found a relaxed evening with good food, a view, and just enough room for a spontaneous encore." : "We found a gentle first step. Verify the agent to unlock the richer live recommendations."}</p></div>
          <div className="total-card"><span>Estimated total</span><strong>${(plan.totalCents / 100).toFixed(0)}</strong><small>within your ${budget} budget</small></div>
        </section>
        <div className="result-grid">
          <section className="itinerary-card">
            <div className="card-heading"><div><span className="eyebrow">Your plan</span><h2>{plan.title}</h2></div><button className="icon-button" aria-label="Share plan"><ArrowRight size={18} /></button></div>
            <div className="timeline">{plan.items.map((item, index) => { const Icon = resultIcons[index % resultIcons.length]; return <div className="timeline-item" key={`${item.startTime}-${item.title}`}><div className="timeline-time">{item.startTime}</div><div className={`timeline-pin ${resultTones[index % resultTones.length]}`}><Icon size={17} /></div><div className="timeline-content"><div className="timeline-title"><div><h3>{item.title}</h3><span>{item.place}</span></div><strong>${(item.costCents / 100).toFixed(0)}</strong></div><p>{item.detail}</p><button className="text-action">Swap this stop <ArrowRight size={14} /></button></div></div>; })}</div>
            <div className="plan-actions"><button className="secondary-button" disabled={refinePlanMutation.isPending} onClick={() => refinePlanMutation.mutate({ id: plan.id, change: "cheaper" }, { onSuccess: (next) => next && setPlan(next) })}>Make it cheaper</button><button className="secondary-button" disabled={refinePlanMutation.isPending} onClick={() => refinePlanMutation.mutate({ id: plan.id, change: "exciting" }, { onSuccess: (next) => next && setPlan(next) })}>Make it more exciting</button></div>
          </section>
          <aside className="result-side"><TrustReceipt plan={plan} /><div className="side-card"><span className="eyebrow">Your preferences</span><div className="preference"><MapPin size={16} /><span>{location}</span></div><div className="preference"><CircleDollarSign size={16} /><span>Under ${budget} per person</span></div><div className="preference"><Sparkles size={16} /><span>{vibe}</span></div><button className="outline-button">Edit preferences</button></div></aside>
        </div>
      </main>
    );
  }

  return (
    <main className="planner-shell">
      <div className="planner-topline"><Link href="/" className="brand brand-small"><span className="brand-mark"><Sparkles size={15} /></span>PlanPal</Link><span className="step-count">Step {step} of 3</span><button className="close-button" onClick={() => window.history.back()}><X size={19} /></button></div>
      <div className="planner-progress"><span className={step >= 1 ? "active" : ""} /><span className={step >= 2 ? "active" : ""} /><span className={step >= 3 ? "active" : ""} /></div>
      <section className="planner-card">
        {!loading ? <>
          {step === 1 && <div className="form-step"><span className="step-icon lime"><MapPin size={24} /></span><p className="eyebrow">First, set the scene</p><h1>Where should the good times happen?</h1><p className="step-copy">We’ll look for places that fit your moment, not just a list of places.</p><label>City or neighborhood<div className="input-wrap"><Search size={19} /><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos, Lekki" autoFocus /></div></label><button className="primary-button" onClick={() => setStep(2)}>Continue <ArrowRight size={18} /></button></div>}
          {step === 2 && <div className="form-step"><span className="step-icon coral"><CalendarDays size={24} /></span><p className="eyebrow">Make it yours</p><h1>What kind of evening are you picturing?</h1><p className="step-copy">No need to decide everything. We’ll fill in the thoughtful details.</p><label>What’s the vibe?<div className="chip-row">{["Relaxed & memorable", "Playful & social", "Low-key & cozy"].map((item) => <button className={`choice-chip ${vibe === item ? "selected" : ""}`} key={item} onClick={() => setVibe(item)}>{vibe === item && <Check size={15} />}{item}</button>)}</div></label><button className="primary-button" onClick={() => setStep(3)}>Continue <ArrowRight size={18} /></button></div>}
          {step === 3 && <div className="form-step"><span className="step-icon lavender"><WalletCards size={24} /></span><p className="eyebrow">One last thing</p><h1>What should we keep it under?</h1><p className="step-copy">PlanPal will keep every suggestion inside your comfort zone.</p><label>Budget per person<div className="budget-display"><strong>${budget}</strong><span>USD</span></div><input className="budget-range" type="range" min="25" max="150" step="5" value={budget} onChange={(e) => setBudget(Number(e.target.value))} /><div className="range-labels"><span>$25</span><span>$150</span></div></label><button className="primary-button" onClick={startPlanning}>Build my plan <Sparkles size={18} /></button></div>}
        </> : <div className="loading-step"><div className="loading-orb"><Sparkles size={26} /></div><p className="eyebrow">PlanPal is working</p><h1>Finding the right kind of <em>memorable.</em></h1><div className="activity-list"><div><Check size={16} /> Understanding your request</div><div><Check size={16} /> Searching live recommendations</div><div className="current"><span className="loading-dot" /> Checking your budget</div><div className="muted-activity">Building your itinerary</div></div></div>}
        {error && <p className="planner-error" role="alert">{error}</p>}
      </section>
      {!loading && <p className="privacy-note"><ShieldCheck size={15} /> Your preferences stay private. PlanPal only pays for the live details it needs.</p>}
    </main>
  );
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isPlanner = location === "/app";
  const featured = useMemo(() => missions.slice(0, 3), []);

  if (isPlanner) return <Planner />;

  return (
    <div className="site-shell">
      <header className="site-header"><Link href="/" className="brand"><span className="brand-mark"><Sparkles size={16} /></span><span>PlanPal</span></Link><nav className={menuOpen ? "open" : ""}><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="#missions" onClick={() => setMenuOpen(false)}>Explore missions</a><a href="#trust" onClick={() => setMenuOpen(false)}>Why verified?</a><Link href="/docs">Docs</Link></nav><div className="header-actions"><Link href="/app" className="header-cta">Create a plan <ArrowRight size={16} /></Link><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div></header>
      <main>
        <section className="hero-section"><div className="hero-copy"><div className="eyebrow-pill"><span className="pulse-dot" /> Your human-backed AI concierge</div><h1>Plans worth <em>leaving the house for.</em></h1><p>Tell PlanPal what you’re in the mood for. It researches the live details, keeps an eye on your budget, and turns a small idea into a great day.</p><div className="hero-actions"><Link href="/app" className="primary-button">Create a plan <ArrowRight size={18} /></Link><a href="#how-it-works" className="text-link">See how it works <ChevronDown size={17} /></a></div><div className="hero-note"><ShieldCheck size={16} /><span>Private by design</span><span className="note-separator" /><span>Payments on Celo</span></div></div><div className="hero-visual"><div className="visual-scribble">good<br /><span>ideas</span></div><div className="sample-plan"><div className="sample-top"><span className="eyebrow">Saturday date night</span><span className="sample-status"><span className="status-dot" /> Live</span></div><h3>Golden hour to goodnight</h3><div className="sample-meta"><span><MapPin size={14} /> Lagos</span><span><CircleDollarSign size={14} /> $54 total</span></div><div className="sample-line"><span className="sample-time">18:30</span><div className="sample-marker lime"><MapPin size={15} /></div><div><strong>Sunset walk</strong><small>Tarkwa Bay viewpoint</small></div></div><div className="sample-line"><span className="sample-time">20:00</span><div className="sample-marker coral"><Utensils size={15} /></div><div><strong>Dinner with a view</strong><small>The Yellow Chilli</small></div></div><div className="sample-line"><span className="sample-time">21:45</span><div className="sample-marker lavender"><Ticket size={15} /></div><div><strong>Live music</strong><small>The Harvest</small></div></div><div className="sample-footer"><span><BadgeCheck size={16} /> Human-backed</span><span>Built by PlanPal</span></div></div><div className="floating-sticker sticker-top"><Sparkles size={18} /><span>made for<br />real life</span></div><div className="floating-sticker sticker-bottom"><Heart size={17} fill="currentColor" /><span>good vibes<br />guaranteed</span></div></div></section>
        <section className="mission-section" id="missions"><div className="section-heading"><div><p className="eyebrow">Start with a feeling</p><h2>What are we planning?</h2></div><Link href="/app" className="text-link">View all missions <ArrowRight size={16} /></Link></div><div className="mission-grid">{featured.map((mission) => { const Icon = mission.icon; return <Link href="/app" className={`mission-card ${mission.color}`} key={mission.title}><div className="mission-icon"><Icon size={22} /></div><div><h3>{mission.title}</h3><p>{mission.note}</p></div><ArrowRight className="mission-arrow" size={19} /></Link>; })}</div></section>
        <section className="how-section" id="how-it-works"><div className="how-intro"><p className="eyebrow">The quiet magic behind it</p><h2>A little less searching.<br /><em>A lot more doing.</em></h2><p>PlanPal handles the fiddly parts so you can stay in the moment. Even the technical bits are designed to feel human.</p><Link href="/docs" className="outline-button">Explore the docs <ArrowRight size={16} /></Link></div><div className="steps-list"><div className="how-step"><span>01</span><div><h3>You share the idea</h3><p>A few words, a budget, and the kind of energy you want.</p></div></div><div className="how-step"><span>02</span><div><h3>PlanPal checks live details</h3><p>Your agent pays for only the premium information it needs.</p></div></div><div className="how-step"><span>03</span><div><h3>You get a plan you’ll use</h3><p>A thoughtful itinerary with options, costs, and room to change your mind.</p></div></div></div></section>
        <section className="trust-section" id="trust"><div className="trust-art"><div className="trust-orbit orbit-one" /><div className="trust-orbit orbit-two" /><div className="trust-badge"><ShieldCheck size={31} /><span>Private<br />identity</span></div><div className="trust-spark spark-one">✦</div><div className="trust-spark spark-two">✦</div></div><div className="trust-copy-large"><p className="eyebrow">Built for a world of agents</p><h2>Payment proves it happened.<br /><em>Self proves who’s behind it.</em></h2><p>PlanPal uses Self Agent ID to show that a real person stands behind the agent, without revealing who they are. Payments settle on Celo, and your identity stays yours.</p><div className="trust-points"><span><Check size={15} /> Human-backed</span><span><Check size={15} /> Privacy-first</span><span><Check size={15} /> Celo settled</span></div></div></section>
      </main>
      <footer className="site-footer"><Link href="/" className="brand"><span className="brand-mark"><Sparkles size={15} /></span>PlanPal</Link><span>Plans worth leaving the house for.</span><div><Link href="/docs">Documentation</Link><a href="https://docs.self.xyz/docs/agent-id/overview/" target="_blank" rel="noreferrer">Self Agent ID</a></div></footer>
    </div>
  );
}
