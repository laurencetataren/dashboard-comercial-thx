export default function TechGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(0,180,255,0.03) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,100,255,0.02) 0%, transparent 50%)'
      }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,210,255,0.1) 2px, rgba(0,210,255,0.1) 4px)',
        backgroundSize: '100% 4px'
      }} />
      <div className="absolute top-0 left-0 w-40 h-40">
        <div className="absolute top-6 left-6 w-20 h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
        <div className="absolute top-6 left-6 w-px h-20 bg-gradient-to-b from-cyan-500/30 to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-40 h-40">
        <div className="absolute top-6 right-6 w-20 h-px bg-gradient-to-l from-cyan-500/30 to-transparent" />
        <div className="absolute top-6 right-6 w-px h-20 bg-gradient-to-b from-cyan-500/30 to-transparent" />
      </div>
    </div>
  )
}
