import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Watermark from "../components/Watermark";

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      sessionStorage.setItem("auth_redirect", JSON.stringify({
        pathname: location.state?.from?.pathname || "/upload",
        search: location.state?.from?.search || "",
        state: location.state?.from?.state || null,
      }));
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await signInWithGoogle(redirectUrl);
      if (error) throw error;
    } catch (err) {
      setError(err.message || "Failed to sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0A0A1A] relative overflow-hidden">
      <Watermark text="入口" sub="ENTRY" />
      {/* Speed lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[30%] left-0 w-[200%] h-px bg-gradient-to-r from-transparent via-[#FF006E]/8 to-transparent animate-speed-line" />
        <div className="absolute top-[60%] left-0 w-[200%] h-px bg-gradient-to-r from-transparent via-[#00F5D4]/8 to-transparent animate-speed-line" style={{ animationDelay: '1.2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="display text-5xl text-white tracking-wider">
            SIGN <span className="text-[#FF006E]">IN</span>
          </h1>
          <p className="font-body text-sm text-gray-500 mt-2">Access your collection</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-4 font-body font-semibold text-sm bg-white/5 border border-white/10 hover:border-[#FF006E]/50 hover:bg-[#FF006E]/5 text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? "Connecting..." : "Continue with Google"}
        </button>

        {error && (
          <div className="mt-4 font-body text-sm text-red-300 bg-red-500/10 border border-red-500/30 p-3 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
