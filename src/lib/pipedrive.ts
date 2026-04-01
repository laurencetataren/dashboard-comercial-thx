const API_TOKEN = process.env.PIPEDRIVE_API_TOKEN!;
const BASE_URL = `https://api.pipedrive.com/v1`;

async function pipedriveGet(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("api_token", API_TOKEN);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Pipedrive API error: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(`Pipedrive: ${data.error}`);
  return data;
}

export async function getPipelines() {
  const data = await pipedriveGet("/pipelines");
  return data.data || [];
}

export async function getStages(pipelineId?: number) {
  const params: Record<string, string> = {};
  if (pipelineId) params.pipeline_id = String(pipelineId);
  const data = await pipedriveGet("/stages", params);
  return data.data || [];
}

export async function getDealsSummary(pipelineId: number, status: "open" | "won" | "lost" = "open") {
  const data = await pipedriveGet("/deals/summary", {
    pipeline_id: String(pipelineId),
    status,
  });
  return data.data;
}

export async function getDeals(pipelineId: number, status: "open" | "won" | "lost" | "all_not_deleted" = "open", limit = 500) {
  const allDeals: any[] = [];
  let start = 0;
  let hasMore = true;

  while (hasMore && start < 2000) {
    const data = await pipedriveGet("/deals", {
      pipeline_id: String(pipelineId),
      status,
      limit: String(limit),
      start: String(start),
      sort: "update_time DESC",
    });
    if (data.data) allDeals.push(...data.data);
    hasMore = data.additional_data?.pagination?.more_items_in_collection || false;
    start += limit;
  }
  return allDeals;
}

export async function getDealsByStage(pipelineId: number) {
  const stages = await getStages(pipelineId);
  const deals = await getDeals(pipelineId, "open");

  const stageMap: Record<number, { id: number; name: string; order: number; deals: any[]; totalValue: number }> = {};
  for (const stage of stages) {
    if (stage.pipeline_id === pipelineId) {
      stageMap[stage.id] = {
        id: stage.id,
        name: stage.name.trim(),
        order: stage.order_nr,
        deals: [],
        totalValue: 0,
      };
    }
  }

  for (const deal of deals) {
    if (stageMap[deal.stage_id]) {
      stageMap[deal.stage_id].deals.push(deal);
      stageMap[deal.stage_id].totalValue += deal.value || 0;
    }
  }

  return Object.values(stageMap).sort((a, b) => a.order - b.order);
}

export async function getActivities(userId?: number, startDate?: string, endDate?: string) {
  const params: Record<string, string> = { limit: "500", done: "0" };
  if (userId) params.user_id = String(userId);
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const data = await pipedriveGet("/activities/collection", params);
  return data.data || [];
}

export async function getUsers() {
  const data = await pipedriveGet("/users");
  return data.data || [];
}

export async function getDealFields() {
  const data = await pipedriveGet("/dealFields", { limit: "500" });
  return data.data || [];
}

export async function getWonDealsStats(pipelineId: number, sinceDate?: string) {
  const deals = await getDeals(pipelineId, "won");
  const filtered = sinceDate
    ? deals.filter((d: any) => d.won_time && d.won_time >= sinceDate)
    : deals;

  return {
    count: filtered.length,
    totalValue: filtered.reduce((sum: number, d: any) => sum + (d.value || 0), 0),
    deals: filtered,
  };
}

export async function getLostDealsStats(pipelineId: number, sinceDate?: string) {
  const deals = await getDeals(pipelineId, "lost");
  const filtered = sinceDate
    ? deals.filter((d: any) => d.lost_time && d.lost_time >= sinceDate)
    : deals;

  const reasons: Record<string, number> = {};
  for (const deal of filtered) {
    const reason = deal.lost_reason || "Sem motivo";
    reasons[reason] = (reasons[reason] || 0) + 1;
  }

  return {
    count: filtered.length,
    totalValue: filtered.reduce((sum: number, d: any) => sum + (d.value || 0), 0),
    reasons: Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    deals: filtered,
  };
}

export async function getDealsAtRisk(pipelineId: number, staleDays = 10) {
  const deals = await getDeals(pipelineId, "open");
  const now = Date.now();
  const staleMs = staleDays * 24 * 60 * 60 * 1000;

  return deals
    .map((d: any) => {
      const lastActivity = d.last_activity_date ? new Date(d.last_activity_date).getTime() : new Date(d.update_time).getTime();
      const daysSinceActivity = Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000));
      return { ...d, daysSinceActivity };
    })
    .filter((d: any) => d.daysSinceActivity >= staleDays)
    .sort((a: any, b: any) => b.daysSinceActivity - a.daysSinceActivity)
    .slice(0, 15);
}
