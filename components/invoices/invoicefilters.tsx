"use client";

import { InvoiceStatus } from "@/src/types/enums";
import { FC, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { RotateCcw, Search } from "lucide-react";
import { Input } from "../ui/input";

export interface InvoiceFiltersData {
  invoice_number: string;
  client_name: string;
  start_date: string;
  end_date: string;
  status: InvoiceStatus;
  total_amount: number;
}

interface InvoiceFiltersProps {
  onFilter: (filters: InvoiceFiltersData) => void;
}

const InvoiceFilters: FC<InvoiceFiltersProps> = ({ onFilter }) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [filters, setFilters] = useState<InvoiceFiltersData>({
    invoice_number: "",
    client_name: "",
    start_date: formatDate(firstDayOfMonth),
    end_date: formatDate(today),
    status: "" as InvoiceStatus,
    total_amount: 0
  });

  // Aplica automaticamente o filtro na montagem
  useEffect(() => {
    onFilter(filters);
  }, []); // executa apenas uma vez ao montar

  const handleInputChange = (field: keyof InvoiceFiltersData, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: field === "total_amount" ? Number(value) : value
    }));
  };

  const handleSearch = () => {
    onFilter(filters);
  };

  const handleClear = () => {
    const clearedFilters: InvoiceFiltersData = {
      invoice_number: "",
      client_name: "",
      start_date: "",
      end_date: "",
      status: "" as InvoiceStatus,
      total_amount: 0
    };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Filtros de Busca</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 
      Grid responsivo ajustado:
      - Mobile (default): 1 coluna (empilhado)
      - Tablet (sm / md): 2 a 3 colunas balanceadas
      - Desktop (lg): 6 colunas para encaixar perfeitamente todos os campos por linha
    */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">

          {/* Número da Nota (Ocupa 1 coluna no desktop, 1 no mobile/tablet) */}
          <div className="space-y-2 lg:col-span-1">
            <Label htmlFor="invoice_number" className="text-muted-foreground text-xs font-medium">Número da Nota</Label>
            <Input
              id="invoice_number"
              placeholder="Ex: 001"
              value={filters.invoice_number}
              onChange={(e) => handleInputChange('invoice_number', e.target.value)}
              className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono w-full"
            />
          </div>

          {/* Nome do Cliente (Ganha mais destaque, ocupando 2 colunas no desktop) */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="client_name" className="text-muted-foreground text-xs font-medium">Nome do Cliente</Label>
            <Input
              id="client_name"
              placeholder="Digite o nome..."
              value={filters.client_name}
              onChange={(e) => handleInputChange('client_name', e.target.value)}
              className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono w-full"
            />
          </div>

          {/* Data Inicial */}
          <div className="space-y-2 lg:col-span-1 sm:col-span-1">
            <Label htmlFor="start_date" className="text-muted-foreground text-xs font-medium">Data Inicial</Label>
            <Input
              id="start_date"
              type="date"
              value={filters.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono w-full"
            />
          </div>

          {/* Data Final */}
          <div className="space-y-2 lg:col-span-1 sm:col-span-1">
            <Label htmlFor="end_date" className="text-muted-foreground text-xs font-medium">Data Final</Label>
            <Input
              id="end_date"
              type="date"
              value={filters.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono w-full"
            />
          </div>

          {/* Valor Total */}
          <div className="space-y-2 lg:col-span-1 sm:col-span-1">
            <Label htmlFor="total_amount" className="text-muted-foreground text-xs font-medium">Valor Total</Label>
            <Input
              id="total_amount"
              type="number"
              value={filters.total_amount}
              onChange={(e) => handleInputChange('total_amount', e.target.value)}
              className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono w-full"
            />
          </div>

          {/* Status (Ocupa 2 colunas no tablet/desktop para acomodar textos longos como "Pendente de Cancelamento") */}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="status" className="text-muted-foreground text-xs font-medium">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm w-full">
                <SelectValue placeholder="Selecione o status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="pendente_de_cancelamento">Pendente de Cancelamento</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Botões de Ação: Empilhados no mobile para melhor usabilidade de toque, alinhados à direita no tablet/desktop */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2 border-t border-border/40">
          <Button
            variant="outline"
            onClick={handleClear}
            className="w-full sm:w-auto bg-slate-800 hover:bg-cyan-800 text-white hover:text-white rounded-xl"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar Filtros
          </Button>
          <Button
            variant="outline"
            onClick={handleSearch}
            className="w-full sm:w-auto bg-primary/80 hover:bg-primary hover:text-white rounded-xl"
          >
            <Search className="w-4 h-4 mr-2" />
            Pesquisar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceFilters;
