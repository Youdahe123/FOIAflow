"use client";
import React from 'react';
const NewsFeed = () => {
  return (
    <div className="min-h-screen bg-newsprint text-ink font-serif selection:bg-accent selection:text-white">
      {/* TOP STRIP: The 'Small Print' Institutional Header */}
      <div className="border-b border-ink py-2 px-6 flex justify-between items-center text-[10px] uppercase tracking-[0.2em] font-sans font-bold">
        <span>Investigation Engine v1.0</span>
        <span className="hidden md:block text-accent">Internal Access Only // Classified Clusters</span>
        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* MASTHEAD: The 'Snowden' Nameplate */}
        <header className="text-center mb-12">
          <h1 className="text-[120px] leading-none font-bold uppercase tracking-tighter border-b-4 border-ink pb-4">
            Snowden
          </h1>
          <p className="mt-4 font-sans text-xs uppercase tracking-[0.3em] font-medium italic">
            Under-The-Radar News & Emerging Domestic Clusters
          </p>
        </header>

        {/* MAIN LAYOUT: 3-Column Broadsheet */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* COLUMN 1: The 'Voices' Rail (Refined) */}
          <aside className="md:col-span-3 border-r border-rule pr-6">
            <h2 className="text-sm font-bold uppercase border-b-2 border-ink mb-6 pb-1">The Investigators</h2>
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="w-full aspect-square bg-gray-200 grayscale contrast-125 mb-3 border border-ink" />
                  <h3 className="text-xl font-bold italic group-hover:text-accent transition-colors">Analyst 0{i}</h3>
                  <p className="text-xs leading-relaxed mt-2 font-sans text-muted">
                    Tracking municipal software procurement across the Tri-State area.
                  </p>
                </div>
              ))}
            </div>
          </aside>

          {/* COLUMN 2: The Main Feed (High Density) */}
          <main className="md:col-span-6 border-r border-rule pr-6">
            <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-accent mb-4">Latest Emerging Clusters</h2>
            
            <article className="mb-12 border-b border-rule pb-12">
              <h3 className="text-5xl font-bold leading-[0.95] tracking-tight mb-4 hover:text-accent transition-colors cursor-pointer">
                Water Rights Privatization: 11 Jurisdictions Flagged.
              </h3>
              <p className="text-lg leading-snug mb-6 text-gray-800">
                Detecting rapid legislative movement in county board agendas. Analysis shows 14% increase in 'emergency' land-use amendments.
              </p>
              <button className="border-2 border-ink px-4 py-2 text-xs font-sans font-bold uppercase hover:bg-accent hover:text-white hover:border-accent transition-all">
                Access FOIA Logs →
              </button>
            </article>

            <div className="grid grid-cols-2 gap-6">
               <article>
                 <h4 className="text-2xl font-bold leading-tight mb-2">Zoning Surges</h4>
                 <p className="text-sm font-sans text-muted">A 12% uptick in commercial-to-private rezoning requests.</p>
               </article>
               <article>
                 <h4 className="text-2xl font-bold leading-tight mb-2">Police Tech</h4>
                 <span className="text-[10px] bg-accent text-white px-2 py-0.5 font-sans font-bold uppercase">Critical</span>
                 <p className="text-sm font-sans text-muted mt-2">New surveillance contracts identified in rural districts.</p>
               </article>
            </div>
          </main>

          {/* COLUMN 3: The Ticker / Data Sidebar */}
          <aside className="md:col-span-3">
            <h2 className="text-sm font-bold uppercase border-b-2 border-ink mb-6 pb-1">Cluster Ticker</h2>
            <div className="space-y-4 font-sans text-xs">
              <div className="flex justify-between border-b border-rule pb-2">
                <span className="font-bold">DOMESTIC/LAND</span>
                <span className="text-accent">+4.2%</span>
              </div>
              <div className="flex justify-between border-b border-rule pb-2">
                <span className="font-bold">MUNI/SURVEILLANCE</span>
                <span className="text-accent">+8.1%</span>
              </div>
              <div className="flex justify-between border-b border-rule pb-2">
                <span className="font-bold">PUBLIC/UTILITY</span>
                <span className="text-accent">+1.4%</span>
              </div>
            </div>
            
            <div className="mt-12 p-4 bg-ink text-newsprint">
              <p className="text-[10px] leading-tight font-sans italic">
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