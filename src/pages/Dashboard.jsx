import { useState } from 'react'
import {
  BarChart3, Funnel, Users, ArrowLeftRight, TrendingUp,
  RefreshCw, AlertTriangle, Clock, Target, DollarSign,
  Award, XCircle, ArrowUpRight, ArrowDownRight, Zap,
  ChevronRight, Layers
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'

import ParticleNetwork from '../components/ParticleNetwork.jsx'
import TechGrid from '../components/TechGrid.jsx'
import { GlassCard, KPICard, SectionTitle, CustomTooltip, Badge, ProgressBar } from '../components/UI.jsx'
import useComercialData from '../lib/useComercialData.js'
import { fmtCurrency, fmtCurrencyShort, fmtPct, fmtMes, fmtMesFull } from '../lib/formatters.js'

const TABS = [
  { id: 'visao', label: 'Visao Geral', icon: BarChart3 },
  { id: 'funil', label: 'Funil', icon: Funnel },
  { id: 'performance', label: 'Performance', icon: Users },
  { id: 'movimentacao', label: 'Movimentacao', icon: ArrowLeftRight },
  { id: 'projecao', label: 'Projecao', icon: TrendingUp },
]

const STAGE_COLORS = {
  'BUGS': '#ef4444',
  'Pedido de Cotacao': '#f59e0b',
  'Em Negociacao': '#06b6d4',
  'BID': '#8b5cf6',
  'Proposta Aprovada': '#10b981',
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('visao')
  const { data, metrics, loading, error, lastUpdate, refresh } = useComercialData()

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400/60 text-sm tracking-widest uppercase">Carregando dados comerciais</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <GlassCard className="max-w-md mx-4">
          <div className="p-8 text-center">
            <AlertTriangle size={40} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-white text-lg font-semibold mb-2">Erro ao carregar dados</h2>
            <p className="text-white/40 text-sm mb-4">{error}</p>
            <button onClick={refresh} className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors">
              Tentar novamente
            </button>
          </div>
        </GlassCard>
      </div>
    )
  }

  const ActiveTabComponent = {
    visao: TabVisaoGeral,
    funil: TabFunil,
    performance: TabPerformance,
    movimentacao: TabMovimentacao,
    projecao: TabProjecao,
  }[activeTab]

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <ParticleNetwork />
      <TechGrid />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-white/[0.06] px-6 py-4" style={{
          background: 'linear-gradient(180deg, rgba(10,10,30,0.95) 0%, rgba(10,10,30,0.8) 100%)',
          backdropFilter: 'blur(20px)'
        }}>
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
                <BarChart3 size={20} className="text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Dashboard Comercial</h1>
                <p className="text-[11px] text-white/30 tracking-wider uppercase">THX Group | Pipeline Oportunidades</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {metrics?.isDemo && (
                <Badge variant="warning">MODO DEMO</Badge>
              )}
              {lastUpdate && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/30">
                  <Clock size={12} />
                  <span>Atualizado {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              <button
                onClick={refresh}
                disabled={loading}
                className="p-2 rounded-lg border border-white/[0.06] hover:border-cyan-500/30 transition-colors disabled:opacity-30"
              >
                <RefreshCw size={16} className={`text-white/40 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav className="border-b border-white/[0.06] px-6" style={{
          background: 'rgba(10,10,30,0.6)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="max-w-[1400px] mx-auto flex gap-1 overflow-x-auto py-2">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-[1400px] mx-auto px-6 py-8">
          {metrics && <ActiveTabComponent data={data} metrics={metrics} />}
        </main>
      </div>
    </div>
  )
}

// =============================================
// TAB: VISAO GERAL
// =============================================
function TabVisaoGeral({ data, metrics }) {
  const chartData = metrics.historico.map(h => ({
    mes: fmtMes(h.mes),
    vendido: h.won_value,
    perdido: h.lost_value,
    conversao: h.conversion_rate
  }))

  return (
    <div className="space-y-8">
      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          label="Vendido no Mes"
          value={fmtCurrencyShort(metrics.totalWonValor)}
          trend={metrics.trendValor}
          trendLabel="vs mes anterior"
          icon={DollarSign}
          color="emerald"
        />
        <KPICard
          label="Meta Mensal"
          value={fmtCurrencyShort(metrics.metaValor)}
          subtitle={`${fmtPct(metrics.atingimentoValor)} atingido`}
          icon={Target}
          color="cyan"
        />
        <KPICard
          label="Deals Ganhos"
          value={metrics.totalWonCount}
          subtitle={`Meta: ${metrics.metaDeals}`}
          icon={Award}
          color="violet"
        />
        <KPICard
          label="Deals Perdidos"
          value={metrics.totalLostCount}
          icon={XCircle}
          color="rose"
        />
        <KPICard
          label="Ticket Medio"
          value={fmtCurrencyShort(metrics.ticketMedio)}
          icon={Zap}
          color="amber"
        />
        <KPICard
          label="Taxa Conversao"
          value={fmtPct(metrics.taxaConversao)}
          trend={metrics.trendConversao}
          trendLabel="vs mes anterior"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Barra de progresso meta */}
      <GlassCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Target}>Progresso da Meta | {fmtMesFull(metrics.mesAtual)}</SectionTitle>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-400">{fmtCurrency(metrics.totalWonValor)}</p>
              <p className="text-xs text-white/30">de {fmtCurrency(metrics.metaValor)}</p>
            </div>
          </div>
          <ProgressBar value={metrics.totalWonValor} max={metrics.metaValor} color="emerald" size="lg" />
          <div className="flex justify-between mt-3">
            <p className="text-xs text-white/30">Dia {metrics.diaAtual} de {metrics.diasNoMes}</p>
            <p className="text-xs text-white/30">
              {metrics.gapMeta > 0
                ? `Faltam ${fmtCurrency(metrics.gapMeta)} para a meta`
                : 'Meta batida!'
              }
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Charts lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolucao mensal */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={BarChart3}>Evolucao Mensal</SectionTitle>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCurrencyShort(v)} />
                  <Tooltip content={<CustomTooltip formatter={(v, name) => name === 'conversao' ? fmtPct(v) : fmtCurrency(v)} />} />
                  <Bar dataKey="vendido" name="Vendido" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="perdido" name="Perdido" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.5} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Taxa de conversao */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={TrendingUp}>Taxa de Conversao (%)</SectionTitle>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradConversao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip formatter={v => fmtPct(v)} />} />
                  <Area type="monotone" dataKey="conversao" name="Conversao" stroke="#06b6d4" strokeWidth={2} fill="url(#gradConversao)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

// =============================================
// TAB: FUNIL
// =============================================
function TabFunil({ data, metrics }) {
  const totalFunil = metrics.totalFunilCount || 1

  return (
    <div className="space-y-8">
      {/* KPIs funil */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Deals no Funil" value={metrics.totalFunilCount} icon={Layers} color="cyan" />
        <KPICard label="Valor Total Funil" value={fmtCurrencyShort(metrics.totalFunilValor)} icon={DollarSign} color="emerald" />
        <KPICard label="Ticket Medio Funil" value={fmtCurrencyShort(metrics.totalFunilCount > 0 ? metrics.totalFunilValor / metrics.totalFunilCount : 0)} icon={Zap} color="violet" />
        <KPICard label="Estagios Ativos" value={metrics.funil.filter(f => f.count > 0).length} subtitle={`de ${metrics.funil.length} estagios`} icon={Funnel} color="amber" />
      </div>

      {/* Funil visual */}
      <GlassCard>
        <div className="p-6">
          <SectionTitle icon={Funnel} description="Pipeline 7: Funil de Oportunidades">Funil de Vendas</SectionTitle>
          <div className="space-y-3 mt-6">
            {metrics.funil.map((stage, i) => {
              const pct = totalFunil > 0 ? (stage.count / totalFunil) * 100 : 0
              const maxVal = Math.max(...metrics.funil.map(f => f.valor), 1)
              const barPct = (stage.valor / maxVal) * 100
              const color = STAGE_COLORS[stage.nome] || '#06b6d4'

              return (
                <div key={stage.nome} className="group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0" style={{ background: `${color}20`, color }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white/80">{stage.nome}</span>
                          <Badge variant="info">{stage.count} {stage.count === 1 ? 'deal' : 'deals'}</Badge>
                        </div>
                        <span className="text-sm font-semibold" style={{ color }}>{fmtCurrency(stage.valor)}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(barPct, 2)}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </GlassCard>

      {/* Lista de deals abertos */}
      <GlassCard>
        <div className="p-6">
          <SectionTitle icon={Layers} description="Todos os deals abertos no pipeline">Deals em Andamento</SectionTitle>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Empresa</th>
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Estagio</th>
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Vendedora</th>
                  <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Valor</th>
                  <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {(data.openDeals || []).sort((a, b) => (b.valor || 0) - (a.valor || 0)).map((deal, i) => (
                  <tr key={deal.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <p className="text-white/80 font-medium">{deal.empresa || deal.titulo}</p>
                      {deal.empresa && deal.titulo !== deal.empresa && (
                        <p className="text-[11px] text-white/30">{deal.titulo}</p>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[deal.estagio] || '#06b6d4' }} />
                        <span className="text-white/60">{deal.estagio}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white/50">{deal.vendedora}</td>
                    <td className="py-3 px-3 text-right font-medium text-white/80">{fmtCurrency(deal.valor)}</td>
                    <td className="py-3 px-3 text-right text-white/30">{deal.dataCriacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

// =============================================
// TAB: PERFORMANCE
// =============================================
function TabPerformance({ data, metrics }) {
  const VENDEDORA_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']

  const chartVendedoras = metrics.vendedoras.map((v, i) => ({
    nome: v.nome.split(' ')[0],
    nomeCompleto: v.nome,
    valor: v.valor,
    count: v.count,
    ticketMedio: v.count > 0 ? v.valor / v.count : 0,
    fill: VENDEDORA_COLORS[i % VENDEDORA_COLORS.length]
  }))

  const wonByVendedora = {}
  ;(data.wonDeals || []).forEach(d => {
    const key = d.vendedora || 'Sem dono'
    if (!wonByVendedora[key]) wonByVendedora[key] = { deals: [], valor: 0 }
    wonByVendedora[key].deals.push(d)
    wonByVendedora[key].valor += d.valor || 0
  })

  const lostByVendedora = {}
  ;(data.lostDeals || []).forEach(d => {
    const key = d.vendedora || 'Sem dono'
    if (!lostByVendedora[key]) lostByVendedora[key] = 0
    lostByVendedora[key]++
  })

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard label="Vendedoras Ativas" value={metrics.vendedoras.length} icon={Users} color="cyan" />
        <KPICard label="Total Vendido" value={fmtCurrencyShort(metrics.totalWonValor)} icon={DollarSign} color="emerald" />
        <KPICard label="Ticket Medio Geral" value={fmtCurrencyShort(metrics.ticketMedio)} icon={Zap} color="violet" />
      </div>

      {/* Chart vendedoras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={Award}>Valor Vendido por Vendedora</SectionTitle>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartVendedoras} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCurrencyShort(v)} />
                  <YAxis type="category" dataKey="nome" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip formatter={(v, name) => name === 'count' ? v : fmtCurrency(v)} />} />
                  <Bar dataKey="valor" name="Valor" radius={[0, 6, 6, 0]}>
                    {chartVendedoras.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Cards individuais */}
        <div className="space-y-4">
          {chartVendedoras.map((v, i) => {
            const lost = lostByVendedora[v.nomeCompleto] || 0
            const totalDecidido = v.count + lost
            const conv = totalDecidido > 0 ? (v.count / totalDecidido) * 100 : 0

            return (
              <GlassCard key={i} hover>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: `${v.fill}20`, color: v.fill }}>
                      {v.nomeCompleto.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white/90">{v.nomeCompleto}</p>
                      <p className="text-[11px] text-white/30">{v.count} deals ganhos | {lost} perdidos</p>
                    </div>
                    <p className="text-lg font-bold" style={{ color: v.fill }}>{fmtCurrencyShort(v.valor)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] uppercase text-white/30">Ticket Medio</p>
                      <p className="text-sm font-medium text-white/70">{fmtCurrencyShort(v.ticketMedio)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-white/30">Conversao</p>
                      <p className="text-sm font-medium text-white/70">{fmtPct(conv)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-white/30">Vs Meta</p>
                      <ProgressBar value={v.valor} max={metrics.metaValor / Math.max(metrics.vendedoras.length, 1)} color={v.fill === '#06b6d4' ? 'cyan' : 'violet'} size="sm" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// =============================================
// TAB: MOVIMENTACAO
// =============================================
function TabMovimentacao({ data, metrics }) {
  const motivosData = metrics.motivosPerda.slice(0, 6).map((m, i) => ({
    motivo: m.motivo.length > 15 ? m.motivo.slice(0, 15) + '...' : m.motivo,
    motivoFull: m.motivo,
    count: m.count,
    fill: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899'][i]
  }))

  const totalLost = motivosData.reduce((s, m) => s + m.count, 0)

  const movData = metrics.historico.map(h => ({
    mes: fmtMes(h.mes),
    novos: h.new_count,
    ganhos: h.won_count,
    perdidos: h.lost_count
  }))

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Deals Ganhos" value={metrics.totalWonCount} icon={ArrowUpRight} color="emerald" />
        <KPICard label="Deals Perdidos" value={metrics.totalLostCount} icon={ArrowDownRight} color="rose" />
        <KPICard label="No Funil Agora" value={metrics.totalFunilCount} icon={Funnel} color="cyan" />
        <KPICard label="Win Rate" value={fmtPct(metrics.taxaConversao)} trend={metrics.trendConversao} icon={Target} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimentacao mensal */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={ArrowLeftRight}>Movimentacao Mensal</SectionTitle>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ganhos" name="Ganhos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="perdidos" name="Perdidos" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.6} />
                  <Bar dataKey="novos" name="Novos" fill="#06b6d4" radius={[4, 4, 0, 0]} opacity={0.4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Motivos de perda */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={XCircle} description={`${totalLost} deals perdidos analisados`}>Motivos de Perda</SectionTitle>
            <div className="space-y-3 mt-4">
              {motivosData.map((m, i) => {
                const pct = totalLost > 0 ? (m.count / totalLost) * 100 : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: m.fill }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white/70 truncate">{m.motivoFull}</span>
                        <span className="text-sm font-medium text-white/50 ml-2">{m.count}x ({fmtPct(pct, 0)})</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: m.fill }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

// =============================================
// TAB: PROJECAO
// =============================================
function TabProjecao({ data, metrics }) {
  const projecaoLinear = metrics.projecaoValor
  const projecaoPessimista = projecaoLinear * 0.85
  const projecaoOtimista = projecaoLinear * 1.15

  const projecaoChart = metrics.historico.map(h => ({
    mes: fmtMes(h.mes),
    realizado: h.won_value,
    meta: null
  }))

  const metaAtual = metrics.metas?.find(m => m.mes === metrics.mesAtual)
  if (projecaoChart.length > 0) {
    const last = projecaoChart[projecaoChart.length - 1]
    last.meta = metrics.metaValor
    last.projecao = projecaoLinear
  }

  const eficienciaData = metrics.historico.map(h => ({
    mes: fmtMes(h.mes),
    ticketMedio: h.ticket_medio,
    ciclo: h.ciclo_medio_dias
  }))

  const cenarios = [
    { nome: 'Pessimista', valor: projecaoPessimista, cor: '#ef4444', desc: 'Ritmo reduz 15%' },
    { nome: 'Base', valor: projecaoLinear, cor: '#06b6d4', desc: 'Mantendo ritmo atual' },
    { nome: 'Otimista', valor: projecaoOtimista, cor: '#10b981', desc: 'Ritmo acelera 15%' },
  ]

  return (
    <div className="space-y-8">
      {/* KPIs projecao */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Projecao Linear" value={fmtCurrencyShort(projecaoLinear)} subtitle={`Dia ${metrics.diaAtual}/${metrics.diasNoMes}`} icon={TrendingUp} color="cyan" />
        <KPICard label="Gap para Meta" value={metrics.gapMeta > 0 ? fmtCurrencyShort(metrics.gapMeta) : 'Meta batida!'} subtitle={metrics.gapMeta > 0 ? `Faltam ${fmtCurrencyShort(metrics.gapMeta)}` : undefined} icon={Target} color={metrics.gapMeta > 0 ? 'amber' : 'emerald'} />
        <KPICard label="Funil Potencial" value={fmtCurrencyShort(metrics.totalFunilValor)} subtitle={`${metrics.totalFunilCount} deals abertos`} icon={Funnel} color="violet" />
        <KPICard label="Velocidade/Dia" value={fmtCurrencyShort(metrics.diaAtual > 0 ? metrics.totalWonValor / metrics.diaAtual : 0)} subtitle="Media diaria" icon={Zap} color="emerald" />
      </div>

      {/* Cenarios */}
      <GlassCard>
        <div className="p-6">
          <SectionTitle icon={TrendingUp} description={`Projecao para ${fmtMesFull(metrics.mesAtual)}`}>Cenarios de Fechamento</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {cenarios.map((c, i) => {
              const vsMeta = metrics.metaValor > 0 ? (c.valor / metrics.metaValor) * 100 : 0
              return (
                <div key={i} className="rounded-xl border border-white/[0.06] p-5" style={{ background: `${c.cor}08` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: c.cor }} />
                    <p className="text-sm font-medium text-white/70">{c.nome}</p>
                  </div>
                  <p className="text-2xl font-bold mb-1" style={{ color: c.cor }}>{fmtCurrencyShort(c.valor)}</p>
                  <p className="text-xs text-white/30 mb-2">{c.desc}</p>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={c.valor} max={metrics.metaValor} color={c.cor === '#10b981' ? 'emerald' : c.cor === '#ef4444' ? 'rose' : 'cyan'} size="sm" showLabel={false} />
                    <span className="text-xs font-medium text-white/40 shrink-0">{fmtPct(vsMeta, 0)} da meta</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolucao realizado vs meta */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={BarChart3}>Realizado vs Meta</SectionTitle>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projecaoChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCurrencyShort(v)} />
                  <Tooltip content={<CustomTooltip formatter={v => fmtCurrency(v)} />} />
                  <Bar dataKey="realizado" name="Realizado" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meta" name="Meta" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.4} />
                  <Bar dataKey="projecao" name="Projecao" fill="#06b6d4" radius={[4, 4, 0, 0]} opacity={0.3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Ticket medio e ciclo */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={Clock}>Ticket Medio e Ciclo de Venda</SectionTitle>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={eficienciaData}>
                  <defs>
                    <linearGradient id="gradTicket" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCurrencyShort(v)} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}d`} />
                  <Tooltip content={<CustomTooltip formatter={(v, name) => name === 'Ciclo (dias)' ? `${v} dias` : fmtCurrency(v)} />} />
                  <Area yAxisId="left" type="monotone" dataKey="ticketMedio" name="Ticket Medio" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradTicket)" />
                  <Area yAxisId="right" type="monotone" dataKey="ciclo" name="Ciclo (dias)" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
