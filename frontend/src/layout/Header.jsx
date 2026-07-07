// src/components/layout/Navbar.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Video,
  Mail,
  LogIn,
  LogOut,
  BookOpen,
  Home,
  User,
  Library,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  /* ---------------- Scroll Effect ---------------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------------- Close Menu on Route Change ---------------- */
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  /* ---------------- Lock Body Scroll (Mobile) ---------------- */
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  /* ---------------- ESC + Resize Handling ---------------- */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    },
    [isOpen]
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleKeyDown, isOpen]);

  /* ---------------- Logout ---------------- */
  const handleLogout = async () => {
    sessionStorage.removeItem("pendingStory");
    sessionStorage.removeItem("pendingFileName");
    await logout();
    setIsOpen(false);
    navigate("/");
  };

  /* ---------------- Navigation ---------------- */
  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Upload", path: "/upload", icon: Video },
    { name: "Library", path: "/library", icon: Library },
    { name: "Docs", path: "/docs", icon: BookOpen },
    { name: "Contact", path: "/contact", icon: Mail },
  ];

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/30 backdrop-blur-md shadow-lg"
            : "bg-black/10"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* -------- Logo -------- */}
            <Link
              to="/"
              className="flex items-center gap-2 text-white font-bold text-lg sm:text-xl shrink-0"
            >
              <img
                src="/manhwa-logo.png"
                alt="Manhwa Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain animate-spin"
              />
              <span className="hidden sm:inline">MANHWA AI</span>
            </Link>

            {/* -------- Desktop Nav -------- */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative text-gray-300 hover:text-white transition font-medium"
                >
                  {link.name}
                  <span
                    className={`absolute left-0 -bottom-1 h-0.5 bg-purple-600 transition-all ${
                      isActive(link.path)
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* -------- Desktop Auth -------- */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3 min-w-[200px] justify-end">
                  <p className="text-sm font-medium text-white truncate">
                    Hi, <span className="font-semibold capitalize">{user.email?.split("@")[0].split(/[._-]/)[0]}</span>
                  </p>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-400 transition-colors duration-200 shrink-0"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:shadow-lg transition min-w-[120px]"
                >
                  SIGN IN
                </button>
              )}
            </div>

            {/* -------- Mobile Toggle -------- */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* ================= MOBILE MENU ================= */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xs sm:max-w-sm bg-black/30 backdrop-blur-2xl border-l border-gray-500/20 p-6 flex flex-col lg:hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <img src="/manhwa-logo.png" className="w-10 h-10" alt="Logo" />
                <span className="font-bold text-white">MANHWA AI</span>
              </div>
              <button onClick={() => setIsOpen(false)}>
                <X className="text-white" />
              </button>
            </div>

            {/* User */}
            {user && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-gray-500/10 to-indigo-500/10 backdrop-blur-md border border-gray-500/30 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Logged in as</p>
                    <p className="text-sm font-semibold text-white truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Links */}
            <nav className="flex-1 space-y-2 overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive(link.path)
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Auth */}
            <div className="pt-4 border-t border-purple-500/20">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Spacer */}
      <div className="h-16 sm:h-20" />
    </>
  );
};

export default Navbar;