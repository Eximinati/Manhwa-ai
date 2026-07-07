import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Shield, Lock } from "lucide-react";

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/upload";

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");

      sessionStorage.setItem(
        "auth_redirect",
        JSON.stringify({
          pathname: location.state?.from?.pathname || "/upload",
          search: location.state?.from?.search || "",
          state: location.state?.from?.state || null,
        })
      );

      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { data, error } = await signInWithGoogle(redirectUrl);

      if (error) throw error;
    } catch (err) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="relative mt-10 z-10 w-full max-w-md">
        <div className="backdrop-blur-2xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-md font-semibold text-purple-400/80">
              Sign in to Manhwa AI for free
            </p>
          </div>

          <div className="space-y-5">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-transparent border border-gray-400/50 hover:bg-white/10 text-white font-semibold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              <div className="text-sm text-red-300 bg-red-500/20 backdrop-blur-sm p-3 rounded-lg border border-red-400/30 text-center">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-7 space-y-2">
          <div className="flex items-center mb-5 justify-center gap-2 text-sm text-gray-400">
            <Lock className="w-4 h-4" />
            <span>Secured by</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-300/50">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
              OAuth 2.0
            </span>
            <span className="text-gray-300/40">•</span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z" />
              </svg>
              256-bit Encryption
            </span>
            <span className="text-gray-300/40">•</span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
              GDPR Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;