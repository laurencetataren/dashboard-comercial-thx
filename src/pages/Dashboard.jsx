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
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'projecao', label: 'Projecao', icon: TrendingUp },
]

const STAGE_COLORS = {
  'Pedido de Cotacao': '#f59e0b',
  'Em Negociacao': '#06b6d4',
  'BID': '#8b5cf6',
  'Proposta Aprovada': '#10b981',
}

const MES_NOMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('visao')
  const { data, metrics, loading, error, lastUpdate, refresh, fetchWithMes } = useComercialData()

  const mesFiltro = data?.mesFiltro || data?.mesAtual || ''
  const mesesDisponiveis = data?.mesesDisponiveis || []

  const handleMesChange = (mes) => {
    if (fetchWithMes) fetchWithMes(mes)
  }

  const mesFiltroLabel = mesFiltro ? (() => {
    const [y, m] = mesFiltro.split('-')
    return `${MES_NOMES[parseInt(m)-1]}/${y}`
  })() : ''

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
    clientes: TabClientes,
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
              {/* Seletor de mes global */}
              <select
                value={mesFiltro}
                onChange={e => handleMesChange(e.target.value)}
                className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-1.5 text-sm text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {mesesDisponiveis.map(m => {
                  const [y, mo] = m.split('-')
                  return <option key={m} value={m}>{MES_NOMES[parseInt(mo)-1]}/{y}</option>
                })}
              </select>
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
          {metrics && <ActiveTabComponent data={data} metrics={metrics} fetchWithMes={fetchWithMes} />}
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

  // Cor da meta: verde >= 100%, amarelo 80-99%, vermelho < 80%
  const pctMeta = metrics.atingimentoValor
  const metaColor = pctMeta >= 100 ? 'emerald' : pctMeta >= 80 ? 'amber' : 'rose'
  const metaColorText = pctMeta >= 100 ? 'text-emerald-400' : pctMeta >= 80 ? 'text-amber-400' : 'text-rose-400'
  const metaColorBg = pctMeta >= 100 ? 'from-emerald-500/10 to-emerald-500/5' : pctMeta >= 80 ? 'from-amber-500/10 to-amber-500/5' : 'from-rose-500/10 to-rose-500/5'
  const metaColorBorder = pctMeta >= 100 ? 'border-emerald-500/20' : pctMeta >= 80 ? 'border-amber-500/20' : 'border-rose-500/20'
  const metaStatusLabel = pctMeta >= 100 ? 'Meta batida!' : pctMeta >= 80 ? 'Quase la' : 'Atencao'

  return (
    <div className="space-y-6">
      {/* FAIXA 1: Meta vs Vendido */}
      <GlassCard>
        <div className={`p-6 border-l-4 ${metaColorBorder}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${metaColorBg} flex items-center justify-center`}>
                <Target size={20} className={metaColorText} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium">Meta vs Vendido | {fmtMesFull(metrics.mesAtual)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pctMeta >= 100 ? 'bg-emerald-500/20 text-emerald-400' : pctMeta >= 80 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {metaStatusLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${metaColorText}`}>{fmtPct(pctMeta, 1)}</p>
              <p className="text-xs text-white/30">atingimento</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <p className="text-xs text-white/40 mb-1">Vendido</p>
              <p className="text-xl font-bold text-white">{fmtCurrency(metrics.totalWonValor)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40 mb-1">Meta</p>
              <p className="text-xl font-bold text-white/60">{fmtCurrency(metrics.metaValor)}</p>
            </div>
          </div>

          <ProgressBar value={metrics.totalWonValor} max={metrics.metaValor} color={metaColor} size="lg" />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-white/30">Dia {metrics.diaAtual} de {metrics.diasNoMes}</p>
            <p className="text-xs text-white/30">
              {metrics.gapMeta > 0
                ? `Faltam ${fmtCurrency(metrics.gapMeta)}`
                : `Superou em ${fmtCurrency(Math.abs(metrics.gapMeta))}`
              }
            </p>
          </div>
        </div>
      </GlassCard>

      {/* FAIXA 2: Deals Ganhos / Perdidos / Abertos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard hover>
          <div className="p-5 border-l-2 border-emerald-500/20">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium">Deals Ganhos</p>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
                <Award size={16} className="text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400 mb-1">{metrics.totalWonCount}</p>
            <p className="text-sm text-white/50">{fmtCurrency(metrics.totalWonValor)}</p>
          </div>
        </GlassCard>

        <GlassCard hover>
          <div className="p-5 border-l-2 border-rose-500/20">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium">Deals Perdidos</p>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/10 to-rose-500/5 flex items-center justify-center">
                <XCircle size={16} className="text-rose-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-400 mb-1">{metrics.totalLostCount}</p>
            <p className="text-sm text-white/50">{fmtCurrency(metrics.totalLostValor)}</p>
          </div>
        </GlassCard>

        <GlassCard hover>
          <div className="p-5 border-l-2 border-cyan-500/20">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium">Deals Abertos</p>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 flex items-center justify-center">
                <Layers size={16} className="text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-cyan-400 mb-1">{metrics.totalFunilCount}</p>
            <p className="text-sm text-white/50">{fmtCurrency(metrics.totalFunilValor)}</p>
          </div>
        </GlassCard>
      </div>

      {/* FAIXA: Faturado vs Vendido */}
      {(() => {
        const faturado = data?.faturado || { totalFaturado: 0, countCargas: 0 }
        const totalFaturado = faturado.totalFaturado || 0
        const totalVendido = metrics.totalWonValor || 0
        const metaFaturado = metrics.metaValor || 0
        const pctFaturadoMeta = metaFaturado > 0 ? Math.round((totalFaturado / metaFaturado) * 1000) / 10 : 0
        const pctVendidoFaturado = totalVendido > 0 ? Math.round((totalFaturado / totalVendido) * 1000) / 10 : 0
        const perdas = totalVendido - totalFaturado
        const perdasPositivo = perdas > 0 ? perdas : 0

        const fatColor = pctFaturadoMeta >= 100 ? 'emerald' : pctFaturadoMeta >= 80 ? 'amber' : 'rose'
        const fatColorText = pctFaturadoMeta >= 100 ? 'text-emerald-400' : pctFaturadoMeta >= 80 ? 'text-amber-400' : 'text-rose-400'
        const fatColorBg = pctFaturadoMeta >= 100 ? 'from-emerald-500/10 to-emerald-500/5' : pctFaturadoMeta >= 80 ? 'from-amber-500/10 to-amber-500/5' : 'from-rose-500/10 to-rose-500/5'
        const fatColorBorder = pctFaturadoMeta >= 100 ? 'border-emerald-500/20' : pctFaturadoMeta >= 80 ? 'border-amber-500/20' : 'border-rose-500/20'

        return (
          <>
            {/* Faturado com barra de progresso */}
            <GlassCard>
              <div className={`p-6 border-l-4 ${fatColorBorder}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${fatColorBg} flex items-center justify-center`}>
                      <DollarSign size={20} className={fatColorText} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium">Faturado | {fmtMesFull(metrics.mesAtual)}</p>
                      <p className="text-xs text-white/30 mt-0.5">{faturado.countCargas} cargas faturadas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${fatColorText}`}>{fmtPct(pctFaturadoMeta, 1)}</p>
                    <p className="text-xs text-white/30">da meta</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Faturado</p>
                    <p className="text-xl font-bold text-white">{fmtCurrency(totalFaturado)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 mb-1">Meta</p>
                    <p className="text-xl font-bold text-white/60">{fmtCurrency(metaFaturado)}</p>
                  </div>
                </div>
                <ProgressBar value={totalFaturado} max={metaFaturado} color={fatColor} size="lg" />
              </div>
            </GlassCard>

            {/* Vendido vs Faturado % + Perdas/No Show */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard hover>
                <div className="p-5 border-l-2 border-blue-500/20">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium">Vendido vs Faturado</p>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center">
                      <ArrowLeftRight size={16} className="text-blue-400" />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold mb-1 ${pctVendidoFaturado >= 90 ? 'text-emerald-400' : pctVendidoFaturado >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {fmtPct(pctVendidoFaturado, 1)}
                  </p>
                  <p className="text-sm text-white/50">
                    {fmtCurrency(totalFaturado)} de {fmtCurrency(totalVendido)} vendidos
                  </p>
                </div>
              </GlassCard>

              <GlassCard hover>
                <div className="p-5 border-l-2 border-rose-500/40">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-rose-400/80 font-medium">Perdas / No Show</p>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-rose-500/10 flex items-center justify-center">
                      <AlertTriangle size={16} className="text-rose-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-rose-400 mb-1">{fmtCurrency(perdasPositivo)}</p>
                  <p className="text-sm text-rose-400/50">
                    GAP entre vendido e faturado
                  </p>
                </div>
              </GlassCard>
            </div>
          </>
        )
      })()}

      {/* FAIXA 3: Ticket Medio / Taxa Conversao */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard
          label="Ticket Medio"
          value={fmtCurrencyShort(metrics.ticketMedio)}
          icon={Zap}
          color="amber"
        />
        <KPICard
          label="Taxa de Conversao"
          value={fmtPct(metrics.taxaConversao)}
          trend={metrics.trendConversao}
          trendLabel="vs mes anterior"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Charts lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  const [filtroVendedora, setFiltroVendedora] = useState('Todas')
  const [filtroEstagio, setFiltroEstagio] = useState('Todos')

  const stages = metrics.funil || []
  const totalDeals = stages.reduce((s, f) => s + f.count, 0)
  const totalValor = stages.reduce((s, f) => s + f.valor, 0)

  // Vendedoras unicas
  const vendedoras = [...new Set((data.openDeals || []).map(d => d.vendedora))].filter(Boolean)

  // Deals filtrados
  const dealsFiltrados = (data.openDeals || []).filter(d => {
    if (filtroVendedora !== 'Todas' && d.vendedora !== filtroVendedora) return false
    if (filtroEstagio !== 'Todos' && d.estagio !== filtroEstagio) return false
    return true
  }).sort((a, b) => (b.valor || 0) - (a.valor || 0))

  const stageColors = ['#f59e0b', '#06b6d4', '#10b981']

  return (
    <div className="space-y-8">
      {/* KPIs funil */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Deals no Funil" value={totalDeals} icon={Layers} color="cyan" />
        <KPICard label="Valor Total Funil" value={fmtCurrencyShort(totalValor)} icon={DollarSign} color="emerald" />
        <KPICard label="Ticket Medio" value={fmtCurrencyShort(totalDeals > 0 ? totalValor / totalDeals : 0)} icon={Zap} color="violet" />
        <KPICard label="Taxa Conversao" value={fmtPct(metrics.taxaConversao, 0)} subtitle="Won / (Won+Lost)" icon={TrendingUp} color="amber" />
      </div>

      {/* Funil visual 3 estagios */}
      <GlassCard>
        <div className="p-6">
          <SectionTitle icon={Funnel} description="Pipeline 7 | Funil de Oportunidades">Funil de Vendas</SectionTitle>
          <div className="flex items-stretch justify-center gap-2 md:gap-4 mt-8 mb-4">
            {stages.map((stage, i) => {
              const color = stageColors[i] || '#06b6d4'
              const pctDeals = totalDeals > 0 ? Math.round((stage.count / totalDeals) * 100) : 0

              return (
                <div key={stage.nome} className="flex items-center gap-2 md:gap-3 flex-1">
                  {/* Stage card */}
                  <div
                    className="relative flex-1 rounded-2xl border border-white/[0.06] p-4 md:p-6 text-center transition-all hover:scale-[1.02] hover:border-white/10 cursor-default"
                    style={{ background: `linear-gradient(135deg, ${color}12, ${color}06)` }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${color}20` }}>
                      <span className="text-lg font-bold" style={{ color }}>{i + 1}</span>
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1">{stage.nome}</p>
                    <p className="text-3xl font-bold text-white mb-1">{stage.count}</p>
                    <p className="text-sm font-semibold" style={{ color }}>{fmtCurrency(stage.valor)}</p>
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.max(pctDeals, 8)}%`, background: color, maxWidth: '80%', minWidth: '12px' }} />
                      <span className="text-[10px] text-white/30">{pctDeals}%</span>
                    </div>
                  </div>
                  {/* Seta entre estagios */}
                  {i < stages.length - 1 && (
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <ChevronRight className="w-5 h-5 text-white/20" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {/* Conversao entre estagios */}
          <div className="flex justify-center gap-16 mt-2">
            {stages.length > 1 && stages.slice(0, -1).map((stage, i) => {
              const next = stages[i + 1]
              const convPct = stage.count > 0 ? Math.round((next.count / stage.count) * 100) : 0
              return (
                <div key={i} className="text-center">
                  <span className="text-[10px] text-white/25">{stage.nome.split(' ')[0]} \u2192 {next.nome.split(' ')[0]}</span>
                  <p className="text-xs font-semibold text-white/50">{convPct}% conv.</p>
                </div>
              )
            })}
          </div>
        </div>
      </GlassCard>

      {/* Deals com filtros */}
      <GlassCard>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <SectionTitle icon={Layers} description="Filtre por vendedora ou estagio">Deals em Andamento</SectionTitle>
            <div className="flex items-center gap-3">
              {/* Filtro vendedora */}
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-white/30" />
                <select
                  value={filtroVendedora}
                  onChange={e => setFiltroVendedora(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="Todas">Todas</option>
                  {vendedoras.map(v => <option key={v} value={v}>{v.split(' ')[0]}</option>)}
                </select>
              </div>
              {/* Filtro estagio */}
              <div className="flex items-center gap-2">
                <Funnel className="w-3.5 h-3.5 text-white/30" />
                <select
                  value={filtroEstagio}
                  onChange={e => setFiltroEstagio(e.target.value)}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="Todos">Todos estagios</option>
                  {stages.map(s => <option key={s.nome} value={s.nome}>{s.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Badge contagem */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="info">{dealsFiltrados.length} deal{dealsFiltrados.length !== 1 ? 's' : ''}</Badge>
            <span className="text-xs text-white/30">|</span>
            <span className="text-xs text-white/40">{fmtCurrency(dealsFiltrados.reduce((s, d) => s + (d.valor || 0), 0))} em pipeline</span>
          </div>

          <div className="overflow-x-auto">
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
                {dealsFiltrados.map((deal, i) => (
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
                {dealsFiltrados.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-white/20 text-sm">Nenhum deal encontrado com os filtros selecionados</td></tr>
                )}
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

  // Won por vendedora detalhado
  const wonByVendedora = {}
  ;(data.wonDeals || []).forEach(d => {
    const key = d.vendedora || 'Sem dono'
    if (!wonByVendedora[key]) wonByVendedora[key] = { deals: [], valor: 0 }
    wonByVendedora[key].deals.push(d)
    wonByVendedora[key].valor += d.valor || 0
  })

  // Lost por vendedora
  const lostByVendedora = {}
  ;(data.lostDeals || []).forEach(d => {
    const key = d.vendedora || 'Sem dono'
    if (!lostByVendedora[key]) lostByVendedora[key] = 0
    lostByVendedora[key]++
  })

  // Atividades
  const atividades = data.atividades || []
  const totalAtividades = atividades.reduce((s, a) => s + a.ligacoes + a.emails + a.reunioes + a.propostas + a.followups + a.whatsapp, 0)
  const atividadeLabels = [
    { key: 'ligacoes', label: 'Ligacoes', color: '#06b6d4' },
    { key: 'emails', label: 'Emails', color: '#8b5cf6' },
    { key: 'whatsapp', label: 'WhatsApp', color: '#10b981' },
    { key: 'reunioes', label: 'Reunioes', color: '#f59e0b' },
    { key: 'propostas', label: 'Propostas', color: '#ec4899' },
    { key: 'followups', label: 'Follow-ups', color: '#ef4444' }
  ]

  // Chart data para atividades comparativas
  const atividadesChartData = atividadeLabels.map(al => {
    const point = { tipo: al.label }
    atividades.forEach(a => {
      point[a.vendedora.split(' ')[0]] = a[al.key]
    })
    return point
  })

  // Motivos de perda
  const motivosData = metrics.motivosPerda.slice(0, 6).map((m, i) => ({
    motivo: m.motivo.length > 15 ? m.motivo.slice(0, 15) + '...' : m.motivo,
    motivoFull: m.motivo,
    count: m.count,
    fill: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ec4899'][i]
  }))
  const totalLost = motivosData.reduce((s, m) => s + m.count, 0)

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Vendido" value={fmtCurrencyShort(metrics.totalWonValor)} icon={DollarSign} color="emerald" />
        <KPICard label="Ticket Medio" value={fmtCurrencyShort(metrics.ticketMedio)} icon={Zap} color="violet" />
        <KPICard label="Win Rate" value={fmtPct(metrics.taxaConversao)} trend={metrics.trendConversao} icon={Target} color="cyan" />
        <KPICard label="Total Atividades" value={totalAtividades} subtitle="no mes" icon={BarChart3} color="amber" />
      </div>

      {/* Cards vendedoras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartVendedoras.map((v, i) => {
          const lost = lostByVendedora[v.nomeCompleto] || 0
          const totalDecidido = v.count + lost
          const conv = totalDecidido > 0 ? (v.count / totalDecidido) * 100 : 0
          const atv = atividades.find(a => a.vendedora === v.nomeCompleto) || {}

          return (
            <GlassCard key={i}>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold" style={{ background: `${v.fill}20`, color: v.fill }}>
                    {v.nomeCompleto.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/90">{v.nomeCompleto}</p>
                    <p className="text-[11px] text-white/30">{v.count} deals ganhos | {lost} perdidos</p>
                  </div>
                  <p className="text-xl font-bold" style={{ color: v.fill }}>{fmtCurrencyShort(v.valor)}</p>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
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
                {/* Atividades inline */}
                <div className="border-t border-white/[0.06] pt-3">
                  <p className="text-[10px] uppercase text-white/25 mb-2">Atividades do Mes</p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {atividadeLabels.map(al => (
                      <div key={al.key} className="text-center">
                        <p className="text-lg font-bold text-white/80">{atv[al.key] || 0}</p>
                        <p className="text-[9px] text-white/30">{al.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Atividades comparativas + Motivos de perda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={BarChart3}>Atividades Comparativas</SectionTitle>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={atividadesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="tipo" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Tayna" name="Tayna" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Gabrieli" name="Gabrieli" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

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
// TAB: CLIENTES
// =============================================
function TabClientes({ data, metrics }) {
  const [filtroVendedora, setFiltroVendedora] = useState('Todas')
  const [filtroTermometro, setFiltroTermometro] = useState('Todos')

  const clientes = data.clientesAtivos || []
  const vendedoras = [...new Set(clientes.map(c => c.responsavel))].filter(Boolean)

  const clientesFiltrados = clientes.filter(c => {
    if (filtroVendedora !== 'Todas' && c.responsavel !== filtroVendedora) return false
    if (filtroTermometro !== 'Todos' && c.termometro !== filtroTermometro) return false
    return true
  }).sort((a, b) => b.vendido - a.vendido)

  const termometroColors = { Quente: '#ef4444', Morno: '#f59e0b', Frio: '#3b82f6' }
  const totalCotado = clientesFiltrados.reduce((s, c) => s + c.valorCotado, 0)
  const totalVendido = clientesFiltrados.reduce((s, c) => s + c.vendido, 0)
  const convGeral = totalCotado > 0 ? Math.round((totalVendido / totalCotado) * 100) : 0

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Clientes Ativos" value={clientes.length} icon={Users} color="cyan" />
        <KPICard label="Valor Cotado" value={fmtCurrencyShort(totalCotado)} icon={Layers} color="amber" />
        <KPICard label="Valor Vendido" value={fmtCurrencyShort(totalVendido)} icon={DollarSign} color="emerald" />
        <KPICard label="Conversao Geral" value={`${convGeral}%`} icon={Target} color="violet" />
      </div>

      {/* Tabela de clientes */}
      <GlassCard>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <SectionTitle icon={Users} description="Carteira ativa com indicadores">Clientes</SectionTitle>
            <div className="flex items-center gap-3">
              <select
                value={filtroVendedora}
                onChange={e => setFiltroVendedora(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="Todas">Todas vendedoras</option>
                {vendedoras.map(v => <option key={v} value={v}>{v.split(' ')[0]}</option>)}
              </select>
              <select
                value={filtroTermometro}
                onChange={e => setFiltroTermometro(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="Todos">Todos termometros</option>
                <option value="Quente">Quente</option>
                <option value="Morno">Morno</option>
                <option value="Frio">Frio</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant="info">{clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Cliente</th>
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Perfil</th>
                  <th className="text-center py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Termometro</th>
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Responsavel</th>
                  <th className="text-center py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Deals</th>
                  <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Cotado</th>
                  <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Vendido</th>
                  <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((c, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-white/80 font-medium">{c.cliente}</td>
                    <td className="py-3 px-3 text-white/50">{c.perfil}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${termometroColors[c.termometro]}20`, color: termometroColors[c.termometro] }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: termometroColors[c.termometro] }} />
                        {c.termometro}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-white/50">{c.responsavel.split(' ')[0]}</td>
                    <td className="py-3 px-3 text-center text-white/60">{c.numDeals}</td>
                    <td className="py-3 px-3 text-right text-white/50">{fmtCurrency(c.valorCotado)}</td>
                    <td className="py-3 px-3 text-right font-medium text-white/80">{fmtCurrency(c.vendido)}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`text-sm font-semibold ${c.conversao >= 60 ? 'text-emerald-400' : c.conversao >= 40 ? 'text-amber-400' : 'text-white/30'}`}>{c.conversao}%</span>
                    </td>
                  </tr>
                ))}
                {clientesFiltrados.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-white/20 text-sm">Nenhum cliente encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

// =============================================
// TAB: PROJECAO
// =============================================
function TabProjecao({ data, metrics }) {
  // Per-seller calculations
  const sellerDefs = [
    { nome: 'Tayna Kazial', short: 'Tayna', color: '#06b6d4', gradId: 'gradTayna' },
    { nome: 'Gabrieli Muneretto', short: 'Gabrieli', color: '#8b5cf6', gradId: 'gradGabrieli' }
  ]

  const sellerStats = {}
  sellerDefs.forEach(s => {
    const won = (data.wonDeals || []).filter(d => d.vendedora === s.nome)
    const open = (data.openDeals || []).filter(d => d.vendedora === s.nome)
    const wonValor = won.reduce((sum, d) => sum + (d.valor || 0), 0)
    const openValor = open.reduce((sum, d) => sum + (d.valor || 0), 0)
    sellerStats[s.short] = {
      wonValor,
      wonCount: won.length,
      openValor,
      openCount: open.length,
      dailyRate: metrics.diaAtual > 0 ? wonValor / metrics.diaAtual : 0,
      projecaoMes: metrics.diaAtual > 0 ? (wonValor / metrics.diaAtual) * metrics.diasNoMes : 0
    }
  })

  const metaMensal = metrics.metaValor
  const metaSemanal = Math.round(metaMensal / 4)
  const convRate = (metrics.taxaConversao || 20) / 100
  const metaPerSeller = metaMensal / 2

  // Projecao geral
  const projecaoLinear = metrics.projecaoValor
  const projecaoPessimista = projecaoLinear * 0.85
  const projecaoOtimista = projecaoLinear * 1.15

  const cenarios = [
    { nome: 'Pessimista', valor: projecaoPessimista, cor: '#ef4444', desc: 'Ritmo reduz 15%' },
    { nome: 'Base', valor: projecaoLinear, cor: '#06b6d4', desc: 'Mantendo ritmo atual' },
    { nome: 'Otimista', valor: projecaoOtimista, cor: '#10b981', desc: 'Ritmo acelera 15%' },
  ]

  // Chart 1: Pace Mensal — acumulado diario vs meta
  const daysInMonth = metrics.diasNoMes
  const milestones = [1, 5, 10, 15, 20, 25, daysInMonth].filter((v, i, arr) => arr.indexOf(v) === i)
  const paceMensalData = milestones.map(d => ({
    dia: `D${d}`,
    Meta: Math.round((metaMensal / daysInMonth) * d),
    Tayna: Math.round(sellerStats.Tayna.dailyRate * d),
    Gabrieli: Math.round(sellerStats.Gabrieli.dailyRate * d)
  }))

  // Chart 2: Pace Semanal — acumulado no dia da semana vs meta semanal
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
  const paceSemanalData = weekDays.map((dia, i) => ({
    dia,
    Meta: Math.round((metaSemanal / 5) * (i + 1)),
    Tayna: Math.round(sellerStats.Tayna.dailyRate * (i + 1)),
    Gabrieli: Math.round(sellerStats.Gabrieli.dailyRate * (i + 1))
  }))

  // Charts 3 & 4: Volume de Oportunidades necessario vs atual
  // Pipeline necessario = (meta_restante_por_vendedora / taxa_conversao)
  // Mostra por semana do mes quanto pipeline cada vendedora precisa

  // Mensal: por semana do mes
  const volumeMensalData = [1, 2, 3, 4].map(sem => {
    const pctMes = sem / 4
    const point = { periodo: `Sem ${sem}` }
    sellerDefs.forEach(s => {
      const stats = sellerStats[s.short]
      const wonAteAqui = stats.wonValor * Math.min(pctMes, metrics.diaAtual / daysInMonth) / (metrics.diaAtual / daysInMonth || 1)
      const gap = Math.max(metaPerSeller - wonAteAqui, 0)
      const needed = convRate > 0 ? gap / convRate : 0
      point[`${s.short}_necessario`] = Math.round(needed)
      point[`${s.short}_pipeline`] = Math.round(stats.openValor)
    })
    return point
  })

  // Semanal: por dia da semana
  const volumeSemanalData = weekDays.map((dia, i) => {
    const pctSemana = (i + 1) / 5
    const metaSemPerSeller = metaSemanal / 2
    const point = { periodo: dia }
    sellerDefs.forEach(s => {
      const stats = sellerStats[s.short]
      const wonEstimado = stats.dailyRate * (i + 1)
      const gap = Math.max(metaSemPerSeller - wonEstimado, 0)
      const needed = convRate > 0 ? gap / convRate : 0
      point[`${s.short}_necessario`] = Math.round(needed)
      point[`${s.short}_pipeline`] = Math.round(stats.openValor)
    })
    return point
  })

  // Historico ticket medio e ciclo
  const eficienciaData = metrics.historico.map(h => ({
    mes: fmtMes(h.mes),
    ticketMedio: h.ticket_medio,
    ciclo: h.ciclo_medio_dias
  }))

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

      {/* 4 Charts de Projecao — 2x2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Pace Mensal */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={TrendingUp}>Pace Mensal vs Meta</SectionTitle>
            <p className="text-[11px] text-white/30 -mt-2 mb-4">Projecao acumulada por vendedora no ritmo atual</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={paceMensalData}>
                  <defs>
                    <linearGradient id="gradTayna" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradGabrieli" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="dia" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCurrencyShort(v)} />
                  <Tooltip content={<CustomTooltip formatter={v => fmtCurrency(v)} />} />
                  <Area type="monotone" dataKey="Tayna" name="Tayna" stroke="#06b6d4" strokeWidth={2} fill="url(#gradTayna)" />
                  <Area type="monotone" dataKey="Gabrieli" name="Gabrieli" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradGabrieli)" />
                  <Area type="monotone" dataKey="Meta" name="Meta" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Chart 2: Pace Semanal */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={TrendingUp}>Pace Semanal vs Meta</SectionTitle>
            <p className="text-[11px] text-white/30 -mt-2 mb-4">Projecao acumulada na semana atual</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={paceSemanalData}>
                  <defs>
                    <linearGradient id="gradTaynaSem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradGabrieliSem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="dia" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCurrencyShort(v)} />
                  <Tooltip content={<CustomTooltip formatter={v => fmtCurrency(v)} />} />
                  <Area type="monotone" dataKey="Tayna" name="Tayna" stroke="#06b6d4" strokeWidth={2} fill="url(#gradTaynaSem)" />
                  <Area type="monotone" dataKey="Gabrieli" name="Gabrieli" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradGabrieliSem)" />
                  <Area type="monotone" dataKey="Meta" name="Meta" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Chart 3: Volume Oportunidades Mensal */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={Layers}>Volume Oportunidades | Mes</SectionTitle>
            <p className="text-[11px] text-white/30 -mt-2 mb-4">Pipeline necessario vs atual (taxa conv. {fmtPct(metrics.taxaConversao, 0)})</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeMensalData}>
                  <defs>
                    <linearGradient id="gradTaynaVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradGabrieliVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="periodo" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCurrencyShort(v)} />
                  <Tooltip content={<CustomTooltip formatter={v => fmtCurrency(v)} />} />
                  <Area type="monotone" dataKey="Tayna_pipeline" name="Tayna Pipeline" stroke="#06b6d4" strokeWidth={2} fill="url(#gradTaynaVol)" />
                  <Area type="monotone" dataKey="Tayna_necessario" name="Tayna Necessario" stroke="#06b6d4" strokeWidth={2} fill="none" strokeDasharray="5 5" opacity={0.6} />
                  <Area type="monotone" dataKey="Gabrieli_pipeline" name="Gabrieli Pipeline" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradGabrieliVol)" />
                  <Area type="monotone" dataKey="Gabrieli_necessario" name="Gabrieli Necessario" stroke="#8b5cf6" strokeWidth={2} fill="none" strokeDasharray="5 5" opacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Chart 4: Volume Oportunidades Semanal */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={Layers}>Volume Oportunidades | Semana</SectionTitle>
            <p className="text-[11px] text-white/30 -mt-2 mb-4">Pipeline necessario vs atual na semana</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeSemanalData}>
                  <defs>
                    <linearGradient id="gradTaynaVolSem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradGabrieliVolSem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="periodo" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCurrencyShort(v)} />
                  <Tooltip content={<CustomTooltip formatter={v => fmtCurrency(v)} />} />
                  <Area type="monotone" dataKey="Tayna_pipeline" name="Tayna Pipeline" stroke="#06b6d4" strokeWidth={2} fill="url(#gradTaynaVolSem)" />
                  <Area type="monotone" dataKey="Tayna_necessario" name="Tayna Necessario" stroke="#06b6d4" strokeWidth={2} fill="none" strokeDasharray="5 5" opacity={0.6} />
                  <Area type="monotone" dataKey="Gabrieli_pipeline" name="Gabrieli Pipeline" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradGabrieliVolSem)" />
                  <Area type="monotone" dataKey="Gabrieli_necessario" name="Gabrieli Necessario" stroke="#8b5cf6" strokeWidth={2} fill="none" strokeDasharray="5 5" opacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Ticket Medio e Ciclo */}
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
  )
}
