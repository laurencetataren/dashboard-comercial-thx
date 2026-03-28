// Vercel Serverless Function — GET /api/sheets
// Busca dados da Google Sheets publica (ou com API key) e retorna JSON formatado
// A planilha deve ter as abas: "Deals", "Historico", "Metas"

const SHEET_ID = process.env.GOOGLE_SHEET_ID
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY

async function fetchSheet(sheetName) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Erro ao buscar aba "${sheetName}": ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return data.values || []
}

function parseRows(rows) {
  if (!rows || rows.length < 2) return []
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  return rows.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = row[i] || ''
    })
    return obj
  })
}

function parseCurrency(val) {
  if (!val) return 0
  return parseFloat(String(val).replace(/[R$\s.]/g, '').replace(',', '.')) || 0
}

function formatData(deals, historico, metas) {
  const openDeals = deals
    .filter(d => d.status === 'open')
    .map(d => ({
      id: d.id,
      titulo: d.titulo || d.title,
      valor: parseCurrency(d.valor),
      estagio: d.estagio || d.stage,
      vendedora: d.vendedora || d.owner,
      empresa: d.empresa || d.org,
      dataCriacao: d.data_criacao || d.created,
      dataAtualizacao: d.data_atualizacao || d.updated
    }))

  const wonDeals = deals
    .filter(d => d.status === 'won')
    .map(d => ({
      id: d.id,
      titulo: d.titulo || d.title,
      valor: parseCurrency(d.valor),
      vendedora: d.vendedora || d.owner,
      empresa: d.empresa || d.org,
      dataGanho: d.data_ganho || d.won_date,
      mes: d.mes || d.month
    }))

  const lostDeals = deals
    .filter(d => d.status === 'lost')
    .map(d => ({
      id: d.id,
      titulo: d.titulo || d.title,
      valor: parseCurrency(d.valor),
      vendedora: d.vendedora || d.owner,
      motivo: d.motivo_perda || d.lost_reason,
      mes: d.mes || d.month
    }))

  const historicoMensal = historico.map(h => ({
    mes: h.mes || h.month,
    won_count: parseInt(h.won_count) || 0,
    won_value: parseCurrency(h.won_value || h.valor_ganho),
    lost_count: parseInt(h.lost_count) || 0,
    lost_value: parseCurrency(h.lost_value || h.valor_perdido),
    new_count: parseInt(h.new_count || h.novos) || 0,
    conversion_rate: parseFloat(h.conversion_rate || h.taxa_conversao) || 0,
    ticket_medio: parseCurrency(h.ticket_medio),
    ciclo_medio_dias: parseInt(h.ciclo_medio_dias) || 0
  }))

  const metasMensal = metas.map(m => ({
    mes: m.mes || m.month,
    meta_valor: parseCurrency(m.meta_valor || m.target),
    meta_deals: parseInt(m.meta_deals || m.target_deals) || 0
  }))

  const stages = {}
  openDeals.forEach(d => {
    if (!stages[d.estagio]) stages[d.estagio] = { nome: d.estagio, count: 0, valor: 0 }
    stages[d.estagio].count++
    stages[d.estagio].valor += d.valor
  })

  const porVendedora = {}
  wonDeals.forEach(d => {
    if (!porVendedora[d.vendedora]) porVendedora[d.vendedora] = { nome: d.vendedora, count: 0, valor: 0 }
    porVendedora[d.vendedora].count++
    porVendedora[d.vendedora].valor += d.valor
  })

  const motivos = {}
  lostDeals.forEach(d => {
    const m = d.motivo || 'Sem motivo'
    if (!motivos[m]) motivos[m] = { motivo: m, count: 0 }
    motivos[m].count++
  })

  return {
    timestamp: new Date().toISOString(),
    openDeals,
    wonDeals,
    lostDeals,
    funil: Object.values(stages),
    performanceVendedoras: Object.values(porVendedora),
    motivosPerda: Object.values(motivos).sort((a, b) => b.count - a.count),
    historicoMensal,
    metas: metasMensal
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SHEET_ID || !API_KEY) {
    return res.status(200).json(getDemoData())
  }

  try {
    const [dealsRows, historicoRows, metasRows] = await Promise.all([
      fetchSheet('Deals'),
      fetchSheet('Historico'),
      fetchSheet('Metas')
    ])

    const deals = parseRows(dealsRows)
    const historico = parseRows(historicoRows)
    const metas = parseRows(metasRows)

    const data = formatData(deals, historico, metas)

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(data)
  } catch (error) {
    console.error('Erro ao buscar dados:', error)
    return res.status(500).json({ error: error.message })
  }
}

function getDemoData() {
  const now = new Date()
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return {
    timestamp: now.toISOString(),
    demo: true,
    openDeals: [
      { id: '1', titulo: 'Transportadora Alpha', valor: 45000, estagio: 'Pedido de Cotacao', vendedora: 'Tayna Kazial', empresa: 'Alpha Logistica', dataCriacao: '2026-03-10' },
      { id: '2', titulo: 'Embarcador Beta', valor: 78000, estagio: 'Em Negociacao', vendedora: 'Gabrieli Muneretto', empresa: 'Beta Industria', dataCriacao: '2026-03-05' },
      { id: '3', titulo: 'Logistica Gamma', valor: 32000, estagio: 'Em Negociacao', vendedora: 'Tayna Kazial', empresa: 'Gamma Express', dataCriacao: '2026-03-15' },
      { id: '4', titulo: 'Frete Delta Corp', valor: 91000, estagio: 'Proposta Aprovada', vendedora: 'Gabrieli Muneretto', empresa: 'Delta Corp', dataCriacao: '2026-02-28' },
      { id: '5', titulo: 'Rodoviario Epsilon', valor: 55000, estagio: 'Em Negociacao', vendedora: 'Tayna Kazial', empresa: 'Epsilon Cargo', dataCriacao: '2026-03-12' },
      { id: '6', titulo: 'Transporte Zeta', valor: 120000, estagio: 'Em Negociacao', vendedora: 'Gabrieli Muneretto', empresa: 'Zeta Log', dataCriacao: '2026-03-20' },
      { id: '7', titulo: 'Operador Eta', valor: 67000, estagio: 'Pedido de Cotacao', vendedora: 'Tayna Kazial', empresa: 'Eta Transportes', dataCriacao: '2026-03-18' },
      { id: '8', titulo: 'Carga Theta', valor: 43000, estagio: 'Em Negociacao', vendedora: 'Gabrieli Muneretto', empresa: 'Theta Freight', dataCriacao: '2026-03-22' }
    ],
    wonDeals: [
      { id: '101', titulo: 'Cliente Omega Won', valor: 85000, vendedora: 'Tayna Kazial', empresa: 'Omega Log', dataGanho: '2026-03-01', mes: mesAtual },
      { id: '102', titulo: 'Frete Sigma Won', valor: 120000, vendedora: 'Gabrieli Muneretto', empresa: 'Sigma Trans', dataGanho: '2026-03-05', mes: mesAtual },
      { id: '103', titulo: 'Logistica Kappa Won', valor: 95000, vendedora: 'Tayna Kazial', empresa: 'Kappa Express', dataGanho: '2026-03-10', mes: mesAtual },
      { id: '104', titulo: 'Transporte Lambda Won', valor: 67000, vendedora: 'Gabrieli Muneretto', empresa: 'Lambda Cargo', dataGanho: '2026-03-12', mes: mesAtual },
      { id: '105', titulo: 'Rodo Mu Won', valor: 142000, vendedora: 'Tayna Kazial', empresa: 'Mu Rodoviario', dataGanho: '2026-03-15', mes: mesAtual },
      { id: '106', titulo: 'Express Nu Won', valor: 78000, vendedora: 'Gabrieli Muneretto', empresa: 'Nu Express', dataGanho: '2026-03-18', mes: mesAtual },
      { id: '107', titulo: 'Cargo Xi Won', valor: 53000, vendedora: 'Tayna Kazial', empresa: 'Xi Cargo', dataGanho: '2026-03-22', mes: mesAtual },
      { id: '108', titulo: 'Trans Omicron Won', valor: 14421, vendedora: 'Gabrieli Muneretto', empresa: 'Omicron Log', dataGanho: '2026-03-25', mes: mesAtual }
    ],
    lostDeals: [
      { id: '201', titulo: 'Perdido A', valor: 45000, vendedora: 'Tayna Kazial', motivo: 'Preco', mes: mesAtual },
      { id: '202', titulo: 'Perdido B', valor: 32000, vendedora: 'Gabrieli Muneretto', motivo: 'Preco', mes: mesAtual },
      { id: '203', titulo: 'Perdido C', valor: 67000, vendedora: 'Tayna Kazial', motivo: 'Prazo', mes: mesAtual },
      { id: '204', titulo: 'Perdido D', valor: 28000, vendedora: 'Gabrieli Muneretto', motivo: 'Concorrencia', mes: mesAtual },
      { id: '205', titulo: 'Perdido E', valor: 91000, vendedora: 'Tayna Kazial', motivo: 'Preco', mes: mesAtual },
      { id: '206', titulo: 'Perdido F', valor: 55000, vendedora: 'Gabrieli Muneretto', motivo: 'Sem resposta', mes: mesAtual }
    ],
    funil: [
      { nome: 'Pedido de Cotacao', count: 2, valor: 112000 },
      { nome: 'Em Negociacao', count: 5, valor: 328000 },
      { nome: 'Proposta Aprovada', count: 1, valor: 91000 }
    ],
    performanceVendedoras: [
      { nome: 'Tayna Kazial', count: 4, valor: 375000 },
      { nome: 'Gabrieli Muneretto', count: 4, valor: 279421 }
    ],
    motivosPerda: [
      { motivo: 'Preco', count: 3 },
      { motivo: 'Prazo', count: 1 },
      { motivo: 'Concorrencia', count: 1 },
      { motivo: 'Sem resposta', count: 1 }
    ],
    historicoMensal: [
      { mes: '2025-10', won_count: 52, won_value: 900000, lost_count: 180, lost_value: 450000, new_count: 280, conversion_rate: 22.4, ticket_medio: 17307, ciclo_medio_dias: 18 },
      { mes: '2025-11', won_count: 45, won_value: 668000, lost_count: 200, lost_value: 520000, new_count: 310, conversion_rate: 18.4, ticket_medio: 14844, ciclo_medio_dias: 21 },
      { mes: '2025-12', won_count: 61, won_value: 1070000, lost_count: 170, lost_value: 380000, new_count: 290, conversion_rate: 26.4, ticket_medio: 17540, ciclo_medio_dias: 15 },
      { mes: '2026-01', won_count: 42, won_value: 682000, lost_count: 220, lost_value: 580000, new_count: 320, conversion_rate: 16.0, ticket_medio: 16238, ciclo_medio_dias: 22 },
      { mes: '2026-02', won_count: 55, won_value: 951000, lost_count: 190, lost_value: 410000, new_count: 300, conversion_rate: 22.4, ticket_medio: 17290, ciclo_medio_dias: 17 },
      { mes: '2026-03', won_count: 48, won_value: 654421, lost_count: 250, lost_value: 620000, new_count: 340, conversion_rate: 16.1, ticket_medio: 13633, ciclo_medio_dias: 19 }
    ],
    metas: [
      { mes: '2026-01', meta_valor: 800000, meta_deals: 50 },
      { mes: '2026-02', meta_valor: 850000, meta_deals: 52 },
      { mes: '2026-03', meta_valor: 400000, meta_deals: 25 },
      { mes: '2026-04', meta_valor: 500000, meta_deals: 30 }
    ],
    atividades: [
      { vendedora: 'Tayna Kazial', ligacoes: 87, emails: 124, reunioes: 12, propostas: 18, followups: 45, whatsapp: 156 },
      { vendedora: 'Gabrieli Muneretto', ligacoes: 63, emails: 98, reunioes: 8, propostas: 14, followups: 32, whatsapp: 112 }
    ],
    clientesAtivos: [
      { cliente: 'Alpha Logistica', perfil: 'Transportadora', termometro: 'Quente', responsavel: 'Tayna Kazial', numDeals: 3, valorCotado: 135000, vendido: 85000, conversao: 63 },
      { cliente: 'Beta Industria', perfil: 'Embarcador', termometro: 'Morno', responsavel: 'Gabrieli Muneretto', numDeals: 2, valorCotado: 156000, vendido: 78000, conversao: 50 },
      { cliente: 'Gamma Express', perfil: 'Transportadora', termometro: 'Frio', responsavel: 'Tayna Kazial', numDeals: 1, valorCotado: 32000, vendido: 0, conversao: 0 },
      { cliente: 'Delta Corp', perfil: 'Embarcador', termometro: 'Quente', responsavel: 'Gabrieli Muneretto', numDeals: 4, valorCotado: 280000, vendido: 189000, conversao: 68 },
      { cliente: 'Epsilon Cargo', perfil: 'Transportadora', termometro: 'Morno', responsavel: 'Tayna Kazial', numDeals: 2, valorCotado: 110000, vendido: 55000, conversao: 50 },
      { cliente: 'Zeta Log', perfil: 'Operador Logistico', termometro: 'Quente', responsavel: 'Gabrieli Muneretto', numDeals: 5, valorCotado: 360000, vendido: 240000, conversao: 67 },
      { cliente: 'Eta Transportes', perfil: 'Transportadora', termometro: 'Morno', responsavel: 'Tayna Kazial', numDeals: 2, valorCotado: 134000, vendido: 67000, conversao: 50 },
      { cliente: 'Theta Freight', perfil: 'Embarcador', termometro: 'Frio', responsavel: 'Gabrieli Muneretto', numDeals: 1, valorCotado: 43000, vendido: 0, conversao: 0 },
      { cliente: 'Iota Rodoviario', perfil: 'Transportadora', termometro: 'Quente', responsavel: 'Tayna Kazial', numDeals: 3, valorCotado: 195000, vendido: 142000, conversao: 73 },
      { cliente: 'Kappa Express', perfil: 'Operador Logistico', termometro: 'Morno', responsavel: 'Gabrieli Muneretto', numDeals: 2, valorCotado: 190000, vendido: 95000, conversao: 50 }
    ]
  }
}
