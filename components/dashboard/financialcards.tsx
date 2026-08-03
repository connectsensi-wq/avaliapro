"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserRoundCheck,
  Stethoscope,
  Percent,
  Users,
} from "lucide-react";

interface FinancialData {
  totalReceivable: number;
  totalPayable: number;
  monthlyRevenue: number;
  adminFees: number;
  totalClients: number;
  totalProfessionals: number;
}

export default function FinancialCards({ data }: { data: FinancialData }) {
  const cards = [
    {
      title: "Contas a Receber",
      value: `R$ ${data.totalReceivable?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: TrendingUp,
      color: "text-[#00F5A0]",
      bgColor: "bg-[#00F5A0]/10",
      borderColor: "border-[#00F5A0]/25",
      badgeText: "Entradas",
      badgeColor: "bg-[#00F5A0]/10 text-[#00F5A0] border-[#00F5A0]/20",
    },
    {
      title: "Contas a Pagar",
      value: `R$ ${data.totalPayable?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: TrendingDown,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/25",
      badgeText: "Saídas",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    {
      title: "Receita do Mês",
      value: `R$ ${data.monthlyRevenue?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/25",
      badgeText: "Bruto",
      badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    {
      title: "Taxas Administrativas",
      value: `R$ ${data.adminFees?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: Percent,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/25",
      badgeText: "Retenção",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Cards Financeiros Enxutos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card
            key={index}
            className={`bg-[#002421] border ${card.borderColor} rounded-xl p-3.5 shadow-md hover:border-opacity-60 transition-all duration-200`}
          >
            <div className="flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">
                  {card.title}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${card.badgeColor}`}>
                  {card.badgeText}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {card.value}
                </span>
                <div className={`p-2 rounded-lg ${card.bgColor} shrink-0`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Card Único Unificado: Clientes Ativos & Profissionais Cadastrados */}
      <Card className="bg-gradient-to-r from-[#002824] via-[#002421] to-[#001D1B] border border-[#004841] rounded-xl p-3.5 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Users className="w-4 h-4 text-[#00F5A0]" />
            Base Operacional Ativa
          </div>

          <div className="grid grid-cols-2 gap-6 sm:gap-10 w-full sm:w-auto">
            {/* Clientes */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <UserRoundCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Clientes Ativos</p>
                <p className="text-lg font-extrabold text-white leading-none mt-0.5">
                  {data.totalClients}
                </p>
              </div>
            </div>

            {/* Profissionais */}
            <div className="flex items-center gap-3 border-l border-[#00453F] pl-6 sm:pl-10">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Stethoscope className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Profissionais</p>
                <p className="text-lg font-extrabold text-white leading-none mt-0.5">
                  {data.totalProfessionals}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}


