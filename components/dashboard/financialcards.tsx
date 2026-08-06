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
      color: "text-emerald-600",
      bgColor: "bg-emerald-600/10",
      borderColor: "border-emerald-600/25",
      badgeText: "Entradas",
      badgeColor: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
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
      {/* 4 Cards Financeiros Enxutos com Estilo Glassmorphic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card
            key={index}
            className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl px-4 py-6 shadow-xl hover:scale-[1.02] hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  {card.title}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                  {card.badgeText}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </span>
                <div className={`p-2.5 rounded-2xl ${card.bgColor} shrink-0 shadow-sm`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Card Único Unificado: Clientes Ativos & Profissionais Cadastrados */}
      <Card className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
            Base Operacional Ativa
          </div>

          <div className="grid grid-cols-2 gap-6 sm:gap-10 w-full sm:w-auto">
            {/* Clientes */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600">
                <UserRoundCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Clientes Ativos</p>
                <p className="text-xl font-extrabold text-slate-900 leading-none mt-0.5">
                  {data.totalClients}
                </p>
              </div>
            </div>

            {/* Profissionais */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6 sm:pl-10">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                <Stethoscope className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Profissionais</p>
                <p className="text-xl font-extrabold text-slate-900 leading-none mt-0.5">
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


