import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkTaskStatus, listUserJobs } from "../api/api";
import { Loader2 } from "lucide-react";
import Watermark from "../components/Watermark";

const statusBadge = (status) => {
  const map = {
    SUCCESS: { label: "Complete", color: "text-[#00F5D4]" },
    PROCESSING: { label: "Processing", color: "text-[#FFD60A]" },
    QUEUED: { label: "Queued", color: "text-gray-500" },
    FAILED: { label: "Failed", color: "text-red-400" },
  };
  const s = map[status] || { label: status, color: "text-gray-500" };
  return <span className={`font-body text-xs ${s.color}`}>{s.label}</span>;
};

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true); setError(null);
    try { const data = await listUserJobs(user.id); setJobs(data.jobs || []); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const loadJob = async (job) => {
    if (job.status !== "SUCCESS") return;
    try {
      const statusData = await checkTaskStatus(job.id);
      let result = statusData.result;
      if (typeof result === "string" && result.startsWith("http")) {
        const resp = await fetch(result);
        result = await resp.json();
      }
      sessionStorage.setItem("pendingStory", JSON.stringify(result));
      sessionStorage.setItem("pendingFileName", job.manga_name || "manga");
      navigate("/upload");
    } catch (err) { console.error(err); }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A1A]">
        <div className="text-center">
          <p className="display text-2xl text-white">COLLECTION</p>
          <p className="font-body text-sm text-gray-500 mt-2">Sign in to view</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A1A] text-white px-6 py-16 relative">
      <Watermark text="集積" sub="COLLECTION" />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="magazine-kicker">Library</span>
            <h1 className="display text-5xl sm:text-6xl text-white mt-1">Collection</h1>
          </div>
          <button onClick={fetchJobs} disabled={loading}
            className="font-body text-xs text-gray-500 hover:text-white transition-colors disabled:opacity-50">
            Refresh
          </button>
        </div>

        {loading && <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#FF006E] mx-auto" /></div>}
        {error && <div className="font-body text-sm text-red-300 bg-red-500/10 border border-red-500/30 p-4 mb-6">{error}</div>}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-20">
            <p className="display text-3xl text-gray-600 mb-2">Empty</p>
            <p className="font-body text-sm text-gray-600 mb-6">No videos generated yet</p>
            <button onClick={() => navigate("/upload")}
              className="px-8 py-3 display text-sm tracking-wider bg-[#FF006E] text-white hover:bg-[#FF006E]/80 transition-all">
              Create One
            </button>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/10">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => loadJob(job)}
                className={`bg-[#0A0A1A] p-6 text-left group transition-all ${
                  job.status === "SUCCESS" ? "hover:bg-[#1A1A2E]" : "opacity-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  {statusBadge(job.status)}
                  {job.created_at && (
                    <span className="font-body text-[10px] text-gray-600">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h3 className="display text-lg tracking-wider text-white mb-2 truncate">
                  {job.manga_name || "Untitled"}
                </h3>
                <div className="flex items-center gap-2">
                  {job.manga_language && (
                    <span className="font-body text-[10px] text-gray-500 uppercase tracking-wider">{job.manga_language}</span>
                  )}
                  {job.reading_direction && (
                    <span className="font-body text-[10px] text-gray-600">{job.reading_direction.split("-").join(" → ")}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Library;
