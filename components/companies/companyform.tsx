"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company } from "@/src/types/company";
import { AddressType, DocumentType, State, Status } from "@/src/types/enums";
import { addressTypes, states } from "@/lib/utils";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";

interface CompanyFormProps {
  company?: Company | null;
  onSave: (data: Partial<Company>) => void;
  onCancel: () => void;
}

export default function CompanyForm({ company, onSave, onCancel }: CompanyFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [formData, setFormData] = useState<Partial<Company>>({
    code: company?.code || "",
    document: company?.document || "",
    document_type: company?.document_type as DocumentType,
    name: company?.name || "",
    fantasy_name: company?.fantasy_name || "",
    address_type: company?.address_type as AddressType,
    street: company?.street || "",
    number: company?.number || "",
    complement: company?.complement || "",
    neighborhood: company?.neighborhood || "",
    city: company?.city || "",
    state: company?.state || undefined,
    cep: company?.cep || "",
    ddd: company?.ddd || "",
    phone: company?.phone || "",
    email: company?.email || "",
    state_registration: company?.state_registration || "",
    municipal_registration: company?.municipal_registration || "",
    constitution_date: (company?.constitution_date as Date) || new Date(),
    status: (company?.status as Status) || ("active" as Status),
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchCep = async () => {
    const cleanCep = (formData.cep || "").replace(/\D/g, "");
    if (!cleanCep || cleanCep.length !== 8) {
      toast.error("Por favor, digite um CEP válido com 8 dígitos.");
      return;
    }

    setIsSearchingCep(true);
    try {
      const res = await fetch(`/api/viacep?cep=${cleanCep}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao consultar CEP.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        street: data.street || prev.street,
        neighborhood: data.neighborhood || prev.neighborhood,
        city: data.city || prev.city,
        state: (data.state as State) || prev.state,
        complement: data.complement || prev.complement,
      }));

      toast.success("Endereço preenchido automaticamente com sucesso!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao consultar serviço ViaCEP.");
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const requiredFields = ["code", "document", "name", "street", "number", "neighborhood", "city", "cep"];
    const emptyField = requiredFields.find((f) => !formData[f as keyof Partial<Company>]);

    if (emptyField) {
      toast.error("Por favor, preencha todos os campos obrigatórios (*)");
      setIsSaving(false);
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (company) {
      setFormData({ ...company });
    }
  }, [company]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-foreground">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border p-1 rounded-xl">
          <TabsTrigger value="basic" className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg">
            Dados Principais
          </TabsTrigger>
          <TabsTrigger value="address" className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg">
            Endereço Sede
          </TabsTrigger>
          <TabsTrigger value="contact" className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg">
            Contato & Fiscal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Identificação da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs font-medium text-muted-foreground">Código *</Label>
                  <Input
                    type="number"
                    value={formData.code || ""}
                    onChange={(e) => handleChange("code", e.target.value)}
                    required
                    disabled={!!company?.code}
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs font-medium text-muted-foreground">Tipo de Documento</Label>
                  <Select
                    value={formData.document_type?.toString() || "cnpj"}
                    onValueChange={(v) => handleChange("document_type", v as DocumentType)}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      <SelectItem value="cnpj" className="focus:bg-primary focus:text-white text-xs">CNPJ</SelectItem>
                      <SelectItem value="cpf" className="focus:bg-primary focus:text-white text-xs">CPF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-medium text-muted-foreground">CNPJ/CPF *</Label>
                  <Input
                    value={formData.document || ""}
                    onChange={(e) => handleChange("document", e.target.value.replace(/\D/g, ""))}
                    required
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Razão Social *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Nome Fantasia</Label>
                <Input
                  value={formData.fantasy_name || ""}
                  onChange={(e) => handleChange("fantasy_name", e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Endereço Registrado</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">CEP *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="00000-000"
                    value={formData.cep || ""}
                    onChange={(e) => handleChange("cep", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchCep();
                      }
                    }}
                    required
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSearchCep}
                    disabled={isSearchingCep}
                    className="bg-secondary hover:bg-cyan-800 text-primary hover:text-white border border-primary/30 rounded-xl px-4 text-xs font-semibold shrink-0 transition-all"
                  >
                    {isSearchingCep ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-primary" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5 mr-1.5 text-primary" />
                        Buscar CEP
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Tipo de Endereço *</Label>
                <Select value={formData.address_type?.toString() || "rua"} onValueChange={(v) => handleChange("address_type", v as AddressType)}>
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {addressTypes.map((a) => (
                      <SelectItem key={a.value} value={a.value} className="focus:bg-primary focus:text-white text-xs">
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Logradouro *</Label>
                <Input
                  value={formData.street || ""}
                  onChange={(e) => handleChange("street", e.target.value)}
                  required
                  className="bg-background border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Número *</Label>
                <Input
                  value={formData.number || ""}
                  onChange={(e) => handleChange("number", e.target.value)}
                  required
                  className="bg-background border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Complemento</Label>
                <Input
                  value={formData.complement || ""}
                  onChange={(e) => handleChange("complement", e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Bairro *</Label>
                <Input
                  value={formData.neighborhood || ""}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  required
                  className="bg-background border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Cidade *</Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                  className="bg-background border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Estado (UF) *</Label>
                <Select value={formData.state?.toString() || undefined} onValueChange={(v) => handleChange("state", v as State)}>
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                    <SelectValue placeholder="Selecione um estado..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {states.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="focus:bg-primary focus:text-white text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Contato & Fiscal</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">E-mail Comercial</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl text-sm"
                />
              </div>
              <div className="flex flex-row gap-2">
                <div className="space-y-1.5 max-w-[80px]">
                  <Label className="text-xs font-medium text-muted-foreground">DDD</Label>
                  <Input
                    value={formData.ddd || ""}
                    onChange={(e) => handleChange("ddd", e.target.value)}
                    className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5 w-full">
                  <Label className="text-xs font-medium text-muted-foreground">Telefone</Label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Inscrição Estadual</Label>
                <Input
                  value={formData.state_registration || ""}
                  onChange={(e) => handleChange("state_registration", e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Inscrição Municipal</Label>
                <Input
                  value={formData.municipal_registration || ""}
                  onChange={(e) => handleChange("municipal_registration", e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                />
              </div>

              <div className="max-w-[170px]">
                <Label className="text-xs font-medium text-muted-foreground">Data de Constituição</Label>
                <Input
                  type="date"
                  value={new Date(formData.constitution_date as Date).toISOString().split("T")[0] || ""}
                  onChange={(e) => handleChange("constitution_date", new Date(e.target.value))}
                  className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                <Select value={formData.status?.toString() || "active"} onValueChange={(v) => handleChange("status", v as Status)}>
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    <SelectItem value="active" className="focus:bg-primary focus:text-white text-xs">Ativo</SelectItem>
                    <SelectItem value="inactive" className="focus:bg-primary focus:text-white text-xs">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-secondary hover:bg-secondary/80 text-foreground border-border rounded-xl text-xs font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-sidebar-primary hover:bg-cyan-800 text-primary-foreground hover:text-white font-bold px-6 rounded-xl text-xs shadow-md border-none"
        >
          {isSaving ? "Salvando..." : company?.id ? "Atualizar" : "Criar"} Empresa
        </Button>
      </div>
    </form>
  );
}
