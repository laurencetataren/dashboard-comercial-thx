import { NextResponse } from "next/server";
import {
  getDealsByStage,
  getDealsSummary,
  getWonDealsStats,
  getLostDealsStats,
  getDealsAtRisk,
  getUsers,
} from "@/lib/pipedrive";

const PIPELINE_OPORTUNIDADE = parseInt(process.env.PIPELINE_OPORTUNIDADE_ID || "7");
const PIPELINE_CLOSER = parseInt(process.env.PIPELINE_CLOSER_ID || "1");

export async function GET() {
  try {
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const [
      oportunidadeStages,
      closerStages,
      oportunidadeSummaryOpen,
      oportunidadeWon,
      oportunidadeLost,
      closerWon,
      closerLost,
      dealsAtRisk,
      users,
    ] = await Promise.all([
      getDealsByStage(PIPELINE_OPORTUNIDADE),
      getDealsByStage(PIPELINE_CLOSER),
      getDealsSummary(PIPELINE_OPORTUNIDADE, "open"),
      getWonDealsStats(PIPELINE_OPORTUNIDADE, firstOfMonth),
      getLostDealsStats(PIPELINE_OPORTUNIDADE, firstOfMonth),
      getWonDealsStats(PIPELINE_CLOSER, firstOfMonth),
      getLostDealsStats(PIPELINE_CLOSER),
      getDealsAtRisk(PIPELINE_OPORTUNIDADE, 10),
      getUsers(),
    ]);

    // Calculate win rate
    const totalWon = oportunidadeWon.count;
    const totalLost = oportunidadeLost.count;
    const winRate = totalWon + totalLost > 0 ? Math.round((totalWon / (totalWon + totalLost)) * 100) : 0;

    // Pipeline totals
    const pipelineValue = oportunidadeStages.reduce((sum: number, s: any) => sum + s.totalValue, 0);
    const pipelineDeals = oportunidadeStages.reduce((sum: number, s: any) => sum + s.deals.length, 0);
    const avgTicket = pipelineDeals > 0 ? Math.round(pipelineValue / pipelineDeals) : 0;

    // Reactivation stats from Closer pipeline
    const reactivatedDeals = closerWon.count;
    const closerBase = closerStages.find((s: any) => s.name.toLowerCase().includes("base"));
    const baseCount = closerBase ? closerBase.deals.length : 0;

    // Team performance from deal owners
    const teamMap: Record<string, { name: string; deals: number; won: number; value: number; activities: number }> = {};
    for (const stage of oportunidadeStages) {
      for (const deal of stage.deals) {
        const owner = deal.owner_name || deal.user_id?.name || "Desconhecido";
        if (!teamMap[owner]) teamMap[owner] = { name: owner, deals: 0, won: 0, value: 0, activities: 0 };
        teamMap[owner].deals++;
        teamMap[owner].value += deal.value || 0;
        teamMap[owner].activities += deal.activities_count || 0;
      }
    }
    for (const deal of oportunidadeWon.deals) {
      const owner = deal.owner_name || "Desconhecido";
      if (teamMap[owner]) teamMap[owner].won++;
    }

    // Deals at risk formatted
    const riskyDeals = dealsAtRisk.map((d: any) => ({
      title: d.title,
      owner: d.owner_name || "N/A",
      days: d.daysSinceActivity,
      value: d.value || 0,
      stage: d.stage_id,
    }));

    return NextResponse.json({
      kpis: {
        pipelineValue,
        pipelineDeals,
        winRate,
        avgTicket,
        reactivatedMonth: reactivatedDeals,
        reactivationTarget: 4,
        baseReativacao: baseCount,
      },
      oportunidadeStages: oportunidadeStages.map((s: any) => ({
        id: s.id,
        name: s.name,
        deals: s.deals.length,
        value: s.totalValue,
      })),
      closerStages: closerStages
        .filter((s: any) => !s.name.toLowerCase().includes("stand by"))
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          deals: s.deals.length,
        })),
      dealsAtRisk: riskyDeals,
      lostReasons: oportunidadeLost.reasons.slice(0, 5),
      team: Object.values(teamMap).sort((a, b) => b.won - a.won),
      wonStats: {
        count: oportunidadeWon.count,
        value: oportunidadeWon.totalValue,
      },
      lostStats: {
        count: oportunidadeLost.count,
        value: oportunidadeLost.totalValue,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Pipedrive API route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
