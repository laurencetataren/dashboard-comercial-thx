"use client";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, DollarSign, Target, Phone,
  AlertTriangle, CheckCircle, Clock, RefreshCw, Activity, Zap, Award,
  BarChart3, Eye, Truck, ArrowRightLeft,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { BRAND, STAGE_COLORS, formatCurrency, formatNumber } from "@/lib/constants";

// ========== FALLBACK DATA ==========
const FALLBACK = {
  kpis: { pipelineValue: 3245000, pipelineDeals: 41, winRate: 26, avgTicket: 79146, reactivatedMonth: 8, reactivationTarget: 4, baseReativacao: 145 },
  oportunidadeStages: [
    { id: 1, name: "Pedido de Cotacao", deals: 18, value: 485000 },
    { id: 2, name: "Em Negociacao", deals: 12, value: 890000 },
    { id: 3, name: "Proposta Aprovada", deals: 4, value: 620000 },
    { id: 4, name: "Fechamento", deals: 7, value: 1250000 },
  ],
  closerStages: [
    { id: 62, name: "Base Reativacao", deals: 145 },
    { id: 63, name: "Retomar Contato", deals: 68 },
    { id: 60, name: "Reagendar Reuniao", deals: 32 },
    { id: 5, name: "Reuniao Agendada", deals: 18 },
    { id: 6, name: "Reuniao Realizada", deals: 11 },
    { id: 7, name: "Formatacao Proposta", deals: 8 },
    { id: 8, name: "Negociacao", deals: 15 },
    { id: 32, name: "Em Homologacao", deals: 6 },
    { id: 34, name: "Homologado", deals: 9 },
    { id: 61, name: "Em Cotacao", deals: 5 },
    { id: 33, name: "Negocio", deals: 8 },
  ],
  dealsAtRisk: [
    { title: "Schneider Electric", owner: "Tayna", days: 22, value: 180000, stage: "Em Negociacao" },
    { title: "Votorantim Cimentos", owner: "Gabrieli", days: 18, value: 250000, stage: "BID" },
    { title: "KaBuM!", owner: "Yasmim", days: 15, value: 95000, stage: "Pedido de Cotacao" },
    { title: "Gerdau Constr. Civil", owner: "Talys", days: 14, value: 320000, stage: "Em Negociacao" },
    { title: "Hypera Pharma", owner: "Ana Julia", days: 12, value: 145000, stage: "BID" },
  ],
  lostReasons: [
    { reason: "Preco", count: 34 },
    { reason: "Sem resposta", count: 22 },
    { reason: "Concorrente", count: 18 },
    { reason: "Prazo", count: 10 },
    { reason: "Outros", count: 6 },
  ],
  team: [
    { name: "Yasmim Herke", deals: 55, won: 11, value: 0, activities: 189 },
    { name: "Tayna Carvalho", deals: 42, won: 8, value: 0, activities: 156 },
    { name: "Gabrieli Muneretto", deals: 38, won: 6, value: 0, activities: 134 },
    { name: "Talys Oliveira", deals: 35, won: 5, value: 0, activities: 112 },
    { name: "Ana Julia Lima", deals: 28, won: 4, value: 0, activities: 98 },
  ],
  wonStats: { count: 12, value: 1850000 },
  lostStats: { count: 34, value: 980000 },
};

const FALLBACK_CLICKUP = {
  flashFTL: { aContratar: 82, emTransito: 3, faturado: 9, total: 94 },
  monthly: [],
};

const MOCK_VENDIDO_FATURADO = [
  { month: "Out", vendido: 1450000, faturado: 1180000, cargas_vendidas: 32, cargas_faturadas: 26 },
  { month: "Nov", vendido: 1780000, faturado: 1520000, cargas_vendidas: 38, cargas_faturadas: 33 },
  { month: "Dez", vendido: 1250000, faturado: 1100000, cargas_vendidas: 25, cargas_faturadas: 22 },
  { month: "Jan", vendido: 2100000, faturado: 1850000, cargas_vendidas: 44, cargas_faturadas: 39 },
  { month: "Fev", vendido: 2400000, faturado: 2050000, cargas_vendidas: 48, cargas_faturadas: 41 },
  { month: "Mar", vendido: 2850000, faturado: 2280000, cargas_vendidas: 55, cargas_faturadas: 44 },
];

const MOCK_MONTHLY = [
  { month: "Out", oportunidades: 1800000, reativados: 2, deals: 28, won: 6 },
  { month: "Nov", oportunidades: 2100000, reativados: 3, deals: 35, won: 8 },
  { month: "Dez", oportunidades: 1950000, reativados: 1, deals: 22, won: 5 },
  { month: "Jan", oportunidades: 2400000, reativados: 4, deals: 41, won: 11 },
  { month: "Fev", oportunidades: 2850000, reativados: 3, deals: 38, won: 9 },
  { month: "Mar", oportunidades: 3245000, reativados: 8, deals: 45, won: 12 },
];

const MOCK_CADENCIA = [
  { name: "Em dia", value: 58, color: BRAND.success },
  { name: "Atrasado 1-3d", value: 24, color: BRAND.warning },
  { name: "Atrasado >3d", value: 18, color: BRAND.danger },
];

const MOCK_WEEKLY_ACTIVITIES = [
  { day: "Seg", calls: 45, emails: 32, meetings: 8 },
  { day: "Ter", calls: 52, emails: 28, meetings: 12 },
  { day: "Qua", calls: 38, emails: 41, meetings: 6 },
  { day: "Qui", calls: 61, emails: 35, meetings: 10 },
  { day: "Sex", calls: 44, emails: 30, meetings: 7 },
];

// ========== COMPONENTS ==========

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (800 / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{typeof value === "number" && value >= 1000 ? display.toLocaleString("pt-BR") : display}{suffix}</span>;
}

function GlowDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
    </span>
  );
}

function KPICard({ title, value, prefix, suffix, icon: Icon, trend, trendValue, color, subtitle }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] cursor-default group"
      style={{ background: `linear-gradient(135deg, ${BRAND.bgCard} 0%, ${BRAND.bgSurface} 100%)`, border: `1px solid ${BRAND.border}` }}>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}
            style={{ background: trend === "up" ? "#00B89415" : "#FF6B6B15" }}>
            {trend === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: BRAND.textMuted }}>{title}</p>
      <p className="text-3xl font-bold tracking-tight" style={{ color: BRAND.text }}>
        <AnimatedNumber value={value} prefix={prefix || ""} suffix={suffix || ""} />
      </p>
      {subtitle && <p className="text-xs mt-1.5" style={{ color: BRAND.textDim }}>{subtitle}</p>}
    </div>
  );
}

function SectionHeader({ title, icon: Icon, badge }: { title: string; icon: any; badge?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 rounded-xl" style={{ background: `${BRAND.primary}15` }}>
        <Icon size={18} style={{ color: BRAND.primary }} />
      </div>
      <h2 className="text-lg font-bold" style={{ color: BRAND.text }}>{title}</h2>
      {badge && (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${BRAND.primary}20`, color: BRAND.primary }}>
          {badge}
        </span>
      )}
    </div>
  );
}

function FunnelBar({ stages, showValues = true }: { stages: any[]; showValues?: boolean }) {
  const maxDeals = Math.max(...stages.map((s: any) => s.deals), 1);
  return (
    <div className="space-y-3">
      {stages.map((stage: any, i: number) => (
        <div key={stage.id || i} className="group">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }} />
              <span className="text-sm font-medium" style={{ color: BRAND.text }}>{stage.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: BRAND.text }}>{stage.deals}</span>
              {showValues && stage.value != null && (
                <span className="text-xs font-medium" style={{ color: BRAND.textMuted }}>{formatCurrency(stage.value)}</span>
              )}
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
            <div className="h-full rounded-full transition-all duration-700 group-hover:opacity-80"
              style={{ width: `${Math.max((stage.deals / maxDeals) * 100, 4)}%`, backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length], boxShadow: `0 0 12px ${STAGE_COLORS[i % STAGE_COLORS.length]}40` }} />
          </div>
          {i < stages.length - 1 && stages.length > 3 && (
            <div className="flex justify-center my-0.5">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: BRAND.textDim }}>
                {stage.deals > 0 ? Math.round((stages[i + 1].deals / stage.deals) * 100) : 0}% conv.
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MetaGauge({ current, target, label }: { current: number; target: number; label: string }) {
  const pct = Math.min((current / target) * 100, 100);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 100 ? BRAND.success : pct >= 50 ? BRAND.warning : BRAND.danger;
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke={BRAND.border} strokeWidth="8" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1s ease-out", filter: `drop-shadow(0 0 6px ${color}60)` }} />
        <text x="60" y="52" textAnchor="middle" fill={BRAND.text} fontSize="28" fontWeight="bold">{current}</text>
        <text x="60" y="70" textAnchor="middle" fill={BRAND.textDim} fontSize="12">de {target}</text>
      </svg>
      <p className="text-sm font-medium mt-2" style={{ color: BRAND.textMuted }}>{label}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3 shadow-2xl" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
      <p className="text-xs font-semibold mb-1.5" style={{ color: BRAND.textMuted }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.value >= 1000 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

function DealRiskRow({ deal }: { deal: any }) {
  const urgency = deal.days > 20 ? BRAND.danger : deal.days > 14 ? BRAND.warning : BRAND.textMuted;
  return (
    <div className="flex items-center justify-between p-3 rounded-xl transition-colors"
      style={{ background: BRAND.bgSurface, border: `1px solid ${BRAND.border}` }}>
      <div className="flex items-center gap-3">
        <AlertTriangle size={16} style={{ color: urgency }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: BRAND.text }}>{deal.title}</p>
          <p className="text-xs" style={{ color: BRAND.textDim }}>{deal.stage} — {deal.owner}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold" style={{ color: urgency }}>{deal.days}d parado</p>
        <p className="text-xs" style={{ color: BRAND.textMuted }}>{formatCurrency(deal.value)}</p>
      </div>
    </div>
  );
}

function TeamRow({ member, rank }: { member: any; rank: number }) {
  const initials = member.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const conversion = member.deals > 0 ? Math.round((member.won / member.deals) * 100) : 0;
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:scale-[1.01]"
      style={{ background: rank === 0 ? `${BRAND.primary}08` : "transparent", border: `1px solid ${rank === 0 ? BRAND.primary + "30" : "transparent"}` }}>
      <div className="flex items-center gap-3 w-48">
        <div className="relative">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: `${STAGE_COLORS[rank % STAGE_COLORS.length]}25`, color: STAGE_COLORS[rank % STAGE_COLORS.length] }}>
            {initials}
          </div>
          {rank === 0 && <Award size={12} className="absolute -top-1 -right-1" style={{ color: BRAND.warning }} />}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: BRAND.text }}>{member.name.split(" ")[0]}</p>
          <p className="text-xs" style={{ color: BRAND.textDim }}>{member.deals} deals</p>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm font-bold" style={{ color: BRAND.success }}>{member.won}</p>
          <p className="text-[10px]" style={{ color: BRAND.textDim }}>Ganhos</p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: BRAND.secondary }}>{conversion}%</p>
          <p className="text-[10px]" style={{ color: BRAND.textDim }}>Conversao</p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: BRAND.text }}>{member.activities}</p>
          <p className="text-[10px]" style={{ color: BRAND.textDim }}>Atividades</p>
        </div>
      </div>
    </div>
  );
}

function VendidoFaturadoPanel({ compact = false, clickupData }: { compact?: boolean; clickupData: any }) {
  const currentMonth = MOCK_VENDIDO_FATURADO[MOCK_VENDIDO_FATURADO.length - 1];
  const conversionRate = Math.round((currentMonth.faturado / currentMonth.vendido) * 100);
  const gap = currentMonth.vendido - currentMonth.faturado;
  const flashFTL = clickupData?.flashFTL || FALLBACK_CLICKUP.flashFTL;

  const cargasStatus = [
    { name: "A Contratar", count: flashFTL.aContratar, color: BRAND.textDim },
    { name: "Em Transito", count: flashFTL.emTransito, color: BRAND.primary },
    { name: "Faturado", count: flashFTL.faturado, color: BRAND.success },
  ];

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl" style={{ background: `${BRAND.secondary}10`, border: `1px solid ${BRAND.secondary}20` }}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} style={{ color: BRAND.secondary }} />
              <span className="text-xs" style={{ color: BRAND.textMuted }}>Vendido (Pipedrive)</span>
            </div>
            <p className="text-xl font-bold" style={{ color: BRAND.secondary }}>{formatCurrency(currentMonth.vendido)}</p>
            <p className="text-[10px]" style={{ color: BRAND.textDim }}>{currentMonth.cargas_vendidas} cargas</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: `${BRAND.success}10`, border: `1px solid ${BRAND.success}20` }}>
            <div className="flex items-center gap-2 mb-1">
              <Truck size={14} style={{ color: BRAND.success }} />
              <span className="text-xs" style={{ color: BRAND.textMuted }}>Faturado (ClickUp)</span>
            </div>
            <p className="text-xl font-bold" style={{ color: BRAND.success }}>{formatCurrency(currentMonth.faturado)}</p>
            <p className="text-[10px]" style={{ color: BRAND.textDim }}>{currentMonth.cargas_faturadas} cargas</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: `${BRAND.warning}10`, border: `1px solid ${BRAND.warning}20` }}>
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft size={14} style={{ color: BRAND.warning }} />
              <span className="text-xs" style={{ color: BRAND.textMuted }}>Gap</span>
            </div>
            <p className="text-xl font-bold" style={{ color: BRAND.warning }}>{formatCurrency(gap)}</p>
            <p className="text-[10px]" style={{ color: BRAND.textDim }}>{currentMonth.cargas_vendidas - currentMonth.cargas_faturadas} cargas pendentes</p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: `${conversionRate >= 80 ? BRAND.success : BRAND.danger}10`, border: `1px solid ${conversionRate >= 80 ? BRAND.success : BRAND.danger}20` }}>
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} style={{ color: conversionRate >= 80 ? BRAND.success : BRAND.danger }} />
              <span className="text-xs" style={{ color: BRAND.textMuted }}>Conversao</span>
            </div>
            <p className="text-xl font-bold" style={{ color: conversionRate >= 80 ? BRAND.success : BRAND.danger }}>{conversionRate}%</p>
            <p className="text-[10px]" style={{ color: BRAND.textDim }}>Vendido → Faturado</p>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={compact ? 180 : 240}>
        <BarChart data={MOCK_VENDIDO_FATURADO} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
          <XAxis dataKey="month" tick={{ fill: BRAND.textDim, fontSize: 12 }} axisLine={false} />
          <YAxis tick={{ fill: BRAND.textDim, fontSize: 11 }} axisLine={false} tickFormatter={(v: number) => formatCurrency(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: BRAND.textMuted }} />
          <Bar dataKey="vendido" name="Vendido (Pipedrive)" fill={BRAND.secondary} radius={[4, 4, 0, 0]} opacity={0.85} />
          <Bar dataKey="faturado" name="Faturado (ClickUp)" fill={BRAND.success} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {!compact && (
        <div className="flex items-center gap-3">
          {cargasStatus.map((s, i) => (
            <div key={i} className="flex-1 p-2.5 rounded-xl text-center" style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}>
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-[10px]" style={{ color: BRAND.textDim }}>{s.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== TAB COMPONENTS ==========

function TabCEO({ data, clickup }: { data: any; clickup: any }) {
  const kpis = data?.kpis || FALLBACK.kpis;
  const stages = data?.oportunidadeStages || FALLBACK.oportunidadeStages;
  const dealsAtRisk = data?.dealsAtRisk || FALLBACK.dealsAtRisk;
  const lostReasons = data?.lostReasons || FALLBACK.lostReasons;
  const totalLost = lostReasons.reduce((s: number, r: any) => s + r.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Valor no Funil" value={kpis.pipelineValue} prefix="R$ " icon={DollarSign} color={BRAND.primary} trend="up" trendValue="+14%" subtitle="Funil Oportunidade (sem BID)" />
        <KPICard title="Deals Abertos" value={kpis.pipelineDeals} icon={BarChart3} color={BRAND.secondary} trend="up" trendValue="+8%" subtitle="Pipeline ativo" />
        <KPICard title="Win Rate" value={kpis.winRate} suffix="%" icon={Target} color={BRAND.success} trend="up" trendValue="+3pp" subtitle="Mes atual" />
        <KPICard title="Reativados no Mes" value={kpis.reactivatedMonth} icon={RefreshCw} color={BRAND.accent} trend="up" trendValue="200%" subtitle={`Meta: ${kpis.reactivationTarget} clientes`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Evolucao Mensal" icon={TrendingUp} badge="6 meses" />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={MOCK_MONTHLY}>
              <defs>
                <linearGradient id="gradOp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
              <XAxis dataKey="month" tick={{ fill: BRAND.textDim, fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: BRAND.textDim, fontSize: 11 }} axisLine={false} tickFormatter={(v: number) => formatCurrency(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="oportunidades" name="Oportunidades" stroke={BRAND.primary} fill="url(#gradOp)" strokeWidth={2.5} dot={{ fill: BRAND.primary, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Deals em Risco" icon={AlertTriangle} badge={`${dealsAtRisk.length}`} />
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
            {dealsAtRisk.map((d: any, i: number) => <DealRiskRow key={i} deal={d} />)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
        <SectionHeader title="Vendido x Faturado" icon={Truck} badge="Pipedrive vs ClickUp" />
        <VendidoFaturadoPanel compact={false} clickupData={clickup} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Atividades da Semana" icon={Activity} />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_WEEKLY_ACTIVITIES} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
              <XAxis dataKey="day" tick={{ fill: BRAND.textDim, fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: BRAND.textDim, fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="calls" name="Ligacoes" fill={BRAND.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="emails" name="Emails" fill={BRAND.secondary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="meetings" name="Reunioes" fill={BRAND.warning} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Motivos de Perda" icon={TrendingDown} />
          <div className="space-y-3">
            {lostReasons.map((r: any, i: number) => {
              const pct = totalLost > 0 ? Math.round((r.count / totalLost) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: BRAND.text }}>{r.reason}</span>
                    <span className="text-xs font-bold" style={{ color: BRAND.textMuted }}>{r.count} deals ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: BRAND.border }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length], transition: "width 0.8s ease-out" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabOportunidade({ data, clickup }: { data: any; clickup: any }) {
  const kpis = data?.kpis || FALLBACK.kpis;
  const stages = data?.oportunidadeStages || FALLBACK.oportunidadeStages;
  const dealsAtRisk = data?.dealsAtRisk || FALLBACK.dealsAtRisk;
  const team = data?.team || FALLBACK.team;
  const totalValue = stages.reduce((s: number, st: any) => s + (st.value || 0), 0);
  const totalDeals = stages.reduce((s: number, st: any) => s + st.deals, 0);

  const stagesWithColor = stages.map((s: any, i: number) => ({ ...s, color: STAGE_COLORS[i % STAGE_COLORS.length] }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Valor Total Pipeline" value={totalValue} prefix="R$ " icon={DollarSign} color={BRAND.primary} trend="up" trendValue="+14%" />
        <KPICard title="Total de Deals" value={totalDeals} icon={BarChart3} color={BRAND.secondary} />
        <KPICard title="Ticket Medio" value={kpis.avgTicket} prefix="R$ " icon={Target} color={BRAND.warning} />
        <KPICard title="Win Rate" value={kpis.winRate} suffix="%" icon={TrendingUp} color={BRAND.success} subtitle="Mes atual" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Funil de Oportunidade" icon={Zap} badge="Pipeline Live" />
          <FunnelBar stages={stagesWithColor} showValues={true} />
          {totalDeals > 0 && stages.length > 1 && (
            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${BRAND.border}` }}>
              <span className="text-xs" style={{ color: BRAND.textDim }}>Conversao geral</span>
              <span className="text-sm font-bold" style={{ color: BRAND.primary }}>
                {stages[0].deals > 0 ? Math.round((stages[stages.length - 1].deals / stages[0].deals) * 100) : 0}%
              </span>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Distribuicao por Valor" icon={DollarSign} />
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stagesWithColor.filter((s: any) => s.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} strokeWidth={0}>
                {stagesWithColor.filter((s: any) => s.value > 0).map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: BRAND.textMuted }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
        <SectionHeader title="Vendido x Faturado" icon={Truck} badge="Gap de Receita" />
        <VendidoFaturadoPanel compact={false} clickupData={clickup} />
      </div>

      <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
        <SectionHeader title="Deals em Risco" icon={AlertTriangle} badge={`${dealsAtRisk.length} alertas`} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dealsAtRisk.map((d: any, i: number) => <DealRiskRow key={i} deal={d} />)}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
        <SectionHeader title="Pipeline por Vendedor" icon={Users} />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={team.slice(0, 6)} layout="vertical" barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
            <XAxis type="number" tick={{ fill: BRAND.textDim, fontSize: 11 }} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: BRAND.text, fontSize: 12 }} width={120} axisLine={false} tickFormatter={(v: string) => v.split(" ")[0]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="deals" name="Deals" fill={BRAND.primary} radius={[0, 6, 6, 0]} />
            <Bar dataKey="won" name="Ganhos" fill={BRAND.success} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TabReativacao({ data, clickup }: { data: any; clickup: any }) {
  const kpis = data?.kpis || FALLBACK.kpis;
  const closerStages = data?.closerStages || FALLBACK.closerStages;
  const lostReasons = data?.lostReasons || FALLBACK.lostReasons;
  const totalLost = lostReasons.reduce((s: number, r: any) => s + r.count, 0);

  const totalBase = closerStages[0]?.deals || 0;
  const contacted = closerStages.slice(1).reduce((s: number, st: any) => s + st.deals, 0);
  const contactRate = totalBase + contacted > 0 ? Math.round((contacted / (totalBase + contacted)) * 100) : 0;

  const closerWithColor = closerStages.map((s: any, i: number) => ({ ...s, color: STAGE_COLORS[i % STAGE_COLORS.length] }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Base Reativacao" value={totalBase} icon={Users} color={BRAND.secondary} subtitle="Clientes na base pra reativar" />
        <KPICard title="Taxa de Contato" value={contactRate} suffix="%" icon={Phone} color={BRAND.primary} trend="up" trendValue="+5pp" />
        <KPICard title="Reativados no Mes" value={kpis.reactivatedMonth} icon={CheckCircle} color={BRAND.success} trend="up" trendValue="200%" subtitle={`Meta: ${kpis.reactivationTarget}`} />
        <KPICard title="Atividades/Semana" value={689} icon={Activity} color={BRAND.warning} trend="up" trendValue="+12%" subtitle="Ligacoes + emails + reunioes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Funil de Reativacao (Closer)" icon={RefreshCw} badge="Pipeline Live" />
          <FunnelBar stages={closerWithColor} showValues={false} />
        </div>

        <div className="rounded-2xl p-5 flex flex-col items-center justify-center" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Meta de Reativacao" icon={Target} />
          <MetaGauge current={kpis.reactivatedMonth} target={kpis.reactivationTarget} label="Clientes reativados / mes" />
          <div className="mt-4 w-full">
            <div className="flex items-center justify-between p-2.5 rounded-xl"
              style={{ background: `${kpis.reactivatedMonth >= kpis.reactivationTarget ? BRAND.success : BRAND.warning}10` }}>
              <span className="text-xs" style={{ color: BRAND.textMuted }}>Status</span>
              <span className="text-sm font-bold" style={{ color: kpis.reactivatedMonth >= kpis.reactivationTarget ? BRAND.success : BRAND.warning }}>
                {kpis.reactivatedMonth >= kpis.reactivationTarget ? "META BATIDA!" : `Faltam ${kpis.reactivationTarget - kpis.reactivatedMonth}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Cadencia de Contato" icon={Clock} />
          <div className="flex items-center justify-center mb-4">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={MOCK_CADENCIA} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                  {MOCK_CADENCIA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: BRAND.textMuted }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {MOCK_CADENCIA.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: `${c.color}10` }}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm" style={{ color: BRAND.text }}>{c.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: c.color }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Motivos de Perda" icon={TrendingDown} />
          <div className="space-y-3">
            {lostReasons.map((r: any, i: number) => {
              const pct = totalLost > 0 ? Math.round((r.count / totalLost) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: BRAND.text }}>{r.reason}</span>
                    <span className="text-xs font-bold" style={{ color: BRAND.textMuted }}>{r.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: BRAND.border }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length], transition: "width 0.8s ease-out" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
        <SectionHeader title="Evolucao de Reativacoes" icon={TrendingUp} badge="Mensal" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={MOCK_MONTHLY}>
            <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
            <XAxis dataKey="month" tick={{ fill: BRAND.textDim, fontSize: 12 }} axisLine={false} />
            <YAxis tick={{ fill: BRAND.textDim, fontSize: 11 }} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="reativados" name="Reativados" fill={BRAND.accent} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TabPerformance({ data }: { data: any }) {
  const team = data?.team || FALLBACK.team;
  const sorted = [...team].sort((a: any, b: any) => b.won - a.won);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
        <SectionHeader title="Ranking do Time" icon={Award} badge="Mes Atual" />
        <div className="space-y-2">
          {sorted.map((m: any, i: number) => <TeamRow key={i} member={m} rank={i} />)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Deals Ganhos por Vendedor" icon={CheckCircle} />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sorted} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
              <XAxis dataKey="name" tick={{ fill: BRAND.textDim, fontSize: 11 }} axisLine={false} tickFormatter={(v: string) => v.split(" ")[0]} />
              <YAxis tick={{ fill: BRAND.textDim, fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="won" name="Deals Ganhos" fill={BRAND.success} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <SectionHeader title="Atividades por Vendedor" icon={Activity} />
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sorted} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
              <XAxis dataKey="name" tick={{ fill: BRAND.textDim, fontSize: 11 }} axisLine={false} tickFormatter={(v: string) => v.split(" ")[0]} />
              <YAxis tick={{ fill: BRAND.textDim, fontSize: 11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="activities" name="Atividades" fill={BRAND.secondary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
        <SectionHeader title="Conversao por Vendedor" icon={Target} />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sorted.map((m: any) => ({ ...m, conversion: m.deals > 0 ? Math.round((m.won / m.deals) * 100) : 0 }))} layout="vertical" barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
            <XAxis type="number" tick={{ fill: BRAND.textDim, fontSize: 11 }} axisLine={false} domain={[0, 30]} unit="%" />
            <YAxis type="category" dataKey="name" tick={{ fill: BRAND.text, fontSize: 12 }} width={100} axisLine={false} tickFormatter={(v: string) => v.split(" ")[0]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="conversion" name="Win Rate" fill={BRAND.primary} radius={[0, 6, 6, 0]}>
              {sorted.map((_: any, i: number) => <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ========== MAIN APP ==========

const TABS = [
  { id: "ceo", label: "Visao CEO", icon: Eye },
  { id: "oportunidade", label: "Oportunidade", icon: Zap },
  { id: "reativacao", label: "Reativacao", icon: RefreshCw },
  { id: "performance", label: "Performance", icon: Award },
];

export default function CockpitComercial() {
  const [activeTab, setActiveTab] = useState("ceo");
  const [time, setTime] = useState(new Date());
  const { pipedrive, clickup, loading, error, lastUpdated, refresh } = useDashboardData();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: BRAND.bg, color: BRAND.text }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between backdrop-blur-xl"
        style={{ background: `${BRAND.bg}E6`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`, color: "#fff" }}>
              THX
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight" style={{ color: BRAND.text }}>Cockpit Comercial</h1>
              <p className="text-[10px] font-medium" style={{ color: BRAND.textDim }}>THX Group — Logtech</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl" style={{ background: BRAND.bgSurface }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  background: isActive ? `${BRAND.primary}20` : "transparent",
                  color: isActive ? BRAND.primary : BRAND.textDim,
                  border: isActive ? `1px solid ${BRAND.primary}30` : "1px solid transparent",
                }}>
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={refresh} className="p-2 rounded-lg transition-colors hover:opacity-80" style={{ background: `${BRAND.primary}15` }} title="Atualizar dados">
            <RefreshCw size={14} style={{ color: BRAND.primary }} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="flex items-center gap-2">
            <GlowDot color={error ? BRAND.danger : BRAND.success} />
            <span className="text-xs font-medium" style={{ color: BRAND.textMuted }}>{error ? "Offline" : "Live"}</span>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold" style={{ color: BRAND.text }}>
              {time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-[10px]" style={{ color: BRAND.textDim }}>
              {time.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
            </p>
          </div>
        </div>
      </header>

      {/* Mobile tabs */}
      <nav className="md:hidden flex items-center gap-1 p-2 mx-2 mt-2 rounded-xl" style={{ background: BRAND.bgSurface }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] font-semibold transition-all duration-200"
              style={{
                background: isActive ? `${BRAND.primary}20` : "transparent",
                color: isActive ? BRAND.primary : BRAND.textDim,
              }}>
              <Icon size={12} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-xl flex items-center gap-3" style={{ background: `${BRAND.danger}15`, border: `1px solid ${BRAND.danger}30` }}>
          <AlertTriangle size={16} style={{ color: BRAND.danger }} />
          <p className="text-sm" style={{ color: BRAND.danger }}>Erro ao carregar dados: {error}. Usando dados de fallback.</p>
        </div>
      )}

      {/* Loading overlay */}
      {loading && !pipedrive && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw size={32} style={{ color: BRAND.primary }} className="animate-spin" />
            <p className="text-sm" style={{ color: BRAND.textMuted }}>Carregando dados do Pipedrive e ClickUp...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {(!loading || pipedrive) && (
        <main className="p-4 lg:p-6 max-w-[1440px] mx-auto">
          {activeTab === "ceo" && <TabCEO data={pipedrive || FALLBACK} clickup={clickup || FALLBACK_CLICKUP} />}
          {activeTab === "oportunidade" && <TabOportunidade data={pipedrive || FALLBACK} clickup={clickup || FALLBACK_CLICKUP} />}
          {activeTab === "reativacao" && <TabReativacao data={pipedrive || FALLBACK} clickup={clickup || FALLBACK_CLICKUP} />}
          {activeTab === "performance" && <TabPerformance data={pipedrive || FALLBACK} />}
        </main>
      )}

      {/* Footer */}
      <footer className="p-4 text-center" style={{ borderTop: `1px solid ${BRAND.border}` }}>
        <p className="text-[10px]" style={{ color: BRAND.textDim }}>
          Cockpit Comercial THX Group — Powered by Matrix DEV Senior — Dados: Pipedrive + ClickUp API (refresh: 5min)
          {lastUpdated && ` — Ultimo update: ${lastUpdated.toLocaleTimeString("pt-BR")}`}
        </p>
      </footer>
    </div>
  );
}
