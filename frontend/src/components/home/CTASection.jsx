import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative z-10 py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <span className="magazine-kicker">Ready?</span>
        <h2 className="display text-5xl sm:text-6xl md:text-7xl text-white mt-4 mb-6 leading-[1.1]">
          Create your first <br />
          <span className="text-[#FF006E]">manga video</span>
        </h2>
        <p className="font-body text-sm text-gray-500 mb-10 max-w-md mx-auto">
          No account needed. Just upload a PDF and we'll handle the rest.
        </p>
        <button
          onClick={() => navigate("/upload")}
          className="px-12 py-4 display text-lg tracking-wider text-white bg-[#FF006E] hover:bg-[#FF006E]/80 transition-all active:scale-[0.97]"
        >
          Upload PDF
        </button>
      </div>
    </section>
  );
};

export default CTASection;
