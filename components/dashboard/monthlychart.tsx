"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Calendar, Filter, Info } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

interface MonthlyChartProps {
  companyId: string | null;
}

interface Invoice {
  issue_date: string;
  total_amount?: number;
  base_amount?: number;
}

interface AccountsPayable {
  due_date: string;
  admin_fee_amount?: number;
}

interface ChartDataItem {
  month: string;
  receita: number;
  invoiceLastYear: number;
  payable: number;
  payableLastYear: number;
}

export default function MonthlyChart({ companyId }: MonthlyChartProps) {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<
    "receita" | "comparativo_receita" | "taxa_admin" | "comparativo_taxa_admin"
  >("receita");

  useEffect(() => {
    if (!companyId) return;

    const loadChartData = async () => {
      try {
        const res = await fetch(`/api/dashboard?companyId=${companyId}`);
        const data: { invoices: Invoice[]; payables: AccountsPayable[] } = await res.json();

        // Extrair anos disponíveis das faturas e pagamentos
        const invoiceYears = (data.invoices ?? []).map((i) => {
          const d = new Date(i.issue_date);
          return isNaN(d.getTime()) ? new Date().getFullYear() : d.getUTCFullYear();
        });

        const payableYears = (data.payables ?? []).map((p) => {
          const d = new Date(p.due_date);
          return isNaN(d.getTime()) ? new Date().getFullYear() : d.getUTCFullYear();
        });

        const allYears = Array.from(new Set<number>([...invoiceYears, ...payableYears])).sort(
          (a, b) => b - a
        );

        const currentYear = new Date().getFullYear();
        const validYears = allYears.length > 0 ? allYears : [currentYear];
        setAvailableYears(validYears);

        // Se selectedYear ainda for null, usa o ano mais recente disponível
        const activeYear = selectedYear ?? validYears[0];

        const months = [
          "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
        ];

        const monthlyData: ChartDataItem[] = months.map((month) => ({
          month,
          receita: 0,
          invoiceLastYear: 0,
          payable: 0,
          payableLastYear: 0,
        }));

        (data.invoices || []).forEach((invoice) => {
          if (!invoice.issue_date) return;
          const d = new Date(invoice.issue_date);
          if (isNaN(d.getTime())) return;

          const year = d.getUTCFullYear();
          const monthIndex = d.getUTCMonth();
          const amount = Number(invoice.total_amount || invoice.base_amount || 0);

          if (year === activeYear) {
            monthlyData[monthIndex].receita += amount;
          } else if (year === activeYear - 1) {
            monthlyData[monthIndex].invoiceLastYear += amount;
          }
        });

        (data.payables || []).forEach((payable) => {
          if (!payable.due_date) return;
          const d = new Date(payable.due_date);
          if (isNaN(d.getTime())) return;

          const year = d.getUTCFullYear();
          const monthIndex = d.getUTCMonth();
          const feeAmount = Number(payable.admin_fee_amount || 0);

          if (year === activeYear) {
            monthlyData[monthIndex].payable += feeAmount;
          } else if (year === activeYear - 1) {
            monthlyData[monthIndex].payableLastYear += feeAmount;
          }
        });

        setChartData(monthlyData);
      } catch (error) {
        console.error("Erro ao carregar dados do gráfico:", error);
      }
    };

    loadChartData();
  }, [companyId, selectedYear]);

  const activeYear = selectedYear ?? (availableYears[0] || new Date().getFullYear());
  const lastYear = activeYear - 1;

  const isComparative = viewMode === "comparativo_receita" || viewMode === "comparativo_taxa_admin";

  return (
    <Card className="bg-transparent backdrop-blur-2xl border border-white/60 rounded-3xl shadow-xl overflow-hidden py-8 px-4 transition-all duration-300">
      <CardHeader className="px-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-300">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2.5 text-base font-bold text-foreground">
            <div className="p-2 rounded-lg bg-emerald-600/10 border border-emerald-600/20 text-emerald-600">
              <BarChart2 className="h-5 w-5" />
            </div>
            Desempenho Operacional Mensal
          </CardTitle>
          {isComparative && (
            <p className="text-xs text-[#00F5A0] flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5" />
              Comparando ano base <span className="font-bold underline">{activeYear}</span> com ano anterior <span className="font-bold underline">{lastYear}</span>
            </p>
          )}
        </div>

        {/* Filtros em Lado a Lado */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Select de Ano */}
          <div className="flex items-center gap-1.5 bg-[#001715] border border-[#00453F] px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="h-3.5 w-3.5 text-[#00F5A0]" />
            <select
              className="bg-transparent font-semibold text-[#00F5A0] focus:outline-none cursor-pointer"
              value={selectedYear ?? availableYears[0] ?? ""}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map((y) => (
                <option key={y} value={y} className="bg-[#002623] text-white">
                  Ano: {y}
                </option>
              ))}
            </select>
          </div>

          {/* Select de Visão / Modo */}
          <div className="flex items-center gap-1.5 bg-[#001715] border border-[#00453F] px-3 py-1.5 rounded-xl text-xs">
            <Filter className="h-3.5 w-3.5 text-sky-400" />
            <select
              className="bg-transparent font-semibold text-slate-200 focus:outline-none cursor-pointer"
              value={viewMode}
              onChange={(e: any) => setViewMode(e.target.value)}
            >
              <option value="receita" className="bg-[#002623] text-white">
                Receita
              </option>
              <option value="comparativo_receita" className="bg-[#002623] text-white">
                Comparativo de Receita
              </option>
              <option value="taxa_admin" className="bg-[#002623] text-white">
                Taxa Administrativa
              </option>
              <option value="comparativo_taxa_admin" className="bg-[#002623] text-white">
                Comparativo de Taxa Adm
              </option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 px-0">
        <ResponsiveContainer width="100%" height={305}>
          <BarChart
            // 1. Removido o layout="vertical"
            data={chartData}
            barCategoryGap="18%"
            barGap={3}
            margin={{ top: 10, right: -20, left: -10, bottom: 10 }}
          >
            <defs>
              {/* 5. Gradientes ajustados para baixo -> cima (y1="1" y2="0") */}
              <linearGradient id="barPrimary" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.100} />
                <stop offset="100%" stopColor="#00F5A0" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="barSecondary" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.100} />
                <stop offset="100%" stopColor="#96a09eff" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="barSky" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.100} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="barPurple" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.100} />
                <stop offset="100%" stopColor="#96a09eff" stopOpacity={1} />
              </linearGradient>
            </defs>

            {/* 3. Grid alterado para linhas horizontais */}
            <CartesianGrid strokeDasharray="3 3" stroke="#003D37" vertical={false} />

            {/* 2. Eixos Invertidos */}
            <XAxis
              dataKey="month" // Meses vieram pro eixo X
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: "bold" }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} // Valores foram pro eixo Y
            />

            <Tooltip
              formatter={(value: any, name: any) => [
                `R$ ${Number(value).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}`,
                name,
              ]}
              labelStyle={{ color: "#00F5A0", fontWeight: "bold" }}
              contentStyle={{
                backgroundColor: "#001A18",
                border: "1px solid #00453F",
                borderRadius: "12px",
                color: "#f8fafc",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} />

            {/* 4. Radius das barras ajustado para o topo: [6, 6, 0, 0] */}
            {viewMode === "receita" && (
              <Bar
                dataKey="receita"
                fill="url(#barPrimary)"
                name={`Receita ${activeYear}`}
                radius={[10, 10, 0, 0]}
                barSize={30}
              />
            )}

            {viewMode === "comparativo_receita" && (
              <Bar
                dataKey="receita"
                fill="url(#barPrimary)"
                name={`Receita ${activeYear}`}
                radius={[10, 10, 0, 0]}
                barSize={30}
              />
            )}
            {viewMode === "comparativo_receita" && (
              <Bar
                dataKey="invoiceLastYear"
                fill="url(#barSecondary)"
                name={`Receita ${lastYear}`}
                radius={[10, 10, 0, 0]}
                barSize={18}
              />
            )}

            {viewMode === "taxa_admin" && (
              <Bar
                dataKey="payable"
                fill="url(#barSky)"
                name={`Taxa Admin ${activeYear}`}
                radius={[10, 10, 0, 0]}
                barSize={30}
              />
            )}

            {viewMode === "comparativo_taxa_admin" && (
              <Bar
                dataKey="payable"
                fill="url(#barSky)"
                name={`Taxa Admin ${activeYear}`}
                radius={[10, 10, 0, 0]}
                barSize={18}
              />
            )}
            {viewMode === "comparativo_taxa_admin" && (
              <Bar
                dataKey="payableLastYear"
                fill="url(#barPurple)"
                name={`Taxa Admin ${lastYear}`}
                radius={[6, 6, 0, 0]}
                barSize={11}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}



