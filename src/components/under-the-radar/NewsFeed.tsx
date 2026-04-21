import React from 'react';

const NewsFeed = () => {
  return (
    <div className="min-h-screen bg-newsprint text-ink font-serif p-8">
      {/* Masthead: High-institutional nameplate energy */}
      <header className="border-b-4 border-ink pb-4 mb-8">
        <h1 className="text-center text-6xl font-bold tracking-tighter uppercase">
          Snowden
        </h1>
        <div className="flex justify-between mt-2 font-sans text-xs uppercase tracking-widest border-t border-ink pt-2">
          <span>Under-The-Radar News Engine</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Column: Emerging Clusters */}
        <div className="md:col-span-2 border-r border-rule pr-8">
          <h2 className="headline-lg mb-6 border-b border-rule pb-2">Emerging Clusters</h2>
          
          {/* Example Cluster Card */}
          <div className="border-l-4 border-accent pl-4 mb-10">
            <h3 className="headline-md mb-2">Water Rights & Privatization</h3>
            <p className="font-sans text-muted mb-4">
              11 jurisdictions flagged across 3 states. Detecting rapid legislative movement in county board agendas.
            </p>
            <button className="bg-accent text-white px-4 py-1 text-xs font-sans uppercase tracking-tighter">
              File FOIA →
            </button>
          </div>
        </div>

        {/* Right Rail: Trend Ticker */}
        <div className="font-sans">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-rule pb-2 mb-4">
            Trend Ticker
          </h2>
          <ul className="space-y-4 text-sm">
            <li className="flex justify-between border-b border-dotted border-rule pb-1">
              <span>Zoning Variance</span>
              <span className="text-accent">+12%</span>
            </li>
            <li className="flex justify-between border-b border-dotted border-rule pb-1">
              <span>Police Contracts</span>
              <span className="text-accent">+8%</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NewsFeed;