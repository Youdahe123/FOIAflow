"use client";

import React, { useEffect, useState } from "react";
import { FileText, TrendingUp, AlertTriangle, Radio } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }}
         className="text-[9px] tracking-wide uppercase mt-1 mb-2">
        {cluster.itemCount === 1 ? "1 article indexed" : `${cluster.itemCount} articles indexed`} · {cluster.trendScore === "emerging" ? "Rising pattern" : "Stable pattern"}
      </p>
      <div className="flex gap-3 mb-2">
        <div className="text-center border border-ink/20 p-2">
          <div className="font-serif text-xl font-black text-ink leading-none">{cluster.itemCount}</div>
          <div className="font-sans text-[8px] tracking-widest uppercase text-muted mt-0.5">stories found</div>
        </div>
        <div className="text-center border border-ink/20 p-2">
          <div className="font-serif text-xl font-black text-ink leading-none">
            {cluster.daySpan === 0 ? "Today" : cluster.daySpan + "d ago"}
          </div>
          <div className="font-sans text-[8px] tracking-widest uppercase text-muted mt-0.5">last detected</div>
        </div>
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
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [liveClusters, setLiveClusters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [marketMeta, setMarketMeta] = useState<{ price: string; change: string; changePercent: string; positive: boolean } | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);

  const loadArticles = async () => {
    const { data, error } = await supabase
      .from("utr_clusters")
      .select("title, summary, source_url, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) console.error("[NewsFeed] Fetch error:", error);
    if (data) setArticles(data);
    setLoading(false);
  };

  const loadClusters = async () => {
    const { data, error } = await supabase
      .from("utr_clusters")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("[CLUSTERS] Fetch error:", error);
      return;
    }

    if (data) {
      const grouped: { [key: string]: any[] } = {};
      data.forEach((cluster) => {
        if (!grouped[cluster.category]) grouped[cluster.category] = [];
        grouped[cluster.category].push(cluster);
      });

      const clusters = Object.entries(grouped).map(([category, items]) => {
        const latest = new Date(items[0].created_at);
        const oldest = new Date(items[items.length - 1].created_at);
        const daySpan = Math.ceil((latest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: category,
          label: `${category} ACTIVITY`,
          category,
          itemCount: items.length,
          daySpan: daySpan || 1,
          delta: `+${items.length} items`,
          source_url: items[0].source_url
        };
      });

      setLiveClusters(clusters.slice(0, 6));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data, error } = await supabase
      .from("utr_clusters")
      .select("*")
      .or(`title.ilike.%${searchQuery}%, summary.ilike.%${searchQuery}%`)
      .limit(20);
    
    if (error) console.error("[SEARCH] error:", error);
    if (data) setSearchResults(data);
    setSearching(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const loadMarketData = async () => {
    try {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=SPY&interval=5min&apikey=${process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY}&outputsize=compact`
      );
      const data = await res.json();
      const timeSeries = data["Time Series (5min)"];
      if (!timeSeries) {
        const note = data["Note"] ?? data["Information"] ?? null;
        const isRateLimit = note && note.includes("API");
        const now = new Date();
        const day = now.getUTCDay();
        const hour = now.getUTCHour();
        const isWeekend = day === 0 || day === 6;
        const isAfterHours = hour < 13 || hour >= 21;

        if (isWeekend) {
          setMarketMeta({ price: "—", change: "Market Closed", changePercent: "Weekend", positive: true });
        } else if (isAfterHours) {
          setMarketMeta({ price: "—", change: "After Hours", changePercent: "Opens 9:30AM EST", positive: true });
        } else if (isRateLimit) {
          setMarketMeta({ price: "—", change: "Rate Limited", changePercent: "25 calls/day max", positive: true });
        } else {
          setMarketMeta({ price: "—", change: "Unavailable", changePercent: "Try again later", positive: true });
        }
        setMarketLoading(false);
        return;
      }

      const entries = Object.entries(timeSeries)
        .slice(0, 30)
        .reverse()
        .map(([time, values]: [string, any]) => ({
          time: time.slice(11, 16),
          price: parseFloat(values["4. close"]),
        }));

      const latest = entries[entries.length - 1]?.price ?? 0;
      const earliest = entries[0]?.price ?? 0;
      const change = latest - earliest;
      const changePercent = ((change / earliest) * 100).toFixed(2);
      const positive = change >= 0;

      setMarketData(entries);
      setMarketMeta({
        price: latest.toFixed(2),
        change: (positive ? "+" : "") + change.toFixed(2),
        changePercent: (positive ? "+" : "") + changePercent + "%",
        positive,
      });
      setMarketLoading(false);
    } catch (err) {
      console.error("[MARKET] Fetch error:", err);
      setMarketLoading(false);
    }
  };

  const runScout = async () => {
    setScanning(true);
    await fetch("/api/scout", { method: "POST" });
    await loadArticles();
    setScanning(false);
  };

  const findSimilarStories = (article: any, allArticles: any[]) => {
    const stopWords = new Set(['the','and','for','that','this','with','from','have','been','were','they','their','into','about','which','when','will','said','also','more','other','some','such','than','then','there','these','would','could','should','after','being','through']);
    const words = article.title
      .toLowerCase()
      .split(' ')
      .filter((w: string) => w.length > 4 && !stopWords.has(w));
    return allArticles.filter((a: any) => {
      if (a.id === article.id || a.title === article.title) return false;
      const matchCount = words.filter((w: string) => 
        a.title.toLowerCase().includes(w)
      ).length;
      return matchCount >= 2;
    }).slice(0, 2);
  };

  useEffect(() => {
    setMounted(true);
    loadArticles();
    loadClusters();
    loadMarketData();
  }, []);

  if (loading) return <div className="text-ink p-12 font-serif text-xl">INITIALIZING...</div>

  if (articles.length === 0) return (
    <div className="text-ink p-12 font-serif text-xl text-center">
      NO CLUSTERS DETECTED.
      <button onClick={runScout} className="block mx-auto mt-4 bg-accent text-white px-6 py-2 font-sans text-sm">
        RUN SCOUT NOW
      </button>
    </div>
  )

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

        {/* QUOTE */}
        <p 
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#000000" }} 
          className="text-[11px] font-bold tracking-[0.15em] uppercase text-center mb-3 opacity-70"
        >
          Real-time monitoring of local government datasets provides the only true shield against institutional drift.
        </p>

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
            {articles.length} Clusters Active &nbsp;·&nbsp; {articles.length} Items Indexed &nbsp;·&nbsp; System Status: MONITORING
          </span>
        </div>

        {/* MAIN 2-COL GRID */}
        <div className="grid grid-cols-[1fr_280px] gap-0 divide-x-2 divide-[#1a1a1a">

          {/* COL 1: Main Feed */}
          <main className="px-6">
            {/* SEARCH BAR */}
            {!searchResults.length && (
              <div className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Search by keyword, topic, location, or outlet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  className="flex-1 px-3 py-2 border-2 border-[#1a1a1a] text-[11px] font-bold tracking-widest uppercase focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#e31212" }}
                  className="px-4 py-2 text-white text-[10px] font-black tracking-[0.2em] uppercase hover:bg-[#c10e0e] transition-colors disabled:opacity-50"
                >
                  {searching ? "SEARCHING..." : "SEARCH"}
                </button>
              </div>
            )}

            {/* SEARCH RESULTS */}
            {searchResults.length > 0 && (
              <div className="mb-6 border-2 border-[#1a1a1a] p-4">
                <div className="flex items-center justify-between mb-4">
                  <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[10px] font-black tracking-[0.2em] uppercase">
                    {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </span>
                  <button
                    onClick={clearSearch}
                    style={{ fontFamily: "'DM Sans', sans-serif", color: "#e31212" }}
                    className="text-[11px] font-black tracking-widest uppercase hover:underline"
                  >
                    CLEAR
                  </button>
                </div>
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <article key={result.id} className="border-b border-[#1a1a1a] pb-3 last:border-b-0">
                      <div className="flex items-start gap-2 mb-1">
                        <span style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: "#1a1a1a", color: "#f4f4f2" }} className="text-[8px] font-black px-1.5 py-0.5 tracking-widest uppercase">
                          {result.category}
                        </span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[9px] font-black tracking-widest uppercase">
                          {new Date(result.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }} className="text-lg font-bold leading-tight">
                        {result.source_url ? (
                          <a href={result.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }} className="hover:underline">
                            {result.title}
                          </a>
                        ) : (
                          result.title
                        )}
                      </h4>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <SectionLabel accent>Latest Emerging Clusters</SectionLabel>

            {/* LEAD STORY */}
            {articles.length > 0 && (() => {
              const lead = articles[0];
              return (
                <article className="border-b-2 border-[#1a1a1a] py-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#e31212" }} className="text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e31212] animate-pulse" /> DEVELOPING
                    </span>
                  </div>
                  <h2
                    style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }}
                    className="text-[2.6rem] font-black leading-[1.05] tracking-tight mb-3"
                  >
                    {lead.source_url ? (
                      <a href={lead.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                        {lead.title}
                      </a>
                    ) : (
                      lead.title
                    )}
                  </h2>
                  <p style={{ fontFamily: "'EB Garamond', serif", color: "#1a1a1a" }} className="text-[1.05rem] leading-relaxed mb-4">
                    {lead.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[10px] font-black tracking-widest uppercase">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <FoiaButton />
                  </div>
                </article>
              );
            })()}

            {/* 2-COL SECONDARY */}
            {articles.length > 1 && (
              <div className="grid grid-cols-2 divide-x-2 divide-[#1a1a1a] border-b-2 border-[#1a1a1a]">
                {articles.slice(1, 3).map((item, i) => (
                  <article key={item.title} className={`py-4 ${i === 0 ? "pr-5" : "pl-5"}`}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }} className="text-[1.35rem] font-black leading-tight mb-2">
                      {item.source_url ? (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </h3>
                    <p style={{ fontFamily: "'EB Garamond', serif", color: "#1a1a1a" }} className="text-sm leading-snug mb-3">{item.summary}</p>
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[10px] font-black tracking-widest uppercase">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <FoiaButton />
                    </div>
                    {(() => {
                      const similar = findSimilarStories(item, articles);
                      if (similar.length === 0) return null;
                      return (
                        <div 
                          className="mt-2 border-l-2 pl-2"
                          style={{ borderColor: "#e31212" }}
                        >
                          <span 
                            style={{ fontFamily: "'DM Sans', sans-serif", color: "#e31212" }} 
                            className="text-[9px] font-black tracking-widest uppercase flex items-center gap-1"
                          >
                            ◆ PATTERN DETECTED — {similar.length} related story{similar.length > 1 ? 'ies' : ''} in feed
                          </span>
                          {similar.map((s: any) => (
                            <p 
                              key={s.source_url} 
                              style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }}
                              className="text-[9px] truncate mt-0.5"
                            >
                              → {s.title}
                            </p>
                          ))}
                        </div>
                      );
                    })()}
                  </article>
                ))}
              </div>
            )}

            {/* BRIEFS */}
            {articles.length > 3 && (
              <div className="mt-0">
                <SectionLabel>Dispatches</SectionLabel>
                {articles.slice(3).map((item, i) => (
                  <article key={item.title} className={`py-2.5 flex items-start justify-between gap-4 ${i < articles.length - 4 ? "border-b border-[#1a1a1a]" : ""}`}>
                    <div className="flex-1">
                      <h4 style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }} className="text-[1.05rem] font-bold leading-snug inline">
                        {item.source_url ? (
                          <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                            {item.title}
                          </a>
                        ) : (
                          item.title
                        )}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }} className="text-[9px] font-black tracking-widest uppercase">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {(() => {
                        const similar = findSimilarStories(item, articles);
                        if (similar.length === 0) return null;
                        return (
                          <div 
                            className="mt-2 border-l-2 pl-2"
                            style={{ borderColor: "#e31212" }}
                          >
                            <span 
                              style={{ fontFamily: "'DM Sans', sans-serif", color: "#e31212" }} 
                              className="text-[9px] font-black tracking-widest uppercase flex items-center gap-1"
                            >
                              ◆ PATTERN DETECTED — {similar.length} related story{similar.length > 1 ? 'ies' : ''} in feed
                            </span>
                            {similar.map((s: any) => (
                              <p 
                                key={s.source_url} 
                                style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }}
                                className="text-[9px] truncate mt-0.5"
                              >
                                → {s.title}
                              </p>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <FoiaButton />
                  </article>
                ))}
              </div>
            )}
          </main>

          {/* COL 2: Cluster Rail */}
          <aside className="pl-5">
            <SectionLabel>Trend Clusters</SectionLabel>
            <div className="pt-2">
              {liveClusters.map((c) => <ClusterCard key={c.id} cluster={c} />)}
            </div>

            <div className="mt-6 border-t-2 border-ink pt-4">
              <div className="border-b border-ink mb-3 pb-1">
                <span
                  style={{ fontFamily: "'DM Sans', sans-serif", color: "#1a1a1a" }}
                  className="text-[10px] font-black tracking-[0.2em] uppercase"
                >
                  S&P 500 · SPY · 15-MIN DELAY
                </span>
              </div>

              {marketLoading ? (
                <div
                  style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }}
                  className="text-[10px] tracking-widest uppercase py-4 text-center"
                >
                  LOADING MARKET DATA...
                </div>
              ) : !marketMeta ? (
                <div
                  style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }}
                  className="text-[10px] tracking-widest uppercase py-4 text-center"
                >
                  MARKET DATA UNAVAILABLE
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <div
                        style={{ fontFamily: "'Playfair Display', serif", color: "#1a1a1a" }}
                        className="text-2xl font-black leading-none"
                      >
                        ${marketMeta.price}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          color: marketMeta.positive ? "#16a34a" : "#e31212",
                        }}
                        className="text-[11px] font-black tracking-widest uppercase mt-1"
                      >
                        {marketMeta.change} ({marketMeta.changePercent})
                      </div>
                    </div>
                    <div
                      style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }}
                      className="text-[9px] tracking-widest uppercase text-right"
                    >
                      {marketMeta.positive ? "▲ ADVANCING" : "▼ DECLINING"}
                    </div>
                  </div>

                  <div className="relative w-full h-24">
                    <svg
                      viewBox={`0 0 ${marketData.length * 8} 80`}
                      preserveAspectRatio="none"
                      className="w-full h-full"
                    >
                      {(() => {
                        const prices = marketData.map(d => d.price);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        const range = max - min || 1;
                        const points = marketData
                          .map((d, i) => `${i * 8},${80 - ((d.price - min) / range) * 70}`)
                          .join(" ");
                        const fillPoints = `0,80 ${points} ${(marketData.length - 1) * 8},80`;
                        const lineColor = marketMeta.positive ? "#16a34a" : "#e31212";
                        return (
                          <>
                            <polyline
                              points={fillPoints}
                              fill={marketMeta.positive ? "rgba(22,163,74,0.1)" : "rgba(227,18,18,0.1)"}
                              stroke="none"
                            />
                            <polyline
                              points={points}
                              fill="none"
                              stroke={lineColor}
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  <div className="flex justify-between mt-1">
                    <span
                      style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }}
                      className="text-[8px] tracking-widest uppercase"
                    >
                      {marketData[0]?.time}
                    </span>
                    <span
                      style={{ fontFamily: "'DM Sans', sans-serif", color: "#5a5a5a" }}
                      className="text-[8px] tracking-widest uppercase"
                    >
                      {marketData[marketData.length - 1]?.time}
                    </span>
                  </div>
                </>
              )}
            </div>
          </aside>

        </div>
      </div>

      {/* STICKY TICKER FOOTER */}
      <NewsTicker mounted={mounted} />
    </div>
  );
}