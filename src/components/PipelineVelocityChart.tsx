import React, { useState } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar
} from "recharts";
import { TrendingUp, Award, Clock, Users, ShieldAlert } from "lucide-react";
import { Candidate } from "../types";

interface PipelineVelocityChartProps {
  candidates: Candidate[];
}

type ChartViewMode = "cumulative" | "daily" | "qualification";

interface ChartDataPoint {
  dateStr: string;
  label: string;
  // Status stages (grouped)
  "Screened": number;
  "Phone Prep": number;
  "Lots & Demos": number;
  "Hired": number;
  "Not Fit / Left": number;
  // Risk and recommendations
  "AI Recommended": number;
  "High Risk Profiles": number;
  // Totals
  "Daily Admissions": number;
  "Cumulative Total": number;
}

export default function PipelineVelocityChart({ candidates }: PipelineVelocityChartProps) {
  const [viewMode, setViewMode] = useState<ChartViewMode>("cumulative");

  // Generate 30 days timeline ending 'today' (reference is June 18, 2026 as per local time)
  const generateChartData = (): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const today = new Date("2026-06-18T12:00:00Z"); // Fix point in time to align perfectly with user container context

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

      data.push({
        dateStr,
        label,
        "Screened": 0,
        "Phone Prep": 0,
        "Lots & Demos": 0,
        "Hired": 0,
        "Not Fit / Left": 0,
        "AI Recommended": 0,
        "High Risk Profiles": 0,
        "Daily Admissions": 0,
        "Cumulative Total": 0,
      });
    }

    // Populate counts
    data.forEach((point) => {
      // 1. Daily Added
      const dailyCandidates = candidates.filter((c) => {
        try {
          const cDate = new Date(c.dateAdded);
          const year = cDate.getUTCFullYear();
          const month = String(cDate.getUTCMonth() + 1).padStart(2, "0");
          const day = String(cDate.getUTCDate()).padStart(2, "0");
          return `${year}-${month}-${day}` === point.dateStr;
        } catch {
          return false;
        }
      });

      point["Daily Admissions"] = dailyCandidates.length;

      // 2. Cumulative Added up to this day
      const cumulativeCandidates = candidates.filter((c) => {
        try {
          const cDate = new Date(c.dateAdded);
          const year = cDate.getUTCFullYear();
          const month = String(cDate.getUTCMonth() + 1).padStart(2, "0");
          const day = String(cDate.getUTCDate()).padStart(2, "0");
          return `${year}-${month}-${day}` <= point.dateStr;
        } catch {
          return false;
        }
      });

      point["Cumulative Total"] = cumulativeCandidates.length;

      cumulativeCandidates.forEach((c) => {
        // Group by status stages
        if (c.status === "Screened") {
          point["Screened"]++;
        } else if (c.status === "Phone Scheduled" || c.status === "Phone Completed") {
          point["Phone Prep"]++;
        } else if (c.status === "In-Person Scheduled" || c.status === "In-Person Completed") {
          point["Lots & Demos"]++;
        } else if (c.status === "Hired") {
          point["Hired"]++;
        } else if (c.status === "Not Fit") {
          point["Not Fit / Left"]++;
        }

        // Split by recommended rating
        if (c.isQualified) {
          point["AI Recommended"]++;
        } else {
          point["High Risk Profiles"]++;
        }
      });
    });

    return data;
  };

  const chartData = generateChartData();

  // Helper calculating trend stats
  const last7DaysData = chartData.slice(-7);
  const totalAdmittedLast7Days = last7DaysData.reduce((sum, d) => sum + d["Daily Admissions"], 0);

  return (
    <div className="bg-[#14161C] rounded-xl border border-gray-800 shadow-sm p-5 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
              Pipeline Velocity Tracker
              {totalAdmittedLast7Days > 0 && (
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 py-0.5 px-2 rounded-full border border-emerald-500/10 animate-pulse font-mono">
                  +{totalAdmittedLast7Days} New This Week
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400">Chronological analysis of applicants advancing through evaluation stages</p>
          </div>
        </div>

        {/* View Mode Switcher buttons */}
        <div className="flex bg-[#1C1F26] p-1 rounded-lg border border-gray-800 self-start md:self-auto">
          <button
            onClick={() => setViewMode("cumulative")}
            className={`text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer ${
              viewMode === "cumulative"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Cumulative Stages
          </button>
          <button
            onClick={() => setViewMode("daily")}
            className={`text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer ${
              viewMode === "daily"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Admissions Flow
          </button>
          <button
            onClick={() => setViewMode("qualification")}
            className={`text-xs font-semibold px-3 py-1.5 rounded transition-all cursor-pointer ${
              viewMode === "qualification"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            AI Assessment Split
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-64 h-md-72 w-full">
        {viewMode === "cumulative" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScreened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPhone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLots" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNotFit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={8}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#1c1f26", 
                  borderColor: "#374151", 
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#fff"
                }}
                labelStyle={{ fontWeight: "bold", color: "#f59e0b", marginBottom: "4px" }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px", color: "#9ca3af" }}
              />
              <Area 
                type="monotone" 
                dataKey="Screened" 
                stroke="#94a3b8" 
                fillOpacity={1} 
                fill="url(#colorScreened)" 
                strokeWidth={1.5}
                stackId="1" 
              />
              <Area 
                type="monotone" 
                dataKey="Phone Prep" 
                stroke="#38bdf8" 
                fillOpacity={1} 
                fill="url(#colorPhone)" 
                strokeWidth={1.5}
                stackId="1" 
              />
              <Area 
                type="monotone" 
                dataKey="Lots & Demos" 
                stroke="#f59e0b" 
                fillOpacity={1} 
                fill="url(#colorLots)" 
                strokeWidth={1.5}
                stackId="1" 
              />
              <Area 
                type="monotone" 
                dataKey="Hired" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorHired)" 
                strokeWidth={1.5}
                stackId="1" 
              />
              <Area 
                type="monotone" 
                dataKey="Not Fit / Left" 
                stroke="#f43f5e" 
                fillOpacity={1} 
                fill="url(#colorNotFit)" 
                strokeWidth={1.5}
                stackId="1" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : viewMode === "daily" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={8}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#1c1f26", 
                  borderColor: "#374151", 
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#fff"
                }}
                labelStyle={{ fontWeight: "bold", color: "#f59e0b" }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="rect" 
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
              />
              <Bar 
                dataKey="Daily Admissions" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={8}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#1c1f26", 
                  borderColor: "#374151", 
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#fff"
                }}
                labelStyle={{ fontWeight: "bold", color: "#f59e0b", marginBottom: "4px" }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", paddingTop: "12px", color: "#9ca3af" }}
              />
              <Area 
                type="monotone" 
                dataKey="AI Recommended" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorRec)" 
                strokeWidth={1.5}
                stackId="2"
              />
              <Area 
                type="monotone" 
                dataKey="High Risk Profiles" 
                stroke="#f43f5e" 
                fillOpacity={1} 
                fill="url(#colorRisk)" 
                strokeWidth={1.5}
                stackId="2"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
