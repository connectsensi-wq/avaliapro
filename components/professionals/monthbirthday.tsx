"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cake, User, Calendar, Sparkles } from "lucide-react";
import { Professional } from "@/src/types/professional";

interface BirthdayProps {
  data: Professional[];
}

export default function MonthBirthday({ data }: BirthdayProps) {
  const now = new Date();
  const currentMonth = now.getUTCMonth();
  const currentDay = now.getUTCDate();

  const currentMonthName = now.toLocaleString("pt-BR", { month: "long" });
  const capitalizedMonth =
    currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // Filtra aniversariantes do mês atual e ordena pelo dia
  const birthdayList = (data || [])
    .filter((p) => {
      if (!p.birthday) return false;
      const bDate = new Date(p.birthday);
      return bDate.getUTCMonth() === currentMonth;
    })
    .sort((a, b) => {
      const dayA = new Date(a.birthday!).getUTCDate();
      const dayB = new Date(b.birthday!).getUTCDate();
      return dayA - dayB;
    });

  return (
    <Card className="bg-white border-none p-4 rounded-2xl shadow-md overflow-hidden flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-slate-300 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                Aniversariantes do Mês
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {capitalizedMonth} de {now.getFullYear()}
              </p>
            </div>
          </div>

          <Badge
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${birthdayList.length > 0
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-secondary text-muted-foreground border-border"
              }`}
          >
            {birthdayList.length}{" "}
            {birthdayList.length === 1 ? "aniversariante" : "aniversariantes"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col justify-center">
        {birthdayList.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Nenhum aniversariante cadastrado para {capitalizedMonth}.
            </p>
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {birthdayList.map((p) => {
              const bDate = new Date(p.birthday!);
              const birthDay = bDate.getUTCDate();
              const isToday = birthDay === currentDay;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${isToday
                    ? "bg-primary/10 border-primary/40 shadow-sm"
                    : "bg-secondary/40 hover:bg-secondary/70 border-border/60"
                    }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${isToday
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-primary border-border"
                        }`}
                    >
                      {p.name ? (
                        p.name.charAt(0).toUpperCase()
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate">
                          {p.name}
                        </span>
                        {isToday && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-primary text-primary-foreground">
                            <Sparkles className="w-3 h-3" /> Hoje!
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.specialty?.name || "Especialidade não informada"}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-primary bg-background px-2.5 py-1 rounded-lg border border-border shrink-0 ml-2">
                    {bDate.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
