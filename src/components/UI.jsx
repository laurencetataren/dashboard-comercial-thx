import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// Card com efeito glassmorphism
export function GlassCard({ children, className = '', hover = false }) {
  return (
    <div className={`
      relative rounded-2xl border border-white/[0.06] overflow-hidden
      ${hover ? 'hover:border-cyan-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5' : ''}
      ${className}
    `} style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
      backdropFilter: 'blur(20px)'
    }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// Card KPI com valor, label, trend
export function KPICard({ label, value, subtitle, trend, trendLabel, icon: Icon, color = 'cyan' }) {
  const colors = {
    cyan: { bg: 'from-cyan-500/10 to-cyan-500/5', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/10' },
    emerald: { bg: 'from-emerald-500/10 to-emerald-500/5', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
    violet: { bg: 'from-violet-500/10 to-violet-500/5', text: 'text-violet-400', border: 'border-violet-500/20', glow: 'shadow-violet-500/10' },
    amber: { bg: 'from-amber-500/10 to-amber-500/5', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
    rose: { bg: 'from-rose-500/10 to-rose-500/5', text: 'text-rose-400', border: 'border-rose-500/20', glow: 'shadow-rose-500/10' },
    blue: { bg: 'from-blue-500/10 to-blue-500/5', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'shadow-blue-500/10' },
  }
  const c = colors[color] || colors.cyan

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-white/40'

  return (
    <GlassCard hover>
      <div className={`p-5 border-l-2 ${c.border}`}>
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium">{label}</p>
          {Icon && (
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.bg} flex items-center justify-center`}>
              <Icon size={16} className={c.text} />
            </div>
          )}
        </div>
        <p className={`text-2xl font-bold ${c.text} mb-1`}>{value}</p>
        {subtitle && <p className="text-xs text-white/30">{subtitle}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
            <TrendIcon size={12} />
            <span className="text-xs font-medium">
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            {trendLabel && <span className="text-[10px] text-white/30 ml-1">{trendLabel}</span>}
          </div>
        )}
      </div>
    </GlassCard>
  )
}

// Titulo de secao
export function SectionTitle({ children, icon: Icon, description }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={20} className="text-cyan-400" />}
        <h2 className="text-lg font-semibold text-white/90 tracking-tight">{children}</h2>
      </div>
      {description && <p className="text-sm text-white/40 mt-1 ml-8">{description}</p>}
    </div>
  )
}

// Tooltip customizado para Recharts
export function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 px-4 py-3" style={{
      background: 'rgba(10,10,30,0.95)',
      backdropFilter: 'blur(10px)'
    }}>
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-white/60">{entry.name}:</span>
          <span className="text-white font-medium">
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// Badge de status
export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-white/5 text-white/60 border-white/10',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${variants[variant]}`}>
      {children}
    </span>
  )
}

// Barra de progresso
export function ProgressBar({ value, max, color = 'cyan', showLabel = true, size = 'md' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const colors = {
    cyan: 'from-cyan-500 to-cyan-400',
    emerald: 'from-emerald-500 to-emerald-400',
    violet: 'from-violet-500 to-violet-400',
    amber: 'from-amber-500 to-amber-400',
    rose: 'from-rose-500 to-rose-400',
  }
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  return (
    <div className="w-full">
      <div className={`w-full ${heights[size]} bg-white/5 rounded-full overflow-hidden`}>
        <div
          className={`h-full bg-gradient-to-r ${colors[color]} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-[10px] text-white/30 mt-1 text-right">{pct.toFixed(0)}%</p>
      )}
    </div>
  )
}
