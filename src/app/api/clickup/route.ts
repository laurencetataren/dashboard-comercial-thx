import { NextResponse } from "next/server";
import { getFlashFTLStats, getFlashFTLByMonth } from "@/lib/clickup";

export async function GET() {
  try {
    const [stats, monthly] = await Promise.all([
      getFlashFTLStats(),
      getFlashFTLByMonth(),
    ]);

    return NextResponse.json({
      flashFTL: {
        aContratar: stats.aContratar,
        emTransito: stats.emTransito,
        faturado: stats.faturado,
        total: stats.total,
      },
      monthly,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("ClickUp API route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
