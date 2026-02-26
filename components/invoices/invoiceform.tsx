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
import { Plus, Trash2, Lock} from "lucide-react";
import { Invoice, InvoiceServiceItem } from "@/src/types/invoice";
import { Client } from "@/src/types/client";
import { Professional } from "@/src/types/professional";
import { Service } from "@/src/types/entities";
import {  OperationNature, YesNo } from "@/src/types/enums";
import { AccountsPayable } from "@/src/types/payment";
import { falseTruetoSimNao, formatDocument, operationNatures, states, toBRLDecimal, toInputDate, toYesNoEnum, yesNoToSimNao } from "@/lib/utils";
import { toast } from "sonner";

interface InvoiceFormState {
    invoice_number: string;
    issue_date: string;
    client_id: string;
    tax_retained: boolean;
    operation_nature: string;
    service_code: string;
    service_location: string;
    service_items: InvoiceServiceItem[];
    is_substitute: "sim" | "não";
    substitute_number: string;
    from_rps: "sim" | "não";
    total_amount: number;
    rps_number: string;
    rps_date: string;
    inss_percentage: number;
    irpj_percentage: number;
    csll_percentage: number;
    cofins_percentage: number;
    pis_pasep_percentage: number;
    other_retentions_percentage: number;
    tax_rate: number;
    observations: string;
    locked: boolean;
}

interface InvoiceFormProps {
    invoice?: Invoice | null; // Tipagem inicial
    clients: Client[];
    professionals: Professional[];
    services: Service[];
    onSave: (data: Partial<Invoice>) => void; // A função onSave AGORA espera o tipo InvoiceData
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
    const [isSaving, setIsSaving] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [openClientSearch, setOpenClientSearch] = useState(false);
    const [formData, setFormData] = useState<InvoiceFormState>({
        // Inicialização de estado tipada com os valores padrão ou da fatura existente
        invoice_number: invoice?.invoice_number || "",
        issue_date: invoice?.issue_date || "",
        client_id: invoice?.client_id || "",
        tax_retained: invoice?.tax_retained || false,
        operation_nature: invoice?.operation_nature || "tributacao_no_municipio",
        service_code: invoice?.service_code || "401",
        service_location: invoice?.service_location || "PE",
        service_items: (invoice?.service_items as InvoiceServiceItem[]) || [],
        is_substitute: yesNoToSimNao(invoice?.is_substitute),
        substitute_number: invoice?.substitute_number || "",
        from_rps: yesNoToSimNao(invoice?.from_rps),
        total_amount:  invoice?.total_amount || 0,
        rps_number: invoice?.rps_number || "",
        rps_date: invoice?.rps_date || "",
        // Retenções (presumindo que estão no nível raiz ou dentro de 'retentions' em 'invoice')
        inss_percentage: invoice?.retentions?.inss_percentage || 0,
        irpj_percentage: invoice?.retentions?.irpj_percentage || 1.5,
        csll_percentage: invoice?.retentions?.csll_percentage || 1,
        cofins_percentage: invoice?.retentions?.cofins_percentage || 3,
        pis_pasep_percentage: invoice?.retentions?.pis_pasep_percentage || 0.65,
        other_retentions_percentage: invoice?.retentions?.other_retentions_percentage || 0,
        tax_rate: invoice?.tax_rate || 2,
        observations: invoice?.observations || "",
        locked: invoice?.locked || false, 
    });

    const [currentService, setCurrentService] = useState<Omit<InvoiceServiceItem, 'id'>>({
        service_value: 0,
        description: "",
        professional_id: "",
        professional_name: ""
    });

    // Hook de efeito para carregar o cliente inicial ao montar o componente ou quando a fatura muda
    useEffect(() => {
        // Verifica se 'invoice' existe e se 'clients' não está vazio para evitar erros
        if (invoice && invoice.client_id && clients.length > 0) {
            // TypeScript assume que o retorno pode ser Client ou undefined
            const client = clients.find(c => c.id === invoice.client_id);
            // Usamos o operador de coerção 'as Client' ou verificamos se 'client' existe
            setSelectedClient(client || null); 
        }
    }, [invoice, clients]); // Dependências: re-executa se invoice ou clients mudar

    // --- Handlers de Mudança ---
    const handleClientChange = (clientId: string) => {
        // Busca o cliente pelo ID (string)
        const client = clients.find(c => c.id === clientId);
        setSelectedClient(client || null); // Atualiza o estado do cliente selecionado
        
        // Define as retenções conforme o tipo de documento
        if (client?.document_type === "cpf") {
            setFormData(prevData => ({
                ...prevData,
                client_id: clientId,
                inss_percentage: 0,
                irpj_percentage: 0,
                csll_percentage: 0,
                cofins_percentage: 0,
                pis_pasep_percentage: 0,
            }));
        } else {
            setFormData(prevData => ({
                ...prevData,
                client_id: clientId,
                inss_percentage: invoice?.retentions?.inss_percentage || 0,
                irpj_percentage: invoice?.retentions?.irpj_percentage || 1.5,
                csll_percentage: invoice?.retentions?.csll_percentage || 1,
                cofins_percentage: invoice?.retentions?.cofins_percentage || 3,
                pis_pasep_percentage: invoice?.retentions?.pis_pasep_percentage || 0.65,
            }));
        }
    };

    const handleServiceChange = (serviceCode: string) => {
        // Busca o serviço pelo código (convertendo o código do serviço para string se necessário)
        const service = services.find(s => s.code.toString() === serviceCode);
        
        // Atualiza o formData (código e descrição do serviço)
        setFormData(prevData => ({ 
            ...prevData, 
            service_code: serviceCode,
            service_description: service?.description || ""
        }));
    };

    const handleProfessionalChange = (professionalId: string) => {
        // Busca o profissional pelo ID (string)
        const professional = professionals.find(p => p.id === professionalId);
        
        // Atualiza o estado do item de serviço atual (currentService)
        setCurrentService(prevService => ({ 
            ...prevService, 
            professional_id: professionalId,
            professional_name: professional?.name || ""
        }));
    };

    // --- Funções de Itens de Serviço ---
    const addServiceItem = () => {
        // Protection: Garante que todos os campos obrigatórios estejam preenchidos
        if (currentService.service_value > 0 && currentService.description && currentService.professional_id) {
            
            // Cria um novo item (garantindo que currentService + id forme o tipo InvoiceServiceItem)
            const newItem: InvoiceServiceItem = {
                ...currentService,
                id: Date.now().toString() // ID temporário para lista de UI
            };
            
            // Adiciona o novo item à lista de service_items no formData
            setFormData(prevData => ({
                ...prevData,
                service_items: [...prevData.service_items, newItem]
            }));
            
            // Limpa o estado de currentService para o próximo item
            setCurrentService({ 
                service_value: 0, 
                description: "", 
                professional_id: "", 
                professional_name: "" 
            });
        }
    };

    const removeServiceItem = (id: string) => {
        // Filtra e remove o item pelo ID temporário
        setFormData(prevData => ({
            ...prevData,
            service_items: prevData.service_items.filter(item => item.id !== id)
        }));
    }

    // Funções de Cálculo usando useMemo para performance
    const getTotalServiceValue = useMemo(() => {
        return formData.service_items.reduce((total, item) => total + (item.service_value || 0), 0);
    }, [formData.service_items]);

    const calculateRetention = (percentage: number): number => {
        return (getTotalServiceValue * (percentage || 0)) / 100;
    };

    const calculateISS = useMemo(() => {
        const rate = formData.tax_rate / 100;
        return getTotalServiceValue * rate;
    }, [getTotalServiceValue, formData.tax_rate]);

    const getTotalRetentions = useMemo(() => {
        return calculateRetention(formData.inss_percentage) +
               calculateRetention(formData.irpj_percentage) +
               calculateRetention(formData.csll_percentage) +
               calculateRetention(formData.cofins_percentage) +
               calculateRetention(formData.pis_pasep_percentage) +
               calculateRetention(formData.other_retentions_percentage);
    }, [
        formData.inss_percentage, 
        formData.irpj_percentage, 
        formData.csll_percentage, 
        formData.cofins_percentage, 
        formData.pis_pasep_percentage, 
        formData.other_retentions_percentage,
        getTotalServiceValue
    ]);

    // Monta os lançamentos de contas a pagar para os profissionais 
    const accountsPayable = formData.service_items.map(item => {
        const professional = professionals.find(p => p.id === item.professional_id);
        const adminFeePercentage = professional?.admin_fee_percentage || 0;
        const adminFeeAmount = (item.service_value * adminFeePercentage) / 100;
        const netAmount = item.service_value - adminFeeAmount;

        return {
          professional_id: item.professional_id,
          document: formData.invoice_number,
          description: `Pagamento ao profissional ${item.professional_name} - NFS-e ${formData.invoice_number}`,
          gross_amount: item.service_value,
          admin_fee_percentage: adminFeePercentage,
          admin_fee_amount: adminFeeAmount,
          amount: netAmount,
          due_date: new Date(formData.issue_date).toISOString(),
          status: "pending",
        } as AccountsPayable;
    });

    // O handleSubmit usa a tipagem InvoiceData e chama onSave
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        setIsSaving(true)
        // Campos Obrigatórios
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
            setIsSaving(false)
            return;
        }

        const totalServiceValue = getTotalServiceValue;
        const totalRetentions = getTotalRetentions;
        const issAmount = calculateISS;

        let receivableAmount = (totalServiceValue || 0) - totalRetentions;
      
        // If tax is retained, subtract ISS amount from receivable
        if (formData.tax_retained) {
            receivableAmount -= (issAmount || 0);
        }

        
        const invoicePartial: Partial<Invoice> = {
            ...formData,
            is_substitute: toYesNoEnum(formData.is_substitute),
            from_rps: toYesNoEnum(formData.from_rps),
            operation_nature: formData.operation_nature as OperationNature,
            service_items: formData.service_items,
            tax_rate: formData.tax_rate,
            retentions: {
                inss_percentage: formData.inss_percentage,
                irpj_percentage: formData.irpj_percentage,
                csll_percentage: formData.csll_percentage,
                cofins_percentage: formData.cofins_percentage,
                pis_pasep_percentage: formData.pis_pasep_percentage,
                other_retentions_percentage: formData.other_retentions_percentage,
                inss: calculateRetention(formData.inss_percentage),
                irpj: calculateRetention(formData.irpj_percentage),
                csll: calculateRetention(formData.csll_percentage),
                cofins: calculateRetention(formData.cofins_percentage),
                pis_pasep: calculateRetention(formData.pis_pasep_percentage),
                other_retentions: calculateRetention(formData.other_retentions_percentage),
                invoice_id: Date.now().toString()
            },
            base_amount: totalServiceValue,
            iss_amount: issAmount,
            total_amount: totalServiceValue,
            total_retentions: totalRetentions,
            accounts_receivable:{
                description: `Recebimento da NFS-e ${formData.invoice_number}`,
                amount: receivableAmount,
                due_date: new Date(formData.issue_date).toISOString(),
                status: "pending",
                client_id: formData.client_id,
            },
            accounts_payable: accountsPayable,
        };
        

        try {
            await onSave(invoicePartial);
        } catch (err) {
            console.error(err)
        } finally {
            setIsSaving(false)
        }
    };
    

    return (
        // Substituí o 'onSubmit' no formulário para chamar a função `handleSubmit` completa
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Dados Básicos</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="invoice_number">Número do Documento *</Label>
                        <Input
                            id="invoice_number"
                            type="number"
                            value={formData.invoice_number}
                            onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="issue_date">Data de Emissão *</Label>
                        <Input
                            id="issue_date"
                            type="date"
                            value={toInputDate(formData.issue_date)}
                            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                            required
                        />
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="client" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="client">Tomador</TabsTrigger>
                    <TabsTrigger value="service">Serviço</TabsTrigger>
                    <TabsTrigger value="items">Descrição</TabsTrigger>
                    <TabsTrigger value="additional">Complementares</TabsTrigger>
                    <TabsTrigger value="summary">Resumo</TabsTrigger>
                </TabsList>

                <TabsContent value="client" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados do Tomador do Serviço</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label>Tomador do Serviço *</Label>
                                
                              {/* Gatilho */}
                              <div
                                className="border rounded-md p-2 bg-white cursor-pointer"
                                onClick={() => setOpenClientSearch(!openClientSearch)}
                              >
                                {selectedClient ? (
                                  <span>
                                    {selectedClient.name} ({formatDocument(selectedClient.document, selectedClient.document_type)})
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">Selecionar / Buscar cliente...</span>
                                )}
                              </div>
                            
                              {/* Área expandida */}
                              {openClientSearch && (
                                <div className="mt-2 border rounded-md bg-white shadow-md max-h-80 overflow-auto">
                                  <Command>
                                    <CommandInput placeholder="Buscar por nome ou documento..." />
                                    <CommandList>
                                      <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            
                                      <CommandGroup>
                                        {clients.map((client) => (
                                          <CommandItem
                                            key={client.id}
                                            onSelect={() => {
                                              handleClientChange(client.id);
                                              setSelectedClient(client);
                                              setOpenClientSearch(false);
                                            }}
                                            className="flex flex-col items-start py-2"
                                          >
                                            <span className="font-medium">{client.name}</span>
                                            <span className="text-sm text-muted-foreground">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <Label>{selectedClient.document_type.toString().toLocaleUpperCase()}</Label>
                                        <p className="text-sm font-medium">{formatDocument(selectedClient.document, selectedClient.document_type)}</p>
                                    </div>
                                    <div>
                                        <Label>Nome Fantasia</Label>
                                        <p className="text-sm">{selectedClient.fantasy_name}</p>
                                    </div>
                                    <div>
                                        <Label>Logradouro</Label>
                                        <p className="text-sm">{selectedClient.street}</p>
                                    </div>
                                    <div>
                                        <Label>Número</Label>
                                        <p className="text-sm">{selectedClient.number}</p>
                                    </div>
                                    <div>
                                        <Label>Complemento</Label>
                                        <p className="text-sm">{selectedClient.complement}</p>
                                    </div>
                                    <div>
                                        <Label>Bairro</Label>
                                        <p className="text-sm">{selectedClient.neighborhood}</p>
                                    </div>
                                    <div>
                                        <Label>Município</Label>
                                        <p className="text-sm">{selectedClient.city}</p>
                                    </div>
                                    <div>
                                        <Label>Estado</Label>
                                        <p className="text-sm">{selectedClient.state}</p>
                                    </div>
                                    {selectedClient.is_simple_national_optant && (
                                        <div>
                                            <Label>Optante do Simples Nacional</Label>
                                            <p className="text-sm">{falseTruetoSimNao(selectedClient.is_simple_national_optant)}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="service" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identificação do Serviço</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="tax_retained" 
                                    checked={formData.tax_retained}
                                    onCheckedChange={(checked) => setFormData({ ...formData, tax_retained: checked as boolean})}
                                />
                                <Label htmlFor="tax_retained">Imposto ISS Retido</Label>
                            </div>

                            <div className="space-y-2">
                                <Label>Natureza da Operação *</Label>
                                <Select
                                    value={formData.operation_nature} 
                                    required
                                    onValueChange={(value) => setFormData({ ...formData, operation_nature: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue 
                                            id="operation_nature"
                                            placeholder="Selecione a natureza"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {operationNatures.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Serviço *</Label>
                                    <Select value={formData.service_code} onValueChange={handleServiceChange} required>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Selecione o serviço..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {services.map((service) => (
                                                <SelectItem key={service.id} value={service.code.toString()}>
                                                    {service.code} - {service.description}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Localidade da Prestação *</Label>
                                    <Select value={formData.service_location} onValueChange={(value) => setFormData({ ...formData, service_location: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o estado..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {states.map((state) => (
                                                <SelectItem key={state.value} value={state.value}>
                                                    {state.value} - {state.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {currentService.description && (
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <Label>Descrição do Serviço</Label>
                                    <p className="text-sm font-medium">{currentService.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="items" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Descrição do Serviço</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Valor Total do Serviço</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={currentService.service_value}
                                            onChange={(e) => setCurrentService({ ...currentService, service_value: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Profissional</Label>
                                        <Select value={currentService.professional_id} onValueChange={handleProfessionalChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um profissional..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {professionals.map((prof) => (
                                                    <SelectItem key={prof.id} value={prof.id}>
                                                        {prof.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Discriminação</Label>
                                    <Input
                                        value={currentService.description}
                                        onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Button type="button" onClick={addServiceItem} size="sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Adicionar Serviço
                                    </Button>
                                </div>
                            </div>

                            {formData.service_items.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Serviços Adicionados</Label>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-slate-100">
                                                <tr>
                                                    <th className="text-left p-3 font-medium">Profissional</th>
                                                    <th className="text-left p-3 font-medium">Discriminação</th>
                                                    <th className="text-right p-3 font-medium">Valor</th>
                                                    <th className="text-center p-3 font-medium">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.service_items.map((item, index) => (
                                                    <tr key={item.id} className="border-t">
                                                        <td className="p-3">{item.professional_name}</td>
                                                        <td className="p-3">{item.description}</td>
                                                        {/* Corrected: Added || 0 to handle potential undefined/null values for service_value */}
                                                        <td className="p-3 text-right">R$ {(toBRLDecimal(item.service_value) || 0)}</td>
                                                        <td className="p-3 text-center">
                                                            <Button 
                                                                type="button" 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => removeServiceItem(item.id)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                <tr className="border-t bg-slate-50">
                                                    <td className="p-3 font-medium col-span-2">Total Geral:</td>
                                                    <td className="p-3 text-right font-bold">R$ {toBRLDecimal(getTotalServiceValue.toFixed(2))}</td>
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

                <TabsContent value="additional" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Complementares</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="text-base font-semibold">Esta Nota é Substituidora?</Label>
                                <RadioGroup 
                                    value={formData.is_substitute} 
                                    onValueChange={(value) => setFormData({ ...formData, is_substitute: value as "sim" | "não"})}
                                    className="mt-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="sim" id="sub_yes" />
                                        <Label htmlFor="sub_yes">Sim</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="não" id="sub_no" />
                                        <Label htmlFor="sub_no">Não</Label>
                                    </div>
                                </RadioGroup>

                                {formData.is_substitute === "sim" && (
                                    <div className="mt-3 space-y-2">
                                        <Label>Nº da Nota Substituída</Label>
                                        <Input
                                            value={formData.substitute_number}
                                            onChange={(e) => setFormData({ ...formData, substitute_number: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label className="text-base font-semibold">Esta Nota Provém de um RPS?</Label>
                                <RadioGroup 
                                    value={formData.from_rps} 
                                    onValueChange={(value) => setFormData({ ...formData, from_rps: value as "sim" | "não"  })}
                                    className="mt-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="sim" id="rps_yes" />
                                        <Label htmlFor="rps_yes">Sim</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="não" id="rps_no" />
                                        <Label htmlFor="rps_no">Não</Label>
                                    </div>
                                </RadioGroup>

                                {formData.from_rps === "sim" && (
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Número do RPS</Label>
                                            <Input
                                                value={formData.rps_number}
                                                onChange={(e) => setFormData({ ...formData, rps_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Data de Emissão do RPS</Label>
                                            <Input
                                                type="date"
                                                value={formData.rps_date}
                                                onChange={(e) => setFormData({ ...formData, rps_date: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="summary" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo Final</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label className="text-base font-semibold">Resumo das Retenções</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                                    <div className="space-y-2">
                                        <Label>INSS (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.inss_percentage}
                                            onChange={(e) => setFormData({ ...formData, inss_percentage: parseFloat(e.target.value) || 0 })}
                                        />
                                        <div className="text-sm text-slate-600">
                                            Valor: R$ {toBRLDecimal(calculateRetention(formData.inss_percentage).toFixed(2))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>IRPJ (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.irpj_percentage}
                                            onChange={(e) => setFormData({ ...formData, irpj_percentage: parseFloat(e.target.value) || 0 })}
                                        />
                                        <div className="text-sm text-slate-600">
                                            Valor: R$ {toBRLDecimal(calculateRetention(formData.irpj_percentage).toFixed(2))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CSLL (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.csll_percentage}
                                            onChange={(e) => setFormData({ ...formData, csll_percentage: parseFloat(e.target.value) || 0 })}
                                        />
                                        <div className="text-sm text-slate-600">
                                            Valor: R$ {toBRLDecimal(calculateRetention(formData.csll_percentage).toFixed(2))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>COFINS (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.cofins_percentage}
                                            onChange={(e) => setFormData({ ...formData, cofins_percentage: parseFloat(e.target.value) || 0 })}
                                        />
                                        <div className="text-sm text-slate-600">
                                            Valor: R$ {toBRLDecimal(calculateRetention(formData.cofins_percentage).toFixed(2))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>PIS/PASEP (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.pis_pasep_percentage}
                                            onChange={(e) => setFormData({ ...formData, pis_pasep_percentage: parseFloat(e.target.value) || 0 })}
                                        />
                                        <div className="text-sm text-slate-600">
                                            Valor: R$ {toBRLDecimal(calculateRetention(formData.pis_pasep_percentage).toFixed(2))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Outras Retenções (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.other_retentions_percentage}
                                            onChange={(e) => setFormData({ ...formData, other_retentions_percentage: parseFloat(e.target.value) || 0 })}
                                        />
                                        <div className="text-sm text-slate-600">
                                            Valor: R$ {toBRLDecimal(calculateRetention(formData.other_retentions_percentage).toFixed(2))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                                    <p className="font-semibold">Total das Retenções: R$ {toBRLDecimal(getTotalRetentions.toFixed(2))}</p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-base font-semibold">Resumo dos Cálculos</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                    <div className="space-y-2">
                                        <Label>Base de Cálculo do Serviço</Label>
                                        <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center font-semibold">
                                            R$ {toBRLDecimal(getTotalServiceValue.toFixed(2))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Alíquota (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.tax_rate}
                                            onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Valor do ISS</Label>
                                        <div className="h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 flex items-center font-semibold">
                                            R$ {toBRLDecimal(calculateISS.toFixed(2))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-base font-semibold">Observações</Label>
                                <Textarea
                                    className="mt-2"
                                    value={formData.observations}
                                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                    rows={4}
                                    placeholder="Observações adicionais..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
                                        
              {invoice?.locked ? (
                <Button 
                  type="button" 
                  disabled 
                  className="bg-slate-400 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Atualizar Nota Fiscal
                </Button>
              ) : (
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={isSaving}>
                  {invoice ? "Atualizar" : "Emitir"} Nota Fiscal
                </Button>
              )}
            </div>
        </form>
    );
}

