"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "../ui/command";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Textarea } from "../ui/textarea";
import { Plus, Trash2, Lock, Search, FileText, UserCheck, Calculator } from "lucide-react";
import { Invoice, InvoiceServiceItem } from "@/src/types/invoice";
import { Client } from "@/src/types/client";
import { Professional } from "@/src/types/professional";
import { Service } from "@/src/types/entities";
import { OperationNature, YesNo } from "@/src/types/enums";
import { AccountsPayable } from "@/src/types/payment";
import { falseTruetoSimNao, formatDocument, operationNatures, round2, states, toBRLDecimal, toInputDate, toYesNoEnum, yesNoToSimNao } from "@/lib/utils";
import { toast } from "sonner";

interface InvoiceFormState {
  invoice_number: string;
  issue_date: string;
  client_id: string;
  tax_retained: boolean;
  operation_nature: string;
  service_code: string;
  service_location: string;
  is_substitute: "sim" | "não";
  substitute_number: string;
  from_rps: "sim" | "não";
  total_amount: number;
  rps_number: string;
  rps_date: string;
  tax_rate: number;
  observations: string;
  locked: boolean;
}

interface InvoiceFormProps {
  invoice?: Invoice | null;
  clients: Client[];
  professionals: Professional[];
  services: Service[];
  onSave: (data: Partial<Invoice>) => void;
  onCancel: () => void;
}

const operationNatureMap: Record<string, OperationNature> = {
  "Imune": "imune",
  "Isento": "isento",
  "Tributação no município": "tributacao_no_municipio",
  "Tributação fora do município": "tributacao_fora_do_municipio",
  "Exigibilidade suspensa por decisão judicial": "exigibilidade_suspensa_judicial",
  "Exigibilidade suspensa por procedimento administrativo": "exigibilidade_suspensa_administrativa"
};

export default function InvoiceForm({ invoice, clients, professionals, services, onSave, onCancel }: InvoiceFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openClientSearch, setOpenClientSearch] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormState>({
    invoice_number: invoice?.invoice_number || "",
    issue_date: invoice?.issue_date
      ? new Date(invoice.issue_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    client_id: invoice?.client_id || "",
    tax_retained: invoice?.tax_retained || false,
    operation_nature: invoice?.operation_nature || "tributacao_no_municipio",
    service_code: invoice?.service_code || "401",
    service_location: invoice?.service_location || "PE",
    is_substitute: yesNoToSimNao(invoice?.is_substitute),
    substitute_number: invoice?.substitute_number || "",
    from_rps: yesNoToSimNao(invoice?.from_rps),
    total_amount: invoice?.total_amount || 0,
    rps_number: invoice?.rps_number || "",
    rps_date: invoice?.rps_date || "",
    tax_rate: invoice?.tax_rate || 2,
    observations: invoice?.observations || "",
    locked: invoice?.locked || false,
  });

  const [serviceItems, setServiceItems] = useState<InvoiceServiceItem[]>(
    (invoice?.service_items as InvoiceServiceItem[]) || []
  );

  const [retentions, setRetentions] = useState({
    inss_percentage: invoice?.retentions?.inss_percentage ?? 0,
    irpj_percentage: invoice?.retentions?.irpj_percentage ?? 1.5,
    csll_percentage: invoice?.retentions?.csll_percentage ?? 1,
    cofins_percentage: invoice?.retentions?.cofins_percentage ?? 3,
    pis_pasep_percentage: invoice?.retentions?.pis_pasep_percentage ?? 0.65,
    other_retentions_percentage: invoice?.retentions?.other_retentions_percentage ?? 4.65,
  });

  const [currentService, setCurrentService] = useState<Omit<InvoiceServiceItem, 'id'>>({
    service_value: 0,
    description: "",
    professional_id: "",
    professional_name: ""
  });

  useEffect(() => {
    if (invoice && invoice.client_id && clients.length > 0) {
      const client = clients.find(c => c.id === invoice.client_id);
      setSelectedClient(client || null);
    }
  }, [invoice, clients]);

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);

    setFormData(prev => ({
      ...prev,
      client_id: clientId
    }));

    if (client?.document_type === "cpf" || client?.is_simple_national_optant) {
      setRetentions({
        inss_percentage: 0,
        irpj_percentage: 0,
        csll_percentage: 0,
        cofins_percentage: 0,
        pis_pasep_percentage: 0,
        other_retentions_percentage: 0,
      });
    } else {
      setRetentions({
        inss_percentage: invoice?.retentions?.inss_percentage ?? 0,
        irpj_percentage: invoice?.retentions?.irpj_percentage ?? 1.5,
        csll_percentage: invoice?.retentions?.csll_percentage ?? 1,
        cofins_percentage: invoice?.retentions?.cofins_percentage ?? 3,
        pis_pasep_percentage: invoice?.retentions?.pis_pasep_percentage ?? 0.65,
        other_retentions_percentage: invoice?.retentions?.other_retentions_percentage ?? 4.65,
      });
    }
  };

  const handleServiceChange = (serviceCode: string) => {
    const service = services.find(s => s.code.toString() === serviceCode);
    setFormData(prevData => ({
      ...prevData,
      service_code: serviceCode,
    }));
  };

  const handleProfessionalChange = (professionalId: string) => {
    const professional = professionals.find(p => p.id === professionalId);
    setCurrentService(prevService => ({
      ...prevService,
      professional_id: professionalId,
      professional_name: professional?.name || ""
    }));
  };

  const addServiceItem = () => {
    if (currentService.service_value > 0 && currentService.description && currentService.professional_id) {
      const newItem: InvoiceServiceItem = {
        ...currentService,
        id: Date.now().toString()
      };
      setServiceItems(prev => [...prev, newItem]);
      setCurrentService({
        service_value: 0,
        description: "",
        professional_id: "",
        professional_name: ""
      });
    } else {
      toast.error("Preencha o valor, profissional e discriminação para adicionar o serviço.");
    }
  };

  const removeServiceItem = (id: string) => {
    setServiceItems(prev => prev.filter(item => item.id !== id));
  };

  const totalServiceValue = useMemo(() => {
    return round2(serviceItems.reduce((total, item) => total + round2(item.service_value || 0), 0));
  }, [serviceItems]);

  const calculateRetention = (percentage: number): number => {
    return round2((totalServiceValue * (percentage || 0)) / 100);
  };

  const issAmount = useMemo(() => {
    const rate = formData.tax_rate / 100;
    return round2(totalServiceValue * rate);
  }, [totalServiceValue, formData.tax_rate]);

  const totalRetentions = useMemo(() => {
    return round2(
      calculateRetention(retentions.inss_percentage) +
      calculateRetention(retentions.irpj_percentage) +
      calculateRetention(retentions.csll_percentage) +
      calculateRetention(retentions.cofins_percentage) +
      calculateRetention(retentions.pis_pasep_percentage)
    );
  }, [retentions, totalServiceValue]);

  const accountsPayable = serviceItems.map(item => {
    const professional = professionals.find(p => p.id === item.professional_id);
    const adminFeePercentage = professional?.admin_fee_percentage || 0;
    const adminFeeAmount = round2((item.service_value * adminFeePercentage) / 100);
    const netAmount = round2(item.service_value - adminFeeAmount);

    return {
      professional_id: item.professional_id,
      document: formData.invoice_number,
      description: item.description,
      gross_amount: round2(item.service_value),
      admin_fee_percentage: round2(adminFeePercentage),
      admin_fee_amount: adminFeeAmount,
      amount: round2(netAmount),
      due_date: new Date(formData.issue_date).toISOString(),
      status: "pending",
    } as AccountsPayable;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const requiredFields = [
      "invoice_number",
      "issue_date",
      "operation_nature",
      "service_code",
      "service_location",
    ];

    const emptyField = requiredFields.find(
      (field) => !formData[field as keyof typeof formData]
    );

    if (emptyField) {
      toast.error("Preencha todos os campos obrigatórios antes de salvar.");
      setIsSaving(false);
      return;
    }

    let receivableAmount = round2((totalServiceValue || 0) - totalRetentions);

    if (formData.tax_retained) {
      receivableAmount -= (issAmount || 0);
    }

    const invoicePartial: Partial<Invoice> = {
      ...formData,
      is_substitute: toYesNoEnum(formData.is_substitute),
      from_rps: toYesNoEnum(formData.from_rps),
      operation_nature: formData.operation_nature as OperationNature,
      service_items: serviceItems,
      tax_rate: formData.tax_rate,
      retentions: {
        ...retentions,
        inss: round2(calculateRetention(retentions.inss_percentage)),
        irpj: round2(calculateRetention(retentions.irpj_percentage)),
        csll: round2(calculateRetention(retentions.csll_percentage)),
        cofins: round2(calculateRetention(retentions.cofins_percentage)),
        pis_pasep: round2(calculateRetention(retentions.pis_pasep_percentage)),
        other_retentions: round2(calculateRetention(retentions.other_retentions_percentage)),
      },
      base_amount: round2(totalServiceValue),
      iss_amount: round2(issAmount),
      total_amount: round2(totalServiceValue),
      total_retentions: round2(totalRetentions),
      accounts_receivable: {
        description: `Recebimento da NFS-e ${formData.invoice_number}`,
        amount: round2(receivableAmount),
        due_date: new Date(formData.issue_date).toISOString(),
        status: "pending",
        client_id: formData.client_id,
      },
      accounts_payable: accountsPayable,
    };

    try {
      await onSave(invoicePartial);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-sans text-foreground">
      {/* Card Dados Básicos */}
      <Card className="bg-card border-border rounded-xl shadow-inner">
        <CardHeader className="pb-2 border-b border-border">
          <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Dados Básicos da NFS-e
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="invoice_number" className="text-xs font-medium text-muted-foreground">
              Número do Documento *
            </Label>
            <Input
              id="invoice_number"
              type="number"
              value={formData.invoice_number}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              required
              placeholder="Ex: 1042"
              className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="issue_date" className="text-xs font-medium text-muted-foreground">
              Data de Emissão *
            </Label>
            <Input
              id="issue_date"
              type="date"
              value={toInputDate(formData.issue_date)}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              required
              className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Navegação por Abas */}
      <Tabs defaultValue="client" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-background border border-border p-1 rounded-xl">
          <TabsTrigger
            value="client"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-primary rounded-lg"
          >
            Tomador
          </TabsTrigger>
          <TabsTrigger
            value="service"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-primary rounded-lg"
          >
            Serviço
          </TabsTrigger>
          <TabsTrigger
            value="items"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-primary rounded-lg"
          >
            Descrição
          </TabsTrigger>
          <TabsTrigger
            value="additional"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-primary rounded-lg"
          >
            Complementares
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-primary rounded-lg"
          >
            Resumo
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Tomador */}
        <TabsContent value="client" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">
                Dados do Tomador do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Tomador do Serviço *</Label>

                <div
                  className="border border-border rounded-xl p-3 bg-background text-foreground text-sm cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-between"
                  onClick={() => setOpenClientSearch(!openClientSearch)}
                >
                  {selectedClient ? (
                    <span className="font-semibold text-foreground">
                      {selectedClient.name}{" "}
                      <span className="font-mono text-xs text-primary ml-1">
                        ({formatDocument(selectedClient.document, selectedClient.document_type)})
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Selecionar / Buscar cliente...</span>
                  )}
                  <Search className="w-4 h-4 text-primary shrink-0" />
                </div>

                {openClientSearch && (
                  <div className="mt-2 border border-border rounded-xl bg-popover text-popover-foreground shadow-2xl max-h-80 overflow-auto">
                    <Command className="bg-popover text-popover-foreground">
                      <CommandInput placeholder="Buscar por nome ou documento..." className="text-sm" />
                      <CommandList>
                        <CommandEmpty className="p-4 text-xs text-muted-foreground text-center">
                          Nenhum cliente encontrado.
                        </CommandEmpty>

                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              onSelect={() => {
                                handleClientChange(client.id);
                                setSelectedClient(client);
                                setOpenClientSearch(false);
                              }}
                              className="flex flex-col items-start py-2.5 px-3 hover:bg-secondary cursor-pointer border-b border-border/50 last:border-b-0"
                            >
                              <span className="font-semibold text-foreground text-sm">{client.name}</span>
                              <span className="text-xs font-mono text-primary">
                                {formatDocument(client.document, client.document_type)}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>

              {selectedClient && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-secondary/40 border border-border rounded-xl text-xs text-muted-foreground">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      {selectedClient.document_type?.toString().toUpperCase()}
                    </Label>
                    <p className="text-sm font-semibold font-mono text-foreground">
                      {formatDocument(selectedClient.document, selectedClient.document_type)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Nome Fantasia</Label>
                    <p className="text-sm font-semibold text-foreground">{selectedClient.fantasy_name || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Logradouro</Label>
                    <p className="text-sm font-medium text-foreground">{selectedClient.street || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Número</Label>
                    <p className="text-sm font-medium text-foreground">{selectedClient.number || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Complemento</Label>
                    <p className="text-sm font-medium text-foreground">{selectedClient.complement || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Bairro</Label>
                    <p className="text-sm font-medium text-foreground">{selectedClient.neighborhood || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Município</Label>
                    <p className="text-sm font-medium text-foreground">{selectedClient.city || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Estado</Label>
                    <p className="text-sm font-medium text-foreground">{selectedClient.state || "-"}</p>
                  </div>
                  {selectedClient.is_simple_national_optant && (
                    <div className="md:col-span-2">
                      <Label className="text-[11px] text-muted-foreground">Optante do Simples Nacional</Label>
                      <p className="text-sm font-semibold text-primary">
                        {falseTruetoSimNao(selectedClient.is_simple_national_optant)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Serviço */}
        <TabsContent value="service" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">
                Identificação do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center space-x-2.5 bg-secondary/40 p-3 rounded-xl border border-border">
                <Checkbox
                  id="tax_retained"
                  checked={formData.tax_retained}
                  onCheckedChange={(checked) => setFormData({ ...formData, tax_retained: checked as boolean })}
                  className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-border"
                />
                <Label htmlFor="tax_retained" className="text-xs font-semibold text-foreground cursor-pointer">
                  Imposto ISS Retido na Fonte
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Natureza da Operação *</Label>
                <Select
                  value={formData.operation_nature}
                  required
                  onValueChange={(value) => setFormData({ ...formData, operation_nature: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                    <SelectValue id="operation_nature" placeholder="Selecione a natureza" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground rounded-xl">
                    {operationNatures.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="focus:bg-accent focus:text-accent-foreground text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Tipo de Serviço *</Label>
                  <Select value={formData.service_code} onValueChange={handleServiceChange} required>
                    <SelectTrigger className="w-full bg-background border-border text-foreground rounded-xl text-sm">
                      <SelectValue placeholder="Selecione o serviço..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground rounded-xl">
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.code.toString()} className="focus:bg-accent focus:text-accent-foreground text-xs">
                          {service.code} - {service.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Localidade da Prestação *</Label>
                  <Select
                    value={formData.service_location}
                    onValueChange={(value) => setFormData({ ...formData, service_location: value })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                      <SelectValue placeholder="Selecione o estado..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground rounded-xl">
                      {states.map((state) => (
                        <SelectItem key={state.value} value={state.value} className="focus:bg-accent focus:text-accent-foreground text-xs">
                          {state.value} - {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {currentService.description && (
                <div className="p-3 bg-secondary/40 border border-border rounded-xl">
                  <Label className="text-[11px] text-muted-foreground">Descrição do Serviço</Label>
                  <p className="text-sm font-semibold text-foreground">{currentService.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Descrição de Serviços / Profissionais */}
        <TabsContent value="items" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">
                Discriminação de Serviços & Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-4 p-4 border border-border rounded-xl bg-secondary/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Valor do Serviço *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={currentService.service_value || ""}
                      onChange={(e) =>
                        setCurrentService({
                          ...currentService,
                          service_value: round2(parseFloat(e.target.value) || 0),
                        })
                      }
                      placeholder="0,00"
                      className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Profissional Médico *</Label>
                    <Select value={currentService.professional_id} onValueChange={handleProfessionalChange}>
                      <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                        <SelectValue placeholder="Selecione um profissional..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground rounded-xl">
                        {professionals.map((prof) => (
                          <SelectItem key={prof.id} value={prof.id} className="focus:bg-accent focus:text-accent-foreground text-xs">
                            {prof.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Discriminação / Descrição *</Label>
                  <Input
                    value={currentService.description}
                    onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
                    placeholder="Ex: Plantão Médico UTI Neonatal 12h..."
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={addServiceItem}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 rounded-xl text-xs shadow-sm border-none"
                  >
                    <Plus className="w-4 h-4 mr-1.5 stroke-[3]" />
                    Adicionar Serviço
                  </Button>
                </div>
              </div>

              {serviceItems.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-wider">
                    Serviços Adicionados ({serviceItems.length})
                  </Label>
                  <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-secondary text-primary font-bold uppercase tracking-wider border-b border-border">
                        <tr>
                          <th className="text-left p-3">Profissional</th>
                          <th className="text-left p-3">Discriminação</th>
                          <th className="text-right p-3">Valor</th>
                          <th className="text-center p-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {serviceItems.map((item) => (
                          <tr key={item.id} className="hover:bg-secondary/40 transition-colors">
                            <td className="p-3 font-semibold text-foreground">{item.professional_name}</td>
                            <td className="p-3 text-muted-foreground">{item.description}</td>
                            <td className="p-3 text-right font-mono font-bold text-primary">
                              R$ {toBRLDecimal(item.service_value) || "0,00"}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeServiceItem(item.id)}
                                className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 h-7 w-7 p-0 rounded-lg"
                                title="Remover item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-secondary/80 font-bold border-t border-border">
                          <td colSpan={2} className="p-3 text-foreground">Total Geral:</td>
                          <td className="p-3 text-right text-primary font-mono text-sm">
                            R$ {toBRLDecimal(totalServiceValue.toFixed(2))}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Dados Complementares */}
        <TabsContent value="additional" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">
                Dados Complementares & RPS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div className="space-y-3 bg-secondary/40 p-4 rounded-xl border border-border">
                <Label className="text-xs font-bold text-foreground">Esta Nota é Substituidora?</Label>
                <RadioGroup
                  value={formData.is_substitute}
                  onValueChange={(value) => setFormData({ ...formData, is_substitute: value as "sim" | "não" })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="sub_yes" className="border-border text-primary" />
                    <Label htmlFor="sub_yes" className="text-xs text-foreground cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="não" id="sub_no" className="border-border text-primary" />
                    <Label htmlFor="sub_no" className="text-xs text-foreground cursor-pointer">Não</Label>
                  </div>
                </RadioGroup>

                {formData.is_substitute === "sim" && (
                  <div className="pt-2 space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Nº da Nota Substituída</Label>
                    <Input
                      value={formData.substitute_number}
                      onChange={(e) => setFormData({ ...formData, substitute_number: e.target.value })}
                      placeholder="Ex: 1041"
                      className="bg-background border-border text-foreground rounded-xl text-sm font-mono max-w-xs"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 bg-secondary/40 p-4 rounded-xl border border-border">
                <Label className="text-xs font-bold text-foreground">Esta Nota Provém de um RPS?</Label>
                <RadioGroup
                  value={formData.from_rps}
                  onValueChange={(value) => setFormData({ ...formData, from_rps: value as "sim" | "não" })}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="rps_yes" className="border-border text-primary" />
                    <Label htmlFor="rps_yes" className="text-xs text-foreground cursor-pointer">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="não" id="rps_no" className="border-border text-primary" />
                    <Label htmlFor="rps_no" className="text-xs text-foreground cursor-pointer">Não</Label>
                  </div>
                </RadioGroup>

                {formData.from_rps === "sim" && (
                  <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Número do RPS</Label>
                      <Input
                        value={formData.rps_number}
                        onChange={(e) => setFormData({ ...formData, rps_number: e.target.value })}
                        className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Data de Emissão do RPS</Label>
                      <Input
                        type="date"
                        value={formData.rps_date}
                        onChange={(e) => setFormData({ ...formData, rps_date: e.target.value })}
                        className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Resumo & Retenções */}
        <TabsContent value="summary" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> Resumo Final & Retenções Tributárias
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-bold text-primary uppercase tracking-wider">
                  Alíquotas de Retenção na Fonte (%)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">INSS (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={retentions.inss_percentage}
                      onChange={(e) =>
                        setRetentions((prev) => ({
                          ...prev,
                          inss_percentage: round2(parseFloat(e.target.value) || 0),
                        }))
                      }
                      className="bg-background border-border text-foreground rounded-xl text-xs font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      R$ {toBRLDecimal(calculateRetention(retentions.inss_percentage).toFixed(2))}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">IRPJ (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={retentions.irpj_percentage}
                      onChange={(e) =>
                        setRetentions((prev) => ({
                          ...prev,
                          irpj_percentage: round2(parseFloat(e.target.value) || 0),
                        }))
                      }
                      className="bg-background border-border text-foreground rounded-xl text-xs font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      R$ {toBRLDecimal(calculateRetention(retentions.irpj_percentage).toFixed(2))}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">CSLL (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={retentions.csll_percentage}
                      onChange={(e) =>
                        setRetentions((prev) => ({
                          ...prev,
                          csll_percentage: round2(parseFloat(e.target.value) || 0),
                        }))
                      }
                      className="bg-background border-border text-foreground rounded-xl text-xs font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      R$ {toBRLDecimal(calculateRetention(retentions.csll_percentage).toFixed(2))}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">COFINS (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={retentions.cofins_percentage}
                      onChange={(e) =>
                        setRetentions((prev) => ({
                          ...prev,
                          cofins_percentage: round2(parseFloat(e.target.value) || 0),
                        }))
                      }
                      className="bg-background border-border text-foreground rounded-xl text-xs font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      R$ {toBRLDecimal(calculateRetention(retentions.cofins_percentage).toFixed(2))}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">PIS/PASEP (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={retentions.pis_pasep_percentage}
                      onChange={(e) =>
                        setRetentions((prev) => ({
                          ...prev,
                          pis_pasep_percentage: round2(parseFloat(e.target.value) || 0),
                        }))
                      }
                      className="bg-background border-border text-foreground rounded-xl text-xs font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      R$ {toBRLDecimal(calculateRetention(retentions.pis_pasep_percentage).toFixed(2))}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">PIS/COFINS/CSLL (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={retentions.other_retentions_percentage}
                      onChange={(e) =>
                        setRetentions((prev) => ({
                          ...prev,
                          other_retentions_percentage: round2(parseFloat(e.target.value) || 0),
                        }))
                      }
                      className="bg-background border-border text-foreground rounded-xl text-xs font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      R$ {toBRLDecimal(calculateRetention(retentions.other_retentions_percentage).toFixed(2))}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-secondary/80 border border-border rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Total das Retenções:</span>
                  <span className="text-sm font-extrabold text-amber-400 font-mono">
                    R$ {toBRLDecimal(totalRetentions.toFixed(2))}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-xs font-bold text-primary uppercase tracking-wider">
                  Resumo dos Cálculos Impostos
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Base de Cálculo do Serviço</Label>
                    <div className="h-10 px-3 py-2 border border-border rounded-xl bg-background flex items-center font-mono font-bold text-primary text-sm">
                      R$ {toBRLDecimal(totalServiceValue.toFixed(2))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Alíquota ISS (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tax_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, tax_rate: round2(parseFloat(e.target.value) || 0) })
                      }
                      className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Valor do ISS</Label>
                    <div className="h-10 px-3 py-2 border border-border rounded-xl bg-background flex items-center font-mono font-bold text-primary text-sm">
                      R$ {toBRLDecimal(issAmount.toFixed(2))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-medium text-muted-foreground">Observações da NFS-e</Label>
                <Textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={3}
                  placeholder="Observações adicionais para a nota fiscal..."
                  className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-secondary hover:bg-secondary/80 text-foreground border-border rounded-xl text-xs font-semibold"
        >
          Cancelar
        </Button>

        {invoice?.locked ? (
          <Button
            type="button"
            disabled
            className="bg-muted text-muted-foreground border border-border rounded-xl text-xs font-semibold cursor-not-allowed"
          >
            <Lock className="w-4 h-4 mr-2" />
            Atualizar Nota Fiscal
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 rounded-xl text-xs shadow-md border-none"
          >
            {isSaving ? "Salvando..." : invoice ? "Atualizar" : "Emitir"} Nota Fiscal
          </Button>
        )}
      </div>
    </form>
  );
}
