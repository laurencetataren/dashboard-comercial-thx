// Vercel Serverless Function â GET /api/sheets
// Busca dados REAIS do Pipedrive (Pipeline 7 â Funil Oportunidade) e retorna JSON formatado
// Fallback para dados demo se PIPEDRIVE_API_KEY nao estiver configurada

const PIPEDRIVE_API_KEY = process.env.PIPEDRIVE_API_KEY
const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN
const PIPELINE_ID = 7

// ClickUp Flash FTL
const CLICKUP_FLASH_FTL_LIST = '901304617884'
const CLICKUP_FRETE_EMPRESA_FIELD = 'b0d60416-41fd-4dcd-95f8-8d44db267745'
const CLICKUP_COLETA_FIELD = 'ee0f910c-b3dc-4e7f-8e5f-e00f0fa04707'
const CLICKUP_MOTIVO_NOSHOW_FIELD = '947cdd58-3c6d-4d78-a0ce-b303af389b69'

// Statuses que indicam que a carga PASSOU por "em transito" (executada)
const PASSED_EM_TRANSITO = ['em transito', 'entregues', 'liberado faturamento', 'faturado', 'finalizado']
// Statuses de perda na execucao
const EXECUTION_LOST = ['no show', 'cancelada']

// Mapeamento de stages do Pipeline 7
const STAGES = {
  64: 'BUGS',
  54: 'Pedido de Cotacao',
  55: 'Em Negociacao',
  80: 'BID',
  56: 'Proposta Aprovada'
}

// Stages que aparecem no funil do dashboard (exclui BUGS e BID)
const FUNIL_STAGES = [54, 55, 56]
const FUNIL_ORDER = ['Pedido de Cotacao', 'Em Negociacao', 'Proposta Aprovada']

// Pipedrive Organizations â Clientes Ativos
const CLIENTES_ATIVOS_FILTER_ID = 31374
const ORG_STATUS_TERMOMETRO_KEY = '4abea383919e4b58f5896ed5cf571d89396d1bc5'
const ORG_PERFIL_COMPRA_KEY = 'e52751b2ca4cdbe74f9f473e158d2f8689c7e66f'
const STATUS_TERMOMETRO_MAP = { '252': 'ATIVO', '253': 'ATENCAO', '254': 'RISCO', '255': 'INATIVO' }
const PERFIL_COMPRA_MAP = { '249': 'A - Cotacao diaria', '250': 'B - Cotacao semanal', '251': 'C - Cotacao esporadica' }

// Mapeamento de users (todos os usuarios do sistema)
const USERS = {
  24188122: 'Tayna Kazial',
  24588753: 'Gabrieli Muneretto',
  23289334: 'Laurence Tataren'
}

// Apenas vendedoras — usado para inicializar metricas do dashboard (exclui Laurence)
const VENDEDORAS = {
  24188122: 'Tayna Kazial',
  24588753: 'Gabrieli Muneretto'
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

async function fetchAllPages(endpoint, params = {}, filterFn = null, maxPages = 10) {
  let allData = []
  let start = 0
  const limit = 100
  let page = 0

  while (page < maxPages) {
    const result = await pipedriveFetch(endpoint, { ...params, start: String(start), limit: String(limit) })
    if (!result.data) break

    const items = filterFn ? result.data.filter(filterFn) : result.data
    allData = allData.concat(items)

    if (!result.additional_data?.pagination?.more_items_in_collection) break
    start = result.additional_data.pagination.next_start
    page++
  }

  return allData
}

// ========== DATA FETCHING ==========

async function fetchOpenDeals() {
  // Busca deals abertos de cada stage do Pipeline 7 em PARALELO
  const results = await Promise.all(
    FUNIL_STAGES.map(stageId => fetchAllPages(`stages/${stageId}/deals`, { everyone: '1' }))
  )
  return results.flat()
}

async function fetchWonDeals(sinceDate) {
  // Busca won deals filtrados por pipeline 7 e data minima (reduz paginacao)
  const params = { status: 'won', user_id: '0', sort: 'update_time DESC' }
  if (sinceDate) params.start_date = sinceDate
  const deals = await fetchAllPages('deals', params, d => d.pipeline_id === PIPELINE_ID, 2)
  return deals
}

async function fetchLostDeals(sinceDate) {
  // Busca lost deals filtrados por pipeline 7 e data minima (reduz paginacao)
  const params = { status: 'lost', user_id: '0', sort: 'update_time DESC' }
  if (sinceDate) params.start_date = sinceDate
  const deals = await fetchAllPages('deals', params, d => d.pipeline_id === PIPELINE_ID, 2)
  return deals
}

async function fetchActivities(startDate, endDate) {
  // Busca atividades REALIZADAS no periodo, max 5 paginas
  const activities = await fetchAllPages('activities', {
    start_date: startDate,
    end_date: endDate,
    done: '1'
  }, null, 5)
  return activities
}

async function fetchPendingActivities(startDate, endDate) {
  const activities = await fetchAllPages('activities', {
    start_date: startDate,
    end_date: endDate,
    done: '0'
  }, null, 5)
  return activities
}

async function fetchActivities30Days() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  const startStr = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`
  const endStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const activities = await fetchAllPages('activities', {
    start_date: startStr, end_date: endStr, done: '1'
  }, null, 10)
  return activities
}

async function fetchOverdueActivities() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const startStr = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-01`
  const endStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`
  const activities = await fetchAllPages('activities', {
    start_date: startStr, end_date: endStr, done: '0'
  }, null, 5)
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
  const now = new Date()
  return deals.map(d => {
    const addTime = d.add_time ? d.add_time.substring(0, 10) : ''
    const diasParado = addTime ? Math.floor((now - new Date(addTime)) / (1000*60*60*24)) : 0
    return {
      id: String(d.id),
      titulo: d.title || '',
      valor: d.value || 0,
      estagio: getStageName(d.stage_id),
      vendedora: getUserName(d),
      empresa: getOrgName(d),
      dataCriacao: addTime,
      dataAtualizacao: d.update_time ? d.update_time.substring(0, 10) : '',
      nextActivityDate: d.next_activity_date || null,
      nextActivityId: d.next_activity_id || null,
      diasParado
    }
  })
}

function processWonDeals(deals, mesAtual) {
  return deals.map(d => {
    const mes = getMonthKey(d.won_time) || getMonthKey(d.close_time) || getMonthKey(d.update_time) || mesAtual
    const addTime = d.add_time ? d.add_time.substring(0, 10) : ''
    const wonTime = (d.won_time || d.close_time || d.update_time || '').substring(0, 10)
    let cicloDias = 0
    if (addTime && wonTime) {
      cicloDias = Math.max(1, Math.floor((new Date(wonTime) - new Date(addTime)) / (1000*60*60*24)))
    }
    return {
      id: String(d.id),
      titulo: d.title || '',
      valor: d.value || 0,
      vendedora: getUserName(d),
      empresa: getOrgName(d),
      dataGanho: wonTime,
      dataCriacao: addTime,
      cicloDias,
      mes
    }
  })
}

function processLostDeals(deals, mesAtual) {
  return deals.map(d => {
    const mes = getMonthKey(d.lost_time) || getMonthKey(d.close_time) || getMonthKey(d.update_time) || mesAtual
    const addTime = d.add_time ? d.add_time.substring(0, 10) : ''
    return {
      id: String(d.id),
      titulo: d.title || '',
      valor: d.value || 0,
      vendedora: getUserName(d),
      empresa: getOrgName(d),
      motivo: d.lost_reason || 'Sem motivo',
      dataCriacao: addTime,
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
  // Inicializa TODAS as vendedoras do mapa para garantir que aparecem mesmo sem deals
  const porVendedora = {}
  Object.values(VENDEDORAS).forEach(nome => {
    porVendedora[nome] = { nome, count: 0, valor: 0 }
  })
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
  // Inicializa TODAS as vendedoras para garantir presenca mesmo sem atividades
  const byUser = {}
  Object.values(VENDEDORAS).forEach(nome => {
    byUser[nome] = { vendedora: nome, ligacoes: 0, emails: 0, whatsapp: 0, reunioes: 0, propostas: 0, followups: 0 }
  })

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

async function fetchClientesAtivos() {
  // Busca organizacoes do Pipedrive usando filtro "Clientes Ativos" (ID 31374)
  const orgs = await fetchAllPages('organizations', { filter_id: String(CLIENTES_ATIVOS_FILTER_ID) })
  return orgs
}

function processClientesAtivos(orgs, wonDeals, mesFiltro) {
  // Calcula valor vendido por org no mes filtrado
  const wonByOrg = {}
  const wonFiltered = mesFiltro ? wonDeals.filter(d => d.mes === mesFiltro) : wonDeals
  wonFiltered.forEach(d => {
    const orgName = d.empresa
    if (!orgName) return
    if (!wonByOrg[orgName]) wonByOrg[orgName] = { valor: 0, count: 0 }
    wonByOrg[orgName].valor += d.valor
    wonByOrg[orgName].count++
  })

  return orgs.map(o => {
    const nome = o.name || ''
    const ownerName = o.owner_name || (typeof o.owner_id === 'object' ? o.owner_id?.name : '') || 'N/A'
    const termometro = STATUS_TERMOMETRO_MAP[String(o[ORG_STATUS_TERMOMETRO_KEY])] || 'N/A'
    const perfil = PERFIL_COMPRA_MAP[String(o[ORG_PERFIL_COMPRA_KEY])] || 'N/A'
    const wonData = wonByOrg[nome] || { valor: 0, count: 0 }

    return {
      cliente: nome,
      termometro,
      perfil,
      responsavel: ownerName,
      pessoas: o.people_count || 0,
      wonDealsCount: o.won_deals_count || 0,
      closedDealsCount: o.closed_deals_count || 0,
      openDealsCount: o.open_deals_count || 0,
      vendidoMes: wonData.valor,
      dealsGanhosMes: wonData.count
    }
  }).sort((a, b) => b.wonDealsCount - a.wonDealsCount)
}

// ========== QUALITY INDICATORS ==========

function buildAtividadesStatus(doneActivities, pendingActivities, overdueActivities) {
  const byVendedora = {}
  Object.values(VENDEDORAS).forEach(nome => {
    byVendedora[nome] = { vendedora: nome, agendadas: 0, executadas: 0, noPrazo: 0, foraDoPrazo: 0, atrasadas: 0 }
  })

  doneActivities.forEach(a => {
    const userName = VENDEDORAS[a.user_id]
    if (!userName) return
    if (!byVendedora[userName]) byVendedora[userName] = { vendedora: userName, agendadas: 0, executadas: 0, noPrazo: 0, foraDoPrazo: 0, atrasadas: 0 }
    byVendedora[userName].executadas++
    byVendedora[userName].agendadas++
    const doneDate = (a.done_time || '').substring(0, 10)
    const dueDate = a.due_date || ''
    if (doneDate && dueDate) {
      if (doneDate <= dueDate) byVendedora[userName].noPrazo++
      else byVendedora[userName].foraDoPrazo++
    } else {
      byVendedora[userName].noPrazo++
    }
  })

  pendingActivities.forEach(a => {
    const userName = VENDEDORAS[a.user_id]
    if (!userName) return
    if (!byVendedora[userName]) byVendedora[userName] = { vendedora: userName, agendadas: 0, executadas: 0, noPrazo: 0, foraDoPrazo: 0, atrasadas: 0 }
    byVendedora[userName].agendadas++
  })

  overdueActivities.forEach(a => {
    const userName = VENDEDORAS[a.user_id]
    if (!userName) return
    if (!byVendedora[userName]) byVendedora[userName] = { vendedora: userName, agendadas: 0, executadas: 0, noPrazo: 0, foraDoPrazo: 0, atrasadas: 0 }
    byVendedora[userName].atrasadas++
  })

  const result = Object.values(byVendedora)
  const totais = result.reduce((acc, v) => ({
    agendadas: acc.agendadas + v.agendadas,
    executadas: acc.executadas + v.executadas,
    noPrazo: acc.noPrazo + v.noPrazo,
    foraDoPrazo: acc.foraDoPrazo + v.foraDoPrazo,
    atrasadas: acc.atrasadas + v.atrasadas
  }), { agendadas: 0, executadas: 0, noPrazo: 0, foraDoPrazo: 0, atrasadas: 0 })

  return { porVendedora: result, totais }
}

function buildDealsOrfaos(openDeals) {
  const orfaos = openDeals.filter(d => !d.nextActivityDate && d.estagio !== 'BUGS')
  const byVendedora = {}
  Object.values(VENDEDORAS).forEach(nome => { byVendedora[nome] = [] })
  orfaos.forEach(d => {
    if (!byVendedora[d.vendedora]) byVendedora[d.vendedora] = []
    byVendedora[d.vendedora].push(d)
  })
  return {
    total: orfaos.length,
    deals: orfaos.sort((a, b) => b.diasParado - a.diasParado),
    porVendedora: byVendedora
  }
}

function buildAtividadesDiarias(activities) {
  const byDay = {}
  activities.forEach(a => {
    const userName = VENDEDORAS[a.user_id]
    if (!userName) return
    const dia = (a.due_date || a.done_time || a.update_time || '').substring(0, 10)
    if (!dia) return
    if (!byDay[dia]) byDay[dia] = {}
    if (!byDay[dia][userName]) byDay[dia][userName] = { total: 0, ligacoes: 0 }
    byDay[dia][userName].total++
    const cat = ACTIVITY_MAP[a.type]
    if (cat === 'ligacoes') byDay[dia][userName].ligacoes++
  })

  return Object.entries(byDay)
    .map(([dia, vendedoras]) => ({ dia, ...vendedoras }))
    .sort((a, b) => a.dia.localeCompare(b.dia))
}

function buildSalesVelocity(wonDeals, lostDeals, mesAtual) {
  const wonMes = wonDeals.filter(d => d.mes === mesAtual)
  const lostMes = lostDeals.filter(d => d.mes === mesAtual)

  function calcVelocity(won, lost) {
    const numDeals = won.length + lost.length
    const valorMedio = won.length > 0 ? won.reduce((s, d) => s + d.valor, 0) / won.length : 0
    const conversao = numDeals > 0 ? won.length / numDeals : 0
    const ciclos = won.filter(d => d.cicloDias > 0).map(d => d.cicloDias)
    const cicloMedio = ciclos.length > 0 ? ciclos.reduce((s, c) => s + c, 0) / ciclos.length : 1
    const velocity = cicloMedio > 0 ? (numDeals * valorMedio * conversao) / cicloMedio : 0

    return {
      velocity: Math.round(velocity),
      numDeals,
      valorMedio: Math.round(valorMedio),
      conversao: Math.round(conversao * 1000) / 10,
      cicloMedio: Math.round(cicloMedio * 10) / 10
    }
  }

  const geral = calcVelocity(wonMes, lostMes)

  const porVendedora = {}
  Object.values(VENDEDORAS).forEach(nome => {
    const wonV = wonMes.filter(d => d.vendedora === nome)
    const lostV = lostMes.filter(d => d.vendedora === nome)
    porVendedora[nome] = calcVelocity(wonV, lostV)
  })

  return { geral, porVendedora }
}

function buildFollowupFrequency(doneActivities, wonDeals, lostDeals, mesAtual) {
  const actsByDeal = {}
  doneActivities.forEach(a => {
    const dealId = a.deal_id
    if (!dealId) return
    if (!actsByDeal[dealId]) actsByDeal[dealId] = 0
    actsByDeal[dealId]++
  })

  const wonMes = wonDeals.filter(d => d.mes === mesAtual)
  const lostMes = lostDeals.filter(d => d.mes === mesAtual)

  const wonFollowups = wonMes.map(d => actsByDeal[d.id] || 0)
  const lostFollowups = lostMes.map(d => actsByDeal[d.id] || 0)

  const avgWon = wonFollowups.length > 0 ? wonFollowups.reduce((s, v) => s + v, 0) / wonFollowups.length : 0
  const avgLost = lostFollowups.length > 0 ? lostFollowups.reduce((s, v) => s + v, 0) / lostFollowups.length : 0

  function countByRange(arr) {
    return {
      zero: arr.filter(v => v === 0).length,
      um_dois: arr.filter(v => v >= 1 && v <= 2).length,
      tres_cinco: arr.filter(v => v >= 3 && v <= 5).length,
      seis_dez: arr.filter(v => v >= 6 && v <= 10).length,
      mais_dez: arr.filter(v => v > 10).length
    }
  }

  return {
    mediaWon: Math.round(avgWon * 10) / 10,
    mediaLost: Math.round(avgLost * 10) / 10,
    distribuicaoWon: countByRange(wonFollowups),
    distribuicaoLost: countByRange(lostFollowups)
  }
}

function buildTempoResposta(doneActivities, openDeals, wonDeals, lostDeals) {
  const firstActivityByDeal = {}
  doneActivities.forEach(a => {
    const dealId = a.deal_id
    if (!dealId) return
    const actTime = a.done_time || a.add_time || a.update_time || ''
    if (!actTime) return
    if (!firstActivityByDeal[dealId] || actTime < firstActivityByDeal[dealId]) {
      firstActivityByDeal[dealId] = actTime
    }
  })

  const allDeals = [...openDeals, ...wonDeals, ...lostDeals]
  const respostas = []

  allDeals.forEach(d => {
    const firstAct = firstActivityByDeal[d.id]
    if (!firstAct || !d.dataCriacao) return
    const addDate = new Date(d.dataCriacao)
    const actDate = new Date(firstAct)
    const horasResposta = Math.max(0, (actDate - addDate) / (1000 * 60 * 60))

    if (horasResposta < 720) {
      respostas.push({
        dealId: d.id,
        empresa: d.empresa,
        vendedora: d.vendedora,
        horasResposta: Math.round(horasResposta * 10) / 10,
        valor: d.valor
      })
    }
  })

  const media = respostas.length > 0
    ? respostas.reduce((s, r) => s + r.horasResposta, 0) / respostas.length
    : 0

  const distribuicao = {
    ate2h: respostas.filter(r => r.horasResposta <= 2).length,
    de2a4h: respostas.filter(r => r.horasResposta > 2 && r.horasResposta <= 4).length,
    de4a8h: respostas.filter(r => r.horasResposta > 4 && r.horasResposta <= 8).length,
    mais8h: respostas.filter(r => r.horasResposta > 8).length
  }

  const porVendedora = {}
  Object.values(VENDEDORAS).forEach(nome => {
    const resp = respostas.filter(r => r.vendedora === nome)
    porVendedora[nome] = resp.length > 0
      ? Math.round(resp.reduce((s, r) => s + r.horasResposta, 0) / resp.length * 10) / 10
      : 0
  })

  const ultimos10 = respostas
    .sort((a, b) => b.dealId - a.dealId)
    .slice(0, 10)

  return {
    mediaGeral: Math.round(media * 10) / 10,
    porVendedora,
    distribuicao,
    ultimos10,
    totalAnalisados: respostas.length
  }
}

// ========== CLICKUP API (Flash FTL â Faturado) ==========

async function clickupFetch(endpoint, params = {}) {
  const url = new URL(`https://api.clickup.com/api/v2/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: { 'Authorization': CLICKUP_API_TOKEN }
  })
  if (!res.ok) {
    throw new Error(`ClickUp API error: ${res.status} ${res.statusText} on ${endpoint}`)
  }
  return res.json()
}

async function fetchFlashFTLTasks(mesFiltro) {
  // Busca TODAS as tasks do Flash FTL (sem filtro de status) incluindo fechadas
  // Logica: faturado = TUDO que passou por "em transito"
  const allTasks = []
  let page = 0

  while (page < 3) {
    const url = new URL(`https://api.clickup.com/api/v2/list/${CLICKUP_FLASH_FTL_LIST}/task`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('limit', '100')
    url.searchParams.set('include_closed', 'true')
    url.searchParams.set('subtasks', 'true')

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': CLICKUP_API_TOKEN }
    })
    if (!res.ok) {
      throw new Error(`ClickUp API error: ${res.status} ${res.statusText}`)
    }
    const result = await res.json()

    if (!result.tasks || result.tasks.length === 0) break
    allTasks.push(...result.tasks)
    if (result.tasks.length < 100) break
    page++
  }

  // Filtra por mes usando campo Coleta
  const [ano, mesNum] = mesFiltro.split('-').map(Number)

  const filtered = allTasks.filter(task => {
    const coletaField = task.custom_fields?.find(f => f.id === CLICKUP_COLETA_FIELD)
    if (!coletaField || !coletaField.value) return false
    const coletaDate = new Date(Number(coletaField.value))
    return coletaDate.getFullYear() === ano && (coletaDate.getMonth() + 1) === mesNum
  })

  // Exclui tasks com status "a contratar" (ainda no pipeline, nao entraram em execucao)
  const execucaoTasks = filtered.filter(task => {
    const status = (task.status?.status || '').toLowerCase()
    return status !== 'a contratar'
  })

  // Mapeia campos customizados
  return execucaoTasks.map(task => {
    const freteField = task.custom_fields?.find(f => f.id === CLICKUP_FRETE_EMPRESA_FIELD)
    const noShowField = task.custom_fields?.find(f => f.id === CLICKUP_MOTIVO_NOSHOW_FIELD)
    const coletaField = task.custom_fields?.find(f => f.id === CLICKUP_COLETA_FIELD)

    const freteValor = freteField?.value ? parseFloat(freteField.value) : 0
    const motivoNoShow = noShowField?.value ? (noShowField.type_config?.options?.find(o => o.orderindex === noShowField.value)?.name || '') : ''
    const coletaDate = coletaField?.value ? new Date(Number(coletaField.value)).toISOString().substring(0, 10) : ''

    return {
      id: task.id,
      customId: task.custom_id || '',
      nome: task.name || '',
      status: (task.status?.status || '').toLowerCase(),
      freteEmpresa: freteValor,
      motivoNoShow,
      dataColeta: coletaDate
    }
  })
}

function processFlashFTLData(tasks) {
  // Faturado = tudo que PASSOU por "em transito"
  const faturadoTasks = tasks.filter(t => PASSED_EM_TRANSITO.includes(t.status))
  const totalFaturado = faturadoTasks.reduce((sum, t) => sum + t.freteEmpresa, 0)

  // Closer FTL = perdas na execucao (no show + cancelada)
  const noShowTasks = tasks.filter(t => t.status === 'no show')
  const canceladaTasks = tasks.filter(t => t.status === 'cancelada')
  const lostTasks = [...noShowTasks, ...canceladaTasks]

  const totalCargas = tasks.length
  const executadas = faturadoTasks.length
  const noShowCount = noShowTasks.length
  const canceladaCount = canceladaTasks.length
  const conversionPct = totalCargas > 0 ? Math.round((executadas / totalCargas) * 1000) / 10 : 0

  return {
    faturado: {
      totalFaturado,
      countCargas: faturadoTasks.length,
      tasks: faturadoTasks
    },
    closerFTL: {
      totalCargas,
      executadas,
      noShowCount,
      canceladaCount,
      lostCount: lostTasks.length,
      conversionPct,
      noShowTasks,
      canceladaTasks,
      lostTasks
    }
  }
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

// Vercel: aumenta timeout para 30s (plano hobby suporta ate 60s em funcoes)
export const config = {
  maxDuration: 60
}

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
    // Mes selecionado via query param (filtro global), default: mes atual
    const mesFiltro = req.query?.mes || mesAtual
    const startOfFilterMonth = `${mesFiltro}-01`
    const endOfFilterMonth = `${mesFiltro}-31`

    // Data de corte: 6 meses atras (para historico) - reduz drasticamente a paginacao
    const sinceDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const sinceDateStr = `${sinceDate.getFullYear()}-${String(sinceDate.getMonth() + 1).padStart(2, '0')}-01`

    // Busca TODOS os dados em paralelo (6 chamadas simultaneas)
    const clickupPromise = CLICKUP_API_TOKEN
      ? fetchFlashFTLTasks(mesFiltro).catch(err => { console.error('ClickUp error:', err); return [] })
      : Promise.resolve([])

    console.log('Starting parallel fetch at', Date.now())
    const [rawOpen, rawWon, rawLost, rawActivities, rawFlashFTL, rawOrgs, rawPending, rawActivities30d, rawOverdue] = await Promise.all([
      fetchOpenDeals(),
      fetchWonDeals(sinceDateStr),
      fetchLostDeals(sinceDateStr),
      fetchActivities(startOfFilterMonth, endOfFilterMonth),
      clickupPromise,
      fetchClientesAtivos().catch(err => { console.error('Orgs error:', err); return [] }),
      fetchPendingActivities(startOfFilterMonth, endOfFilterMonth),
      fetchActivities30Days(),
      fetchOverdueActivities()
    ])

    // Processa dados
    const openDeals = processOpenDeals(rawOpen)
    const wonDeals = processWonDeals(rawWon, mesAtual)
    const lostDeals = processLostDeals(rawLost, mesAtual)
    const atividades = buildAtividades(rawActivities)
    const clientesAtivos = processClientesAtivos(rawOrgs, wonDeals, mesFiltro)
    const { faturado: faturadoData, closerFTL: closerFTLData } = processFlashFTLData(rawFlashFTL)

    // Quality indicators
    const atividadesStatus = buildAtividadesStatus(rawActivities, rawPending, rawOverdue)
    const dealsOrfaos = buildDealsOrfaos(openDeals)
    const atividadesDiarias = buildAtividadesDiarias(rawActivities30d)
    const salesVelocity = buildSalesVelocity(wonDeals, lostDeals, mesFiltro)
    const followupFrequency = buildFollowupFrequency(rawActivities30d, wonDeals, lostDeals, mesFiltro)
    const tempoResposta = buildTempoResposta(rawActivities30d, openDeals, wonDeals.filter(d => d.mes === mesFiltro), lostDeals.filter(d => d.mes === mesFiltro))

    // Meses disponiveis para filtro (ultimos 12 meses)
    const mesesDisponiveis = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      mesesDisponiveis.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const data = {
      timestamp: now.toISOString(),
      demo: false,
      mesAtual,
      mesFiltro,
      mesesDisponiveis,
      openDeals,
      wonDeals: wonDeals.filter(d => d.mes === mesFiltro),
      lostDeals: lostDeals.filter(d => d.mes === mesFiltro),
      funil: buildFunil(openDeals),
      performanceVendedoras: buildPerformance(wonDeals, mesFiltro),
      motivosPerda: buildMotivosPerda(lostDeals, mesFiltro),
      historicoMensal: buildHistoricoMensal(wonDeals, lostDeals, openDeals),
      metas: getMetas(),
      atividades,
      clientesAtivos,
      faturado: faturadoData,
      closerFTL: closerFTLData,
      atividadesStatus,
      dealsOrfaos,
      atividadesDiarias,
      salesVelocity,
      followupFrequency,
      tempoResposta
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
      { nome: 'Em Negociacao', count: 4, valor: 273000 },
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
      { cliente: 'Taurus', termometro: 'ATIVO', perfil: 'A - Cotacao diaria', responsavel: 'Tayna Kazial', pessoas: 5, wonDealsCount: 95, closedDealsCount: 196, openDealsCount: 2, vendidoMes: 85000, dealsGanhosMes: 4 },
      { cliente: 'WEG', termometro: 'ATIVO', perfil: 'A - Cotacao diaria', responsavel: 'Gabrieli Muneretto', pessoas: 3, wonDealsCount: 50, closedDealsCount: 80, openDealsCount: 1, vendidoMes: 120000, dealsGanhosMes: 6 },
      { cliente: 'Embrasa', termometro: 'ATIVO', perfil: 'A - Cotacao diaria', responsavel: 'Gabrieli Muneretto', pessoas: 4, wonDealsCount: 40, closedDealsCount: 65, openDealsCount: 0, vendidoMes: 78000, dealsGanhosMes: 3 },
      { cliente: 'Construtora Grifo', termometro: 'ATIVO', perfil: 'B - Cotacao semanal', responsavel: 'Gabrieli Muneretto', pessoas: 2, wonDealsCount: 5, closedDealsCount: 8, openDealsCount: 0, vendidoMes: 32000, dealsGanhosMes: 2 },
      { cliente: 'Marques e Bezerra', termometro: 'ATENCAO', perfil: 'B - Cotacao semanal', responsavel: 'Tayna Kazial', pessoas: 5, wonDealsCount: 16, closedDealsCount: 36, openDealsCount: 1, vendidoMes: 45000, dealsGanhosMes: 2 },
      { cliente: 'Arpeco', termometro: 'RISCO', perfil: 'B - Cotacao semanal', responsavel: 'Tayna Kazial', pessoas: 2, wonDealsCount: 0, closedDealsCount: 2, openDealsCount: 0, vendidoMes: 0, dealsGanhosMes: 0 },
      { cliente: 'Softys', termometro: 'INATIVO', perfil: 'A - Cotacao diaria', responsavel: 'Gabrieli Muneretto', pessoas: 10, wonDealsCount: 16, closedDealsCount: 16, openDealsCount: 0, vendidoMes: 0, dealsGanhosMes: 0 }
    ],
    faturado: {
      totalFaturado: 520000,
      countCargas: 38,
      tasks: []
    },
    closerFTL: {
      totalCargas: 45,
      executadas: 38,
      noShowCount: 3,
      canceladaCount: 4,
      lostCount: 7,
      conversionPct: 84.4,
      noShowTasks: [
        { id: 'ns1', customId: 'CARGA-7001', nome: 'Embrasa - Sumare/SP x Rio Verde/GO', status: 'no show', freteEmpresa: 8500, motivoNoShow: 'Motorista desistiu', dataColeta: '2026-03-10' },
        { id: 'ns2', customId: 'CARGA-7015', nome: 'Piacentini - Almirante Tamandare/PR x Jaguariaiva/PR', status: 'no show', freteEmpresa: 4200, motivoNoShow: 'Veiculo quebrado', dataColeta: '2026-03-14' },
        { id: 'ns3', customId: 'CARGA-7030', nome: 'Embrasa - Catalao/GO x Araguari/MG', status: 'no show', freteEmpresa: 6800, motivoNoShow: 'Sem retorno', dataColeta: '2026-03-20' }
      ],
      canceladaTasks: [
        { id: 'c1', customId: 'CARGA-7005', nome: 'WEG - Aracati/CE x Jandaira/RN', status: 'cancelada', freteEmpresa: 12000, motivoNoShow: '', dataColeta: '2026-03-08' },
        { id: 'c2', customId: 'CARGA-7012', nome: 'I3M Engenharia - Aparecida de Goiania/GO x Varzea Grande/MT', status: 'cancelada', freteEmpresa: 9500, motivoNoShow: '', dataColeta: '2026-03-13' },
        { id: 'c3', customId: 'CARGA-7020', nome: 'Embrasa - Artur Nogueira/SP x Riachao do Jacuipe/BA', status: 'cancelada', freteEmpresa: 7800, motivoNoShow: '', dataColeta: '2026-03-17' },
        { id: 'c4', customId: 'CARGA-7025', nome: 'WEG - Blumenau/SC x Gravatai/RS', status: 'cancelada', freteEmpresa: 5500, motivoNoShow: '', dataColeta: '2026-03-19' }
      ],
      lostTasks: []
    },
    atividadesStatus: {
      porVendedora: [
        { vendedora: 'Tayna Kazial', agendadas: 45, executadas: 38, atrasadas: 3 },
        { vendedora: 'Gabrieli Muneretto', agendadas: 32, executadas: 25, atrasadas: 5 }
      ],
      totais: { agendadas: 77, executadas: 63, atrasadas: 8 }
    },
    dealsOrfaos: {
      total: 4,
      deals: [
        { id: 'o1', titulo: 'Empresa Exemplo', vendedora: 'Tayna Kazial', diasParado: 12, valor: 15000 },
        { id: 'o2', titulo: 'Logistica ABC', vendedora: 'Gabrieli Muneretto', diasParado: 8, valor: 22000 }
      ],
      porVendedora: { 'Tayna Kazial': [], 'Gabrieli Muneretto': [] }
    },
    atividadesDiarias: [
      { dia: '2026-03-25', 'Tayna Kazial': { total: 8, ligacoes: 5 }, 'Gabrieli Muneretto': { total: 6, ligacoes: 3 } },
      { dia: '2026-03-26', 'Tayna Kazial': { total: 10, ligacoes: 7 }, 'Gabrieli Muneretto': { total: 5, ligacoes: 2 } },
      { dia: '2026-03-27', 'Tayna Kazial': { total: 7, ligacoes: 4 }, 'Gabrieli Muneretto': { total: 8, ligacoes: 6 } }
    ],
    salesVelocity: {
      geral: { velocity: 12500, numDeals: 15, valorMedio: 18000, conversao: 46.7, cicloMedio: 10.2 },
      porVendedora: {
        'Tayna Kazial': { velocity: 7800, numDeals: 9, valorMedio: 20000, conversao: 55.6, cicloMedio: 9.5 },
        'Gabrieli Muneretto': { velocity: 4700, numDeals: 6, valorMedio: 15000, conversao: 33.3, cicloMedio: 11.0 }
      }
    },
    followupFrequency: {
      mediaWon: 4.2,
      mediaLost: 1.8,
      distribuicaoWon: { zero: 0, um_dois: 2, tres_cinco: 4, seis_dez: 1, mais_dez: 0 },
      distribuicaoLost: { zero: 3, um_dois: 4, tres_cinco: 1, seis_dez: 0, mais_dez: 0 }
    },
    tempoResposta: {
      mediaGeral: 3.5,
      porVendedora: { 'Tayna Kazial': 2.8, 'Gabrieli Muneretto': 4.2 },
      distribuicao: { ate2h: 5, de2a4h: 4, de4a8h: 3, mais8h: 2 },
      ultimos10: [
        { dealId: 'd1', empresa: 'Transportadora Alpha', vendedora: 'Tayna Kazial', horasResposta: 1.5, valor: 25000 },
        { dealId: 'd2', empresa: 'Logistica Beta', vendedora: 'Gabrieli Muneretto', horasResposta: 3.2, valor: 18000 }
      ],
      totalAnalisados: 14
    }
  }
}
