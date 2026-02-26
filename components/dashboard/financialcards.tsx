"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserRoundCheck,
  Stethoscope,
  Percent,
} from "lucide-react";

// Tipagem do objeto que vem da API
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
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      title: "Contas a Pagar",
      value: `R$ ${data.totalPayable?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      title: "Receita do Mês",
      value: `R$ ${data.monthlyRevenue?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Taxas Admin.",
      value: `R$ ${data.adminFees?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: Percent,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  ];

  const clifor = [
    {
      title: "Clientes",
      value: data.totalClients,
      icon: UserRoundCheck,
      color: "text-orange-600",
    },
    {
      title: "Profissionais",
      value: data.totalProfessionals,
      icon: Stethoscope,
      color: "text-blue-600",
    },
  ];

  return (
    <>
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <Card
            key={index}
            className={`border-l-4 ${card.borderColor} hover:shadow-lg transition-all duration-200`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cards de clifor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clifor.map((item, index) => (
          <Card
            key={index}
            className="bg-gradient-to-r from-slate-50 to-slate-100"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span className="text-lg font-medium text-slate-700">
                    {item.title}
                  </span>
                </div>
                <div  className="text-2xl font-bold pr-2">
                  {item.value}
                </div>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
