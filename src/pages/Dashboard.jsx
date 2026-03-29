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
  const metaColorHex = pctMeta >= 100 ? '#10b981' : pctMeta >= 80 ? '#f59e0b' : '#ef4444'
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
  const stageIcons = ['FileText', 'MessageSquare', 'CheckCircle']

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
              const widthPct = Math.max(100 - (i * 15), 55)

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
                  <span className="text-[10px] text-white/25">{stage.nome.split(' ')[0]} â {next.nome.split(' ')[0]}</span>
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
    { key: 'ligacoes', label: 'Ligacoes', icon: 'ð', color: '#06b6d4' },
    { key: 'emails', label: 'Emails', icon: 'ð§', color: '#8b5cf6' },
    { key: 'whatsapp', label: 'WhatsApp', icon: 'ð¬', color: '#10b981' },
    { key: 'reunioes', label: 'Reunioes', icon: 'ð¤', color: '#f59e0b' },
    { key: 'propostas', label: 'Propostas', icon: 'ð', color: '#ec4899' },
    { key: 'followups', label: 'Follow-ups', icon: 'ð', color: '#ef4444' }
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
            <div className="flex items-center gap-3 flex-wrap">
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
            <Badge variant="info">{clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}</BadgOÙ]]Û\ÜÓ[YOHÝ\ÝË^X]]ÈXHÛ\ÜÓ[YOHËY[^\ÛHXYÛ\ÜÓ[YOHÜ\XÜ\]Ú]KÖÌ
HÛ\ÜÓ[YOH^[YKLÈLÈ^VÌL\H\\Ø\ÙHXÚÚ[Ë]ÚY\^]Ú]KÌÌÛ[YY][HÛY[OÝÛ\ÜÓ[YOH^[YKLÈLÈ^VÌL\H\\Ø\ÙHXÚÚ[Ë]ÚY\^]Ú]KÌÌÛ[YY][H\[ÝÛ\ÜÓ[YOH^XÙ[\KLÈLÈ^VÌL\H\\Ø\ÙHXÚÚ[Ë]ÚY\^]Ú]KÌÌÛ[YY][H\[ÛY]ÏÝÛ\ÜÓ[YOH^[YKLÈLÈ^VÌL\H\\Ø\ÙHXÚÚ[Ë]ÚY\^]Ú]KÌÌÛ[YY][H\ÜÛØ][ÝÛ\ÜÓ[YOH^XÙ[\KLÈLÈ^VÌL\H\\Ø\ÙHXÚÚ[Ë]ÚY\^]Ú]KÌÌÛ[YY][HX[ÏÝÛ\ÜÓ[YOH^\YÚKLÈLÈ^VÌL\H\\Ø\ÙHXÚÚ[Ë]ÚY\^]Ú]KÌÌÛ[YY][HÛÝYÏÝÛ\ÜÓ[YOH^\YÚKLÈLÈ^VÌL\H\\Ø\ÙHXÚÚ[Ë]ÚY\^]Ú]KÌÌÛ[YY][H[YÏÝÛ\ÜÓ[YOH^\YÚKLÈLÈ^VÌL\H\\Ø\ÙHXÚÚ[Ë]ÚY\^]Ú]KÌÌÛ[YY][HÛÛÝÝÝXYÙOØÛY[\Ñ[YÜËX\

ËJHO
Ù^O^Ú_HÛ\ÜÓ[YOHÜ\XÜ\]Ú]KÖÌ×HÝ\Ë]Ú]KÖÌH[Ú][ÛXÛÛÜÈÛ\ÜÓ[YOHKLÈLÈ^]Ú]KÎÛ[YY][HØËÛY[_OÝÛ\ÜÓ[YOHKLÈLÈ^]Ú]KÍLØË\[OÝÛ\ÜÓ[YOHKLÈLÈ^XÙ[\Ü[Û\ÜÓ[YOH[[KY^][\ËXÙ[\Ø\LKHLKLHÝ[YY[^VÌLHÛ\Ù[ZXÛÝ[O^ÞÈXÚÙÜÝ[	Ý\[ÛY]ÐÛÛÜÖØË\[ÛY]×_LÛÛÜ\[ÛY]ÐÛÛÜÖØË\[ÛY]×H_OÜ[Û\ÜÓ[YOHËLKHLKHÝ[YY[Ý[O^ÞÈXÚÙÜÝ[\[ÛY]ÐÛÛÜÖØË\[ÛY]×H_HÏØË\[ÛY]ßBÜÜ[ÝÛ\ÜÓ[YOHKLÈLÈ^]Ú]KÍLØË\ÜÛØ][Ü]
	È	ÊVÌ_OÝÛ\ÜÓ[YOHKLÈLÈ^XÙ[\^]Ú]KÍØË[QX[ßOÝÛ\ÜÓ[YOHKLÈLÈ^\YÚ^]Ú]KÍLÙ]Ý\[ÞJË[ÜÛÝYÊ_OÝÛ\ÜÓ[YOHKLÈLÈ^\YÚÛ[YY][H^]Ú]KÎÙ]Ý\[ÞJË[YÊ_OÝÛ\ÜÓ[YOHKLÈLÈ^\YÚÜ[Û\ÜÓ[YO^Ø^\ÛHÛ\Ù[ZXÛ	ØËÛÛ\Ø[ÈH
È	Ý^Y[Y\[M	ÈËÛÛ\Ø[ÈH
È	Ý^X[X\M	È	Ý^]Ú]KÌÌ	ßXOØËÛÛ\Ø[ßIOÜÜ[ÝÝ
J_BØÛY[\Ñ[YÜË[ÝOOH	
ÛÛÜ[^ÎHÛ\ÜÓ[YOHKN^XÙ[\^]Ú]KÌ^\ÛH[[HÛY[H[ÛÛYÏÝÝ
_BÝÙOÝXOÙ]Ù]ÑÛ\ÜÐØ\Ù]
BBËÈOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOBËÈPÒPÐSÂËÈOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOB[Ý[ÛXÚXØ[ÊÈ]KY]XÜÈJHÂËÈ\\Ù[\Ø[Ý[][ÛÂÛÛÝÙ[\YÈHÂÈÛYN	Õ^[HØ^X[	ËÚÜ	Õ^[IËÛÛÜ	ÈÌ

	ËÜYY	ÙÜY^[IÈKÈÛYN	ÑØXY[H][\]ÉËÚÜ	ÑØXY[IËÛÛÜ	ÈÎXÙËÜYY	ÙÜYØXY[IÈBBÛÛÝÙ[\Ý]ÈHßBÙ[\YËÜXXÚ
ÈOÂÛÛÝÛÛH
]KÛÛX[È×JK[\O[YÜHOOHËÛYJBÛÛÝÜ[H
]KÜ[X[È×JK[\O[YÜHOOHËÛYJBÛÛÝÛÛ[ÜHÛÛYXÙJ
Ý[K
HOÝ[H
È
[Ü
K
BÛÛÝÜ[[ÜHÜ[YXÙJ
Ý[K
HOÝ[H
È
[Ü
K
BÙ[\Ý]ÖÜËÚÜHHÂÛÛ[ÜÛÛÛÝ[ÛÛ[ÝÜ[[ÜÜ[ÛÝ[Ü[[ÝZ[T]NY]XÜËXP]X[ÈÛÛ[ÜÈY]XÜËXP]X[ÚXØ[ÓY\ÎY]XÜËXP]X[È
ÛÛ[ÜÈY]XÜËXP]X[
H
Y]XÜËX\ÓÓY\ÈBJBÛÛÝY]SY[Ø[HY]XÜËY]U[ÜÛÛÝY]TÙ[X[[HX]Ý[
Y]SY[Ø[È
BÛÛÝÛÛ]HH
Y]XÜË^PÛÛ\Ø[È
HÈLÛÛÝY]T\Ù[\HY]SY[Ø[ÈËÈÚXØ[ÈÙ\[ÛÛÝÚXØ[Ó[X\HY]XÜËÚXØ[Õ[ÜÛÛÝÚXØ[Ô\ÜÚ[Z\ÝHHÚXØ[Ó[X\

BÛÛÝÚXØ[ÓÝ[Z\ÝHHÚXØ[Ó[X\
KMBÛÛÝÙ[\[ÜÈHÂÈÛYN	Ô\ÜÚ[Z\ÝIË[ÜÚXØ[Ô\ÜÚ[Z\ÝKÛÜ	ÈÙY


	Ë\ØÎ	Ô][ÈY^MIIÈKÈÛYN	Ð\ÙIË[ÜÚXØ[Ó[X\ÛÜ	ÈÌ

	Ë\ØÎ	ÓX[[È][È]X[	ÈKÈÛYN	ÓÝ[Z\ÝIË[ÜÚXØ[ÓÝ[Z\ÝKÛÜ	ÈÌLNIË\ØÎ	Ô][ÈXÙ[\HMIIÈKBËÈÚ\NXÙHY[Ø[8 %XÝ[][YÈX\[ÈÈY]BÛÛÝ^\Ò[[ÛHY]XÜËX\ÓÓY\ÂÛÛÝZ[\ÝÛ\ÈHÌK
KLMKK^\Ò[[ÛK[\
K\HO\[^ÙHOOHJBÛÛÝXÙSY[Ø[]HHZ[\ÝÛ\ËX\
O
ÂXN	ÙXY]NX]Ý[

Y]SY[Ø[È^\Ò[[Û
H

K^[NX]Ý[
Ù[\Ý]Ë^[KZ[T]H

KØXY[NX]Ý[
Ù[\Ý]ËØXY[KZ[T]H

BJJBËÈÚ\XÙHÙ[X[[8 %XÝ[][YÈÈXHHÙ[X[HÈY]HÙ[X[[ÛÛÝÙYZÑ^\ÈHÉÔÙYÉË	Õ\Ë	Ô]XIË	Ô]ZIË	ÔÙ^	×BÛÛÝXÙTÙ[X[[]HHÙYZÑ^\ËX\

XKJHO
ÂXKY]NX]Ý[

Y]TÙ[X[[È
JH

H
ÈJJK^[NX]Ý[
Ù[\Ý]Ë^[KZ[T]H

H
ÈJJKØXY[NX]Ý[
Ù[\Ý]ËØXY[KZ[T]H

H
ÈJJBJJBËÈÚ\ÈÈ	
Û[YHHÜÜ[YY\ÈXÙ\ÜØ\[ÈÈ]X[ËÈ\[[HXÙ\ÜØ\[ÈH
Y]WÜ\Ý[WÜÜÝ[YÜHÈ^WØÛÛ\Ø[ÊBËÈ[ÜÝHÜÙ[X[HÈY\È]X[È\[[HØYH[YÜHXÚ\ØBËÈY[Ø[ÜÙ[X[HÈY\ÂÛÛÝÛ[YSY[Ø[]HHÌKË
KX\
Ù[HOÂÛÛÝÝY\ÈHÙ[HÈ
ÛÛÝÚ[HÈ\[ÙÎÙ[H	ÜÙ[_XBÙ[\YËÜXXÚ
ÈOÂÛÛÝÝ]ÈHÙ[\Ý]ÖÜËÚÜBÛÛÝÛÛ]P\]ZHHÝ]ËÛÛ[Ü
X]Z[ÝY\ËY]XÜËXP]X[È^\Ò[[Û
HÈ
Y]XÜËXP]X[È^\Ò[[ÛJBÛÛÝØ\HX]X^
Y]T\Ù[\HÛÛ]P\]ZK
BÛÛÝYYYHÛÛ]HÈØ\ÈÛÛ]HÚ[Ø	ÜËÚÜWÛXÙ\ÜØ\[ØHHX]Ý[
YYY
BÚ[Ø	ÜËÚÜWÜ\[[XHHX]Ý[
Ý]ËÜ[[ÜBJB]\Ú[JBËÈÙ[X[[ÜXHHÙ[X[BÛÛÝÛ[YTÙ[X[[]HHÙYZÑ^\ËX\

XKJHOÂÛÛÝÝÙ[X[HH
H
ÈJHÈ
BÛÛÝY]TÙ[T\Ù[\HY]TÙ[X[[ÈÛÛÝÚ[HÈ\[ÙÎXHBÙ[\YËÜXXÚ
ÈOÂÛÛÝÝ]ÈHÙ[\Ý]ÖÜËÚÜBÛÛÝÛÛ\Ý[XYÈHÝ]ËZ[T]H

H
ÈJBÛÛÝØ\HX]X^
Y]TÙ[T\Ù[\HÛÛ\Ý[XYË
BÛÛÝYYYHÛÛ]HÈØ\ÈÛÛ]HÚ[Ø	ÜËÚÜWÛXÙ\ÜØ\[ØHHX]Ý[
YYY
BÚ[Ø	ÜËÚÜWÜ\[[XHHX]Ý[
Ý]ËÜ[[ÜBJB]\Ú[JBËÈ\ÝÜXÛÈXÚÙ]YY[ÈHÚXÛÂÛÛÝYXÚY[ÚXQ]HHY]XÜË\ÝÜXÛËX\
O
ÂY\Î]Y\ÊY\ÊKXÚÙ]YY[ÎXÚÙ]ÛYY[ËÚXÛÎÚXÛ×ÛYY[×ÙX\ÂJJB]\
]Û\ÜÓ[YOHÜXÙK^KNËÊÔ\ÈÚXØ[È
ßB]Û\ÜÓ[YOHÜYÜYXÛÛËLYÜYXÛÛËMØ\MÔPØ\X[HÚXØ[È[X\[YO^Ù]Ý\[ÞTÚÜ
ÚXØ[Ó[X\_HÝX]O^ØXH	ÛY]XÜËXP]X[KÉÛY]XÜËX\ÓÓY\ßXHXÛÛ^Õ[[Õ\HÛÛÜHÞX[ÏÔPØ\X[HØ\\HY]H[YO^ÛY]XÜËØ\Y]HÈ]Ý\[ÞTÚÜ
Y]XÜËØ\Y]JH	ÓY]H]YHIßHÝX]O^ÛY]XÜËØ\Y]HÈ[[H	Ù]Ý\[ÞTÚÜ
Y]XÜËØ\Y]J_X[Y[YHXÛÛ^Õ\Ù]HÛÛÜ^ÛY]XÜËØ\Y]HÈ	Ø[X\È	Ù[Y\[	ßHÏÔPØ\X[H[[Ý[ÚX[[YO^Ù]Ý\[ÞTÚÜ
Y]XÜËÝ[[[[Ü_HÝX]O^Ø	ÛY]XÜËÝ[[[ÛÝ[HX[ÈX\ÜØHXÛÛ^Ñ[[HÛÛÜH[Û]ÏÔPØ\X[H[ØÚYYKÑXH[YO^Ù]Ý\[ÞTÚÜ
Y]XÜËXP]X[ÈY]XÜËÝ[ÛÛ[ÜÈY]XÜËXP]X[
_HÝX]OHYYXHX\XHXÛÛ^Ö\HÛÛÜH[Y\[ÏÙ]ËÊÙ[\[ÜÈ
ßBÛ\ÜÐØ\]Û\ÜÓ[YOHMÙXÝ[Û]HXÛÛ^Õ[[Õ\H\ØÜ\[Û^ØÚXØ[È\H	Ù]Y\Ñ[
Y]XÜËY\Ð]X[
_XOÙ[\[ÜÈHXÚ[Y[ÏÔÙXÝ[Û]O]Û\ÜÓ[YOHÜYÜYXÛÛËLHYÜYXÛÛËLÈØ\M]MØÙ[\[ÜËX\

ËJHOÂÛÛÝÓY]HHY]XÜËY]U[ÜÈ
Ë[ÜÈY]XÜËY]U[ÜH
L]\
]Ù^O^Ú_HÛ\ÜÓ[YOHÝ[Y^Ü\Ü\]Ú]KÖÌ
HMHÝ[O^ÞÈXÚÙÜÝ[	ØËÛÜL_O]Û\ÜÓ[YOH^][\ËXÙ[\Ø\LXLÈ]Û\ÜÓ[YOHËLÈLÈÝ[YY[Ý[O^ÞÈXÚÙÜÝ[ËÛÜ_HÏÛ\ÜÓ[YOH^\ÛHÛ[YY][H^]Ú]KÍÌØËÛY_OÜÙ]Û\ÜÓ[YOH^LÛXÛXLHÝ[O^ÞÈÛÛÜËÛÜ_OÙ]Ý\[ÞTÚÜ
Ë[Ü_OÜÛ\ÜÓ[YOH^^È^]Ú]KÌÌXLØË\ØßOÜ]Û\ÜÓ[YOH^][\ËXÙ[\Ø\LÙÜ\ÜÐ\[YO^ØË[ÜHX^^ÛY]XÜËY]U[ÜHÛÛÜ^ØËÛÜOOH	ÈÌLNIÈÈ	Ù[Y\[	ÈËÛÜOOH	ÈÙY


	ÈÈ	ÜÜÙIÈ	ØÞX[ßHÚ^OHÛHÚÝÓX[^Ù[Ù_HÏÜ[Û\ÜÓ[YOH^^ÈÛ[YY][H^]Ú]KÍÚ[ËLÙ]Ý
ÓY]K
_HHY]OÜÜ[Ù]Ù]
BJ_BÙ]Ù]ÑÛ\ÜÐØ\ËÊ
Ú\ÈHÚXØ[È8 %ÜY
ßB]Û\ÜÓ[YOHÜYÜYXÛÛËLHÎÜYXÛÛËLØ\MËÊÚ\NXÙHY[Ø[
ßBÛ\ÜÐØ\]Û\ÜÓ[YOHMÙXÝ[Û]HXÛÛ^Õ[[Õ\OXÙHY[Ø[ÈY]OÔÙXÝ[Û]OÛ\ÜÓ[YOH^VÌL\H^]Ú]KÌÌ[]LXMÚXØ[ÈXÝ[][YHÜ[YÜHÈ][È]X[Ü]Û\ÜÓ[YOHVÌH\ÜÛÚ]PÛÛZ[\ÚYHL	HZYÚHL	H\XPÚ\]O^ÜXÙSY[Ø[]_OYÏ[X\ÜYY[YHÜY^[HOHLOHHLHHÝÜÙÙ]HIHÝÜÛÛÜHÌ

ÝÜÜXÚ]O^ÌßHÏÝÜÙÙ]HMIHÝÜÛÛÜHÌ

ÝÜÜXÚ]O^ÌHÏÛ[X\ÜYY[[X\ÜYY[YHÜYØXY[HOHLOHHLHHÝÜÙÙ]HIHÝÜÛÛÜHÎXÙÝÜÜXÚ]O^ÌßHÏÝÜÙÙ]HMIHÝÜÛÛÜHÎXÙÝÜÜXÚ]O^ÌHÏÛ[X\ÜYY[ÙYÏØ\\ÚX[ÜYÝÚÙQ\Ú\^OHÈÈÝÚÙOHØJMKMKMK
HÏ^\È]RÙ^OHXHXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HÏP^\ÈXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HXÚÑÜX]\^ÝO]Ý\[ÞTÚÜ
_HÏÛÛ\ÛÛ[^ÏÝ\ÝÛUÛÛ\ÜX]\^ÝO]Ý\[ÞJ_HÏHÏ\XH\OH[ÛÝÛH]RÙ^OH^[H[YOH^[HÝÚÙOHÌ

ÝÚÙUÚY^ÌH[H\
ÙÜY^[JHÏ\XH\OH[ÛÝÛH]RÙ^OHØXY[H[YOHØXY[HÝÚÙOHÎXÙÝÚÙUÚY^ÌH[H\
ÙÜYØXY[JHÏ\XH\OH[ÛÝÛH]RÙ^OHY]H[YOHY]HÝÚÙOHÙNYLÝÚÙUÚY^ÌH[HÛHÝÚÙQ\Ú\^OHH
HÏÐ\XPÚ\Ô\ÜÛÚ]PÛÛZ[\Ù]Ù]ÑÛ\ÜÐØ\ËÊÚ\XÙHÙ[X[[
ßBÛ\ÜÐØ\]Û\ÜÓ[YOHMÙXÝ[Û]HXÛÛ^Õ[[Õ\OXÙHÙ[X[[ÈY]OÔÙXÝ[Û]OÛ\ÜÓ[YOH^VÌL\H^]Ú]KÌÌ[]LXMÚXØ[ÈXÝ[][YHHÙ[X[H]X[Ü]Û\ÜÓ[YOHVÌH\ÜÛÚ]PÛÛZ[\ÚYHL	HZYÚHL	H\XPÚ\]O^ÜXÙTÙ[X[[]_OYÏ[X\ÜYY[YHÜY^[TÙ[HOHLOHHLHHÝÜÙÙ]HIHÝÜÛÛÜHÌ

ÝÜÜXÚ]O^ÌßHÏÝÜÙÙ]HMIHÝÜÛÛÜHÌ

ÝÜÜXÚ]O^ÌHÏÛ[X\ÜYY[[X\ÜYY[YHÜYØXY[TÙ[HOHLOHHLHHÝÜÙÙ]HIHÝÜÛÛÜHÎXÙÝÜÜXÚ]O^ÌßHÏÝÜÙÙ]HMIHÝÜÛÛÜHÎXÙÝÜÜXÚ]O^ÌHÏÛ[X\ÜYY[ÙYÏØ\\ÚX[ÜYÝÚÙQ\Ú\^OHÈÈÝÚÙOHØJMKMKMK
HÏ^\È]RÙ^OHXHXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HÏP^\ÈXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HXÚÑÜX]\^ÝO]Ý\[ÞTÚÜ
_HÏÛÛ\ÛÛ[^ÏÝ\ÝÛUÛÛ\ÜX]\^ÝO]Ý\[ÞJ_HÏHÏ\XH\OH[ÛÝÛH]RÙ^OH^[H[YOH^[HÝÚÙOHÌ

ÝÚÙUÚY^ÌH[H\
ÙÜY^[TÙ[JHÏ\XH\OH[ÛÝÛH]RÙ^OHØXY[H[YOHØXY[HÝÚÙOHÎXÙÝÚÙUÚY^ÌH[H\
ÙÜYØXY[TÙ[JHÏ\XH\OH[ÛÝÛH]RÙ^OHY]H[YOHY]HÝÚÙOHÙNYLÝÚÙUÚY^ÌH[HÛHÝÚÙQ\Ú\^OHH
HÏÐ\XPÚ\Ô\ÜÛÚ]PÛÛZ[\Ù]Ù]ÑÛ\ÜÐØ\ËÊÚ\ÎÛ[YHÜÜ[YY\ÈY[Ø[
ßBÛ\ÜÐØ\]Û\ÜÓ[YOHMÙXÝ[Û]HXÛÛ^Ó^Y\ßOÛ[YHÜÜ[YY\ÈY\ÏÔÙXÝ[Û]OÛ\ÜÓ[YOH^VÌL\H^]Ú]KÌÌ[]LXM\[[HXÙ\ÜØ\[ÈÈ]X[
^HÛÛÙ]Ý
Y]XÜË^PÛÛ\Ø[Ë
_JOÜ]Û\ÜÓ[YOHVÌH\ÜÛÚ]PÛÛZ[\ÚYHL	HZYÚHL	H\XPÚ\]O^ÝÛ[YSY[Ø[]_OYÏ[X\ÜYY[YHÜY^[UÛOHLOHHLHHÝÜÙÙ]HIHÝÜÛÛÜHÌ

ÝÜÜXÚ]O^Ì_HÏÝÜÙÙ]HMIHÝÜÛÛÜHÌ

ÝÜÜXÚ]O^ÌHÏÛ[X\ÜYY[[X\ÜYY[YHÜYØXY[UÛOHLOHHLHHÝÜÙÙ]HIHÝÜÛÛÜHÎXÙÝÜÜXÚ]O^Ì_HÏÝÜÙÙ]HMIHÝÜÛÛÜHÎXÙÝÜÜXÚ]O^ÌHÏÛ[X\ÜYY[ÙYÏØ\\ÚX[ÜYÝÚÙQ\Ú\^OHÈÈÝÚÙOHØJMKMKMK
HÏ^\È]RÙ^OH\[ÙÈXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HÏP^\ÈXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HXÚÑÜX]\^ÝO]Ý\[ÞTÚÜ
_HÏÛÛ\ÛÛ[^ÏÝ\ÝÛUÛÛ\ÜX]\^ÝO]Ý\[ÞJ_HÏHÏ\XH\OH[ÛÝÛH]RÙ^OH^[WÜ\[[H[YOH^[H\[[HÝÚÙOHÌ

ÝÚÙUÚY^ÌH[H\
ÙÜY^[UÛ
HÏ\XH\OH[ÛÝÛH]RÙ^OH^[WÛXÙ\ÜØ\[È[YOH^[HXÙ\ÜØ\[ÈÝÚÙOHÌ

ÝÚÙUÚY^ÌH[HÛHÝÚÙQ\Ú\^OHH
HÜXÚ]O^ÌHÏ\XH\OH[ÛÝÛH]RÙ^OHØXY[WÜ\[[H[YOHØXY[H\[[HÝÚÙOHÎXÙÝÚÙUÚY^ÌH[H\
ÙÜYØXY[UÛ
HÏ\XH\OH[ÛÝÛH]RÙ^OHØXY[WÛXÙ\ÜØ\[È[YOHØXY[HXÙ\ÜØ\[ÈÝÚÙOHÎXÙÝÚÙUÚY^ÌH[HÛHÝÚÙQ\Ú\^OHH
HÜXÚ]O^ÌHÏÐ\XPÚ\Ô\ÜÛÚ]PÛÛZ[\Ù]Ù]ÑÛ\ÜÐØ\ËÊÚ\
Û[YHÜÜ[YY\ÈÙ[X[[
ßBÛ\ÜÐØ\]Û\ÜÓ[YOHMÙXÝ[Û]HXÛÛ^Ó^Y\ßOÛ[YHÜÜ[YY\ÈÙ[X[OÔÙXÝ[Û]OÛ\ÜÓ[YOH^VÌL\H^]Ú]KÌÌ[]LXM\[[HXÙ\ÜØ\[ÈÈ]X[HÙ[X[OÜ]Û\ÜÓ[YOHVÌH\ÜÛÚ]PÛÛZ[\ÚYHL	HZYÚHL	H\XPÚ\]O^ÝÛ[YTÙ[X[[]_OYÏ[X\ÜYY[YHÜY^[UÛÙ[HOHLOHHLHHÝÜÙÙ]HIHÝÜÛÛÜHÌ

ÝÜÜXÚ]O^Ì_HÏÝÜÙÙ]HMIHÝÜÛÛÜHÌ

ÝÜÜXÚ]O^ÌHÏÛ[X\ÜYY[[X\ÜYY[YHÜYØXY[UÛÙ[HOHLOHHLHHÝÜÙÙ]HIHÝÜÛÛÜHÎXÙÝÜÜXÚ]O^Ì_HÏÝÜÙÙ]HMIHÝÜÛÛÜHÎXÙÝÜÜXÚ]O^ÌHÏÛ[X\ÜYY[ÙYÏØ\\ÚX[ÜYÝÚÙQ\Ú\^OHÈÈÝÚÙOHØJMKMKMK
HÏ^\È]RÙ^OH\[ÙÈXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HÏP^\ÈXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HXÚÑÜX]\^ÝO]Ý\[ÞTÚÜ
_HÏÛÛ\ÛÛ[^ÏÝ\ÝÛUÛÛ\ÜX]\^ÝO]Ý\[ÞJ_HÏHÏ\XH\OH[ÛÝÛH]RÙ^OH^[WÜ\[[H[YOH^[H\[[HÝÚÙOHÌ

ÝÚÙUÚY^ÌH[H\
ÙÜY^[UÛÙ[JHÏ\XH\OH[ÛÝÛH]RÙ^OH^[WÛXÙ\ÜØ\[È[YOH^[HXÙ\ÜØ\[ÈÝÚÙOHÌ

ÝÚÙUÚY^ÌH[HÛHÝÚÙQ\Ú\^OHH
HÜXÚ]O^ÌHÏ\XH\OH[ÛÝÛH]RÙ^OHØXY[WÜ\[[H[YOHØXY[H\[[HÝÚÙOHÎXÙÝÚÙUÚY^ÌH[H\
ÙÜYØXY[UÛÙ[JHÏ\XH\OH[ÛÝÛH]RÙ^OHØXY[WÛXÙ\ÜØ\[È[YOHØXY[HXÙ\ÜØ\[ÈÝÚÙOHÎXÙÝÚÙUÚY^ÌH[HÛHÝÚÙQ\Ú\^OHH
HÜXÚ]O^ÌHÏÐ\XPÚ\Ô\ÜÛÚ]PÛÛZ[\Ù]Ù]ÑÛ\ÜÐØ\Ù]ËÊXÚÙ]YY[ÈHÚXÛÈ
ßBÛ\ÜÐØ\]Û\ÜÓ[YOHMÙXÝ[Û]HXÛÛ^ÐÛØÚßOXÚÙ]YY[ÈHÚXÛÈH[OÔÙXÝ[Û]O]Û\ÜÓ[YOHVÌÌH\ÜÛÚ]PÛÛZ[\ÚYHL	HZYÚHL	H\XPÚ\]O^ÙYXÚY[ÚXQ]_OYÏ[X\ÜYY[YHÜYXÚÙ]OHLOHHLHHÝÜÙÙ]HIHÝÜÛÛÜHÎXÙÝÜÜXÚ]O^ÌßHÏÝÜÙÙ]HMIHÝÜÛÛÜHÎXÙÝÜÜXÚ]O^ÌHÏÛ[X\ÜYY[ÙYÏØ\\ÚX[ÜYÝÚÙQ\Ú\^OHÈÈÝÚÙOHØJMKMKMK
HÏ^\È]RÙ^OHY\ÈXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HÏP^\ÈP^\ÒYHYXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HXÚÑÜX]\^ÝO]Ý\[ÞTÚÜ
_HÏP^\ÈP^\ÒYHYÚÜY[][ÛHYÚXÚÏ^ÞÈ[	ÜØJMKMKMK
IËÛÚ^NLH_H^\Ó[O^Ù[Ù_HXÚÓ[O^Ù[Ù_HXÚÑÜX]\^ÝO	ÝYHÏÛÛ\ÛÛ[^ÏÝ\ÝÛUÛÛ\ÜX]\^Ê[YJHO[YHOOH	ÐÚXÛÈ
X\ÊIÈÈ	ÝHX\Ø]Ý\[ÞJ_HÏHÏ\XHP^\ÒYHY\OH[ÛÝÛH]RÙ^OHXÚÙ]YY[È[YOHXÚÙ]YY[ÈÝÚÙOHÎXÙÝÚÙUÚY^ÌH[H\
ÙÜYXÚÙ]
HÏ\XHP^\ÒYHYÚ\OH[ÛÝÛH]RÙ^OHÚXÛÈ[YOHÚXÛÈ
X\ÊHÝÚÙOHÙNYLÝÚÙUÚY^ÌH[HÛHÝÚÙQ\Ú\^OHH
HÏÐ\XPÚ\Ô\ÜÛÚ]PÛÛZ[\Ù]Ù]ÑÛ\ÜÐØ\Ù]
BB
