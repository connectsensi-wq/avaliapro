"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
// 1. Importações do Recharts adicionadas:
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Invoice {
  issue_date: string;
  base_amount?: number;
  total_amount?: number;
}

interface RevenueGoalCardProps {
  invoices: Invoice[];
}

export default function RevenueGoalCard({ invoices = [] }: RevenueGoalCardProps) {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0 - 11

  // Determinar o mês e ano anterior
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Somar Receita do Mês Corrente
  const currentMonthRevenue = invoices
    .filter((inv) => {
      if (!inv.issue_date) return false;
      const d = new Date(inv.issue_date);
      return d.getUTCFullYear() === currentYear && d.getUTCMonth() === currentMonth;
    })
    .reduce((sum, inv) => sum + (inv.total_amount || inv.base_amount || 0), 0);

  // Somar Receita do Mês Anterior (Meta)
  const previousMonthRevenue = invoices
    .filter((inv) => {
      if (!inv.issue_date) return false;
      const d = new Date(inv.issue_date);
      return d.getUTCFullYear() === previousYear && d.getUTCMonth() === previousMonth;
    })
    .reduce((sum, inv) => sum + (inv.total_amount || inv.base_amount || 0), 0);

  // Calcular % Atingida em relação ao Mês Anterior
  let progressPercent = 0;
  if (previousMonthRevenue > 0) {
    progressPercent = Math.round((currentMonthRevenue / previousMonthRevenue) * 100);
  } else if (currentMonthRevenue > 0) {
    progressPercent = 100;
  }

  const isGoalAchieved = progressPercent >= 100;

  // 2. Preparar os dados para o Velocímetro (Gauge)
  // Limitamos o "preenchimento" ao valor da meta para o gráfico não dar mais de 1 volta
  const targetValue = previousMonthRevenue > 0 ? previousMonthRevenue : 1;
  const currentGaugeValue = Math.min(currentMonthRevenue, targetValue);
  const remainingGaugeValue = Math.max(0, targetValue - currentMonthRevenue);

  // Dados que alimentam as duas fatias da meia-pizza
  const gaugeData = [
    { name: "Realizado", value: currentGaugeValue, color: "#00F5A0" }, // Verde Neon
    { name: "Faltante", value: remainingGaugeValue, color: "#034e3fff" }, // Fundo escuro
  ];

  return (
    <Card className="bg-card border border-border rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
      <CardHeader className="border-b border-[#003B35] pb-1 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2.5 text-base font-bold text-foreground">
          <div className="p-2 rounded-lg bg-[#00F5A0]/10 border border-[#00F5A0]/20 text-[#00F5A0]">
            <Target className="h-5 w-5" />
          </div>
          Desempenho de Meta (Receita)
        </CardTitle>

        <span
          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${isGoalAchieved
            ? "bg-[#00F5A0]/10 text-[#00F5A0] border-[#00F5A0]/30"
            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
        >
          {isGoalAchieved ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" />
          )}
          {progressPercent}% da Meta
        </span>
      </CardHeader>

      <CardContent className="p-4">
        {/* Gráfico Gauge */}
        <div className="relative h-70 w-full -mt-15">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="80%" // O centro do gráfico fica em 80% da altura da div
                startAngle={180}
                endAngle={0}
                innerRadius="70%"
                outerRadius="100%"
                dataKey="value"
                stroke="none"
                cornerRadius={5}
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Texto Posicionado de Forma Absoluta */}
          <div className="absolute left-1/2 top-[80%] -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none">
            <span
              className={`text-3xl font-black ${isGoalAchieved ? "text-[#00F5A0]" : "text-primary"
                }`}
            >
              {progressPercent}%
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Alcançado
            </span>
          </div>
        </div>

        {/* Valores Comparativos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
              Mês Corrente
            </span>
            <p className="text-lg font-black text-primary mt-1">
              R${" "}
              {currentMonthRevenue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-3.5">
            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
              Meta (Mês Anterior)
            </span>
            <p className="text-lg font-black text-foreground mt-1">
              R${" "}
              {previousMonthRevenue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}