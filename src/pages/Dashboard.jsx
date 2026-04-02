import { useState } from 'react'
import {
  BarChart3, Funnel, Users, ArrowLeftRight, TrendingUp,
  RefreshCw, AlertTriangle, Clock, Target, DollarSign,
  Award, XCircle, ArrowUpRight, ArrowDownRight, Zap,
  ChevronRight, Layers, Truck, Ban, CheckCircle, Phone, Activity,
  Columns2, TrendingDown, ExternalLink
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
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
  { id: 'insideSales', label: 'Inside Sales', icon: Users },
  { id: 'closerFTL', label: 'Closer FTL', icon: Truck },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'projecao', label: 'Projecao', icon: TrendingUp },
]

const STAGE_COLORS = {
  'Pedido de Cotacao': '#f59e0b',
  'Em Negociacao': '#06b6d4',
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
    insideSales: TabInsideSales,
    closerFTL: TabCloserFTL,
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
  const [expandedCard, setExpandedCard] = useState(null)
  const [expandedFat, setExpandedFat] = useState(null)

  const chartData = metrics.historico.map(h => ({
    mes: fmtMes(h.mes),
    oportunidades: (h.won_count || 0) + (h.lost_count || 0),
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

      {/* FAIXA 2: Deals Ganhos / Perdidos / Abertos — clicaveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'won', label: 'Deals Ganhos', count: metrics.totalWonCount, valor: metrics.totalWonValor, color: 'emerald', Icon: Award, deals: data.wonDeals || [] },
          { key: 'lost', label: 'Deals Perdidos', count: metrics.totalLostCount, valor: metrics.totalLostValor, color: 'rose', Icon: XCircle, deals: data.lostDeals || [] },
          { key: 'open', label: 'Deals Abertos', count: metrics.totalFunilCount, valor: metrics.totalFunilValor, color: 'cyan', Icon: Layers, deals: data.openDeals || [] },
        ].map(card => (
          <div key={card.key}>
            <GlassCard hover>
              <div
                className={`p-5 border-l-2 border-${card.color}-500/20 cursor-pointer select-none`}
                onClick={() => setExpandedCard(expandedCard === card.key ? null : card.key)}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium">{card.label}</p>
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${card.color}-500/10 to-${card.color}-500/5 flex items-center justify-center`}>
                    <card.Icon size={16} className={`text-${card.color}-400`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold text-${card.color}-400 mb-1`}>{card.count}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/50">{fmtCurrency(card.valor)}</p>
                  <span className="text-[10px] text-white/25">{expandedCard === card.key ? 'fechar' : 'ver deals'} ▾</span>
                </div>
              </div>
            </GlassCard>
            {expandedCard === card.key && (
              <div className="mt-1 rounded-xl border border-white/[0.06] bg-[#0d0d24]/90 backdrop-blur-md">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0d0d24]">
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 px-3 text-[10px] uppercase text-white/30">Empresa</th>
                      <th className="text-right py-2 px-3 text-[10px] uppercase text-white/30">Valor</th>
                      <th className="text-left py-2 px-3 text-[10px] uppercase text-white/30">Vendedora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.deals.slice(0, 30).map((d, i) => (
                      <tr key={d.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-1.5 px-3 text-white/70">{d.empresa || d.titulo}</td>
                        <td className={`py-1.5 px-3 text-right font-medium text-${card.color}-400`}>{fmtCurrency(d.valor)}</td>
                        <td className="py-1.5 px-3 text-white/40">{(d.vendedora || '').split(' ')[0]}</td>
                      </tr>
                    ))}
                    {card.deals.length > 30 && (
                      <tr><td colSpan={3} className="py-2 text-center text-white/20 text-[10px]">+{card.deals.length - 30} deals</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
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
        const fatColorHex = pctFaturadoMeta >= 100 ? '#10b981' : pctFaturadoMeta >= 80 ? '#f59e0b' : '#ef4444'
        const fatColorText = pctFaturadoMeta >= 100 ? 'text-emerald-400' : pctFaturadoMeta >= 80 ? 'text-amber-400' : 'text-rose-400'
        const fatColorBg = pctFaturadoMeta >= 100 ? 'from-emerald-500/10 to-emerald-500/5' : pctFaturadoMeta >= 80 ? 'from-amber-500/10 to-amber-500/5' : 'from-rose-500/10 to-rose-500/5'
        const fatColorBorder = pctFaturadoMeta >= 100 ? 'border-emerald-500/20' : pctFaturadoMeta >= 80 ? 'border-amber-500/20' : 'border-rose-500/20'

        return (
          <>
            {/* Faturado com barra de progresso — clicavel para ver cargas */}
            <div>
              <GlassCard>
                <div
                  className={`p-6 border-l-4 ${fatColorBorder} cursor-pointer select-none`}
                  onClick={() => setExpandedFat(expandedFat === 'faturado' ? null : 'faturado')}
                >
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
                  <div className="flex justify-end mt-2">
                    <span className="text-[10px] text-white/25">{expandedFat === 'faturado' ? 'fechar' : 'ver cargas'} ▾</span>
                  </div>
                </div>
              </GlassCard>
              {expandedFat === 'faturado' && (
                <div className="mt-1 rounded-xl border border-white/[0.06] bg-[#0d0d24]/90 backdrop-blur-md">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#0d0d24]">
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left py-2 px-3 text-[10px] uppercase text-white/30">Carga</th>
                        <th className="text-right py-2 px-3 text-[10px] uppercase text-white/30">Frete</th>
                        <th className="text-left py-2 px-3 text-[10px] uppercase text-white/30">Status</th>
                        <th className="text-left py-2 px-3 text-[10px] uppercase text-white/30">Coleta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(faturado.tasks || []).slice(0, 30).map((t, i) => (
                        <tr key={t.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="py-1.5 px-3 text-white/70">{t.customId || t.nome}</td>
                          <td className={`py-1.5 px-3 text-right font-medium ${fatColorText}`}>{fmtCurrency(t.freteEmpresa)}</td>
                          <td className="py-1.5 px-3 text-white/40 capitalize">{t.status}</td>
                          <td className="py-1.5 px-3 text-white/40">{t.dataColeta}</td>
                        </tr>
                      ))}
                      {(faturado.tasks || []).length === 0 && (
                        <tr><td colSpan={4} className="py-3 text-center text-white/20 text-[10px]">Nenhuma carga faturada no periodo</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Vendido vs Faturado % + Perdas/No Show */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <GlassCard hover>
                  <div
                    className="p-5 border-l-2 border-blue-500/20 cursor-pointer select-none"
                    onClick={() => setExpandedFat(expandedFat === 'vendidoFat' ? null : 'vendidoFat')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[11px] uppercase tracking-[0.15em] text-white/40 font-medium">Vendido vs Faturado</p>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center">
                        <ArrowLeftRight size={16} className="text-blue-400" />
                      </div>
                    </div>
                    <p className={`text-2xl font-bold mb-1 ${pctVendidoFaturado >= 90 ? 'text-emerald-400' : pctVendidoFaturado >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {fmtPct(pctVendidoFaturado, 1)}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/50">
                        {fmtCurrency(totalFaturado)} de {fmtCurrency(totalVendido)} vendidos
                      </p>
                      <span className="text-[10px] text-white/25">{expandedFat === 'vendidoFat' ? 'fechar' : 'ver deals'} ▾</span>
                    </div>
                  </div>
                </GlassCard>
                {expandedFat === 'vendidoFat' && (
                  <div className="mt-1 rounded-xl border border-white/[0.06] bg-[#0d0d24]/90 backdrop-blur-md">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#0d0d24]">
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-left py-2 px-3 text-[10px] uppercase text-white/30">Empresa</th>
                          <th className="text-left py-2 px-3 text-[10px] uppercase text-white/30">Vendedora</th>
                          <th className="text-right py-2 px-3 text-[10px] uppercase text-white/30">Valor</th>
                          <th className="text-right py-2 px-3 text-[10px] uppercase text-white/30">Ganho em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.wonDeals || []).slice(0, 50).map((d, i) => (
                          <tr key={d.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                            <td className="py-1.5 px-3 text-white/70">{d.empresa || d.titulo}</td>
                            <td className="py-1.5 px-3 text-white/40">{(d.vendedora || '').split(' ')[0]}</td>
                            <td className="py-1.5 px-3 text-right font-medium text-emerald-400">{fmtCurrency(d.valor)}</td>
                            <td className="py-1.5 px-3 text-right text-white/30">{d.dataGanho ? d.dataGanho.split('-').reverse().join('/') : '-'}</td>
                          </tr>
                        ))}
                        {(data.wonDeals || []).length === 0 && (
                          <tr><td colSpan={4} className="py-3 text-center text-white/20 text-[10px]">Nenhum deal ganho no periodo</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <GlassCard hover>
                  <div
                    className="p-5 border-l-2 border-rose-500/40 cursor-pointer select-none"
                    onClick={() => setExpandedFat(expandedFat === 'perdas' ? null : 'perdas')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-[11px] uppercase tracking-[0.15em] text-rose-400/80 font-medium">Perdas / No Show</p>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-rose-500/10 flex items-center justify-center">
                        <AlertTriangle size={16} className="text-rose-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-rose-400 mb-1">{fmtCurrency(perdasPositivo)}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-rose-400/50">GAP entre vendido e faturado</p>
                      <span className="text-[10px] text-white/25">{expandedFat === 'perdas' ? 'fechar' : 'ver perdas'} ▾</span>
                    </div>
                  </div>
                </GlassCard>
                {expandedFat === 'perdas' && (
                  <div className="mt-1 rounded-xl border border-white/[0.06] bg-[#0d0d24]/90 backdrop-blur-md">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#0d0d24]">
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-left py-2 px-3 text-[10px] uppercase text-white/30">Carga</th>
                          <th className="text-right py-2 px-3 text-[10px] uppercase text-white/30">Valor</th>
                          <th className="text-left py-2 px-3 text-[10px] uppercase text-white/30">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.closerFTL?.lostTasks || []).slice(0, 30).map((t, i) => (
                          <tr key={t.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                            <td className="py-1.5 px-3 text-white/70">{t.customId || t.nome}</td>
                            <td className="py-1.5 px-3 text-right font-medium text-rose-400">{fmtCurrency(t.freteEmpresa)}</td>
                            <td className="py-1.5 px-3 text-white/40 capitalize">{t.motivoNoShow || t.status}</td>
                          </tr>
                        ))}
                        {(data?.closerFTL?.lostTasks || []).length === 0 && (
                          <tr><td colSpan={3} className="py-3 text-center text-white/20 text-[10px]">Nenhuma perda registrada no periodo</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
                  <YAxis yAxisId="valor" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtCurrencyShort(v)} />
                  <YAxis yAxisId="count" orientation="right" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={(v, name) => name === 'Oportunidades' ? `${v} deals` : fmtCurrency(v)} />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
                  <Bar yAxisId="count" dataKey="oportunidades" name="Oportunidades" fill="#06b6d4" radius={[4, 4, 0, 0]} opacity={0.35} />
                  <Bar yAxisId="valor" dataKey="vendido" name="Vendido" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="valor" dataKey="perdido" name="Perdido" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.5} />
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
  const [sortField, setSortField] = useState('valor')
  const [sortDir, setSortDir] = useState('desc')

  const stages = metrics.funil || []
  const totalDeals = stages.reduce((s, f) => s + f.count, 0)
  const totalValor = stages.reduce((s, f) => s + f.valor, 0)

  // Vendedoras unicas (open + lost)
  const allDeals = [...(data.openDeals || []), ...(data.lostDeals || [])]
  const vendedoras = [...new Set(allDeals.map(d => d.vendedora))].filter(Boolean)

  const handleFunilSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  const FunilSortHeader = ({ field, children, align }) => (
    <th
      className={`py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium cursor-pointer hover:text-white/60 select-none ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => handleFunilSort(field)}
    >
      {children} {sortField === field ? (sortDir === 'desc' ? '\u2193' : '\u2191') : ''}
    </th>
  )

  const sortDeals = (arr) => [...arr].sort((a, b) => {
    let aVal = a[sortField], bVal = b[sortField]
    if (typeof aVal === 'string') return sortDir === 'asc' ? (aVal || '').localeCompare(bVal || '') : (bVal || '').localeCompare(aVal || '')
    return sortDir === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0)
  })

  // Deals filtrados
  const dealsFiltrados = sortDeals((data.openDeals || []).filter(d => {
    if (filtroVendedora !== 'Todas' && d.vendedora !== filtroVendedora) return false
    if (filtroEstagio !== 'Todos' && d.estagio !== filtroEstagio) return false
    return true
  }))

  // Deals perdidos filtrados
  const dealsPerdidosFiltrados = sortDeals((data.lostDeals || []).filter(d => {
    if (filtroVendedora !== 'Todas' && d.vendedora !== filtroVendedora) return false
    return true
  }))

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
                  <span className="text-[10px] text-white/25">{stage.nome.split(' ')[0]} → {next.nome.split(' ')[0]}</span>
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
                  <FunilSortHeader field="empresa">Empresa</FunilSortHeader>
                  <FunilSortHeader field="estagio">Estagio</FunilSortHeader>
                  <FunilSortHeader field="vendedora">Vendedora</FunilSortHeader>
                  <FunilSortHeader field="valor" align="right">Valor</FunilSortHeader>
                  <FunilSortHeader field="dataCriacao" align="right">Criado em</FunilSortHeader>
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
                    <td className="py-3 px-3 text-right text-white/30">{deal.dataCriacao ? deal.dataCriacao.split('-').reverse().join('/') : '-'}</td>
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

      {/* Deals Perdidos */}
      <GlassCard>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <SectionTitle icon={XCircle} description="Deals perdidos no periodo filtrado">Deals Perdidos</SectionTitle>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant="danger">{dealsPerdidosFiltrados.length} deal{dealsPerdidosFiltrados.length !== 1 ? 's' : ''} perdido{dealsPerdidosFiltrados.length !== 1 ? 's' : ''}</Badge>
            <span className="text-xs text-white/30">|</span>
            <span className="text-xs text-white/40">{fmtCurrency(dealsPerdidosFiltrados.reduce((s, d) => s + (d.valor || 0), 0))} perdidos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <FunilSortHeader field="empresa">Empresa</FunilSortHeader>
                  <FunilSortHeader field="vendedora">Vendedora</FunilSortHeader>
                  <FunilSortHeader field="valor" align="right">Valor</FunilSortHeader>
                  <FunilSortHeader field="dataCriacao" align="right">Data</FunilSortHeader>
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {dealsPerdidosFiltrados.map((deal, i) => (
                  <tr key={deal.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <p className="text-white/80 font-medium">{deal.empresa || deal.titulo}</p>
                    </td>
                    <td className="py-3 px-3 text-white/50">{deal.vendedora}</td>
                    <td className="py-3 px-3 text-right font-medium text-rose-400">{fmtCurrency(deal.valor)}</td>
                    <td className="py-3 px-3 text-right text-white/30">{deal.dataCriacao ? deal.dataCriacao.split('-').reverse().join('/') : '-'}</td>
                    <td className="py-3 px-3 text-white/40 text-xs">{deal.motivo || '-'}</td>
                  </tr>
                ))}
                {dealsPerdidosFiltrados.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-white/20 text-sm">Nenhum deal perdido no periodo</td></tr>
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
// TAB: INSIDE SALES
// =============================================
function TabInsideSales({ data, metrics }) {
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

  // Total oportunidades geradas no periodo = open criados no mes + won no mes + lost no mes
  const mesFiltro = data.mesFiltro || metrics.mesAtual || ''
  const oportunidadesByVendedora = {}
  ;(data.openDeals || []).filter(d => (d.dataCriacao || '').startsWith(mesFiltro)).forEach(d => {
    const key = d.vendedora || 'Sem dono'
    if (!oportunidadesByVendedora[key]) oportunidadesByVendedora[key] = 0
    oportunidadesByVendedora[key]++
  })
  ;(data.wonDeals || []).forEach(d => {
    if (d.mes !== mesFiltro) return
    const key = d.vendedora || 'Sem dono'
    if (!oportunidadesByVendedora[key]) oportunidadesByVendedora[key] = 0
    oportunidadesByVendedora[key]++
  })
  ;(data.lostDeals || []).forEach(d => {
    if (d.mes !== mesFiltro) return
    const key = d.vendedora || 'Sem dono'
    if (!oportunidadesByVendedora[key]) oportunidadesByVendedora[key] = 0
    oportunidadesByVendedora[key]++
  })

  // Atividades
  const atividades = data.atividades || []
  const totalAtividades = atividades.reduce((s, a) => s + a.ligacoes + a.emails + a.reunioes + a.propostas + a.followups + a.whatsapp, 0)
  const atividadeLabels = [
    { key: 'ligacoes', label: 'Ligacoes', icon: '📞', color: '#06b6d4' },
    { key: 'emails', label: 'Emails', icon: '📧', color: '#8b5cf6' },
    { key: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#10b981' },
    { key: 'reunioes', label: 'Reunioes', icon: '🤝', color: '#f59e0b' },
    { key: 'propostas', label: 'Propostas', icon: '📄', color: '#ec4899' },
    { key: 'followups', label: 'Follow-ups', icon: '🔄', color: '#ef4444' }
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

  // Open deals por vendedora
  const openByVendedora = {}
  ;(data.openDeals || []).forEach(d => {
    const key = d.vendedora || 'Sem dono'
    if (!openByVendedora[key]) openByVendedora[key] = { count: 0, valor: 0 }
    openByVendedora[key].count++
    openByVendedora[key].valor += d.valor || 0
  })

  // Lost detalhado por vendedora (com valor)
  const lostDetailByVendedora = {}
  ;(data.lostDeals || []).forEach(d => {
    const key = d.vendedora || 'Sem dono'
    if (!lostDetailByVendedora[key]) lostDetailByVendedora[key] = { count: 0, valor: 0 }
    lostDetailByVendedora[key].count++
    lostDetailByVendedora[key].valor += d.valor || 0
  })

  // Motivos de perda por vendedora
  const motivosByVendedora = {}
  ;(data.lostDeals || []).forEach(d => {
    const key = d.vendedora || 'Sem dono'
    const motivo = d.motivoPerda || 'Nao informado'
    if (!motivosByVendedora[key]) motivosByVendedora[key] = {}
    motivosByVendedora[key][motivo] = (motivosByVendedora[key][motivo] || 0) + 1
  })

  const metaPerVendedora = metrics.metaValor / Math.max(chartVendedoras.length, 1)

  return (
    <div className="space-y-8">
      {/* Grade comparativa — vendedores lado a lado */}
      <GlassCard>
        <div className="p-6">
          <SectionTitle icon={Users}>Performance por Vendedor</SectionTitle>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium w-40">Indicador</th>
                  {chartVendedoras.map((v, i) => (
                    <th key={i} className="text-center py-3 px-3 min-w-[160px]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: `${v.fill}20`, color: v.fill }}>
                          {v.nomeCompleto.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-white/80 font-semibold text-xs">{v.nome}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Total oportunidades geradas no periodo */}
                <tr className="border-b border-white/[0.03]">
                  <td className="py-4 px-3">
                    <p className="text-white/60 font-medium">Oportunidades Geradas</p>
                    <p className="text-[10px] text-white/25">total entradas no funil no periodo</p>
                  </td>
                  {chartVendedoras.map((v, i) => {
                    const total = oportunidadesByVendedora[v.nomeCompleto] || 0
                    return (
                      <td key={i} className="py-4 px-3 text-center">
                        <p className="text-2xl font-bold text-cyan-400">{total}</p>
                        <p className="text-[10px] text-white/25">oportunidades</p>
                      </td>
                    )
                  })}
                </tr>
                {/* Oportunidades abertas (pipeline atual) */}
                <tr className="border-b border-white/[0.03]">
                  <td className="py-4 px-3">
                    <p className="text-white/60 font-medium">Em Aberto</p>
                    <p className="text-[10px] text-white/25">deals ativos no funil agora</p>
                  </td>
                  {chartVendedoras.map((v, i) => {
                    const op = openByVendedora[v.nomeCompleto] || { count: 0, valor: 0 }
                    const tkm = op.count > 0 ? op.valor / op.count : 0
                    return (
                      <td key={i} className="py-4 px-3 text-center">
                        <p className="text-2xl font-bold text-violet-400">{op.count}</p>
                        <p className="text-xs text-white/40">{fmtCurrencyShort(op.valor)}</p>
                        <p className="text-[10px] text-white/20 mt-0.5">TM {fmtCurrencyShort(tkm)}</p>
                      </td>
                    )
                  })}
                </tr>
                {/* Vendido x Meta */}
                <tr className="border-b border-white/[0.03]">
                  <td className="py-4 px-3">
                    <p className="text-white/60 font-medium">Vendido x Meta</p>
                    <p className="text-[10px] text-white/25">meta: {fmtCurrencyShort(metaPerVendedora)}</p>
                  </td>
                  {chartVendedoras.map((v, i) => {
                    const pctMeta = metaPerVendedora > 0 ? (v.valor / metaPerVendedora) * 100 : 0
                    const metaColor = pctMeta >= 100 ? 'text-emerald-400' : pctMeta >= 80 ? 'text-amber-400' : 'text-rose-400'
                    return (
                      <td key={i} className="py-4 px-3 text-center">
                        <p className={`text-2xl font-bold ${metaColor}`}>{fmtCurrencyShort(v.valor)}</p>
                        <ProgressBar value={v.valor} max={metaPerVendedora} color={pctMeta >= 100 ? 'emerald' : pctMeta >= 80 ? 'amber' : 'rose'} size="sm" />
                        <p className="text-[10px] text-white/25 mt-1">{fmtPct(pctMeta, 0)} da meta | TM {fmtCurrencyShort(v.ticketMedio)}</p>
                      </td>
                    )
                  })}
                </tr>
                {/* Won Deals (volume) */}
                <tr className="border-b border-white/[0.03]">
                  <td className="py-4 px-3">
                    <p className="text-white/60 font-medium">Deals Ganhos</p>
                    <p className="text-[10px] text-white/25">quantidade no mes</p>
                  </td>
                  {chartVendedoras.map((v, i) => {
                    const lost = lostByVendedora[v.nomeCompleto] || 0
                    return (
                      <td key={i} className="py-4 px-3 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{v.count}</p>
                        <p className="text-[10px] text-white/25">{lost} perdidos</p>
                      </td>
                    )
                  })}
                </tr>
                {/* Taxa de Conversao */}
                <tr className="border-b border-white/[0.03]">
                  <td className="py-4 px-3">
                    <p className="text-white/60 font-medium">Taxa de Conversao</p>
                    <p className="text-[10px] text-white/25">won / (won + lost)</p>
                  </td>
                  {chartVendedoras.map((v, i) => {
                    const lost = lostByVendedora[v.nomeCompleto] || 0
                    const total = v.count + lost
                    const conv = total > 0 ? (v.count / total) * 100 : 0
                    const convColor = conv >= 25 ? 'text-emerald-400' : conv >= 15 ? 'text-amber-400' : 'text-rose-400'
                    return (
                      <td key={i} className="py-4 px-3 text-center">
                        <p className={`text-2xl font-bold ${convColor}`}>{fmtPct(conv, 1)}</p>
                        <p className="text-[10px] text-white/25">{v.count}W / {total} total</p>
                      </td>
                    )
                  })}
                </tr>
                {/* Atividades */}
                <tr className="border-b border-white/[0.03]">
                  <td className="py-4 px-3">
                    <p className="text-white/60 font-medium">Atividades</p>
                    <p className="text-[10px] text-white/25">total no mes</p>
                  </td>
                  {chartVendedoras.map((v, i) => {
                    const atv = atividades.find(a => a.vendedora === v.nomeCompleto) || {}
                    const totalAtv = (atv.ligacoes || 0) + (atv.emails || 0) + (atv.reunioes || 0) + (atv.propostas || 0) + (atv.followups || 0) + (atv.whatsapp || 0)
                    return (
                      <td key={i} className="py-4 px-3 text-center">
                        <p className="text-2xl font-bold text-white/80">{totalAtv}</p>
                        <div className="flex justify-center gap-2 mt-1 text-[10px] text-white/25">
                          <span>{atv.ligacoes || 0} lig</span>
                          <span>{atv.emails || 0} em</span>
                          <span>{atv.whatsapp || 0} wpp</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {/* Motivos de perda — geral + por vendedora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={XCircle} description={`${totalLost} deals perdidos analisados`}>Motivos de Perda (Geral)</SectionTitle>
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

      {/* ============================================= */}
      {/* QUADRO OPERACIONAL DE ATIVIDADES              */}
      {/* ============================================= */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-8 rounded-full bg-cyan-500" />
          <h2 className="text-lg font-bold tracking-tight text-white/80">Quadro Operacional de Atividades</h2>
        </div>

        {/* Atividades: Agendadas / No Prazo / Fora do Prazo / Atrasadas */}
        {data.atividadesStatus && (
          <div className="space-y-4">
            {/* KPI Cards — 4 metricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                label="Agendadas"
                value={data.atividadesStatus.totais?.agendadas || 0}
                icon={Clock}
                color="blue"
                subtitle="total no periodo"
              />
              <KPICard
                label="Executadas no Prazo"
                value={data.atividadesStatus.totais?.noPrazo || 0}
                icon={CheckCircle}
                color="emerald"
                subtitle={data.atividadesStatus.totais?.executadas > 0
                  ? `${Math.round(((data.atividadesStatus.totais.noPrazo || 0) / data.atividadesStatus.totais.executadas) * 100)}% das executadas`
                  : ''}
              />
              <KPICard
                label="Fora do Prazo"
                value={data.atividadesStatus.totais?.foraDoPrazo || 0}
                icon={AlertTriangle}
                color="amber"
                subtitle={data.atividadesStatus.totais?.executadas > 0
                  ? `${Math.round(((data.atividadesStatus.totais.foraDoPrazo || 0) / data.atividadesStatus.totais.executadas) * 100)}% das executadas`
                  : ''}
              />
              <KPICard
                label="Atrasadas"
                value={data.atividadesStatus.totais?.atrasadas || 0}
                icon={AlertTriangle}
                color="rose"
                subtitle="nao executadas"
              />
            </div>

            {/* Vertical grouped bar chart por vendedora */}
            <GlassCard>
              <div className="p-6">
                <SectionTitle icon={BarChart3} description="Agendadas vs Executadas vs Atrasadas por vendedora">Disciplina de Atividades</SectionTitle>
                <div className="h-[240px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(data.atividadesStatus.porVendedora || []).map(v => ({
                        nome: v.vendedora.split(' ')[0],
                        Agendadas: v.agendadas,
                        Executadas: v.executadas,
                        Pendentes: Math.max(0, v.agendadas - v.executadas),
                        Atrasadas: v.atrasadas
                      }))}
                      barGap={3}
                      barCategoryGap="35%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="nome" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }} />
                      <Bar dataKey="Agendadas" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Executadas" fill="#10b981" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Pendentes" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Atrasadas" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Tempo de Resposta a Cotacao */}
        {data.tempoResposta && (
          <div className="mt-4">
            <GlassCard>
              <div className="p-6">
                <SectionTitle icon={Zap} description="SLA: 2h para primeiro contato">Tempo de Resposta a Cotacao</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                  {/* Semaphore */}
                  <div className="flex flex-col items-center justify-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
                      data.tempoResposta.mediaGeral <= 2 ? 'border-emerald-500 bg-emerald-500/10' :
                      data.tempoResposta.mediaGeral <= 4 ? 'border-amber-500 bg-amber-500/10' :
                      'border-rose-500 bg-rose-500/10'
                    }`}>
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${
                          data.tempoResposta.mediaGeral <= 2 ? 'text-emerald-400' :
                          data.tempoResposta.mediaGeral <= 4 ? 'text-amber-400' :
                          'text-rose-400'
                        }`}>{data.tempoResposta.mediaGeral}h</p>
                        <p className="text-[9px] text-white/30 uppercase">media</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/30 mt-2">{data.tempoResposta.totalAnalisados} deals analisados</p>
                  </div>

                  {/* Distribuicao */}
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-white/30 font-medium mb-3">Distribuicao</p>
                    {[
                      { label: 'Ate 2h (SLA)', value: data.tempoResposta.distribuicao?.ate2h || 0, color: '#10b981' },
                      { label: '2h a 4h', value: data.tempoResposta.distribuicao?.de2a4h || 0, color: '#f59e0b' },
                      { label: '4h a 8h', value: data.tempoResposta.distribuicao?.de4a8h || 0, color: '#ef4444' },
                      { label: 'Mais de 8h', value: data.tempoResposta.distribuicao?.mais8h || 0, color: '#991b1b' }
                    ].map((faixa, i) => {
                      const total = (data.tempoResposta.distribuicao?.ate2h || 0) + (data.tempoResposta.distribuicao?.de2a4h || 0) + (data.tempoResposta.distribuicao?.de4a8h || 0) + (data.tempoResposta.distribuicao?.mais8h || 0)
                      const pct = total > 0 ? (faixa.value / total) * 100 : 0
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-white/50 w-24">{faixa.label}</span>
                          <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: faixa.color }} />
                          </div>
                          <span className="text-xs text-white/40 w-8 text-right">{faixa.value}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Por vendedora */}
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-white/30 font-medium mb-3">Por vendedora</p>
                    {Object.entries(data.tempoResposta.porVendedora || {}).map(([nome, media], i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                        <span className="text-sm text-white/70">{nome}</span>
                        <span className={`text-sm font-semibold ${
                          media <= 2 ? 'text-emerald-400' : media <= 4 ? 'text-amber-400' : 'text-rose-400'
                        }`}>{media}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Deals sem Proxima Atividade (bonus) */}
        {data.dealsOrfaos && data.dealsOrfaos.total > 0 && (
          <div className="mt-4">
            <GlassCard>
              <div className="p-6">
                <SectionTitle icon={AlertTriangle} description={`${data.dealsOrfaos.total} deals sem follow-up agendado`}>Deals Orfaos (sem proxima atividade)</SectionTitle>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider text-white/30">Deal</th>
                        <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider text-white/30">Vendedora</th>
                        <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-white/30">Dias Parado</th>
                        <th className="text-right py-2 px-3 text-[10px] uppercase tracking-wider text-white/30">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.dealsOrfaos.deals || []).slice(0, 10).map((d, i) => (
                        <tr key={d.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="py-2 px-3 text-white/80">{d.titulo || d.empresa || `Deal #${d.id}`}</td>
                          <td className="py-2 px-3 text-white/50">{d.vendedora}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              d.diasParado >= 7 ? 'bg-rose-500/20 text-rose-400' :
                              d.diasParado >= 3 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-white/10 text-white/60'
                            }`}>{d.diasParado}d</span>
                          </td>
                          <td className="py-2 px-3 text-right text-white/40">{fmtCurrencyShort(d.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Tipo de Tarefa por vendedora (Atividades Comparativas) */}
        <GlassCard>
          <div className="p-6">
            <SectionTitle icon={BarChart3} description="Volume por tipo de atividade — perfil de cada vendedora">Tipo de Tarefa por Vendedora</SectionTitle>
            <div className="h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={atividadesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="tipo" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  {chartVendedoras.map((v, i) => (
                    <Bar key={i} dataKey={v.nome} name={v.nomeCompleto} fill={v.fill} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Ligacoes Realizadas — volume diario 30 dias */}
        {data.atividadesDiarias && data.atividadesDiarias.length > 0 && (
          <GlassCard>
            <div className="p-6">
              <SectionTitle icon={Phone} description="Volume diario de ligacoes (ultimos 30 dias)">Ligacoes Realizadas</SectionTitle>
              <div className="h-[280px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.atividadesDiarias.map(d => ({
                    dia: d.dia.substring(5),
                    ...Object.fromEntries(
                      Object.entries(d).filter(([k]) => k !== 'dia').map(([nome, val]) => [nome.split(' ')[0], val?.ligacoes || 0])
                    )
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="dia" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    {chartVendedoras.map((v, i) => (
                      <Line key={i} type="monotone" dataKey={v.nome} name={v.nomeCompleto} stroke={v.fill} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Frequencia de Follow-up por Deal */}
        {data.followupFrequency && (
          <div className="mt-4">
            <GlassCard>
              <div className="p-6">
                <SectionTitle icon={Activity} description="Media de atividades por deal: ganhos vs perdidos">Frequencia de Follow-up</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  {/* Comparativo Won vs Lost */}
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-400">{data.followupFrequency.mediaWon}</p>
                      <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">media won</p>
                      <p className="text-xs text-white/20">atividades/deal</p>
                    </div>
                    <div className="text-white/10 text-2xl">vs</div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-rose-400">{data.followupFrequency.mediaLost}</p>
                      <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">media lost</p>
                      <p className="text-xs text-white/20">atividades/deal</p>
                    </div>
                  </div>

                  {/* Distribuicao por faixa */}
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-white/30 font-medium mb-2">Distribuicao por faixa</p>
                    {[
                      { label: '0 atividades', won: data.followupFrequency.distribuicaoWon?.zero, lost: data.followupFrequency.distribuicaoLost?.zero },
                      { label: '1-2 atividades', won: data.followupFrequency.distribuicaoWon?.um_dois, lost: data.followupFrequency.distribuicaoLost?.um_dois },
                      { label: '3-5 atividades', won: data.followupFrequency.distribuicaoWon?.tres_cinco, lost: data.followupFrequency.distribuicaoLost?.tres_cinco },
                      { label: '6-10 atividades', won: data.followupFrequency.distribuicaoWon?.seis_dez, lost: data.followupFrequency.distribuicaoLost?.seis_dez },
                      { label: '10+ atividades', won: data.followupFrequency.distribuicaoWon?.mais_dez, lost: data.followupFrequency.distribuicaoLost?.mais_dez }
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-white/40 w-24">{f.label}</span>
                        <span className="text-emerald-400 w-8 text-right">{f.won || 0}</span>
                        <span className="text-white/10">|</span>
                        <span className="text-rose-400 w-8">{f.lost || 0}</span>
                      </div>
                    ))}
                    <div className="flex gap-4 mt-1 text-[10px] text-white/25">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Won</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Lost</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Sales Velocity */}
        {data.salesVelocity && (
          <GlassCard>
            <div className="p-6">
              <SectionTitle icon={Zap} description="Velocity = (Deals x Valor Medio x Conversao) / Ciclo Medio">Sales Velocity</SectionTitle>
              <div className="mt-4">
                {/* Velocity Geral */}
                <div className="flex items-center justify-center mb-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-emerald-400">{fmtCurrencyShort(data.salesVelocity.geral?.velocity || 0)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">velocity/dia</p>
                  </div>
                </div>

                {/* Formula decomposition */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-xl font-bold text-cyan-400">{data.salesVelocity.geral?.numDeals || 0}</p>
                    <p className="text-[10px] text-white/30 mt-1">Deals</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-xl font-bold text-violet-400">{fmtCurrencyShort(data.salesVelocity.geral?.valorMedio || 0)}</p>
                    <p className="text-[10px] text-white/30 mt-1">Valor Medio</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-xl font-bold text-amber-400">{data.salesVelocity.geral?.conversao || 0}%</p>
                    <p className="text-[10px] text-white/30 mt-1">Conversao</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-xl font-bold text-rose-400">{data.salesVelocity.geral?.cicloMedio || 0}d</p>
                    <p className="text-[10px] text-white/30 mt-1">Ciclo Medio</p>
                  </div>
                </div>

                {/* Por vendedora */}
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Por vendedora</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-left py-2 px-3 text-[10px] uppercase tracking-wider text-white/30">Vendedora</th>
                          <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-white/30">Velocity</th>
                          <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-white/30">Deals</th>
                          <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-white/30">Valor Medio</th>
                          <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-white/30">Conversao</th>
                          <th className="text-center py-2 px-3 text-[10px] uppercase tracking-wider text-white/30">Ciclo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.salesVelocity.porVendedora || {}).map(([nome, v], i) => (
                          <tr key={i} className="border-b border-white/[0.03]">
                            <td className="py-2 px-3 text-white/70 font-medium">{nome}</td>
                            <td className="py-2 px-3 text-center text-emerald-400 font-semibold">{fmtCurrencyShort(v.velocity)}</td>
                            <td className="py-2 px-3 text-center text-white/50">{v.numDeals}</td>
                            <td className="py-2 px-3 text-center text-white/50">{fmtCurrencyShort(v.valorMedio)}</td>
                            <td className="py-2 px-3 text-center text-white/50">{v.conversao}%</td>
                            <td className="py-2 px-3 text-center text-white/50">{v.cicloMedio}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

    </div>
  )
}

// =============================================
// TAB: CLOSER FTL
// =============================================
function TabCloserFTL({ data }) {
  const closer = data.closerFTL || { totalCargas: 0, executadas: 0, noShowCount: 0, canceladaCount: 0, lostCount: 0, conversionPct: 0, noShowTasks: [], canceladaTasks: [], lostTasks: [] }
  const allLost = [...(closer.noShowTasks || []), ...(closer.canceladaTasks || [])].sort((a, b) => (b.freteEmpresa || 0) - (a.freteEmpresa || 0))
  const totalPerda = allLost.reduce((s, t) => s + (t.freteEmpresa || 0), 0)

  // Closer FT — Kanban + Eficiencia
  const ft = data.closerFT || { kanban: [], eficiencia: [] }
  const { kanban, eficiencia } = ft
  const byStatus = {}
  KANBAN_COLS.forEach(c => { byStatus[c.id] = [] })
  kanban.forEach(t => {
    const col = KANBAN_COLS.find(c => c.id === t.status)
    if (col) byStatus[col.id].push(t)
  })
  const totalAtivas = kanban.filter(t => t.status !== 'no show').length
  const totalNoShowKanban = kanban.filter(t => t.status === 'no show').length
  const emContratacao = byStatus['em contratacao']?.length || 0
  const efiNeg = eficiencia.filter(t => !t.isNoShow)
  const efiNoShow = eficiencia.filter(t => t.isNoShow)
  const totalDesejado = efiNeg.reduce((s, t) => s + t.freteMotorista, 0)
  const totalFechado = efiNeg.reduce((s, t) => s + t.valorFechado, 0)
  const totalSaldo = efiNeg.reduce((s, t) => s + (t.saldo || 0), 0)
  const totalNoShowValor = efiNoShow.reduce((s, t) => s + t.freteMotorista, 0)

  return (
    <div className="space-y-6">
      {/* KPIs Closer FTL */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard label="Total Cargas" value={closer.totalCargas} icon={Truck} color="cyan" />
        <KPICard label="Executadas" value={closer.executadas} icon={Award} color="emerald" />
        <KPICard label="No Show" value={closer.noShowCount} icon={Ban} color="rose" />
        <KPICard label="Canceladas" value={closer.canceladaCount} icon={XCircle} color="amber" />
        <KPICard label="% Conversao" value={fmtPct(closer.conversionPct, 1)} icon={Target} color={closer.conversionPct >= 80 ? 'emerald' : closer.conversionPct >= 60 ? 'amber' : 'rose'} />
      </div>

      {/* Tabela de cargas perdidas */}
      <GlassCard>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <SectionTitle icon={AlertTriangle} description={`${allLost.length} cargas perdidas | ${fmtCurrency(totalPerda)} em frete`}>Cargas Perdidas (No Show + Canceladas)</SectionTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">ID</th>
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Carga</th>
                  <th className="text-center py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Status</th>
                  <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Frete</th>
                  <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Motivo</th>
                  <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">Coleta</th>
                </tr>
              </thead>
              <tbody>
                {allLost.map((t, i) => (
                  <tr key={t.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-white/40 text-xs font-mono">{t.customId || t.id}</td>
                    <td className="py-3 px-3 text-white/80 font-medium">{t.nome}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.status === 'no show'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.status === 'no show' ? <Ban size={10} /> : <XCircle size={10} />}
                        {t.status === 'no show' ? 'NO SHOW' : 'CANCELADA'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-rose-400">{t.freteEmpresa > 0 ? fmtCurrency(t.freteEmpresa) : '-'}</td>
                    <td className="py-3 px-3 text-white/50 text-xs">{t.motivoNoShow || '-'}</td>
                    <td className="py-3 px-3 text-right text-white/30">{t.dataColeta}</td>
                  </tr>
                ))}
                {allLost.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-white/20 text-sm">Nenhuma carga perdida no periodo</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>

      {/* Divisor */}
      <div className="border-t border-white/[0.06] pt-2">
        <p className="text-[11px] uppercase tracking-[0.15em] text-white/20 font-medium mb-4">Pipeline do Closer</p>
      </div>

      {/* KPIs Kanban */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Cargas Ativas" value={totalAtivas} icon={Truck} color="cyan" />
        <KPICard label="Em Contratacao" value={emContratacao} icon={Activity} color="blue" />
        <KPICard label="No Show (Kanban)" value={totalNoShowKanban} icon={Ban} color="rose" />
        <KPICard label="Saldo do Mes" value={fmtCurrencyShort(totalSaldo)} icon={totalSaldo >= 0 ? ArrowUpRight : ArrowDownRight} color={totalSaldo >= 0 ? 'emerald' : 'rose'} />
      </div>

      {/* Kanban */}
      <GlassCard>
        <div className="p-6">
          <SectionTitle icon={Columns2} description="Status de cada carga no pipeline do Closer">Kanban de Demandas</SectionTitle>
          {kanban.length === 0 ? (
            <div className="py-12 text-center text-white/20 text-sm">Nenhuma carga ativa no momento</div>
          ) : (
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${KANBAN_COLS.length}, minmax(200px, 1fr))`, overflowX: 'auto' }}>
              {KANBAN_COLS.map(col => {
                const cards = byStatus[col.id] || []
                return (
                  <div key={col.id} className="min-w-[200px]">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: col.color + '30' }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: col.color }}>{col.label}</span>
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: col.color + '20', color: col.color }}>{cards.length}</span>
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: '440px' }}>
                      {cards.length === 0 ? (
                        <div className="text-center py-4 text-white/15 text-xs border border-dashed border-white/[0.05] rounded-xl">vazio</div>
                      ) : (
                        cards.map(t => <KanbanCard key={t.id} task={t} />)
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Tabela de Eficiencia */}
      <GlassCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={TrendingDown} description={`${eficiencia.length} cargas | Economia: ${fmtCurrency(totalSaldo)}`}>Eficiencia de Negociacao</SectionTitle>
            {efiNoShow.length > 0 && (
              <span className="text-xs text-rose-400 font-medium">{efiNoShow.length} no show = {fmtCurrency(totalNoShowValor)} perdido</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">ID</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">Cliente</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">Data</th>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">Rota</th>
                  <th className="text-right py-3 px-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">Frete Desejado</th>
                  <th className="text-right py-3 px-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">Frete Negociado</th>
                  <th className="text-right py-3 px-3 text-[10px] uppercase tracking-wider text-white/30 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {eficiencia.map((t, i) => {
                  const isNS = t.isNoShow
                  const sPos = !isNS && t.saldo !== null && t.saldo >= 0
                  return (
                    <tr key={t.id || i} className={`border-b border-white/[0.03] transition-colors ${isNS ? 'bg-rose-500/[0.06] hover:bg-rose-500/[0.10]' : 'hover:bg-white/[0.02]'}`}>
                      <td className={`py-3 px-3 text-xs font-mono ${isNS ? 'text-rose-400/70' : 'text-white/30'}`}>{t.customId}</td>
                      <td className={`py-3 px-3 font-medium ${isNS ? 'text-rose-300' : 'text-white/80'}`}>{t.cliente}</td>
                      <td className={`py-3 px-3 text-xs ${isNS ? 'text-rose-400/60' : 'text-white/40'}`}>
                        {t.coleta ? new Date(t.coleta + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--'}
                      </td>
                      <td className={`py-3 px-3 text-xs ${isNS ? 'text-rose-400/60' : 'text-white/40'}`}>
                        {t.origem && t.destino ? `${t.origem} → ${t.destino}` : (t.origem || t.destino || '--')}
                      </td>
                      <td className={`py-3 px-3 text-right font-medium ${isNS ? 'text-rose-400/80' : 'text-white/60'}`}>
                        {t.freteMotorista > 0 ? fmtCurrency(t.freteMotorista) : '--'}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${isNS ? 'text-rose-400' : 'text-white/80'}`}>
                        {isNS ? 'NO SHOW' : (t.valorFechado > 0 ? fmtCurrency(t.valorFechado) : '--')}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold text-sm ${isNS ? 'text-rose-400' : sPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isNS
                          ? (t.freteMotorista > 0 ? `-${fmtCurrency(t.freteMotorista)}` : '--')
                          : t.saldo !== null ? `${t.saldo >= 0 ? '+' : ''}${fmtCurrency(t.saldo)}` : '--'
                        }
                      </td>
                    </tr>
                  )
                })}
                {eficiencia.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-white/20 text-sm">Nenhuma negociacao no periodo</td></tr>
                )}
              </tbody>
              {eficiencia.length > 0 && (
                <tfoot>
                  <tr className="border-t border-white/[0.08]">
                    <td colSpan={4} className="py-3 px-3 text-xs text-white/30 font-medium">{efiNeg.length} negociadas{efiNoShow.length > 0 ? ` + ${efiNoShow.length} no show` : ''}</td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-white/60">{fmtCurrency(totalDesejado)}</td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-white/60">{totalFechado > 0 ? fmtCurrency(totalFechado) : '--'}</td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${totalSaldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalSaldo >= 0 ? '+' : ''}{fmtCurrency(totalSaldo)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

// =============================================
// KANBAN COLS (usado no TabCloserFTL)
// =============================================

const KANBAN_COLS = [
  { id: 'a contratar',       label: 'A Contratar',    color: '#6b7280', desc: 'Aguardando Closer' },
  { id: 'validacao tecnica', label: 'Val. Técnica',   color: '#8b5cf6', desc: 'Validação técnica' },
  { id: 'pesquisa',          label: 'Pesquisa',        color: '#06b6d4', desc: 'Pesquisando motorista' },
  { id: 'checklist',         label: 'Checklist',       color: '#f97316', desc: 'Checklist pendente' },
  { id: 'em contratacao',    label: 'Em Contratação', color: '#3b82f6', desc: 'Prospectando motorista' },
  { id: 'em carregamento',   label: 'Em Carregamento',color: '#f59e0b', desc: 'Motorista contratado' },
  { id: 'em transito',       label: 'Em Transito',     color: '#10b981', desc: 'Carga saiu' },
  { id: 'no show',           label: 'No Show',         color: '#ef4444', desc: 'Oportunidade perdida' },
]

function KanbanCard({ task }) {
  const isNoShow = task.status === 'no show'
  const saldoPositivo = task.saldo !== null && task.saldo >= 0
  return (
    <div className={`rounded-xl p-3.5 mb-2.5 border transition-all ${
      isNoShow
        ? 'bg-rose-500/10 border-rose-500/30'
        : 'bg-white/[0.04] border-white/[0.07] hover:border-white/[0.12]'
    }`}>
      {/* ID + link */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-white/30">{task.customId}</span>
        {task.url && (
          <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-cyan-400 transition-colors">
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Cliente */}
      <p className={`text-sm font-semibold leading-tight mb-1.5 ${isNoShow ? 'text-rose-300' : 'text-white/90'}`}>
        {task.cliente || task.nome.split(' - ')[0]}
      </p>

      {/* Rota */}
      {(task.origem || task.destino) && (
        <p className="text-[11px] text-white/40 mb-2 leading-tight">
          {task.origem}{task.origem && task.destino ? ' → ' : ''}{task.destino}
        </p>
      )}

      {/* Data coleta + closer */}
      <div className="flex items-center justify-between text-[10px] text-white/30 mb-2">
        <span>{task.coleta ? new Date(task.coleta + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--'}</span>
        {task.closer && <span className="text-cyan-400/60">{task.closer}</span>}
      </div>

      {/* Frete Motorista + Saldo */}
      {task.freteMotorista > 0 && (
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/[0.05]">
          <span className="text-[10px] text-white/25">Teto: {fmtCurrency(task.freteMotorista)}</span>
          {isNoShow ? (
            <span className="text-[10px] font-bold text-rose-400 uppercase">No Show</span>
          ) : task.saldo !== null ? (
            <span className={`text-[11px] font-bold ${saldoPositivo ? 'text-emerald-400' : 'text-rose-400'}`}>
              {saldoPositivo ? '+' : ''}{fmtCurrency(task.saldo)}
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}

// =============================================
// TAB: CLIENTES
// =============================================
function TabClientes({ data, metrics, fetchWithMes }) {
  const [filtroVendedora, setFiltroVendedora] = useState('Todas')
  const [filtroTermometro, setFiltroTermometro] = useState('Todos')
  const [sortField, setSortField] = useState('wonDealsCount')
  const [sortDir, setSortDir] = useState('desc')

  const clientes = data.clientesAtivos || []
  const vendedoras = [...new Set(clientes.map(c => c.responsavel))].filter(Boolean)

  const termometroColors = { ATIVO: '#10b981', ATENCAO: '#f59e0b', RISCO: '#ef4444', INATIVO: '#6b7280' }
  const termometroOrder = { ATIVO: 0, ATENCAO: 1, RISCO: 2, INATIVO: 3 }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const clientesFiltrados = clientes.filter(c => {
    if (filtroVendedora !== 'Todas' && c.responsavel !== filtroVendedora) return false
    if (filtroTermometro !== 'Todos' && c.termometro !== filtroTermometro) return false
    return true
  }).sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    if (sortField === 'termometro') {
      aVal = termometroOrder[a.termometro] ?? 99
      bVal = termometroOrder[b.termometro] ?? 99
    }
    if (sortField === 'ticketMedio') {
      aVal = a.wonDealsCount > 0 ? a.vendidoMes / a.wonDealsCount : 0
      bVal = b.wonDealsCount > 0 ? b.vendidoMes / b.wonDealsCount : 0
    }
    if (sortField === 'taxaConversao') {
      aVal = a.closedDealsCount > 0 ? a.wonDealsCount / a.closedDealsCount : 0
      bVal = b.closedDealsCount > 0 ? b.wonDealsCount / b.closedDealsCount : 0
    }
    if (sortField === 'perdidoCount') {
      aVal = Math.max(0, (a.closedDealsCount || 0) - (a.wonDealsCount || 0))
      bVal = Math.max(0, (b.closedDealsCount || 0) - (b.wonDealsCount || 0))
    }
    if (sortField === 'totalDealsCount') {
      aVal = (a.openDealsCount || 0) + (a.closedDealsCount || 0)
      bVal = (b.openDealsCount || 0) + (b.closedDealsCount || 0)
    }
    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  const totalVendidoMes = clientesFiltrados.reduce((s, c) => s + (c.vendidoMes || 0), 0)
  const totalWon = clientesFiltrados.reduce((s, c) => s + (c.wonDealsCount || 0), 0)
  const totalLost = clientesFiltrados.reduce((s, c) => s + Math.max(0, (c.closedDealsCount || 0) - (c.wonDealsCount || 0)), 0)
  const totalOpen = clientesFiltrados.reduce((s, c) => s + (c.openDealsCount || 0), 0)
  const totalOport = clientesFiltrados.reduce((s, c) => s + (c.openDealsCount || 0) + (c.closedDealsCount || 0), 0)
  const totalClosed = clientesFiltrados.reduce((s, c) => s + (c.closedDealsCount || 0), 0)
  const totalTicketMedio = totalWon > 0 ? totalVendidoMes / totalWon : 0
  const totalConversao = totalClosed > 0 ? totalWon / totalClosed : 0
  const ativos = clientes.filter(c => c.termometro === 'ATIVO').length
  const risco = clientes.filter(c => c.termometro === 'RISCO' || c.termometro === 'ATENCAO').length

  const SortHeader = ({ field, children, align }) => (
    <th
      className={`py-3 px-3 text-[11px] uppercase tracking-wider text-white/30 font-medium cursor-pointer hover:text-white/60 select-none ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
      onClick={() => handleSort(field)}
    >
      {children} {sortField === field ? (sortDir === 'desc' ? '\u2193' : '\u2191') : ''}
    </th>
  )

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Clientes Ativos" value={ativos + '/' + clientes.length} icon={Users} color="cyan" />
        <KPICard label="Total Won Deals" value={totalWon} icon={Award} color="emerald" />
        <KPICard label="Vendido no Mes" value={fmtCurrencyShort(totalVendidoMes)} icon={DollarSign} color="amber" />
        <KPICard label="Risco/Atencao" value={risco} icon={AlertTriangle} color="rose" />
      </div>

      {/* Tabela de clientes */}
      <GlassCard>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <SectionTitle icon={Users} description="Organizacoes do filtro Clientes Ativos (Pipedrive)">Clientes</SectionTitle>
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
                <option value="Todos">Todos status</option>
                <option value="ATIVO">ATIVO</option>
                <option value="ATENCAO">ATENCAO</option>
                <option value="RISCO">RISCO</option>
                <option value="INATIVO">INATIVO</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Badge variant="info">{clientesFiltrados.length} organizacao{clientesFiltrados.length !== 1 ? 'es' : ''}</Badge>
            <span className="text-[10px] text-white/20 ml-2">Clique nos cabecalhos para ordenar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <SortHeader field="cliente">Cliente</SortHeader>
                  <SortHeader field="termometro" align="center">Status</SortHeader>
                  <SortHeader field="totalDealsCount" align="right">Oportunidades</SortHeader>
                  <SortHeader field="wonDealsCount" align="right">Ganho</SortHeader>
                  <SortHeader field="perdidoCount" align="right">Perdido</SortHeader>
                  <SortHeader field="openDealsCount" align="right">Em Aberto</SortHeader>
                  <SortHeader field="ticketMedio" align="right">Ticket Medio</SortHeader>
                  <SortHeader field="taxaConversao" align="right">Conversao</SortHeader>
                  <SortHeader field="vendidoMes" align="right">Vendido Mes</SortHeader>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((c, i) => {
                  const perdido = Math.max(0, (c.closedDealsCount || 0) - (c.wonDealsCount || 0))
                  const oport = (c.openDealsCount || 0) + (c.closedDealsCount || 0)
                  const tkMedio = c.wonDealsCount > 0 ? c.vendidoMes / c.wonDealsCount : 0
                  const conv = c.closedDealsCount > 0 ? c.wonDealsCount / c.closedDealsCount : null
                  const tColor = termometroColors[c.termometro] || '#6b7280'
                  return (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-white/80 font-medium">{c.cliente}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide" style={{ background: `${tColor}18`, color: tColor, border: `1px solid ${tColor}40` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tColor }} />
                          {c.termometro || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-white/60">{oport}</td>
                      <td className="py-3 px-3 text-right font-medium text-emerald-400">{c.wonDealsCount || 0}</td>
                      <td className="py-3 px-3 text-right font-medium text-rose-400">{perdido}</td>
                      <td className="py-3 px-3 text-right text-cyan-400 font-medium">{c.openDealsCount || 0}</td>
                      <td className="py-3 px-3 text-right text-white/60">{tkMedio > 0 ? fmtCurrencyShort(tkMedio) : '-'}</td>
                      <td className="py-3 px-3 text-right">
                        {conv !== null ? (
                          <span className={`font-medium ${conv * 100 >= 20 ? 'text-emerald-400' : conv * 100 >= 10 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {fmtPct(conv * 100, 1)}
                          </span>
                        ) : <span className="text-white/30">-</span>}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-white/80">{c.vendidoMes > 0 ? fmtCurrency(c.vendidoMes) : '-'}</td>
                    </tr>
                  )
                })}
                {clientesFiltrados.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-white/20 text-sm">Nenhum cliente encontrado</td></tr>
                )}
              </tbody>
              {clientesFiltrados.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-white/[0.10] bg-white/[0.02]">
                    <td className="py-3 px-3 text-[11px] uppercase tracking-wider text-white/40 font-semibold">TOTAL</td>
                    <td className="py-3 px-3 text-center text-[10px] text-white/20">{ativos} ativ.</td>
                    <td className="py-3 px-3 text-right font-semibold text-white/60">{totalOport}</td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-400">{totalWon}</td>
                    <td className="py-3 px-3 text-right font-semibold text-rose-400">{totalLost}</td>
                    <td className="py-3 px-3 text-right font-semibold text-cyan-400">{totalOpen}</td>
                    <td className="py-3 px-3 text-right font-semibold text-white/60">{totalTicketMedio > 0 ? fmtCurrencyShort(totalTicketMedio) : '-'}</td>
                    <td className="py-3 px-3 text-right font-semibold">
                      <span className={totalConversao * 100 >= 20 ? 'text-emerald-400' : totalConversao * 100 >= 10 ? 'text-amber-400' : 'text-rose-400'}>
                        {totalClosed > 0 ? fmtPct(totalConversao * 100, 1) : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-white/80">{fmtCurrency(totalVendidoMes)}</td>
                  </tr>
                </tfoot>
              )}
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
