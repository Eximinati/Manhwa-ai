import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkTaskStatus, listUserJobs } from "../api/api";
import { Film, Loader2, Clock, AlertCircle, ChevronRight } from "lucide-react";

const Library = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUserJobs(user.id);
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const colors = {
      QUEUED: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      PROCESSING: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      SUCCESS: "bg-green-500/20 text-green-300 border-green-500/30",
      FAILED: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs border ${colors[status] || "bg-gray-500/20 text-gray-300"}`}>
        {status}
      </span>
    );
  };

  const loadJob = async (job) => {
    if (job.status === "SUCCESS") {
      const statusData = await checkTaskStatus(job.id);
      let result = statusData.result;
      if (typeof result === "string" && result.startsWith("http")) {
        const resp = await fetch(result);
        result = await resp.json();
      }
      sessionStorage.setItem("pendingStory", JSON.stringify(result));
      sessionStorage.setItem("pendingFileName", job.manga_name || "manga");
      navigate("/upload");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-gray-400">
          <p className="text-lg">Sign in to view your library</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Film className="w-6 h-6 text-purple-400" />
          My Library
        </h1>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="text-sm text-purple-300 hover:text-white underline disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 rounded-xl border border-red-500/30 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">No generations yet</p>
          <button
            onClick={() => navigate("/upload")}
            className="mt-4 px-6 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
          >
            Create your first video
          </button>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => loadJob(job)}
            className="flex items-center gap-4 p-4 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition-all cursor-pointer group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold truncate">{job.manga_name || "Untitled"}</p>
                {statusBadge(job.status)}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {job.created_at ? new Date(job.created_at).toLocaleDateString() : "—"}
                </span>
                {job.reading_direction && (
                  <span>{job.reading_direction.replace("-", " → ")}</span>
                )}
                {job.manga_language && <span>{job.manga_language}</span>}
              </div>
            </div>
            {job.status === "SUCCESS" && (
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </main>
  );
};

export default Library;
