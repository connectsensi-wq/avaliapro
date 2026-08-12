"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  ShieldCheck,
  FileKey,
  AlertTriangle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Professional } from "@/src/types/professional";
import { formatCpf } from "@/lib/utils";

interface ExpiringCertificatesProps {
  data: Professional[];
}

export default function ExpiringCertificates({ data }: ExpiringCertificatesProps) {
  const now = new Date();

  // Filtra profissionais com certificado válido que vencem em até 30 dias (ou já expiraram)
  const expiringList = (data || [])
    .filter((p) => {
      if (!p.certificate_valid_to) return false;
      const validTo = new Date(p.certificate_valid_to);
      const diffDays = Math.ceil(
        (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays <= 30;
    })
    .sort((a, b) => {
      const dateA = new Date(a.certificate_valid_to!).getTime();
      const dateB = new Date(b.certificate_valid_to!).getTime();
      return dateA - dateB;
    });

  const hasUrgent = expiringList.some((p) => {
    const diff = Math.ceil(
      (new Date(p.certificate_valid_to!).getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24)
    );
    return diff <= 7;
  });

  return (
    <Card className="bg-white border-none rounded-2xl p-4 shadow-md overflow-hidden flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-slate-300 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${hasUrgent
                ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                Certificados a Vencer
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Vencimento em até 30 dias
              </p>
            </div>
          </div>

          <Badge
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${expiringList.length > 0
              ? hasUrgent
                ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                : "bg-amber-500/10 text-amber-500 border-amber-500/30"
              : "bg-secondary text-muted-foreground border-border"
              }`}
          >
            {expiringList.length}{" "}
            {expiringList.length === 1 ? "alerta" : "alertas"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col justify-center">
        {expiringList.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Todos os certificados digitais estão em dia.
            </p>
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {expiringList.map((p) => {
              const validTo = new Date(p.certificate_valid_to!);
              const diffDays = Math.ceil(
                (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              const isExpired = diffDays < 0;
              const isToday = diffDays === 0;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${isExpired
                    ? "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/30"
                    : isToday
                      ? "bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/40"
                      : "bg-secondary/40 hover:bg-secondary/70 border-border/60"
                    }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${isExpired
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : isToday || diffDays <= 7
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-secondary text-primary border-border"
                        }`}
                    >
                      <FileKey className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-background border border-border text-muted-foreground shrink-0">
                          {p.certificate_type || "A1"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        CPF: {formatCpf(p.cpf) || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" /> Expirado
                      </span>
                    ) : isToday ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        <AlertCircle className="w-3 h-3" /> Vence Hoje
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${diffDays <= 7
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}
                      >
                        <AlertCircle className="w-3 h-3" /> Em {diffDays}d
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {validTo.toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
