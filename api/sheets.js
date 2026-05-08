// Vercel Serverless Function — GET /api/sheets
// Busca dados REAIS do Pipedrive (Pipeline 7 — Funil Oportunidade) e retorna JSON formatado
// Fallback para dados demo se PIPEDRIVE_API_KEY nao estiver configurada

const PIPEDRIVE_API_KEY = process.env.PIPEDRIVE_API_KEY
const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN
const PIPELINE_ID = 7

// ClickUp Flash FTL
const CLICKUP_FLASH_FTL_LIST = '901304617884'
const CLICKUP_FRETE_EMPRESA_FIELD = 'b0d60416-41fd-4dcd-95f8-8d44db267745'
const CLICKUP_COLETA_FIELD = 'ee0f910c-b3dc-4e7f-8e5f-e00f0fa04707'
const CLICKUP_MOTIVO_NOSHOW_FIELD = '947cdd58-3c6d-4d78-a0ce-b303af389b69'

// Closer FT — campos adicionais para Kanban e Eficiencia
const CLICKUP_FRETE_MOTORISTA_FIELD = '09a2946d-0498-4eb1-b66d-678bc6c3acc7'
const CLICKUP_VALOR_FECHADO_FIELD = 'c9b713ec-ffd9-4d23-8a8e-d18fd6849087'
const CLICKUP_CAIXA_PROSPECCAO_FIELD = '8d93aca7-ad85-45e5-bc45-f861eea26fc2'
const CLICKUP_CIDADE_ORIGEM_FIELD = '8dff6d61-3942-42dd-a82b-faa167984dd2'
const CLICKUP_CIDADE_DESTINO_FIELD = '63543a19-7885-4412-8bb3-4a394ac6a188'
const CLICKUP_CLOSER_FIELD = 'cee9b9fe-729f-4ed2-81a5-30a70ecf7df7'
const CLICKUP_CLIENTE_FIELD = '35c290fb-079e-4db5-9af9-f624b3e84292'

const PASSED_EM_TRANSITO = ['em transito', 'entregues', 'liberado faturamento', 'faturado', 'finalizado']
const EXECUTION_LOST = ['no show', 'cancelada']

const STAGES = {
  64: 'BUGS',
  54: 'Pedido de Cotacao',
  55: 'Em Negociacao',
  80: 'BID',
  56: 'Proposta Aprovada'
}

const FUNIL_STAGES = [54, 55, 56]
const FUNIL_ORDER = ['Pedido de Cotacao', 'Em Negociacao', 'Proposta Aprovada']

const CLIENTES_ATIVOS_FILTER_ID = 31374
const ORG_STATUS_TERMOMETRO_KEY = '4abea383919e4b58f5896ed5cf571d89396d1bc5'
const ORG_PERFIL_COMPRA_KEY = 'e52751b2ca4cdbe74f9f473e158d2f8689c7e66f'
const STATUS_TERMOMETRO_MAP = { '252': 'ATIVO', '253': 'ATENCAO', '254': 'RISCO', '255': 'INATIVO' }
const PERFIL_COMPRA_MAP = { '249': 'A - Cotacao diaria', '250': 'B - Cotacao semanal', '251': 'C - Cotacao esporadica' }

const USERS = {
  24188122: 'Tayna Kazial',
  24588753: 'Gabrieli Muneretto',
  23289334: 'Laurence Tataren'
}

const VENDEDORAS = {
  24188122: 'Tayna Kazial',
  24588753: 'Gabrieli Muneretto'
}

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

function normalizeVendedoraName(name) {
  if (!name) return name
  const s = name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
  if (s.startsWith('tayna')) return 'Tayna Kazial'
  if (s.startsWith('gabrieli')) return 'Gabrieli Muneretto'
  return name
}

function getActivityUserId(activity) {
  if (typeof activity.user_id === 'object' && activity.user_id?.id) return activity.user_id.id
  return activity.user_id
}

async function pipedriveFetch(endpoint, params = {}) {
  const url = new URL(`https://api.pipedrive.com/v1/${endpoint}`)
  url.searchParams.set('api_token', PIPEDRIVE_API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Pipedrive API error: ${res.status} ${res.statusText} on ${endpoint}`)
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

async function fetchOpenDeals() {
  const results = await Promise.all(
    FUNIL_STAGES.map(stageId => fetchAllPages(`stages/${stageId}/deals`, { everyone: '1' }))
  )
  return results.flat()
}

async function fetchWonDeals(sinceDate) {
  const params = { status: 'won', user_id: '0', sort: 'update_time DESC' }
  if (sinceDate) params.start_date = sinceDate
  return fetchAllPages('deals', params, d => d.pipeline_id === PIPELINE_ID, 2)
}

async function fetchLostDeals(sinceDate) {
  const params = { status: 'lost', user_id: '0', sort: 'update_time DESC' }
  if (sinceDate) params.start_date = sinceDate
  return fetchAllPages('deals', params, d => d.pipeline_id === PIPELINE_ID, 2)
}

async function fetchActivities(startDate, endDate) {
  return fetchAllPages('activities', { user_id: '0', start_date: startDate, end_date: endDate, done: '1' }, null, 5)
}

async function fetchPendingActivities(startDate, endDate) {
  return fetchAllPages('activities', { user_id: '0', start_date: startDate, end_date: endDate, done: '0' }, null, 5)
}

async function fetchActivities30Days() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
  const endStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return fetchAllPages('activities', { user_id: '0', start_date: startStr, end_date: endStr, done: '1' }, null, 10)
}

async function fetchOverdueActivities() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`
  const endStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
  return fetchAllPages('activities', { user_id: '0', start_date: startStr, end_date: endStr, done: '0' }, null, 5)
}

function getUserName(deal) {
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
  return dateStr.substring(0, 7)
}

function processOpenDeals(deals) {
  const now = new Date()
  return deals.map(d => {
    const addTime = d.add_time ? d.add_time.substring(0, 10) : ''
    const diasParado = addTime ? Math.floor((now - new Date(addTime)) / (1000 * 60 * 60 * 24)) : 0
    return {
      id: String(d.id), titulo: d.title || '', valor: d.value || 0,
      estagio: getStageName(d.stage_id), vendedora: normalizeVendedoraName(getUserName(d)),
      empresa: getOrgName(d), dataCriacao: addTime,
      dataAtualizacao: d.update_time ? d.update_time.substring(0, 10) : '',
      nextActivityDate: d.next_activity_date || null, nextActivityId: d.next_activity_id || null, diasParado
    }
  })
}

function processWonDeals(deals, mesAtual) {
  return deals.map(d => {
    const mes = getMonthKey(d.won_time) || getMonthKey(d.close_time) || getMonthKey(d.update_time) || mesAtual
    const addTime = d.add_time ? d.add_time.substring(0, 10) : ''
    const wonTime = (d.won_time || d.close_time || d.update_time || '').substring(0, 10)
    let cicloDias = 0
    if (addTime && wonTime) cicloDias = Math.max(1, Math.floor((new Date(wonTime) - new Date(addTime)) / (1000 * 60 * 60 * 24)))
    return {
      id: String(d.id), titulo: d.title || '', valor: d.value || 0,
      vendedora: normalizeVendedoraName(getUserName(d)), empresa: getOrgName(d),
      dataGanho: wonTime, dataCriacao: addTime, cicloDias, mes
    }
  })
}

function processLostDeals(deals, mesAtual) {
  return deals.map(d => {
    const mes = getMonthKey(d.lost_time) || getMonthKey(d.close_time) || getMonthKey(d.update_time) || mesAtual
    const addTime = d.add_time ? d.add_time.substring(0, 10) : ''
    return {
      id: String(d.id), titulo: d.title || '', valor: d.value || 0,
      vendedora: normalizeVendedoraName(getUserName(d)), empresa: getOrgName(d),
      motivo: d.lost_reason || 'Sem motivo', dataCriacao: addTime, mes
    }
  })
}

function buildFunil(openDeals) {
  const stages = {}
  openDeals.forEach(d => {
    const s = d.estagio
    if (s === 'BUGS') return
    if (!stages[s]) stages[s] = { nome: s, count: 0, valor: 0 }
    stages[s].count++; stages[s].valor += d.valor
  })
  return FUNIL_ORDER.map(nome => stages[nome]).filter(Boolean)
}

function buildPerformance(wonDeals, mesAtual) {
  const wonMesAtual = wonDeals.filter(d => d.mes === mesAtual)
  const porVendedora = {}
  Object.values(VENDEDORAS).forEach(nome => { porVendedora[nome] = { nome, count: 0, valor: 0 } })
  wonMesAtual.forEach(d => {
    const v = normalizeVendedoraName(d.vendedora)
    if (!porVendedora[v]) return
    porVendedora[v].count++; porVendedora[v].valor += d.valor
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
  const meses = {}
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    meses[key] = { mes: key, won_count: 0, won_value: 0, lost_count: 0, lost_value: 0, new_count: 0, conversion_rate: 0, ticket_medio: 0, ciclo_medio_dias: 0 }
  }
  wonDeals.forEach(d => { if (meses[d.mes]) { meses[d.mes].won_count++; meses[d.mes].won_value += d.valor } })
  lostDeals.forEach(d => { if (meses[d.mes]) { meses[d.mes].lost_count++; meses[d.mes].lost_value += d.valor } })
  Object.values(meses).forEach(m => {
    const total = m.won_count + m.lost_count
    m.conversion_rate = total > 0 ? Math.round((m.won_count / total) * 1000) / 10 : 0
    m.ticket_medio = m.won_count > 0 ? Math.round(m.won_value / m.won_count) : 0
  })
  return Object.values(meses)
}

function buildAtividades(activities) {
  const byUser = {}
  Object.values(VENDEDORAS).forEach(nome => {
    byUser[nome] = { vendedora: nome, ligacoes: 0, emails: 0, whatsapp: 0, reunioes: 0, propostas: 0, followups: 0 }
  })
  activities.forEach(a => {
    const userId = getActivityUserId(a)
    const userName = VENDEDORAS[userId]
    if (!userName) return
    if (!byUser[userName]) byUser[userName] = { vendedora: userName, ligacoes: 0, emails: 0, whatsapp: 0, reunioes: 0, propostas: 0, followups: 0 }
    const categoria = ACTIVITY_MAP[a.type] || 'followups'
    byUser[userName][categoria]++
  })
  return Object.values(byUser)
}

async function fetchClientesAtivos() {
  const orgs = await fetchAllPages('organizations', { filter_id: String(CLIENTES_ATIVOS_FILTER_ID) })

  // Fix: Pipedrive nao retorna campos customizados para orgs criadas antes do campo existir.
  // Para orgs sem ORG_STATUS_TERMOMETRO_KEY ou ORG_PERFIL_COMPRA_KEY, busca detalhes individuais.
  const missing = orgs.filter(o =>
    (o[ORG_STATUS_TERMOMETRO_KEY] == null || o[ORG_STATUS_TERMOMETRO_KEY] === '') ||
    (o[ORG_PERFIL_COMPRA_KEY] == null || o[ORG_PERFIL_COMPRA_KEY] === '')
  )
  if (missing.length > 0) {
    const enriched = await Promise.all(
      missing.map(async o => {
        try {
          const res = await pipedriveFetch(`organizations/${o.id}`)
          return res.data || o
        } catch (_) {
          return o
        }
      })
    )
    const enrichedById = Object.fromEntries(enriched.map(o => [o.id, o]))
    return orgs.map(o => enrichedById[o.id] || o)
  }
  return orgs
}

function processClientesAtivos(orgs, wonDeals, lostDeals, mesFiltro) {
  const wonByOrg = {}
  const wonFiltered = mesFiltro ? wonDeals.filter(d => d.mes === mesFiltro) : wonDeals
  wonFiltered.forEach(d => {
    if (!d.empresa) return
    if (!wonByOrg[d.empresa]) wonByOrg[d.empresa] = { valor: 0, count: 0 }
    wonByOrg[d.empresa].valor += d.valor; wonByOrg[d.empresa].count++
  })
  const lostByOrg = {}
  const lostFiltered = mesFiltro ? lostDeals.filter(d => d.mes === mesFiltro) : lostDeals
  lostFiltered.forEach(d => { if (d.empresa) lostByOrg[d.empresa] = (lostByOrg[d.empresa] || 0) + 1 })
  return orgs.map(o => {
    const nome = o.name || ''
    const ownerName = o.owner_name || (typeof o.owner_id === 'object' ? o.owner_id?.name : '') || 'N/A'
    const termometro = STATUS_TERMOMETRO_MAP[String(o[ORG_STATUS_TERMOMETRO_KEY])] || 'N/A'
    const perfil = PERFIL_COMPRA_MAP[String(o[ORG_PERFIL_COMPRA_KEY])] || 'N/A'
    const wonData = wonByOrg[nome] || { valor: 0, count: 0 }
    const perdidoMes = lostByOrg[nome] || 0
    return {
      cliente: nome, termometro, perfil, responsavel: ownerName, pessoas: o.people_count || 0,
      wonDealsCount: wonData.count, closedDealsCount: wonData.count + perdidoMes,
      openDealsCount: o.open_deals_count || 0, vendidoMes: wonData.valor, dealsGanhosMes: wonData.count
    }
  }).sort((a, b) => b.wonDealsCount - a.wonDealsCount)
}

function buildAtividadesStatus(doneActivities, pendingActivities, overdueActivities) {
  const byVendedora = {}
  Object.values(VENDEDORAS).forEach(nome => {
    byVendedora[nome] = { vendedora: nome, agendadas: 0, executadas: 0, noPrazo: 0, foraDoPrazo: 0, atrasadas: 0 }
  })
  doneActivities.forEach(a => {
    const userName = VENDEDORAS[getActivityUserId(a)]
    if (!userName) return
    if (!byVendedora[userName]) byVendedora[userName] = { vendedora: userName, agendadas: 0, executadas: 0, noPrazo: 0, foraDoPrazo: 0, atrasadas: 0 }
    byVendedora[userName].executadas++; byVendedora[userName].agendadas++
    const doneDate = (a.done_time || '').substring(0, 10)
    const dueDate = a.due_date || ''
    if (doneDate && dueDate) {
      if (doneDate <= dueDate) byVendedora[userName].noPrazo++
      else byVendedora[userName].foraDoPrazo++
    } else byVendedora[userName].noPrazo++
  })
  pendingActivities.forEach(a => {
    const userName = VENDEDORAS[getActivityUserId(a)]
    if (!userName) return
    if (!byVendedora[userName]) byVendedora[userName] = { vendedora: userName, agendadas: 0, executadas: 0, noPrazo: 0, foraDoPrazo: 0, atrasadas: 0 }
    byVendedora[userName].agendadas++
  })
  overdueActivities.forEach(a => {
    const userName = VENDEDORAS[getActivityUserId(a)]
    if (!userName) return
    if (!byVendedora[userName]) byVendedora[userName] = { vendedora: userName, agendadas: 0, executadas: 0, noPrazo: 0, foraDoPrazo: 0, atrasadas: 0 }
    byVendedora[userName].atrasadas++
  })
  const result = Object.values(byVendedora)
  const totais = result.reduce((acc, v) => ({
    agendadas: acc.agendadas + v.agendadas, executadas: acc.executadas + v.executadas,
    noPrazo: acc.noPrazo + v.noPrazo, foraDoPrazo: acc.foraDoPrazo + v.foraDoPrazo, atrasadas: acc.atrasadas + v.atrasadas
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
  return { total: orfaos.length, deals: orfaos.sort((a, b) => b.diasParado - a.diasParado), porVendedora: byVendedora }
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
  return Object.entries(byDay).map(([dia, vendedoras]) => ({ dia, ...vendedoras })).sort((a, b) => a.dia.localeCompare(b.dia))
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
    return { velocity: Math.round(velocity), numDeals, valorMedio: Math.round(valorMedio), conversao: Math.round(conversao * 1000) / 10, cicloMedio: Math.round(cicloMedio * 10) / 10 }
  }
  const geral = calcVelocity(wonMes, lostMes)
  const porVendedora = {}
  Object.values(VENDEDORAS).forEach(nome => {
    porVendedora[nome] = calcVelocity(wonMes.filter(d => d.vendedora === nome), lostMes.filter(d => d.vendedora === nome))
  })
  return { geral, porVendedora }
}

function buildFollowupFrequency(doneActivities, wonDeals, lostDeals, mesAtual) {
  const actsByDeal = {}
  doneActivities.forEach(a => {
    if (!a.deal_id) return
    if (!actsByDeal[a.deal_id]) actsByDeal[a.deal_id] = 0
    actsByDeal[a.deal_id]++
  })
  const wonMes = wonDeals.filter(d => d.mes === mesAtual)
  const lostMes = lostDeals.filter(d => d.mes === mesAtual)
  const wonFollowups = wonMes.map(d => actsByDeal[d.id] || 0)
  const lostFollowups = lostMes.map(d => actsByDeal[d.id] || 0)
  const avgWon = wonFollowups.length > 0 ? wonFollowups.reduce((s, v) => s + v, 0) / wonFollowups.length : 0
  const avgLost = lostFollowups.length > 0 ? lostFollowups.reduce((s, v) => s + v, 0) / lostFollowups.length : 0
  function countByRange(arr) {
    return {
      zero: arr.filter(v => v === 0).length, um_dois: arr.filter(v => v >= 1 && v <= 2).length,
      tres_cinco: arr.filter(v => v >= 3 && v <= 5).length, seis_dez: arr.filter(v => v >= 6 && v <= 10).length, mais_dez: arr.filter(v => v > 10).length
    }
  }
  return { mediaWon: Math.round(avgWon * 10) / 10, mediaLost: Math.round(avgLost * 10) / 10, distribuicaoWon: countByRange(wonFollowups), distribuicaoLost: countByRange(lostFollowups) }
}

function buildTempoResposta(doneActivities, openDeals, wonDeals, lostDeals) {
  const firstActivityByDeal = {}
  doneActivities.forEach(a => {
    if (!a.deal_id) return
    const actTime = a.done_time || a.add_time || a.update_time || ''
    if (!actTime) return
    if (!firstActivityByDeal[a.deal_id] || actTime < firstActivityByDeal[a.deal_id]) firstActivityByDeal[a.deal_id] = actTime
  })
  const allDeals = [...openDeals, ...wonDeals, ...lostDeals]
  const respostas = []
  allDeals.forEach(d => {
    const firstAct = firstActivityByDeal[d.id]
    if (!firstAct || !d.dataCriacao) return
    const horasResposta = Math.max(0, (new Date(firstAct) - new Date(d.dataCriacao)) / (1000 * 60 * 60))
    if (horasResposta < 720) respostas.push({ dealId: d.id, empresa: d.empresa, vendedora: d.vendedora, horasResposta: Math.round(horasResposta * 10) / 10, valor: d.valor })
  })
  const media = respostas.length > 0 ? respostas.reduce((s, r) => s + r.horasResposta, 0) / respostas.length : 0
  const distribuicao = {
    ate2h: respostas.filter(r => r.horasResposta <= 2).length, de2a4h: respostas.filter(r => r.horasResposta > 2 && r.horasResposta <= 4).length,
    de4a8h: respostas.filter(r => r.horasResposta > 4 && r.horasResposta <= 8).length, mais8h: respostas.filter(r => r.horasResposta > 8).length
  }
  const porVendedora = {}
  Object.values(VENDEDORAS).forEach(nome => {
    const resp = respostas.filter(r => r.vendedora === nome)
    porVendedora[nome] = resp.length > 0 ? Math.round(resp.reduce((s, r) => s + r.horasResposta, 0) / resp.length * 10) / 10 : 0
  })
  return { mediaGeral: Math.round(media * 10) / 10, porVendedora, distribuicao, ultimos10: respostas.sort((a, b) => b.dealId - a.dealId).slice(0, 10), totalAnalisados: respostas.length }
}

async function clickupFetch(endpoint, params = {}) {
  const url = new URL(`https://api.clickup.com/api/v2/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: { 'Authorization': CLICKUP_API_TOKEN } })
  if (!res.ok) throw new Error(`ClickUp API error: ${res.status} ${res.statusText} on ${endpoint}`)
  return res.json()
}

async function fetchTaskComments(taskId) {
  try {
    const res = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/comment`, { headers: { 'Authorization': CLICKUP_API_TOKEN } })
    if (!res.ok) return []
    const data = await res.json()
    return data.comments || []
  } catch (e) { return [] }
}

function extractValorFechado(comments) {
  for (const comment of comments) {
    const text = comment.comment_text || ''
    const match = text.match(/(?:negociado|fechado)\s*r\$\s*([\d.,]+)/i)
    if (match) {
      const normalized = match[1].replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
      const val = parseFloat(normalized)
      if (!isNaN(val) && val > 0) return val
    }
  }
  return 0
}

async function fetchFlashFTLTasks() {
  const TEAM_ID = '9007070798'
  const OPERATIONAL_STATUSES = [
    'a contratar', 'validação técnica', 'pesquisa', 'checklist',
    'em contratação', 'em contratacao', 'em carregamento',
    'em transito', 'em descarga', 'entregues',
    'pendente faturamento', 'liberado faturamento',
    'faturado', 'finalizado',
    'no show', 'cancelada'
  ]
  const allTasks = []
  let page = 0
  const statusParams = OPERATIONAL_STATUSES.map(s => `statuses[]=${encodeURIComponent(s)}`).join('&')
  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000)
  while (page < 8) {
    const fullUrl = `https://api.clickup.com/api/v2/team/${TEAM_ID}/task?page=${page}&limit=100&include_closed=true&subtasks=false&list_ids[]=${CLICKUP_FLASH_FTL_LIST}&date_updated_gt=${ninetyDaysAgo}&${statusParams}`
    const res = await fetch(fullUrl, { headers: { 'Authorization': CLICKUP_API_TOKEN } })
    if (!res.ok) throw new Error(`ClickUp API error: ${res.status} ${res.statusText}`)
    const result = await res.json()
    if (!result.tasks || result.tasks.length === 0) break
    allTasks.push(...result.tasks)
    if (result.tasks.length < 100) break
    page++
  }
  return allTasks
}

function getTaskField(task, fieldId) {
  const f = task.custom_fields?.find(f => f.id === fieldId)
  return f?.value ?? null
}

function processFlashFTLData(rawTasks, mesFiltro) {
  const [ano, mesNum] = mesFiltro.split('-').map(Number)
  const mesFiltered = rawTasks.filter(task => {
    const coletaMs = getTaskField(task, CLICKUP_COLETA_FIELD)
    if (!coletaMs) return false
    const d = new Date(Number(coletaMs))
    return d.getFullYear() === ano && (d.getMonth() + 1) === mesNum
  })
  const execucao = mesFiltered.filter(t => (t.status?.status || '').toLowerCase() !== 'a contratar')
  const tasks = execucao.map(task => {
    const freteVal = parseFloat(getTaskField(task, CLICKUP_FRETE_EMPRESA_FIELD)) || 0
    const noShowField = task.custom_fields?.find(f => f.id === CLICKUP_MOTIVO_NOSHOW_FIELD)
    const motivoNoShow = noShowField?.value ? (noShowField.type_config?.options?.find(o => o.orderindex === noShowField.value)?.name || '') : ''
    const coletaMs = getTaskField(task, CLICKUP_COLETA_FIELD)
    const coletaDate = coletaMs ? new Date(Number(coletaMs)).toISOString().substring(0, 10) : ''
    return {
      id: task.id, customId: task.custom_id || '', nome: task.name || '',
      status: (task.status?.status || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
      freteEmpresa: freteVal, motivoNoShow, dataColeta: coletaDate
    }
  })
  const faturadoTasks = tasks.filter(t => PASSED_EM_TRANSITO.includes(t.status))
  const totalFaturado = faturadoTasks.reduce((sum, t) => sum + t.freteEmpresa, 0)
  const noShowTasks = tasks.filter(t => t.status === 'no show')
  const canceladaTasks = tasks.filter(t => t.status === 'cancelada')
  const lostTasks = [...noShowTasks, ...canceladaTasks]
  const totalCargas = tasks.length
  const executadas = faturadoTasks.length
  const conversionPct = totalCargas > 0 ? Math.round((executadas / totalCargas) * 1000) / 10 : 0
  return {
    faturado: { totalFaturado, countCargas: faturadoTasks.length, tasks: faturadoTasks },
    closerFTL: { totalCargas, executadas, noShowCount: noShowTasks.length, canceladaCount: canceladaTasks.length, lostCount: lostTasks.length, conversionPct, noShowTasks, canceladaTasks, lostTasks }
  }
}

async function processCloserKanban(rawTasks, mesFiltro) {
  const realTasks = rawTasks.filter(t => t.name && t.name.includes(' - '))
  const DONE_STATUSES = new Set(['faturado', 'entregues', 'liberado faturamento', 'finalizado', 'em descarga'])
  const mapped = realTasks.map(task => {
    const status = (task.status?.status || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const freteMotorista = parseFloat(getTaskField(task, CLICKUP_FRETE_MOTORISTA_FIELD)) || 0
    const valorFechado = parseFloat(getTaskField(task, CLICKUP_VALOR_FECHADO_FIELD)) || 0
    const caixaRaw = getTaskField(task, CLICKUP_CAIXA_PROSPECCAO_FIELD)
    const saldo = caixaRaw !== null ? parseFloat(caixaRaw) : (freteMotorista > 0 && valorFechado > 0 ? freteMotorista - valorFechado : null)
    const clienteField = task.custom_fields?.find(f => f.id === CLICKUP_CLIENTE_FIELD)
    const clienteIdx = clienteField?.value
    let clienteNome = ''
    if (clienteField?.type_config?.options) {
      if (typeof clienteIdx === 'number') clienteNome = clienteField.type_config.options[clienteIdx]?.name || ''
      else if (typeof clienteIdx === 'string') clienteNome = clienteField.type_config.options.find(o => o.id === clienteIdx)?.name || clienteIdx
    }
    if (!clienteNome) clienteNome = task.name.split(' - ')[0] || ''
    const closerVal = getTaskField(task, CLICKUP_CLOSER_FIELD)
    const closers = Array.isArray(closerVal) ? closerVal.map(u => (u.username || u.name || '').split(' ')[0]).filter(Boolean) : []
    const coletaMs = getTaskField(task, CLICKUP_COLETA_FIELD)
    const coletaDate = coletaMs ? new Date(Number(coletaMs)).toISOString().substring(0, 10) : null
    const coletaMes = coletaDate ? coletaDate.substring(0, 7) : null
    return {
      id: task.id, customId: task.custom_id || task.id, nome: task.name, status, cliente: clienteNome,
      origem: getTaskField(task, CLICKUP_CIDADE_ORIGEM_FIELD) || '', destino: getTaskField(task, CLICKUP_CIDADE_DESTINO_FIELD) || '',
      coleta: coletaDate, coletaMes, closer: closers.join(' / '), freteMotorista, valorFechado, saldo,
      isNoShow: status === 'no show', url: task.url || ''
    }
  })

  const tasksMes = mapped.filter(t => !mesFiltro || t.coletaMes === mesFiltro)
  const commentsByTask = {}
  await Promise.all(tasksMes.map(async t => {
    const comments = await fetchTaskComments(t.id)
    commentsByTask[t.id] = extractValorFechado(comments)
  }))
  const enriched = mapped.map(t => {
    const valorDoComentario = commentsByTask[t.id]
    const valorFechadoFinal = valorDoComentario > 0 ? valorDoComentario : t.valorFechado
    const saldoFinal = t.freteMotorista > 0 && valorFechadoFinal > 0 ? t.freteMotorista - valorFechadoFinal : t.saldo
    return { ...t, valorFechado: valorFechadoFinal, saldo: saldoFinal }
  })
  const PIPELINE_INICIAL = new Set(['a contratar', 'validacao tecnica', 'pesquisa', 'checklist', 'em contratacao'])
  const kanbanEnriched = enriched.filter(t => {
    if (DONE_STATUSES.has(t.status) || t.status === 'cancelada') return false
    if (PIPELINE_INICIAL.has(t.status)) return true
    return !mesFiltro || t.coletaMes === mesFiltro
  })
  const eficiencia = enriched.filter(t => !mesFiltro || t.coletaMes === mesFiltro).sort((a, b) => (a.coleta || '').localeCompare(b.coleta || ''))
  return { kanban: kanbanEnriched, eficiencia }
}

function getMetas() {
  return [
    { mes: '2026-01', meta_valor: 800000, meta_deals: 50 },
    { mes: '2026-02', meta_valor: 850000, meta_deals: 52 },
    { mes: '2026-03', meta_valor: 400000, meta_deals: 25 },
    { mes: '2026-04', meta_valor: 500000, meta_deals: 30 }
  ]
}

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!PIPEDRIVE_API_KEY) return res.status(200).json(getDemoData())

  try {
    const now = new Date()
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const mesFiltro = req.query?.mes || mesAtual
    const startOfFilterMonth = `${mesFiltro}-01`
    const endOfFilterMonth = `${mesFiltro}-31`
    const sinceDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const sinceDateStr = `${sinceDate.getFullYear()}-${String(sinceDate.getMonth() + 1).padStart(2, '0')}-01`

    const clickupPromise = CLICKUP_API_TOKEN
      ? fetchFlashFTLTasks().catch(err => { console.error('ClickUp error:', err); return [] })
      : Promise.resolve([])

    const [rawOpen, rawWon, rawLost, rawActivities, rawFlashFTL, rawOrgs, rawPending, rawActivities30d, rawOverdue] = await Promise.all([
      fetchOpenDeals(), fetchWonDeals(sinceDateStr), fetchLostDeals(sinceDateStr),
      fetchActivities(startOfFilterMonth, endOfFilterMonth), clickupPromise,
      fetchClientesAtivos().catch(err => { console.error('Orgs error:', err); return [] }),
      fetchPendingActivities(startOfFilterMonth, endOfFilterMonth).catch(err => { console.error('Pending activities error:', err); return [] }),
      fetchActivities30Days().catch(err => { console.error('Activities 30d error:', err); return [] }),
      fetchOverdueActivities().catch(err => { console.error('Overdue activities error:', err); return [] })
    ])

    const openDeals = processOpenDeals(rawOpen)
    const wonDeals = processWonDeals(rawWon, mesAtual)
    const lostDeals = processLostDeals(rawLost, mesAtual)
    const atividades = buildAtividades(rawActivities)
    const clientesAtivos = processClientesAtivos(rawOrgs, wonDeals, lostDeals, mesFiltro)
    const { faturado: faturadoData, closerFTL: closerFTLData } = processFlashFTLData(rawFlashFTL, mesFiltro)
    const closerFT = await processCloserKanban(rawFlashFTL, mesFiltro)
    const atividadesStatus = buildAtividadesStatus(rawActivities, rawPending, rawOverdue)
    const dealsOrfaos = buildDealsOrfaos(openDeals)
    const atividadesDiarias = buildAtividadesDiarias(rawActivities30d)
    const salesVelocity = buildSalesVelocity(wonDeals, lostDeals, mesFiltro)
    const followupFrequency = buildFollowupFrequency(rawActivities30d, wonDeals, lostDeals, mesFiltro)
    const tempoResposta = buildTempoResposta(rawActivities30d, openDeals, wonDeals.filter(d => d.mes === mesFiltro), lostDeals.filter(d => d.mes === mesFiltro))

    const mesesDisponiveis = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      mesesDisponiveis.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const data = {
      timestamp: now.toISOString(), demo: false, mesAtual, mesFiltro, mesesDisponiveis,
      openDeals, wonDeals: wonDeals.filter(d => d.mes === mesFiltro), lostDeals: lostDeals.filter(d => d.mes === mesFiltro),
      funil: buildFunil(openDeals), performanceVendedoras: buildPerformance(wonDeals, mesFiltro),
      motivosPerda: buildMotivosPerda(lostDeals, mesFiltro), historicoMensal: buildHistoricoMensal(wonDeals, lostDeals, openDeals),
      metas: getMetas(), atividades, clientesAtivos, faturado: faturadoData, closerFTL: closerFTLData, closerFT,
      atividadesStatus, dealsOrfaos, atividadesDiarias, salesVelocity, followupFrequency, tempoResposta
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(data)
  } catch (error) {
    console.error('Erro ao buscar dados do Pipedrive:', error)
    return res.status(200).json({ ...getDemoData(), error: error.message, fallback: true })
  }
}

function getDemoData() {
  const now = new Date()
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return {
    timestamp: now.toISOString(), demo: true,
    openDeals: [
      { id: '1', titulo: 'Transportadora Alpha', valor: 45000, estagio: 'Pedido de Cotacao', vendedora: 'Tayna Kazial', empresa: 'Alpha Logistica', dataCriacao: '2026-03-10' },
      { id: '2', titulo: 'Embarcador Beta', valor: 78000, estagio: 'Em Negociacao', vendedora: 'Gabrieli Muneretto', empresa: 'Beta Industria', dataCriacao: '2026-03-05' },
      { id: '4', titulo: 'Frete Delta Corp', valor: 91000, estagio: 'Proposta Aprovada', vendedora: 'Gabrieli Muneretto', empresa: 'Delta Corp', dataCriacao: '2026-02-28' }
    ],
    wonDeals: [
      { id: '101', titulo: 'Cliente Omega Won', valor: 85000, vendedora: 'Tayna Kazial', empresa: 'Omega Log', dataGanho: '2026-03-01', mes: mesAtual },
      { id: '102', titulo: 'Frete Sigma Won', valor: 120000, vendedora: 'Gabrieli Muneretto', empresa: 'Sigma Trans', dataGanho: '2026-03-05', mes: mesAtual },
      { id: '103', titulo: 'Logistica Kappa Won', valor: 95000, vendedora: 'Tayna Kazial', empresa: 'Kappa Express', dataGanho: '2026-03-10', mes: mesAtual }
    ],
    lostDeals: [
      { id: '201', titulo: 'Perdido A', valor: 45000, vendedora: 'Tayna Kazial', motivo: 'Preco', mes: mesAtual },
      { id: '202', titulo: 'Perdido B', valor: 32000, vendedora: 'Gabrieli Muneretto', motivo: 'Preco', mes: mesAtual }
    ],
    funil: [
      { nome: 'Pedido de Cotacao', count: 1, valor: 45000 },
      { nome: 'Em Negociacao', count: 1, valor: 78000 },
      { nome: 'Proposta Aprovada', count: 1, valor: 91000 }
    ],
    performanceVendedoras: [
      { nome: 'Tayna Kazial', count: 2, valor: 180000 },
      { nome: 'Gabrieli Muneretto', count: 1, valor: 120000 }
    ],
    motivosPerda: [{ motivo: 'Preco', count: 2 }],
    historicoMensal: [
      { mes: '2026-01', won_count: 42, won_value: 682000, lost_count: 220, lost_value: 580000, new_count: 320, conversion_rate: 16.0, ticket_medio: 16238, ciclo_medio_dias: 22 },
      { mes: '2026-02', won_count: 55, won_value: 951000, lost_count: 190, lost_value: 410000, new_count: 300, conversion_rate: 22.4, ticket_medio: 17290, ciclo_medio_dias: 17 },
      { mes: '2026-03', won_count: 3, won_value: 300000, lost_count: 2, lost_value: 77000, new_count: 6, conversion_rate: 60.0, ticket_medio: 100000, ciclo_medio_dias: 12 }
    ],
    metas: getMetas(),
    atividades: [
      { vendedora: 'Tayna Kazial', ligacoes: 87, emails: 124, reunioes: 12, propostas: 18, followups: 45, whatsapp: 156 },
      { vendedora: 'Gabrieli Muneretto', ligacoes: 63, emails: 98, reunioes: 8, propostas: 14, followups: 32, whatsapp: 112 }
    ],
    clientesAtivos: [
      { cliente: 'Omega Log', termometro: 'ATIVO', perfil: 'A - Cotacao diaria', responsavel: 'Tayna Kazial', pessoas: 3, wonDealsCount: 2, closedDealsCount: 3, openDealsCount: 1, vendidoMes: 85000, dealsGanhosMes: 1 }
    ],
    faturado: { totalFaturado: 250000, countCargas: 20, tasks: [] },
    closerFTL: {
      totalCargas: 25, executadas: 20, noShowCount: 2, canceladaCount: 3, lostCount: 5, conversionPct: 80,
      noShowTasks: [{ id: 'ns1', customId: 'CARGA-7001', nome: 'Embrasa - Demo', status: 'no show', freteEmpresa: 8500, motivoNoShow: 'Motorista desistiu', dataColeta: '2026-03-10' }],
      canceladaTasks: [], lostTasks: []
    },
    closerFT: { kanban: [], eficiencia: [] },
    atividadesStatus: {
      porVendedora: [
        { vendedora: 'Tayna Kazial', agendadas: 42, executadas: 35, noPrazo: 30, foraDoPrazo: 5, atrasadas: 3 },
        { vendedora: 'Gabrieli Muneretto', agendadas: 38, executadas: 30, noPrazo: 25, foraDoPrazo: 5, atrasadas: 5 }
      ],
      totais: { agendadas: 80, executadas: 65, noPrazo: 55, foraDoPrazo: 10, atrasadas: 8 }
    },
    dealsOrfaos: { total: 1, deals: [{ id: '2', titulo: 'Embarcador Beta', valor: 78000, estagio: 'Em Negociacao', vendedora: 'Gabrieli Muneretto', empresa: 'Beta Industria', dataCriacao: '2026-03-05', diasParado: 25, nextActivityDate: null }], porVendedora: {} },
    atividadesDiarias: [],
    salesVelocity: {
      geral: { velocity: 9200, numDeals: 5, valorMedio: 100000, conversao: 60, cicloMedio: 12 },
      porVendedora: {
        'Tayna Kazial': { velocity: 5000, numDeals: 3, valorMedio: 90000, conversao: 66, cicloMedio: 10 },
        'Gabrieli Muneretto': { velocity: 4200, numDeals: 2, valorMedio: 120000, conversao: 50, cicloMedio: 14 }
      }
    },
    followupFrequency: { mediaWon: 4.2, mediaLost: 1.8, distribuicaoWon: { zero: 0, um_dois: 1, tres_cinco: 2, seis_dez: 0, mais_dez: 0 }, distribuicaoLost: { zero: 1, um_dois: 1, tres_cinco: 0, seis_dez: 0, mais_dez: 0 } },
    tempoResposta: { mediaGeral: 3.2, porVendedora: { 'Tayna Kazial': 2.8, 'Gabrieli Muneretto': 3.6 }, distribuicao: { ate2h: 2, de2a4h: 2, de4a8h: 1, mais8h: 0 }, ultimos10: [], totalAnalisados: 5 }
  }
}
