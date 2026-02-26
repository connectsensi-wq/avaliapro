"use client";

import React from "react";

import { FileText, Building } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Invoice } from "@/src/types/invoice";
import { Client } from "@/src/types/client";
import { Professional } from "@/src/types/professional";
import { Service } from "@/src/types/entities";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface InvoiceDetailsProps {
  invoice: Invoice;
  clients: Client[];
  professionals: Professional[];
  services: Service[];
}

export default function InvoiceDetails({ invoice, clients, professionals, services }: InvoiceDetailsProps) {
  const client = clients.find((c) => c.id === invoice.client_id);
  const service = services.find((s) => s.code.toString() === invoice.service_code);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      Regular: { label: "Regular", color: "bg-green-100 text-green-800" },
      Cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800" },
      "Pendente de Cancelamento": { label: "Pendente de Cancelamento", color: "bg-yellow-100 text-yellow-800" },
    };
    return configs[status] || { label: status, color: "bg-gray-100 text-gray-800" };
  };

  const statusConfig = getStatusConfig(invoice.status);

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">

        {/* --- HEADER --- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">NF {invoice.invoice_number}</h2>
              <p className="text-slate-500">
                Emissão: {format(new Date(invoice.issue_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
        </div>  

        {/* --- CLIENTE --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Dados do Tomador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client ? (
              <>
                <p>
                  <strong>Nome:</strong> {client.name}
                </p>
                <p>
                  <strong>Documento:</strong> {client.document}
                </p>
                <p>
                  <strong>Endereço:</strong> {client.street}, {client.number}
                </p>
                <p>
                  <strong>Cidade:</strong> {client.city}/{client.state}
                </p>
              </>
            ) : (
              <p className="text-slate-500">Cliente não encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Serviço */}
        <Card>
            <CardHeader>
                <CardTitle>Identificação do Serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p><strong>Código:</strong> {invoice.service_code}</p>
                {service && <p><strong>Descrição:</strong> {service.description}</p>}
                <p><strong>Natureza da Operação:</strong> {invoice.operation_nature}</p>
                <p><strong>Localidade da Prestação:</strong> {invoice.service_location}</p>
                <p><strong>Imposto Retido:</strong> {invoice.tax_retained ? 'Sim' : 'Não'}</p>
            </CardContent>
        </Card>

        {/* Serviços Detalhados */}
        {invoice.service_items && invoice.service_items.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Descrição dos Serviços</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {invoice.service_items.map((item, index) => (
                            <div key={index} className="p-3 border rounded-lg bg-slate-50">
                                <p><strong>Discriminação:</strong> {item.description}</p>
                                <p><strong>Profissional:</strong> {item.professional_name}</p>
                                <p><strong>Valor:</strong> R$ {(item.service_value || 0).toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Dados Complementares */}
        <Card>
            <CardHeader>
                <CardTitle>Dados Complementares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p><strong>Nota Substituidora:</strong> {invoice.is_substitute ? 'Sim' : 'Não'}</p>
                {invoice.substitute_number && (
                    <p><strong>Nº da Nota Substituída:</strong> {invoice.substitute_number}</p>
                )}
                <p><strong>Provém de RPS:</strong> {invoice.from_rps ? 'Sim' : 'Não'}</p>
                {invoice.rps_number && (
                    <p><strong>Número do RPS:</strong> {invoice.rps_number}</p>
                )}
                {invoice.rps_date && (
                    <p><strong>Data do RPS:</strong> {format(new Date(invoice.rps_date), "d/MM/yyyy", { locale: ptBR })}</p>
                )}
            </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card>
            <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Retenções */}
                {invoice.retentions && (
                    <div>
                        <h4 className="font-semibold mb-2">Retenções</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <p>INSS: {invoice.retentions.inss_percentage}% = R$ {(invoice.retentions.inss || 0).toFixed(2)}</p>
                            <p>IRPJ: {invoice.retentions.irpj_percentage}% = R$ {(invoice.retentions.irpj || 0).toFixed(2)}</p>
                            <p>CSLL: {invoice.retentions.csll_percentage}% = R$ {(invoice.retentions.csll || 0).toFixed(2)}</p>
                            <p>COFINS: {invoice.retentions.cofins_percentage}% = R$ {(invoice.retentions.cofins || 0).toFixed(2)}</p>
                            <p>PIS/PASEP: {invoice.retentions.pis_pasep_percentage}% = R$ {(invoice.retentions.pis_pasep || 0).toFixed(2)}</p>
                            <p>Outras: {invoice.retentions.other_retentions_percentage}% = R$ {(invoice.retentions.other_retentions || 0).toFixed(2)}</p>
                        </div>
                    </div>
                )}
                
                {/* Cálculos */}
                <div className="border-t pt-3">
                    <h4 className="font-semibold mb-2">Cálculos</h4>
                    <div className="space-y-1">
                        <p><strong>Base de Cálculo:</strong> R$ {(invoice.base_amount || 0).toFixed(2)}</p>
                        <p><strong>Alíquota ISS:</strong> {invoice.tax_rate}%</p>
                        <p><strong>Valor do ISS:</strong> R$ {(invoice.iss_amount || 0).toFixed(2)}</p>
                        <p className="text-lg font-bold"><strong>Valor Total:</strong> R$ {(invoice.total_amount || 0).toFixed(2)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Observações */}
        {invoice.observations && (
            <Card>
                <CardHeader>
                    <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">{invoice.observations}</p>
                </CardContent>
            </Card>
        )}{/* --- Aqui segue o restante do código exatamente como você já fez (Serviços, Retenções, Resumo Financeiro, etc.) --- */}
    </div>
  );
}