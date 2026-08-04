"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldAlert, Filter, Calendar, FileText, ChevronRight, CheckCircle2 } from "lucide-react";
import { AccountsReceivable } from "@/src/types/payment";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgingReceivablesCardProps {
  data: AccountsReceivable[];
}

// Helper para formatar datas UTC sem deslocamento de fuso horário
const formatUTCDate = (dateInput: string | Date, pattern: string = "d 'de' MMMM 'de' yyyy") => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const day = d.getUTCDate();

  return format(new Date(year, month, day, 12, 0, 0), pattern, { locale: ptBR });
};

export default function AgingReceivablesCard({ data = [] }: AgingReceivablesCardProps) {
  const [selectedRange, setSelectedRange] = useState<"all" | "30" | "60" | "90" | "120">("all");

  const now = new Date();

  // Filtrar apenas títulos pendentes/vencidos em aberto (status pending/overdue e sem payment_date) com vencimento no passado
  const overdueItems = (data || [])
    .filter((item) => {
      if (!item.due_date) return false;
      const isUnpaid = (item.status === "pending" || item.status === "overdue") && !item.payment_date;
      if (!isUnpaid) return false;

      const d = new Date(item.due_date);
      const utcDueDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59);
      return utcDueDate.getTime() < now.getTime();
    })
    .map((item) => {
      const d = new Date(item.due_date);
      const utcDueDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
      const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
      const diffTime = todayNoon.getTime() - utcDueDate.getTime();
      const daysOverdue = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      let bracket: "30" | "60" | "90" | "120" = "30";
      if (daysOverdue > 90) {
        bracket = "120";
      } else if (daysOverdue > 60) {
        bracket = "90";
      } else if (daysOverdue > 30) {
        bracket = "60";
      } else {
        bracket = "30";
      }

      return {
        ...item,
        daysOverdue,
        bracket,
      };
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue); // Ordenar por maior atraso

  // Cálculo por faixa
  const range30 = overdueItems.filter((i) => i.bracket === "30");
  const range60 = overdueItems.filter((i) => i.bracket === "60");
  const range90 = overdueItems.filter((i) => i.bracket === "90");
  const range120 = overdueItems.filter((i) => i.bracket === "120");

  const total30Amount = range30.reduce((s, i) => s + (i.amount || 0), 0);
  const total60Amount = range60.reduce((s, i) => s + (i.amount || 0), 0);
  const total90Amount = range90.reduce((s, i) => s + (i.amount || 0), 0);
  const total120Amount = range120.reduce((s, i) => s + (i.amount || 0), 0);

  const totalOverdueAmount = overdueItems.reduce((s, i) => s + (i.amount || 0), 0);

  // Filtragem para a lista detalhada
  const filteredList = overdueItems.filter((item) => {
    if (selectedRange === "all") return true;
    return item.bracket === selectedRange;
  });

  const bracketsSummary = [
    {
      id: "30" as const,
      label: "1 a 30 Dias",
      amount: total30Amount,
      count: range30.length,
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      activeBorder: "border-amber-500/80 bg-amber-500/10",
      normalBorder: "border-amber-500/25 bg-[#001D1B] hover:border-amber-500/50",
    },
    {
      id: "60" as const,
      label: "31 a 60 Dias",
      amount: total60Amount,
      count: range60.length,
      badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/30",
      activeBorder: "border-orange-500/80 bg-orange-500/10",
      normalBorder: "border-orange-500/25 bg-[#001D1B] hover:border-orange-500/50",
    },
    {
      id: "90" as const,
      label: "61 a 90 Dias",
      amount: total90Amount,
      count: range90.length,
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      activeBorder: "border-rose-500/80 bg-rose-500/10",
      normalBorder: "border-rose-500/25 bg-[#001D1B] hover:border-rose-500/50",
    },
    {
      id: "120" as const,
      label: "Acima de 90 Dias (120+)",
      amount: total120Amount,
      count: range120.length,
      badgeColor: "bg-red-500/20 text-red-400 border-red-500/40 font-bold",
      activeBorder: "border-red-500/90 bg-red-500/15",
      normalBorder: "border-red-500/30 bg-[#001D1B] hover:border-red-500/60",
    },
  ];

  return (
    <Card className="bg-card border border-border rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
      {/* Cabeçalho com Filtro Select e Resumo de Total */}
      <CardHeader className="border-b border-[#003B35] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2.5 text-base font-bold text-foreground">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          Contas a Receber em Aberto (Títulos Vencidos)
        </CardTitle>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 bg-[#001715] border border-[#00453F] px-3 py-1.5 rounded-xl text-xs">
            <Filter className="h-3.5 w-3.5 text-amber-400" />
            <select
              className="bg-transparent font-semibold text-slate-200 focus:outline-none cursor-pointer"
              value={selectedRange}
              onChange={(e: any) => setSelectedRange(e.target.value)}
            >
              <option value="all" className="bg-[#002623] text-white">
                Todos os Vencidos ({overdueItems.length})
              </option>
              <option value="30" className="bg-[#002623] text-white">
                1 a 30 Dias ({range30.length})
              </option>
              <option value="60" className="bg-[#002623] text-white">
                31 a 60 Dias ({range60.length})
              </option>
              <option value="90" className="bg-[#002623] text-white">
                61 a 90 Dias ({range90.length})
              </option>
              <option value="120" className="bg-[#002623] text-white">
                Acima de 90 Dias (120+) ({range120.length})
              </option>
            </select>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            R${" "}
            {totalOverdueAmount.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4  sm:p-6 space-y-6">
        {/* Resumo Interativo das 4 Faixas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {bracketsSummary.map((item) => {
            const isSelected = selectedRange === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedRange(isSelected ? "all" : item.id)}
                className={`text-left bg-card border rounded-xl p-3.5 transition-all duration-200 ${isSelected ? item.activeBorder : item.normalBorder
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.count} {item.count === 1 ? "título" : "títulos"}
                  </span>
                </div>

                <div className="text-lg font-extrabold text-foreground mt-1">
                  R${" "}
                  {item.amount.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </button>
            );
          })}
        </div>

        {/* Lista Detalhada dos Títulos Vencidos */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-[#003B35] pb-2">
            <h4 className="text-xs font-bold text-[#00F5A0] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Detalhamento dos Títulos Vencidos ({filteredList.length})
            </h4>
            {selectedRange !== "all" && (
              <button
                onClick={() => setSelectedRange("all")}
                className="text-[11px] text-slate-400 hover:text-white underline transition-colors"
              >
                Limpar filtro
              </button>
            )}
          </div>

          {filteredList.length === 0 ? (
            <div className="p-8 text-center bg-[#001D1B] border border-[#00453F] rounded-xl text-slate-400 text-xs space-y-1">
              <CheckCircle2 className="w-6 h-6 text-[#00F5A0] mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-200">Nenhum título vencido nesta categoria</p>
              <p>Todas as contas para o filtro selecionado estão em dia ou liquidadas.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {filteredList.map((item) => {
                let badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                if (item.bracket === "120") {
                  badgeStyle = "bg-red-500/20 text-red-400 border-red-500/40 font-bold";
                } else if (item.bracket === "90") {
                  badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/30";
                } else if (item.bracket === "60") {
                  badgeStyle = "bg-orange-500/10 text-orange-400 border-orange-500/30";
                }

                const clientName =
                  item.client?.name ||
                  item.client?.fantasy_name ||
                  (item as any).invoice?.client?.name ||
                  (item as any).client_name;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border/80 transition-all shadow-sm"
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        {clientName && (
                          <span className="text-xs font-bold text-foreground truncate">
                            {clientName}
                          </span>
                        )}
                        {item.document && (
                          <span className="text-[10px] font-mono text-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                            NFS-e:{" "}{item.document}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          Data de Emissão:{" "}
                          {formatUTCDate(item.due_date, "d 'de' MMMM 'de' yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${badgeStyle}`}>
                        {item.daysOverdue} {item.daysOverdue === 1 ? "dia" : "dias"} em atraso
                      </span>

                      <span className="text-sm font-extrabold text-foreground font-mono">
                        R${" "}
                        {(item.amount || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
