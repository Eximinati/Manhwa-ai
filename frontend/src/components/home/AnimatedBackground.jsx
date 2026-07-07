const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base */}
      <div className="absolute inset-0 bg-[#0A0A1A]" />

      {/* Halftone dot texture */}
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }} />

      {/* Gradient orb 1 — pink, drifts slowly */}
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.08]" style={{
        background: 'radial-gradient(circle, #FF006E, transparent)',
        top: '-10%',
        left: '-5%',
        animation: 'drift 20s ease-in-out infinite',
      }} />

      {/* Gradient orb 2 — cyan */}
      <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.06]" style={{
        background: 'radial-gradient(circle, #00F5D4, transparent)',
        bottom: '-5%',
        right: '-5%',
        animation: 'drift 25s ease-in-out infinite reverse',
      }} />

      {/* Gradient orb 3 — purple */}
      <div className="absolute w-[350px] h-[350px] rounded-full opacity-[0.05]" style={{
        background: 'radial-gradient(circle, #9B5DE5, transparent)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: 'drift 30s ease-in-out infinite',
      }} />

      {/* Diagonal line decorations */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]" aria-hidden="true">
        <line x1="0%" y1="100%" x2="30%" y2="0%" stroke="#FF006E" strokeWidth="1" />
        <line x1="70%" y1="100%" x2="100%" y2="0%" stroke="#00F5D4" strokeWidth="1" />
        <line x1="40%" y1="100%" x2="55%" y2="0%" stroke="#FF006E" strokeWidth="0.5" />
      </svg>

      {/* Drift keyframes injected once */}
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -20px); }
          66% { transform: translate(-20px, 25px); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
