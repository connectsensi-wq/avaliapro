"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Cake, User } from 'lucide-react';
import { Professional } from '@/src/types/professional';

interface BirthdayProps {
  data: Professional[];
}

export default function MonthBirthday({ data }: BirthdayProps) {
  return (
    <Card className="bg-[#002623] border border-[#00453F] rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
      <CardHeader className="border-b border-[#003B35] pb-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2.5 text-base font-bold text-white">
          <div className="p-2 rounded-lg bg-[#00F5A0]/10 border border-[#00F5A0]/20 text-[#00F5A0]">
            <Cake className="h-5 w-5" />
          </div>
          Aniversariantes do Mês
        </CardTitle>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/20">
          {data.length}
        </span>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-[#003B35]">
        {data.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            Nenhum aniversariante cadastrado para este mês.
          </div>
        ) : (
          data.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3 px-5 hover:bg-[#00302C]/60 transition-colors duration-150">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-[#001715] border border-[#00453F] flex items-center justify-center text-[#00F5A0] font-bold text-xs shrink-0">
                  {p.name ? p.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </div>
                <span className="text-xs font-medium text-slate-200 truncate">{p.name}</span>
              </div>
              <span className="text-[11px] font-mono text-[#00F5A0] bg-[#001715] px-2.5 py-1 rounded-lg border border-[#00453F] shrink-0">
                {new Date(p.birthday!).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  timeZone: "UTC",
                })}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

