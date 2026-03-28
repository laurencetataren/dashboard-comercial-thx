import { useState, useEffect, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api/sheets'

export default function useComercialData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(API_URL)
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
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  const metrics = data ? computeMetrics(data) : null
  return { data, metrics, loading, error, lastUpdate, refresh: fetchData }
}

function computeMetrics(data) {
  const now = new Date()
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const wonMesAtual = data.wonDeals?.filter(d => d.mes === mesAtual || d.dataGanho?.startsWith(mesAtual)) || []
  const totalWonValor = wonMesAtual.reduce((s, d) => s + (d.valor || 0), 0)
  const totalWonCount = wonMesAtual.length

  const lostMesAtual = data.lostDeals?.filter(d => d.mes === mesAtual) || []
  const totalLostCount = lostMesAtual.length
  const totalLostValor = lostMesAtual.reduce((s, d) => s + (d.valor || 0), 0)

  const metaAtual = data.metas?.find(m => m.mes === mesAtual)
  const metaValor = metaAtual?.meta_valor || 0
  const metaDeals = metaAtual?.meta_deals || 0
  const atingimentoValor = metaValor > 0 ? (totalWonValor / metaValor) * 100 : 0
  const atingimentoDeals = metaDeals > 0 ? (totalWonCount / metaDeals) * 100 : 0

  const openDeals = data.openDeals || []
  const totalFunilValor = openDeals.reduce((s, d) => s + (d.valor || 0), 0)
  const totalFunilCount = openDeals.length
  const ticketMedio = totalWonCount > 0 ? totalWonValor / totalWonCount : 0
  const totalDecididos = totalWonCount + totalLostCount
  const taxaConversao = totalDecididos > 0 ? (totalWonCount / totalDecididos) * 100 : 0
  const vendedoras = data.performanceVendedoras || []
  const historico = (data.historicoMensal || []).filter(h => h.mes >= '2026')
  const mesAnteriorData = historico.length >= 2 ? historico[historico.length - 2] : null
  const trendValor = mesAnteriorData ? ((totalWonValor - mesAnteriorData.won_value) / mesAnteriorData.won_value) * 100 : 0
  const trendConversao = mesAnteriorData ? taxaConversao - mesAnteriorData.conversion_rate : 0

  const STAGE_ORDER = ['Pedido de Cotacao', 'Em Negociacao', 'Proposta Aprovada']
  const funil = STAGE_ORDER.map(nome => {
    const stage = data.funil?.find(f => f.nome === nome) || { nome, count: 0, valor: 0 }
    return stage
  })

  const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const diaAtual = now.getDate()
  const projecaoValor = diaAtual > 0 ? (totalWonValor / diaAtual) * diasNoMes : 0
  const gapMeta = metaValor - totalWonValor

  return {
    mesAtual, totalWonValor, totalWonCount, totalLostCount,
    totalLostValor,
    totalFunilValor, totalFunilCount, ticketMedio, taxaConversao,
    metaValor, metaDeals, atingimentoValor, atingimentoDeals,
    trendValor: parseFloat(trendValor.toFixed(1)),
    trendConversao: parseFloat(trendConversao.toFixed(1)),
    vendedoras, funil, historico,
    motivosPerda: data.motivosPerda || [],
    projecaoValor, gapMeta, diasNoMes, diaAtual,
    isDemo: data.demo || false
  }
}
