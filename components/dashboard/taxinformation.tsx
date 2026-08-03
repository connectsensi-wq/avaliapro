"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Bot, Receipt } from 'lucide-react';
import { AccountsReceivable } from '@/src/types/payment';

interface TaxInformationsProps {
  data: AccountsReceivable[];
}

export default function TaxInformations({ data }: TaxInformationsProps) {
  return (
    <Card className="bg-[#002623] border border-[#00453F] rounded-2xl shadow-lg shadow-black/20 overflow-hidden">
      <CardHeader className="border-b border-[#003B35] pb-4">
        <CardTitle className="flex items-center gap-2.5 text-base font-bold text-white">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Receipt className="h-5 w-5" />
          </div>
          Retenções & Impostos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
          <div className="p-3 rounded-full bg-[#001715] border border-[#00453F] text-[#00F5A0]">
            <Bot className="h-6 w-6 text-[#00F5A0]" />
          </div>
          <p className="text-sm font-semibold text-slate-200">Módulo Fiscal em Processamento</p>
          <p className="text-xs text-slate-400 max-w-xs">Cálculo automatizado de retenções de impostos para a empresa selecionada.</p>
        </div>
      </CardContent>
    </Card>
  );
}

