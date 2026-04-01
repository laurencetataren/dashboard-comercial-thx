import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api/sheets'

export default function useComercialData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  // Le mes da URL query string (?mes=2026-03), ou usa mes atual como default
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('mes') || null
  })

  const fetchData = useCallback(async (mes) => {
    try {
      setLoading(true)
      setError(null)

      const mesParam = mes || mesSelecionado
      const url = mesParam ? `${API_URL}?mes=${mesParam}` : API_URL
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)

      const json = await res.json()
      setData(json)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Erro ao buscar dados comerciais:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [mesSelecionado])

  useEffect(() => {
    fetchData()
    // Refresh a cada 5 minutos
    const interval = setInterval(() => fetchData(), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Metricas calculadas
  const metrics = data ? computeMetrics(data) : null

  // Fetch com filtro de mes (troca global de mes)
  const fetchWithMes = useCallback(async (mes) => {
    try {
      setMesSelecionado(mes)
      // Atualiza URL sem recarregar a pagina
      const url = new URL(window.location.href)
      if (mes) { url.searchParams.set('mes', mes) } else { url.searchParams.delete('mes') }
      window.history.replaceState({}, '', url.toString())
      // Fetch com o novo mes
      await fetchData(mes)
    } catch (err) {
      setError(err.message)
    }
  }, [fetchData])

  return { data, metrics, loading, error, lastUpdate, refresh: fetchData, fetchWithMes }
}

function computeMetrics(data) {
  const now = new Date()
  const mesAtual = data.mesFiltro || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Won do mes filtrado (API ja filtra por mesFiltro)
  const wonMesAtual = data.wonDeals || []
  const totalWonValor = wonMesAtual.reduce((s, d) => s + (d.valor || 0), 0)
  const totalWonCount = wonMesAtual.length

  // Lost do mes filtrado (API ja filtra por mesFiltro)
  const lostMesAtual = data.lostDeals || []
  const totalLostCount = lostMesAtual.length
  const totalLostValor = lostMesAtual.reduce((s, d) => s + (d.valor || 0), 0)

  // Meta do mes atual
  const metaAtual = data.metas?.find(m => m.mes === mesAtual)
  const metaValor = metaAtual?.meta_valor || 0
  const metaDeals = metaAtual?.meta_deals || 0
  const atingimentoValor = metaValor > 0 ? (totalWonValor / metaValor) * 100 : 0
  const atingimentoDeals = metaDeals > 0 ? (totalWonCount / metaDeals) * 100 : 0

  // Open deals (funil)
  const openDeals = data.openDeals || []
  const totalFunilValor = openDeals.reduce((s, d) => s + (d.valor || 0), 0)
  const totalFunilCount = openDeals.length

  // Ticket medio
  const ticketMedio = totalWonCount > 0 ? totalWonValor / totalWonCount : 0

  // Taxa de conversao (won / (won + lost))
  const totalDecididos = totalWonCount + totalLostCount
  const taxaConversao = totalDecididos > 0 ? (totalWonCount / totalDecididos) * 100 : 0

  // Performance por vendedora
  const vendedoras = data.performanceVendedoras || []

  // Historico (apenas 2026+)
  const historico = (data.historicoMensal || []).filter(h => h.mes >= '2026')
  const mesAnteriorData = historico.length >= 2 ? historico[historico.length - 2] : null

  // Trend vs mes anterior
  const trendValor = mesAnteriorData
    ? ((totalWonValor - mesAnteriorData.won_value) / mesAnteriorData.won_value) * 100
    : 0
  const trendConversao = mesAnteriorData
    ? taxaConversao - mesAnteriorData.conversion_rate
    : 0

  // Funil por estagio (ordenado)
  const STAGE_ORDER = ['Pedido de Cotacao', 'Em Negociacao', 'Proposta Aprovada']
  const funil = STAGE_ORDER.map(nome => {
    const stage = data.funil?.find(f => f.nome === nome) || { nome, count: 0, valor: 0 }
    return stage
  })

  // Projecao linear
  const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const diaAtual = now.getDate()
  const projecaoValor = diaAtual > 0 ? (totalWonValor / diaAtual) * diasNoMes : 0

  // Gap para meta
  const gapMeta = metaValor - totalWonValor

  return {
    mesAtual,
    totalWonValor,
    totalWonCount,
    totalLostCount,
    totalLostValor,
    totalFunilValor,
    totalFunilCount,
    ticketMedio,
    taxaConversao,
    metaValor,
    metaDeals,
    atingimentoValor,
    atingimentoDeals,
    trendValor: parseFloat(trendValor.toFixed(1)),
    trendConversao: parseFloat(trendConversao.toFixed(1)),
    vendedoras,
    funil,
    historico,
    motivosPerda: data.motivosPerda || [],
    projecaoValor,
    gapMeta,
    diasNoMes,
    diaAtual,
    isDemo: data.demo || false
  }
}
