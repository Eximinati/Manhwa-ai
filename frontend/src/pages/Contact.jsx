import React, { useState } from "react";
import Watermark from "../components/Watermark";

const faqData = [
  { q: "How does the conversion work?", a: "Upload a manga PDF. AI extracts panels, generates narration, creates audio, and compiles a video. All automatic." },
  { q: "What formats are supported?", a: "Input: PDF. Output: MP4." },
  { q: "Is there a file size limit?", a: "Under 50MB recommended for optimal processing speed." },
  { q: "Do I need to install anything?", a: "No. Everything runs in your browser." },
];

const developers = [
  { name: "Subhradeep Nath", role: "Frontend", emoji: "🎨", img: "/SubhroDp.png", linkedin: "https://www.linkedin.com/in/subhradeep-nath-dev", github: "https://github.com/SubhradeepNathGit" },
  { name: "Anurag Bhattacharya", role: "Backend", emoji: "⚙️", img: "/Anurag.jpeg", linkedin: "https://www.linkedin.com/in/anurag-bhattacharya-256b351a4/", github: "https://github.com/anurag-bitan" },
];

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = "Required";
    if (!form.email.trim()) err.email = "Required";
    else if (!/^\S+@\S+$/i.test(form.email)) err.email = "Invalid";
    if (!form.message.trim()) err.message = "Required";
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
          name: form.name, email: form.email, message: form.message,
          subject: "New Message from Manhwa.ai Website",
        }),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        setForm({ name: "", email: "", message: "" });
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0A0A1A] text-white px-6 py-20 relative">
      <Watermark text="交流" sub="CONTACT" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <span className="magazine-kicker">Contact</span>
          <h1 className="display text-5xl sm:text-6xl text-white mt-2">
            Get in <span className="text-[#FF006E]">touch</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Form */}
          <div>
            <div className="space-y-5">
              <div>
                <input type="text" placeholder="Name" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full p-3 bg-transparent border-b border-white/10 text-white font-body text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF006E] transition-colors" />
                {errors.name && <p className="text-red-400 text-xs mt-1 font-body">{errors.name}</p>}
              </div>
              <div>
                <input type="email" placeholder="Email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full p-3 bg-transparent border-b border-white/10 text-white font-body text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF006E] transition-colors" />
                {errors.email && <p className="text-red-400 text-xs mt-1 font-body">{errors.email}</p>}
              </div>
              <div>
                <textarea placeholder="Message" value={form.message} rows={4}
                  onChange={e => setForm({...form, message: e.target.value})}
                  className="w-full p-3 bg-transparent border-b border-white/10 text-white font-body text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF006E] transition-colors resize-none" />
                {errors.message && <p className="text-red-400 text-xs mt-1 font-body">{errors.message}</p>}
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3 font-body text-sm font-semibold tracking-wider bg-[#FF006E] text-white hover:bg-[#FF006E]/80 transition-all active:scale-[0.98] disabled:opacity-50">
                {loading ? "Sending..." : "Send Message"}
              </button>
              {success && (
                <div className="font-body text-sm text-[#00F5D4]">✓ Message sent</div>
              )}
            </div>
          </div>

          {/* FAQ + Devs */}
          <div>
            <h3 className="display text-2xl tracking-wider text-white mb-6">FAQ</h3>
            <div className="space-y-1 mb-16">
              {faqData.map((item, i) => (
                <details key={i} className="group border-b border-white/10 py-4">
                  <summary className="font-body text-sm font-semibold text-white cursor-pointer list-none flex items-center justify-between">
                    {item.q}
                    <span className="text-[#FF006E] text-xs group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="font-body text-sm text-gray-400 mt-3 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>

            <h3 className="display text-2xl tracking-wider text-white mb-6">Creators</h3>
            <div className="grid grid-cols-2 gap-4">
              {developers.map((dev, i) => (
                <div key={i} className="border border-white/10 p-5">
                  <div className="text-2xl mb-2">{dev.emoji}</div>
                  <img src={dev.img} alt={dev.name} className="w-12 h-12 rounded-full object-cover mb-3 border border-white/20" />
                  <div className="display text-base tracking-wider text-white">{dev.name}</div>
                  <div className="font-body text-xs text-gray-500 mb-3">{dev.role}</div>
                  <div className="flex gap-3">
                    <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#00F5D4] text-xs">LinkedIn</a>
                    <a href={dev.github} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#FF006E] text-xs">GitHub</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
