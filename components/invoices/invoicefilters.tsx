"use client";

import { InvoiceStatus } from "@/src/types/enums";
import { FC, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { RotateCcw, Search } from "lucide-react";

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
        <CardTitle className="text-lg">Filtros de Busca</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="invoice_number">Número da Nota</Label>
            <Input
              id="invoice_number"
              placeholder="Ex: 001"
              value={filters.invoice_number}
              onChange={(e) => handleInputChange('invoice_number', e.target.value)}
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="client_name">Nome do Cliente</Label>
            <Input
              id="client_name"
              placeholder="Digite o nome..."
              value={filters.client_name}
              onChange={(e) => handleInputChange('client_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Data Inicial</Label>
            <Input
              id="start_date"
              type="date"
              value={filters.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Data Final</Label>
            <Input
              id="end_date"
              type="date"
              value={filters.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_amount">Valor Total</Label>
            <Input
              id="total_amount"
              type="number"
              value={filters.total_amount}
              onChange={(e) => handleInputChange('total_amount', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
            
              value={filters.status} 
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
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

        <div className="flex gap-3 justify-end">
          <Button onClick={handleSearch} className="bg-slate-900 hover:bg-slate-800">
            <Search className="w-4 h-4 mr-2" />
            Pesquisar
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceFilters;
