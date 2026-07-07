import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User, Sparkles, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Upload", path: "/upload" },
  { name: "Library", path: "/library" },
  { name: "Docs", path: "/docs" },
  { name: "Contact", path: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleLogout = async () => {
    sessionStorage.removeItem("pendingStory");
    sessionStorage.removeItem("pendingFileName");
    await logout();
    navigate("/");
  };

  return (
    <>
      {/* Desktop: floating pill */}
      <nav
        className={`hidden md:flex fixed top-0 left-0 right-0 z-50 justify-center pt-4 transition-all duration-500 ${
          scrolled ? "translate-y-0" : "translate-y-0"
        }`}
      >
        <div
          className={`flex items-center gap-1 px-2 py-1.5 transition-all duration-500 ${
            scrolled
              ? "bg-[#0A0A1A]/90 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              : "bg-transparent"
          }`}
          style={{ borderRadius: "100px" }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 px-3 mr-2">
            <img src="/manhwa-logo.png" alt="Manhwa AI" className="h-7 w-7 object-contain" />
            <span className="display text-lg tracking-wider text-white">
              MANHWA<span className="text-[#FF006E]">AI</span>
            </span>
          </Link>

          {/* Nav */}
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 text-sm font-body font-medium transition-all ${
                isActive(link.path)
                  ? "text-white bg-[#FF006E]"
                  : "text-gray-400 hover:text-white"
              }`}
              style={{ borderRadius: "100px" }}
            >
              {link.name}
            </Link>
          ))}

          {/* Auth */}
          <div className="ml-3 pl-3 border-l border-white/10 flex items-center gap-2">
            {user ? (
              <>
                <div className="w-7 h-7 rounded-full bg-[#FF006E]/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-body text-gray-300 hidden lg:inline max-w-[100px] truncate">
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2 text-sm font-body font-semibold text-white bg-[#FF006E] hover:bg-[#FF006E]/80 transition-all"
                style={{ borderRadius: "100px" }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A1A]/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-around py-2 px-1">
          {navLinks.slice(0, 4).map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
                  active ? "text-[#FF006E]" : "text-gray-500"
                }`}
              >
                <span className={`w-1 h-1 rounded-full ${active ? "bg-[#FF006E]" : "bg-transparent"}`} />
                <span className="text-[10px] font-body font-medium tracking-wider">{link.name}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-500"
          >
            <span className={`w-1 h-1 rounded-full ${menuOpen ? "bg-[#FF006E]" : "bg-transparent"}`} />
            <span className="text-[10px] font-body font-medium tracking-wider">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile: more menu */}
      {menuOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/60 z-50" onClick={() => setMenuOpen(false)} />
          <div className="md:hidden fixed bottom-16 left-2 right-2 z-50 bg-[#1A1A2E] border border-white/10 p-4 animate-fade-up">
            <div className="space-y-1">
              {navLinks.slice(4).map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-body transition-all ${
                    isActive(link.path) ? "text-[#FF006E] bg-[#FF006E]/10" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-t border-white/10 pt-2 mt-2">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm font-body text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/login"); }}
                    className="w-full px-4 py-3 text-sm font-body font-semibold text-white bg-[#FF006E]"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacers */}
      <div className="hidden md:block h-16" />
      <div className="md:hidden h-16" />
    </>
  );
};

export default Navbar;
