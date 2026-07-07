const videos = [
  { id: 1, src: "https://placehold.co/800x450/FF006E/FFFFFF?text=Epic+Battle", title: "Epic Battle Scene" },
  { id: 2, src: "https://placehold.co/800x450/00F5D4/0A0A1A?text=Romance", title: "Romantic Moment" },
  { id: 3, src: "https://placehold.co/800x450/FFD60A/0A0A1A?text=Action", title: "Action Sequence" },
  { id: 4, src: "https://placehold.co/800x450/FF6B35/FFFFFF?text=Comedy", title: "Comedy Scene" },
  { id: 5, src: "https://placehold.co/800x450/9B5DE5/FFFFFF?text=Horror", title: "Horror Scene" },
];

const VideoCarousel = () => {
  return (
    <section className="relative z-10 py-20 px-6">
      <div className="max-w-7xl mx-auto mb-10">
        <span className="magazine-kicker">Showcase</span>
        <h2 className="display text-4xl sm:text-5xl text-white mt-2">
          Recent <span className="text-[#FF006E]">outputs</span>
        </h2>
      </div>

      <div className="horiz-scroll flex gap-4 pb-4 -mx-6 px-6">
        {videos.map((v) => (
          <div key={v.id} className="flex-shrink-0 w-[300px] sm:w-[400px] md:w-[480px] group">
            <div className="relative overflow-hidden bg-[#1A1A2E] border border-white/10">
              <img src={v.src} alt={v.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A1A] via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="display text-lg tracking-wider text-white">{v.title}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VideoCarousel;
