"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Bot, Receipt } from 'lucide-react';
import { AccountsReceivable } from '@/src/types/payment';
import { 
    startOfMonth, 
    startOfQuarter, 
    endOfMonth, 
    endOfQuarter, 
    isWithinInterval 
} from 'date-fns';

interface TaxInformationsProps {
  data: AccountsReceivable[];
}

export default function TaxInformations( {data}: TaxInformationsProps) {


  return (
    <Card className="shadow-sm">
        <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-red-700">
                <Receipt className="h-5 w-5" />
                 Impostos
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="flex px-4 justify-center gap-1 text-gray-400"><Bot/>Em Desenvolvimento...</div>
            
        </CardContent>
    </Card>
  )
}
