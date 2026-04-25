"use client";

import React, { useEffect, useState } from "react";
import { FileText, TrendingUp, AlertTriangle, Radio } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type TrendScore = "emerging" | "active";

interface Cluster {
  id: string;
  label: string;
  jurisdictionCount: number;
  itemCount: number;
  daySpan: number;
  trendScore: TrendScore;
  tag: string;
  delta: string;
}

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  jurisdiction: string;
  date: string;
  summary?: string;
  tag: string;
  isBreaking?: boolean;
  source_url?: string;
}

interface Investigator {
  id: string;
  codename: string;
  focus: string;
  datasets: string[];
  alertCount: number;
}

// ── Static Data ───────────────────────────────────────────────────────────────

const INVESTIGATORS: Investigator[] = [
  {
    id: "inv-1",
    codename: "CARDINAL",
    focus: "Municipal Land Use & Water Rights",
    datasets: ["County Board Agendas", "PACER Filings", "State EPA Records"],
    alertCount: 14,
  },
  {
    id: "inv-2",
    codename: "SPECTER",
    focus: "Law Enforcement Technology Contracts",
    datasets: ["FCC Dockets", "DHS Procurement", "City Budget Amendments"],
    alertCount: 8,
  },
];

const CLUSTERS: Cluster[] = [
  { id: "c1", label: "Water Privatization Language", jurisdictionCount: 14, itemCount: 31, daySpan: 22, trendScore: "emerging", tag: "WATER RIGHTS", delta: "+6 this week" },
  { id: "c2", label: "Police Surveillance Contracts", jurisdictionCount: 8,  itemCount: 19, daySpan: 18, trendScore: "emerging", tag: "LAW ENFORCEMENT", delta: "+3 this week" },
  { id: "c3", label: "Rural Broadband Consolidation", jurisdictionCount: 17, itemCount: 12, daySpan: 42, trendScore: "active",   tag: "TELECOMMUNICATIONS", delta: "stable" },
  { id: "c4", label: "Curriculum Records Restrictions", jurisdictionCount: 11, itemCount: 24, daySpan: 61, trendScore: "active", tag: "EDUCATION", delta: "+1 this week" },
  { id: "c5", label: "Wildfire Exemption Reclassification", jurisdictionCount: 6, itemCount: 9, daySpan: 14, trendScore: "emerging", tag: "EMERGENCY MGMT", delta: "+4 this week" },
];

const LEAD: NewsItem = {
  id: "lead",
  headline: "Fourteen County Boards Approve Identical Water Privatization Language in Coordinated Push",
  source: "Municipal Record Monitor",
  jurisdiction: "Multi-State",
  date: "April 22, 2026",
  summary: "A coordinated legislative effort — largely unreported by national media — is advancing identical contract language across rural water districts in the Midwest and Southeast. Legal filings obtained through open records requests reveal the template language originated from a single K Street lobbying firm with ties to three private equity funds.",
  tag: "WATER RIGHTS",
  isBreaking: true,
  source_url: "https://example.com/lead-water-privatization",
};

const SECONDARY: NewsItem[] = [
  {
    id: "s1",
    headline: "Minneapolis City Council Defers Body Camera Retention Vote for Third Consecutive Month",
    source: "Twin Cities Municipal Watch",
    jurisdiction: "Hennepin County, MN",
    date: "April 20, 2026",
    summary: "Council members cite 'ongoing vendor negotiations' but no contract has been disclosed publicly.",
    tag: "LAW ENFORCEMENT",
    source_url: "https://example.com/minneapolis-body-camera",
  },
  {
    id: "s2",
    headline: "FCC Docket 26-117: Seventeen Rural Broadband Licenses Transferred to Single Holding Company",
    source: "Telecom Accountability Project",
    jurisdiction: "Federal",
    date: "April 19, 2026",
    summary: "The transfers, filed individually over six weeks, evaded the threshold requiring public comment periods.",
    tag: "TELECOMMUNICATIONS",
    source_url: "https://example.com/fcc-docket-26-117",
  },
];

const BRIEFS: NewsItem[] = [
  { id: "b1", headline: "Three Texas Counties Reclassify Wildfire Response Records as 'Homeland Security' Exempt", source: "TX Open Gov", jurisdiction: "TX", date: "Apr 21", tag: "EMERGENCY", source_url: "https://example.com/tx-wildfire-reclass" },
  { id: "b2", headline: "USDA Quietly Withdraws Proposed Rule on Concentrated Animal Feeding Operations Reporting", source: "Ag Policy Monitor", jurisdiction: "Federal", date: "Apr 20", tag: "AGRICULTURE", source_url: "https://example.com/usda-cafos" },
  { id: "b3", headline: "Port Authority of NY/NJ Files for Retroactive Exemption on $2.3B Infrastructure Contract", source: "NE Contracts Watch", jurisdiction: "NY/NJ", date: "Apr 19", tag: "INFRASTRUCTURE", source_url: "https://example.com/port-authority-exemption" },
  { id: "b4", headline: "Nevada Gaming Control Board Delays Release of Audit Finding for Eleventh Consecutive Month", source: "Silver State Records", jurisdiction: "NV", date: "Apr 18", tag: "GAMING", source_url: "https://example.com/nv-audit-delay" },
  { id: "b5", headline: "Ohio School Board Model Resolution Restricting Curriculum Records Adopted by 11 Districts", source: "Education Records Digest", jurisdiction: "Statewide, OH", date: "Apr 17", tag: "EDUCATION", source_url: "https://example.com/ohio-school-resolution" },
];

const TICKER_OUTLETS = [
  "THE NEW YORK TIMES", "REUTERS", "PROPUBLICA", "THE INTERCEPT",
  "AP NEWS", "THE GUARDIAN", "POLITICO", "AXIOS", "THE MARSHALL PROJECT",
  "NPR", "THE ATLANTIC", "BLOOMBERG LAW", "MUCKROCK", "OPENRECORDS.ORG",
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FoiaButton({ label = "FILE FOIA REQUEST" }: { label?: string }) {
  return (
    <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent text-newsprint font-sans text-[10px] font-black tracking-[0.15em] uppercase hover:bg-[#c10e0e] transition-colors">
      <FileText size={10} />
      {label}
    </button>
  );
}

function SectionLabel({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`border-b-2 ${accent ? "border-accent" : "border-ink"} mb-0`}>
      <span className={`inline-block font-sans text-[10px] font-black tracking-[0.2em] uppercase px-2 py-1 -mb-px ${accent ? "bg-accent text-newsprint" : "bg-ink text-newsprint"}`}>
        {children}
      </span>
    </div>
  );
}

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const isEmerging = cluster.trendScore === "emerging";
  return (
    <article className="border-b border-ink py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="font-sans text-[9px] font-black tracking-[0.2em] uppercase text-muted">{cluster.tag}</span>
        {isEmerging && (
          <span className="flex items-center gap-1 font-sans text-[9px] font-black tracking-widest uppercase text-accent">
            <TrendingUp size={9} /> EMERGING
          </span>
        )}
      </div>
      <h4 className="font-serif text-[1rem] font-bold leading-tight text-ink mb-2">{cluster.label}</h4>
      <div className="flex gap-3 mb-2">
        {[
          { val: cluster.jurisdictionCount, label: "jurisdictions" },
          { val: cluster.itemCount,         label: "items" },
          { val: `${cluster.daySpan}d`,     label: "span" },
        ].map(({ val, label }) => (
          <div key={label} className="text-center">
            <div className="font-serif text-xl font-black text-ink leading-none">{val}</div>
            <div className="font-sans text-[8px] tracking-widest uppercase text-muted">{label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="font-sans text-[9px] text-accent font-black">{cluster.delta}</span>
        <FoiaButton label="FOIA →" />
      </div>
    </article>
  );
}

function InvestigatorCard({ inv }: { inv: Investigator }) {
  return (
    <div className="border-b border-ink py-4">
      <div className="flex items-start justify-between mb-1">
        <span className="font-sans text-[9px] font-black tracking-[0.25em] uppercase text-muted">Agent</span>
        <span className="font-sans text-[9px] font-black bg-accent text-newsprint px-1.5 py-0.5">{inv.alertCount} ALERTS</span>
      </div>
      <h3 className="font-serif text-xl font-black text-ink mb-1">{inv.codename}</h3>
      <p className="font-sans text-[11px] font-bold text-muted mb-2 uppercase tracking-wide">{inv.focus}</p>
      <ul className="space-y-0.5 mb-3">
        {inv.datasets.map((d) => (
          <li key={d} className="font-sans text-[10px] text-ink flex items-center gap-1.5">
            <span className="w-1 h-1 bg-accent flex-shrink-0" />
            {d}
          </li>
        ))}
      </ul>
      <FoiaButton label="ACCESS LOGS →" />
    </div>
  );
}

function NewsTicker({ mounted }: { mounted: boolean }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-accent text-newsprint border-t-2 border-ink overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-ink text-newsprint px-4 py-2 flex items-center gap-2 z-10">
          <Radio size={12} className="text-accent" style={{ color: "#e31212" }} />
          <span className="font-sans text-[10px] font-black tracking-[0.2em] uppercase text-newsprint">Live Feed</span>
        </div>
        {mounted && (
          <div className="overflow-hidden flex-1">
            <div
              className="flex gap-12 whitespace-nowrap font-sans text-[10px] font-black tracking-[0.2em] uppercase py-2 px-6"
              style={{
                animation: "ticker 30s linear infinite",
              }}
            >
              {[...TICKER_OUTLETS, ...TICKER_OUTLETS].map((outlet, i) => (
                <span key={i} className="flex items-center gap-3">
                  <span className="text-newsprint">{outlet}</span>
                  <span className="text-newsprint/40">◆</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function NewsFeed() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const dateStr = mounted
    ? new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div
      className="min-h-screen pb-12"
      style={{
        backgroundColor: "#f4f4f2",
        color: "#1a1a1a",
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500;600;700;900&display=swap');
      `}</style>

      {/* TOP BAR */}
      <div style={{ backgroundColor: "#e31212" }} className="text-[#f4f4f2] py-2 px-6 flex justify-between items-center">
        <span style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-[10px] font-black tracking-[0.2em] uppercase">Investigation Engine v1.0</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-[10px] font-black tracking-[0.2em] uppercase hidden md:block">Internal Access Only // Classified Clusters</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-[10px] font-black tracking-[0.2em] uppercase">{dateStr}</span>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6">

        {/* MASTHEAD */}
        <header className="text-center mb-6 border-b-[3px] border-[#1a1a1a] pb-4">
          <h1
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#1a1a1a" }}
            className="text-[100px] leading-none font-black uppercase tracking-tighter"
          >
            SNOWDEN
          </h1>
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#1a1a1a" }} className="text-[10px] font-black tracking-[0.25em] uppercase whitespace-nowrap">
              Under-The-Radar News &amp; Emerging Domestic Clusters
            </p>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>
        </header>

        {/* ALERT BANNER */}
        <div style={{ backgroundColor: "#1a1a1a", color: "#f4f4f2" }} className="flex items-center gap-3 px-4 py-2.5 mb-6">
          <AlertTriangle size={14} style={{ color: "#e31212" }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-[10px] font-black tracking-[0.15em] uppercase">
            {CLUSTERS.filter(c => c.trendScore === "emerging").length} Emerging Clusters Active &nbsp;·&nbsp; {BRIEFS.length + SECONDARY.length + 1} Items Indexed Today &nbsp;·&nbsp; System Status: MONITORING
          </span>
        </div>

        {/* MAIN 12-COL GRID */}
        <div className="grid grid-cols-12 gap-0 divide-x-2 divide-[#1a1a1a]">

          {/* COL 1: Investigators */}
          <aside className="col-span-2 pr-5">
            <SectionLabel>The Investigators</SectionLabel>
            <div className="pt-3">
              {INVESTIGATORS.map((inv) => <InvestigatorCard key={inv.id} inv={inv} />)}
            </div>
          </aside>

          {/* COL 2: Main Feed */}
          <main className="col-span-7 px-6">
            <SectionLabel accent>Latest Emerging Clusters</SectionLabel>

            {/* LEAD STORY */}
            <article className="border-b-2 border-[#1a1a1a] py-5">
              <div className="flex items-center gap-3 mb-2">
                {LEAD.isBreaking && (
                  <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#e31212" }} className="text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e31212] animate-pulse" /> DEVELOPING
                  </span>
                )}
                <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[10px] font-black tracking-[0.2em] uppercase">{LEAD.tag}</span>
              </div>
              <h2
                style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }}
                className="text-[2.6rem] font-black leading-[1.05] tracking-tight mb-3"
              >
                {LEAD.source_url ? (
                  <a
                    href={LEAD.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {LEAD.headline}
                  </a>
                ) : (
                  LEAD.headline
                )}
              </h2>
              <p style={{ fontFamily: "'EB Garamond', serif", color: "#1a1a1a" }} className="text-[1.05rem] leading-relaxed mb-4">
                {LEAD.summary}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {[LEAD.source, LEAD.jurisdiction, LEAD.date].map((v, i) => (
                    <React.Fragment key={v}>
                      {i > 0 && <span className="text-[#5a5a5a]">·</span>}
                      {i === 0 && LEAD.source_url ? (
                        <a
                          href={LEAD.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a", textDecoration: "none" }}
                          className="text-[10px] font-black tracking-widest uppercase"
                        >
                          {v}
                        </a>
                      ) : (
                        <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[10px] font-black tracking-widest uppercase">{v}</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <FoiaButton />
              </div>
            </article>

            {/* 2-COL SECONDARY */}
            <div className="grid grid-cols-2 divide-x-2 divide-[#1a1a1a] border-b-2 border-[#1a1a1a]">
              {SECONDARY.map((item, i) => (
                <article key={item.id} className={`py-4 ${i === 0 ? "pr-5" : "pl-5"}`}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[10px] font-black tracking-[0.2em] uppercase block mb-1.5">{item.tag}</span>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }} className="text-[1.35rem] font-black leading-tight mb-2">
                    {item.source_url ? (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                        {item.headline}
                      </a>
                    ) : (
                      item.headline
                    )}
                  </h3>
                  <p style={{ fontFamily: "'EB Garamond', serif", color: "#1a1a1a" }} className="text-sm leading-snug mb-3">{item.summary}</p>
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[10px] font-black tracking-widest uppercase">{item.jurisdiction}</span>
                    <FoiaButton />
                  </div>
                </article>
              ))}
            </div>

            {/* BRIEFS */}
            <div className="mt-0">
              <SectionLabel>Dispatches</SectionLabel>
              {BRIEFS.map((item, i) => (
                <article key={item.id} className={`py-2.5 flex items-start justify-between gap-4 ${i < BRIEFS.length - 1 ? "border-b border-[#1a1a1a]" : ""}`}>
                  <div className="flex-1">
                    <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#e31212" }} className="text-[9px] font-black tracking-[0.2em] uppercase mr-2">{item.tag}</span>
                    <h4 style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }} className="text-[1.05rem] font-bold leading-snug inline">
                      {item.source_url ? (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                          {item.headline}
                        </a>
                      ) : (
                        item.headline
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[9px] font-black tracking-widest uppercase">{item.jurisdiction}</span>
                      <span className="text-[#5a5a5a]">·</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[9px] font-black tracking-widest uppercase">{item.date}</span>
                    </div>
                  </div>
                  <FoiaButton />
                </article>
              ))}
            </div>
          </main>

          {/* COL 3: Cluster Rail */}
          <aside className="col-span-3 pl-5">
            <SectionLabel>Trend Clusters</SectionLabel>
            <div className="pt-2">
              {CLUSTERS.map((c) => <ClusterCard key={c.id} cluster={c} />)}
            </div>

            {/* Quote box */}
            <div style={{ backgroundColor: "#1a1a1a" }} className="mt-6 p-4 border-l-4 border-[#e31212]">
              <p style={{ fontFamily: "'EB Garamond', serif", color: "#f4f4f2" }} className="text-[11px] italic leading-relaxed">
                "Real-time monitoring of local government datasets provides the only true shield against institutional drift."
              </p>
            </div>

            {/* Trend ticker sub-stats */}
            <div className="mt-6">
              <SectionLabel>Signal Strength</SectionLabel>
              {[
                { label: "Domestic / Land",    val: "+4.2%", hot: true },
                { label: "Muni / Surveillance", val: "+8.1%", hot: true },
                { label: "Public / Utility",    val: "+1.4%", hot: false },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center border-b border-[#1a1a1a] py-2">
                  <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#1a1a1a" }} className="text-[10px] font-black tracking-widest uppercase">{item.label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", color: item.hot ? "#e31212" : "#5a5a5a" }} className="text-[10px] font-black">{item.val}</span>
                </div>
              ))}
            </div>
          </aside>

        </div>
      </div>

      {/* STICKY TICKER FOOTER */}
      <NewsTicker mounted={mounted} />
    </div>
  );
}