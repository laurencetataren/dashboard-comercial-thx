// Vercel Serverless Function — GET /api/sheets
// Busca dados REAIS do Pipedrive (Pipeline 7 — Funil Oportunidade) e retorna JSON formatado
// Fallback para dados demo se PIPEDRIVE_API_KEY nao estiver configurada

const PIPEDRIVE_API_KEY = process.env.PIPEDRIVE_API_KEY
const PIPELINE_ID = 7

// Mapeamento de stages do Pipeline 7
const STAGES = {
  64: 'BUGS',
  54: 'Pedido de Cotacao',
  55: 'Em Negociacao',
  80: 'BID',
  56: 'Proposta Aprovada'
}

// Stages que aparecem no funil do dashboard (exclui BUGS)
const FUNIL_STAGES = [54, 55, 80, 56]
const FUNIL_ORDER = ['Pedido de Cotacao', 'Em Negociacao', 'BID', 'Proposta Aprovada']

// Mapeamento de users
const USERS = {
  24188122: 'Tayna Kazial',
  24588753: 'Gabrieli Muneretto',
  23289334: 'Laurence Tataren'
}

// Mapeamento de tipos de atividade para categorias do dashboard
const ACTIVITY_MAP = {
  'call': 'ligacoes',
  'email': 'emails',
  'whatsapp_': 'whatsapp',
  'meeting': 'reunioes',
  'reuniao_realizada_': 'reunioes',
  'pedido_cotacao_': 'propostas',
  'follow_up_de_negociacao_hu': 'followups',
  'follow_up_de_cotacao_farme': 'followups',
  'follow_up_de_agendamento_d': 'followups',
  'tentativa_agendamento_de_r': 'ligacoes'
}

// ========== PIPEDRIVE API HELPERS ==========

async function pipedriveFetch(endpoint, params = {}) {
  const url = new URL(`https://api.pipedrive.com/v1/${endpoint}`)
  url.searchParams.set('api_token', PIPEDRIVE_API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`Pipedrive API error: ${res.status} ${res.statusText} on ${endpoint}`)
  }
  return res.json()
}

async function fetchAllPages(endpoint, params = {}, filterFn = null) {
  let allData = []
  let start = 0
  const limit = 100

  while (true) {
    const result = await pipedriveFetch(endpoint, { ...params, start: String(start), limit: String(limit) })
    if (!result.data) break

    const items = filterFn ? result.data.filter(filterFn) : result.data
    allData = allData.concat(items)

    if (!result.additional_data?.pagination?.more_items_in_collection) break
    start = result.additional_data.pagination.next_start
  }

  return allData
}

// ========== DATA FETCHING ==========

async function fetchOpenDeals() {
  // Busca deals abertos de cada stage do Pipeline 7
  const allDeals = []
  for (const stageId of FUNIL_STAGES) {
    const deals = await fetchAllPages(`stages/${stageId}/deals`, { status: 'open' })
    allDeals.push(...deals)
  }
  return allDeals
}

async function fetchWonDeals() {
  // Busca todos os won deals e filtra por pipeline_id === 7
  const deals = await fetchAllPages('deals', { status: 'won' }, d => d.pipeline_id === PIPELINE_ID)
  return deals
}

async function fetchLostDeals() {
  // Busca todos os lost deals e filtra por pipeline_id === 7
  const deals = await fetchAllPages('deals', { status: 'lost' }, d => d.pipeline_id === PIPELINE_ID)
  return deals
}

async function fetchActivities(startDate, endDate) {
  // Busca atividades no periodo
  const activities = await fetchAllPages('activities', {
    start_date: startDate,
    end_date: endDate,
    done: '1'
  })
  return activities
}

// ========== DATA PROCESSING ==========

function getUserName(deal) {
  // user_id pode ser number ou object dependendo do endpoint
  if (typeof deal.user_id === 'object' && deal.user_id?.name) return deal.user_id.name
  if (typeof deal.user_id === 'number') return USERS[deal.user_id] || deal.owner_name || 'Desconhecido'
  return deal.owner_name || 'Desconhecido'
}

function getOrgName(deal) {
  if (typeof deal.org_id === 'object' && deal.org_id?.name) return deal.org_id.name
  return deal.org_name || ''
}

function getStageName(stageId) {
  return STAGES[stageId] || `Stage ${stageId}`
}

function getMonthKey(dateStr) {
  if (!dateStr) return null
  return dateStr.substring(0, 7) // "2026-03"
}

function processOpenDeals(deals) {
  return deals.map(d => ({
    id: String(d.id),
    titulo: d.title || '',
    valor: d.value || 0,
    estagio: getStageName(d.stage_id),
    vendedora: getUserName(d),
    empresa: getOrgName(d),
    dataCriacao: d.add_time ? d.add_time.substring(0, 10) : '',
    dataAtualizacao: d.update_time ? d.update_time.substring(0, 10) : ''
  }))
}

function processWonDeals(deals, mesAtual) {
  return deals.map(d => {
    const mes = getMonthKey(d.won_time) || getMonthKey(d.close_time) || getMonthKey(d.update_time) || mesAtual
    return {
      id: String(d.id),
      titulo: d.title || '',
      valor: d.value || 0,
      vendedora: getUserName(d),
      empresa: getOrgName(d),
      dataGanho: (d.won_time || d.close_time || d.update_time || '').substring(0, 10),
      mes
    }
  })
}

function processLostDeals(deals, mesAtual) {
  return deals.map(d => {
    const mes = getMonthKey(d.lost_time) || getMonthKey(d.close_time) || getMonthKey(d.update_time) || mesAtual
    return {
      id: String(d.id),
      titulo: d.title || '',
      valor: d.value || 0,
      vendedora: getUserName(d),
      motivo: d.lost_reason || 'Sem motivo',
      mes
    }
  })
}

function buildFunil(openDeals) {
  const stages = {}
  openDeals.forEach(d => {
    const s = d.estagio
    if (s === 'BUGS') return // Exclui BUGS do funil
    if (!stages[s]) stages[s] = { nome: s, count: 0, valor: 0 }
    stages[s].count++
    stages[s].valor += d.valor
  })
  // Ordenar conforme FUNIL_ORDER
  return FUNIL_ORDER
    .map(nome => stages[nome])
    .filter(Boolean)
}

function buildPerformance(wonDeals, mesAtual) {
  const wonMesAtual = wonDeals.filter(d => d.mes === mesAtual)
  const porVendedora = {}
  wonMesAtual.forEach(d => {
    const v = d.vendedora
    if (!porVendedora[v]) porVendedora[v] = { nome: v, count: 0, valor: 0 }
    porVendedora[v].count++
    porVendedora[v].valor += d.valor
  })
  return Object.values(porVendedora)
}

function buildMotivosPerda(lostDeals, mesAtual) {
  const lostMesAtual = lostDeals.filter(d => d.mes === mesAtual)
  const motivos = {}
  lostMesAtual.forEach(d => {
    const m = d.motivo || 'Sem motivo'
    if (!motivos[m]) motivos[m] = { motivo: m, count: 0 }
    motivos[m].count++
  })
  return Object.values(motivos).sort((a, b) => b.count - a.count)
}

function buildHistoricoMensal(wonDeals, lostDeals, openDeals) {
  // Agrupa por mes (ultimos 6 meses)
  const meses = {}
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    meses[key] = { mes: key, won_count: 0, won_value: 0, lost_count: 0, lost_value: 0, new_count: 0, conversion_rate: 0, ticket_medio: 0, ciclo_medio_dias: 0 }
  }

  wonDeals.forEach(d => {
    const m = d.mes
    if (meses[m]) {
      meses[m].won_count++
      meses[m].won_value += d.valor
    }
  })

  lostDeals.forEach(d => {
    const m = d.mes
    if (meses[m]) {
      meses[m].lost_count++
      meses[m].lost_value += d.valor
    }
  })

  // Calcula metricas derivadas
  Object.values(meses).forEach(m => {
    const total = m.won_count + m.lost_count
    m.conversion_rate = total > 0 ? Math.round((m.won_count / total) * 1000) / 10 : 0
    m.ticket_medio = m.won_count > 0 ? Math.round(m.won_value / m.won_count) : 0
  })

  return Object.values(meses)
}

function buildAtividades(activities) {
  // Agrupa atividades por user
  const byUser = {}

  activities.forEach(a => {
    const userId = a.user_id
    const userName = USERS[userId]
    if (!userName) return // Ignora users que nao sao vendedoras

    if (!byUser[userName]) {
      byUser[userName] = { vendedora: userName, ligacoes: 0, emails: 0, whatsapp: 0, reunioes: 0, propostas: 0, followups: 0 }
    }

    const categoria = ACTIVITY_MAP[a.type] || 'followups'
    byUser[userName][categoria]++
  })

  return Object.values(byUser)
}

function buildClientesAtivos(openDeals, wonDeals, lostDeals) {
  // Agrupa todos os deals por organizacao
  const byOrg = {}

  const processDeal = (d, status) => {
    const org = d.empresa || d.titulo
    if (!org) return
    if (!byOrg[org]) {
      byOrg[org] = {
        cliente: org,
        perfil: 'Cliente',
        responsavel: d.vendedora,
        numDeals: 0,
        valorCotado: 0,
        vendido: 0,
        wonCount: 0,
        lostCount: 0,
        openCount: 0
      }
    }
    byOrg[org].numDeals++
    byOrg[org].valorCotado += d.valor
    if (status === 'won') {
      byOrg[org].vendido += d.valor
      byOrg[org].wonCount++
    }
    if (status === 'lost') byOrg[org].lostCount++
    if (status === 'open') byOrg[org].openCount++
    // Atualiza responsavel se houver
    if (d.vendedora && d.vendedora !== 'Desconhecido') {
      byOrg[org].responsavel = d.vendedora
    }
  }

  openDeals.forEach(d => processDeal(d, 'open'))
  wonDeals.forEach(d => processDeal(d, 'won'))
  lostDeals.forEach(d => processDeal(d, 'lost'))

  // Calcula termometro e conversao
  return Object.values(byOrg)
    .map(c => {
      const conversao = c.valorCotado > 0 ? Math.round((c.vendido / c.valorCotado) * 100) : 0
      let termometro = 'Frio'
      if (c.openCount > 0 && c.wonCount > 0) termometro = 'Quente'
      else if (c.openCount > 0 || c.wonCount > 0) termometro = 'Morno'

      return {
        cliente: c.cliente,
        perfil: c.perfil,
        termometro,
        responsavel: c.responsavel,
        numDeals: c.numDeals,
        valorCotado: c.valorCotado,
        vendido: c.vendido,
        conversao
      }
    })
    .sort((a, b) => b.valorCotado - a.valorCotado)
    .slice(0, 30) // Top 30 clientes
}

// Metas (hardcoded por enquanto, pode migrar para planilha depois)
function getMetas() {
  return [
    { mes: '2026-01', meta_valor: 800000, meta_deals: 50 },
    { mes: '2026-02', meta_valor: 850000, meta_deals: 52 },
    { mes: '2026-03', meta_valor: 400000, meta_deals: 25 },
    { mes: '2026-04', meta_valor: 500000, meta_deals: 30 }
  ]
}

// ========== MAIN HANDLER ==========

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Modo demo (sem Pipedrive API key configurada)
  if (!PIPEDRIVE_API_KEY) {
    return res.status(200).json(getDemoData())
  }

  try {
    const now = new Date()
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const startOfMonth = `${mesAtual}-01`
    const endOfMonth = `${mesAtual}-31`

    // Busca dados em paralelo
    const [rawOpen, rawWon, rawLost, rawActivities] = await Promise.all([
      fetchOpenDeals(),
      fetchWonDeals(),
      fetchLostDeals(),
      fetchActivities(startOfMonth, endOfMonth)
    ])

    // Processa dados
    const openDeals = processOpenDeals(rawOpen)
    const wonDeals = processWonDeals(rawWon, mesAtual)
    const lostDeals = processLostDeals(rawLost, mesAtual)
    const atividades = buildAtividades(rawActivities)
    const clientesAtivos = buildClientesAtivos(openDeals, wonDeals, lostDeals)

    const data = {
      timestamp: now.toISOString(),
      demo: false,
      openDeals,
      wonDeals: wonDeals.filter(d => d.mes === mesAtual),
      lostDeals: lostDeals.filter(d => d.mes === mesAtual),
      funil: buildFunil(openDeals),
      performanceVendedoras: buildPerformance(wonDeals, mesAtual),
      motivosPerda: buildMotivosPerda(lostDeals, mesAtual),
      historicoMensal: buildHistoricoMensal(wonDeals, lostDeals, openDeals),
      metas: getMetas(),
      atividades,
      clientesAtivos
    }

    // Cache 5 minutos
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(data)
  } catch (error) {
    console.error('Erro ao buscar dados do Pipedrive:', error)
    // Fallback para demo em caso de erro
    return res.status(200).json({ ...getDemoData(), error: error.message, fallback: true })
  }
}

// ========== DEMO DATA (fallback) ==========

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
