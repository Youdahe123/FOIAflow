"use client";

import React, { useEffect, useState } from 'react';

const NewsFeed = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-newsprint text-ink font-serif selection:bg-accent selection:text-white">
      {/* TOP STRIP: Heavy Red Institutional Bar */}
      <div className="border-b-2 border-ink bg-accent text-white py-2 px-6 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-sans font-black">
        <span>Investigation Engine v1.0</span>
        <span className="hidden md:block">Internal Access Only // Classified Clusters</span>
        <span>
          {mounted 
            ? new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
            : "INITIALIZING..."}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* MASTHEAD */}
        <header className="text-center mb-12">
          <h1 className="text-[120px] leading-none font-bold uppercase tracking-tighter border-b-[12px] border-ink pb-4">
            Snowden
          </h1>
          <p className="mt-4 font-sans text-xs uppercase tracking-[0.3em] font-black italic text-ink">
            Under-The-Radar News & Emerging Domestic Clusters
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* COLUMN 1: The Investigators */}
          <aside className="md:col-span-3 border-r-2 border-ink pr-6">
            <h2 className="text-sm font-black uppercase border-b-2 border-ink mb-6 pb-1 text-ink">The Investigators</h2>
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="w-full aspect-square bg-ink/10 grayscale contrast-150 mb-3 border-2 border-ink group-hover:border-accent transition-colors" />
                  <h3 className="text-xl font-bold italic text-ink group-hover:text-accent underline decoration-2 underline-offset-4">Analyst 0{i}</h3>
                  <p className="text-xs leading-relaxed mt-2 font-sans text-ink font-bold opacity-90">
                    Monitoring high-frequency municipal datasets for legislative anomalies.
                  </p>
                </div>
              ))}
            </div>
          </aside>

          {/* COLUMN 2: The Main Feed */}
          <main className="md:col-span-6 border-r-2 border-ink pr-6">
            {/* FIXED FONT/OPACITY HERE */}
            <h2 className="text-xs font-sans font-black uppercase tracking-widest text-accent border-b-2 border-accent mb-6 pb-1 inline-block">
              Latest Emerging Clusters
            </h2>
            
            <article className="mb-12 border-b-2 border-ink pb-12">
              <h3 className="text-5xl font-bold leading-[0.95] tracking-tight mb-4 text-ink hover:text-accent transition-colors cursor-pointer">
                Water Rights Privatization: 11 Jurisdictions Flagged.
              </h3>
              <p className="text-lg leading-snug mb-6 text-ink font-bold">
                Detecting rapid legislative movement in county board agendas. Analysis shows 14% increase in 'emergency' land-use amendments.
              </p>
              <button className="bg-ink text-newsprint px-6 py-3 text-xs font-sans font-black uppercase hover:bg-accent transition-all">
                Access FOIA Logs →
              </button>
            </article>

            <div className="grid grid-cols-2 gap-8">
               <article>
                 <h4 className="text-2xl font-bold leading-tight mb-2 text-ink">Zoning Surges</h4>
                 <p className="text-sm font-sans text-ink font-bold">A 12% uptick in commercial-to-private rezoning requests.</p>
               </article>
               <article>
                 <h4 className="text-2xl font-bold leading-tight mb-2 text-ink">Police Tech</h4>
                 {/* FIXED CRITICAL ALERT VISIBILITY */}
                 <span className="text-[10px] bg-accent text-white px-2 py-1 font-sans font-black uppercase tracking-tighter">
                   Critical Alert
                 </span>
                 <p className="text-sm font-sans text-ink font-bold mt-2">New surveillance contracts identified in rural districts.</p>
               </article>
            </div>
          </main>

          {/* COLUMN 3: The Ticker */}
          <aside className="md:col-span-3">
            <h2 className="text-sm font-black uppercase border-b-2 border-ink mb-6 pb-1 text-ink">Trend Ticker</h2>
            <div className="space-y-4 font-sans text-xs">
              {[
                { label: "Domestic/Land", val: "+4.2%" },
                { label: "Muni/Surveillance", val: "+8.1%" },
                { label: "Public/Utility", val: "+1.4%" }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between border-b-2 border-ink/20 pb-2">
                  <span className="font-black text-ink uppercase tracking-tighter">{item.label}</span>
                  <span className="text-accent font-black">{item.val}</span>
                </div>
              ))}
            </div>
            
            {/* The Quote Box: High Contrast Red Border */}
            <div className="mt-12 p-5 bg-ink text-newsprint border-l-[6px] border-accent">
              <p className="text-[11px] leading-tight font-sans italic font-black uppercase tracking-wider">
                "Real-time monitoring of local government datasets provides the only true shield against institutional drift."
              </p>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default NewsFeed;