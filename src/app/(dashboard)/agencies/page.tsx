"use client";

import { useState, useMemo } from "react";
import { Search as SearchIcon, Building2, MapPin, Scale, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// --- 1. GLOBAL TAXONOMY ---
const INDUSTRY_CATEGORIES = [
  "Government & Administration", "Law Enforcement & Justice", "Health & Human Services",
  "Education", "Finance & Commerce", "Transportation & Infrastructure",
  "Environment & Natural Resources", "Labor & Employment", "Housing & Community",
  "Agriculture & Food", "Public Safety & Defense", "Science & Technology",
  "Arts & Culture", "Regulatory & Licensing", "Social Services"
] as const;

const LEVELS = ["Federal", "State", "County", "City", "Special District"] as const;

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
] as const;

interface SnowdenAgency {
  id: string;
  name: string;
  level: typeof LEVELS[number];
  state: string;
  industry: typeof INDUSTRY_CATEGORIES[number];
  governing_law: string;
  law_citation: string;
  deadline_days: number;
  website?: string;
  email?: string;
}

// --- 2. MAIN COMPONENT ---
export default function AgenciesPage() {
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  // This will be replaced by your Supabase fetch later
  const [agencies] = useState<SnowdenAgency[]>([]); 

  const filteredAgencies = useMemo(() => {
    return agencies.filter((agency) => {
      const matchesSearch = search === "" || 
        agency.name.toLowerCase().includes(search.toLowerCase()) ||
        agency.law_citation.toLowerCase().includes(search.toLowerCase());
        
      const matchesState = selectedState === "All" || agency.state === selectedState;
      const matchesIndustry = selectedIndustry === "All" || agency.industry === selectedIndustry;
      const matchesLevel = selectedLevel === "All" || agency.level === selectedLevel;

      return matchesSearch && matchesState && matchesIndustry && matchesLevel;
    });
  }, [agencies, search, selectedState, selectedIndustry, selectedLevel]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Snowden</h1>
        <p className="text-muted-foreground">
          Nationwide investigative agency database. Search 30,000+ jurisdictions.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agencies, laws, or citations..."
              className="h-11 w-full border border-border bg-background pl-10 pr-4 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={selectedState} 
              onChange={(e) => setSelectedState(e.target.value)}
              className="h-11 border border-border bg-background px-3 text-sm rounded-lg outline-none hover:bg-accent transition-colors"
            >
              <option value="All">State (All)</option>
              {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>

            <select 
              value={selectedIndustry} 
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="h-11 border border-border bg-background px-3 text-sm rounded-lg outline-none hover:bg-accent transition-colors"
            >
              <option value="All">Industry (All)</option>
              {INDUSTRY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgencies.length > 0 ? (
          filteredAgencies.map((agency) => (
            <div key={agency.id} className="group bg-card border border-border p-5 rounded-xl hover:shadow-md hover:border-primary/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">
                  {agency.level}
                </span>
              </div>
              <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                {agency.name}
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> {agency.state}
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5" /> {agency.governing_law}
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> {agency.law_citation}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl">
            <p className="text-muted-foreground italic">No agencies found matching your search. Ready to seed the database?</p>
          </div>
        )}
      </div>
    </div>
  );
}