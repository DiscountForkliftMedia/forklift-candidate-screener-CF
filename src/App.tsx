import { useEffect, useMemo, useState } from "react";
import { CheckCircle, AlertCircle, LogOut, BookOpen } from "lucide-react";
import type { Candidate, InterviewEvent, PipelineStats, Stage } from "./types";
import { STAGES } from "./types";
import { api } from "./api";
import { useAuth } from "./auth";
import StatTiles from "./components/StatTiles";
import UploadResume from "./components/UploadResume";
import ApplicantsList from "./components/ApplicantsList";
import CandidateDetail from "./components/CandidateDetail";
import OwnerPanel from "./components/OwnerPanel";
import TrifectaPanel from "./components/TrifectaPanel";
import SchedulingPanel from "./components/SchedulingPanel";

const EMPTY_STATS: PipelineStats = {
  "Resume Screen": 0,
  "Phone Screen": 0,
  "In-Person": 0,
  "Sales Director": 0,
  "Final Decision": 0,
};

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<PipelineStats>(EMPTY_STATS);
  const [events, setEvents] = useState<InterviewEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loadingList, setLoadingList] = useState(true);

  const [locationFilter, setLocationFilter] = useState("mine");
  const [sort, setSort] = useState("score-desc");
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);

  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const uploadLocation = user?.locations?.[0] || "Denver";

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const reloadCandidates = async (selectFirst = false) => {
    setLoadingList(true);
    try {
      const [list, s] = await Promise.all([api.listCandidates(), api.stats()]);
      setCandidates(list);
      setStats(s);
      if (selectFirst && list.length > 0 && !list.some((c) => c.id === selectedId)) {
        // Open on the strongest candidate by default.
        const top = [...list].sort((a, b) => b.score - a.score)[0];
        setSelectedId(top.id);
      }
    } catch (e: any) {
      showToast(e?.message || "Failed to load candidates.", "error");
    } finally {
      setLoadingList(false);
    }
  };

  // Initial load once the (cosmetic) user is known.
  useEffect(() => {
    if (!authLoading) reloadCandidates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Load events for the selected candidate.
  useEffect(() => {
    if (!selectedId) {
      setEvents([]);
      return;
    }
    let active = true;
    api
      .listEvents(selectedId)
      .then((ev) => active && setEvents(ev))
      .catch(() => active && setEvents([]));
    return () => {
      active = false;
    };
  }, [selectedId]);

  const handleCreated = async (created: Candidate) => {
    await reloadCandidates();
    setSelectedId(created.id);
    showToast(
      `Analyzed ${created.fullName} — score ${created.score}. ${
        created.isQualified ? "Above the hiring line." : "Below the auto-decline threshold."
      }`,
    );
  };

  const applyUpdated = (updated: Candidate) => {
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const patchCandidate = async (
    id: string,
    patch: Partial<Pick<Candidate, "stage" | "status" | "ownerManager" | "location" | "notes">>,
  ) => {
    try {
      const updated = await api.updateCandidate(id, patch);
      applyUpdated(updated);
      if (patch.stage) setStats(await api.stats());
    } catch (e: any) {
      showToast(e?.message || "Update failed.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCandidate(id);
      const remaining = candidates.filter((c) => c.id !== id);
      setCandidates(remaining);
      setStats(await api.stats());
      if (selectedId === id) setSelectedId(remaining[0]?.id || "");
      showToast("Candidate removed.", "error");
    } catch (e: any) {
      showToast(e?.message || "Delete failed.", "error");
    }
  };

  const handleTouch = async (id: string) => {
    try {
      applyUpdated(await api.touchCandidate(id));
    } catch {
      /* non-critical */
    }
  };

  const handleSchedule = async (payload: Partial<InterviewEvent>) => {
    const created = await api.createEvent(payload);
    setEvents((prev) => [...prev, created].sort((a, b) => a.datetime.localeCompare(b.datetime)));
  };

  const toggleEvent = async (id: string, completed: boolean) => {
    const updated = await api.updateEvent(id, { completed });
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
  };

  const removeEvent = async (id: string) => {
    await api.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const filtered = useMemo(() => {
    let list = candidates;
    if (locationFilter === "mine") {
      const mine = user?.locations || [];
      list = list.filter((c) => mine.includes(c.location));
    } else if (locationFilter !== "all") {
      list = list.filter((c) => c.location === locationFilter);
    }
    if (stageFilter) list = list.filter((c) => c.stage === stageFilter);

    const sorted = [...list];
    if (sort === "score-desc") sorted.sort((a, b) => b.score - a.score);
    else if (sort === "score-asc") sorted.sort((a, b) => a.score - b.score);
    else sorted.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    return sorted;
  }, [candidates, locationFilter, stageFilter, sort, user]);

  const activeCandidate = candidates.find((c) => c.id === selectedId) || null;

  return (
    <div className="min-h-screen px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* ---- Header ---- */}
        <header className="panel grid-texture relative overflow-hidden">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(110deg, rgba(13,46,40,0.85), rgba(8,12,16,0.4) 55%, rgba(40,12,52,0.45))",
            }}
          />
          <div className="flex flex-col gap-5 p-5 md:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-teal-300">
                Discount Forklift
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
                Sales Candidate Screener
              </h1>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                <span>
                  Signed in as <span className="text-slate-200">{user?.email || "…"}</span>
                  {user?.role ? ` / ${user.role}` : ""}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 rounded border border-white/10 bg-black/30 px-2 py-1 font-semibold text-slate-300 transition-colors hover:border-teal-400/40 hover:text-white cursor-pointer"
                >
                  <LogOut className="h-3 w-3" /> Sign out
                </button>
              </div>
            </div>

            <div className="lg:w-[640px]">
              <StatTiles
                stats={stats}
                active={stageFilter}
                onSelect={(s) => setStageFilter((prev) => (prev === s ? null : s))}
              />
            </div>
          </div>
        </header>

        {/* ---- Toast ---- */}
        {toast && (
          <div
            className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-sm font-semibold animate-slideIn ${
              toast.type === "success"
                ? "border-emerald-700/50 bg-emerald-950/40 text-emerald-200"
                : "border-rose-700/50 bg-rose-950/40 text-rose-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            {toast.text}
          </div>
        )}

        {/* ---- Main grid ---- */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left column */}
          <div className="space-y-5 lg:col-span-3">
            <UploadResume
              uploadLocation={uploadLocation}
              onCreated={handleCreated}
              onError={(m) => showToast(m, "error")}
            />

            <div className="panel p-5">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-white">
                Your Access
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {user?.role || "Sales Manager"} access can work candidate follow-up, notes,
                schedules, and scorecards.
              </p>
              <p className="mt-3 text-xs font-semibold text-teal-300">
                Locations: {(user?.locations || ["Denver"]).join(", ")}
              </p>
            </div>

            <ApplicantsList
              candidates={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              locationFilter={locationFilter}
              onLocationFilter={setLocationFilter}
              sort={sort}
              onSort={setSort}
              onRefresh={() => reloadCandidates()}
              onShowAll={() => {
                setLocationFilter("all");
                setStageFilter(null);
              }}
              loading={loadingList}
            />
          </div>

          {/* Center column */}
          <div className="lg:col-span-6">
            {activeCandidate ? (
              <CandidateDetail
                candidate={activeCandidate}
                onPatch={(patch) => patchCandidate(activeCandidate.id, patch)}
                onDelete={() => handleDelete(activeCandidate.id)}
              />
            ) : (
              <div className="panel flex min-h-[420px] flex-col items-center justify-center p-12 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-slate-600" />
                <h3 className="font-display text-base font-bold text-white">No candidate selected</h3>
                <p className="mt-2 max-w-sm text-xs text-slate-400">
                  Upload a resume on the left or pick an applicant from the pipeline to see their
                  scorecard, flags, and interview questions.
                </p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5 lg:col-span-3">
            {activeCandidate ? (
              <>
                <OwnerPanel
                  candidate={activeCandidate}
                  onPatch={(patch) => patchCandidate(activeCandidate.id, patch)}
                />
                <TrifectaPanel candidate={activeCandidate} onTouch={() => handleTouch(activeCandidate.id)} />
                <SchedulingPanel
                  candidate={activeCandidate}
                  events={events}
                  onSchedule={handleSchedule}
                  onToggleEvent={toggleEvent}
                  onDeleteEvent={removeEvent}
                  onToast={showToast}
                />
              </>
            ) : (
              <div className="panel p-6 text-center text-xs text-slate-500">
                Select a candidate to manage ownership, outreach, and scheduling.
              </div>
            )}
          </div>
        </div>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-5 text-[11px] text-slate-500 md:flex-row">
          <p>© 2026 Discount Forklift Recruitment Operations.</p>
          <p className="rounded border border-white/8 bg-black/30 px-2 py-0.5 font-mono">
            Cloudflare Workers + D1 · React SPA
          </p>
        </footer>
      </div>
    </div>
  );
}
