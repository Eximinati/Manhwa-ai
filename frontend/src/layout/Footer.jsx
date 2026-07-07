import React from "react";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="border-t border-white/10 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/manhwa-logo.png" alt="Manhwa AI" className="h-6 w-6 object-contain" />
            <span className="display text-sm tracking-wider text-white">
              MANHWA<span className="text-[#FF006E]">AI</span>
            </span>
          </Link>
          <span className="text-gray-600 text-xs font-body">© {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-6">
          {[
            { name: "Home", link: "/" },
            { name: "Upload", link: "/upload" },
            { name: "Library", link: "/library" },
            { name: "Docs", link: "/docs" },
          ].map((item) => (
            <Link key={item.name} to={item.link} className="text-xs font-body text-gray-500 hover:text-white transition-colors">
              {item.name}
            </Link>
          ))}
          <a href="https://github.com/SubhradeepNathGit" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
            <FaGithub className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
