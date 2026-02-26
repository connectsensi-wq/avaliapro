"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Cake } from 'lucide-react';
import { Professional } from '@/src/types/professional';
import { formatDate } from '@/lib/utils';

interface BirthdayProps {
  data: Professional[];
}

export default function MonthBirthday( {data}: BirthdayProps) {

  return (
    <Card className="shadow-sm">
        <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-blue-500">
                <Cake className="h-5 w-5" />
                 Aniversariantes do Mês
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.map((p) => (
            <div key={p.id} className="flex justify-between text-sm gap-2 py-2 px-4 border-b">
              <span className="h-10 overflow-hidden text-ellipsis">{p.name}</span>
              <span className="text-gray-500">{new Date(p.birthday!).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit", 
                year: 'numeric',
                timeZone: "UTC", // ⬅️ força a leitura como UTC
              })}</span>
            </div>
          ))}            
        </CardContent>
    </Card>
  )
}
