"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DollarSign, Percent, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


interface MonthlyChartProps {
  companyId: string | null;
}

interface Invoice {
  issue_date: string;
  total_amount: number;
}

interface AccountsPayable {
  due_date: string;
  admin_fee_amount: number;
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
  const [isLoading, setIsLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const loadChartData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/dashboard?companyId=${companyId}`);
        const data: { invoices: Invoice[];  payables: AccountsPayable [] } = await res.json();

        // lista de anos encontrados nas invoices
        const invoiceYears: number[] = (data.invoices ?? []).map((i) =>
          new Date(i.issue_date).getUTCFullYear()
        );

        // transformar em Set<number>, depois em array, e ordenar desc
        const years: number[] = Array.from(new Set<number>(invoiceYears)).sort(
          (a: number, b: number) => b - a
        );

        setAvailableYears(years);

        if (!selectedYear && years.length > 0) {
          setSelectedYear(years[0]); // define ano mais recente
        }

        if (selectedYear) {
          const months = [
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
          ];

          const monthlyData: ChartDataItem[] = months.map((month) => ({
            month,
            receita: 0,
            invoiceLastYear: 0,
            payable: 0,
            payableLastYear: 0 
          }));

          data.invoices.forEach((invoice) => {
            const d = new Date(invoice.issue_date);
            const year = d.getUTCFullYear();
            const monthIndex = d.getUTCMonth();

            if (year === selectedYear) {
              monthlyData[monthIndex].receita += invoice.total_amount || 0;
            } else if (year === selectedYear - 1) {
              monthlyData[monthIndex].invoiceLastYear +=
                invoice.total_amount || 0;
            }
          });

          data.payables.forEach((payables) => {
            const d = new Date(payables.due_date);
            const year = d.getUTCFullYear();
            const monthIndex = d.getUTCMonth();

            if (year === selectedYear) {
              monthlyData[monthIndex].payable += payables.admin_fee_amount || 0;
            } else if (year === selectedYear - 1) {
              monthlyData[monthIndex].payableLastYear +=
                payables.admin_fee_amount || 0;
            }
          });

          setChartData(monthlyData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do gráfico:", error);
      }
      setIsLoading(false);
    };

    loadChartData();
  }, [companyId, selectedYear]);

  return (
    <div className="flex flex-col gap-4">
      {/*Invoice Data*/}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <DollarSign className="h-5 w-5" />
            Receita Mensal
          </CardTitle>

          {availableYears.length > 0 && (
            <select
              className="border rounded px-3 py-1 text-sm"
              value={selectedYear ?? ""}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                formatter={(value, name) => [
                  `R$ ${Number(value).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`,
                  name,
                ]}
                labelStyle={{ color: "#1e293b" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="receita"
                fill="#1f4379ff"
                name={`Receita ${selectedYear}`}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="invoiceLastYear"
                fill="#88aceaff"
                name={`Receita ${selectedYear ? selectedYear - 1 : ""}`}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/*Payable Data*/}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Percent className="h-5 w-5" />
            Taxa Administrativa Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                formatter={(value, name) => [
                  `R$ ${Number(value).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`,
                  name,
                ]}
                labelStyle={{ color: "#1e293b" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="payable"
                fill="#3fb8af"
                name={`Taxa Admin ${selectedYear}`}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="payableLastYear"
                fill="#bac4c4"
                name={`Taxa Admin ${selectedYear ? selectedYear - 1 : ""}`}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
