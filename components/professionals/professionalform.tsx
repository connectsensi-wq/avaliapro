"use client";

import React, { useState, useEffect } from "react";
import { Professional } from "@/src/types/professional";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Specialty, State } from "@/lib/generated/prisma";
import { addressTypes, formatCpf, formatPhone, pixKeyTypes, states } from "@/lib/utils";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";

interface ProfessionalFormProps {
  professional?: Professional | null;
  specialties: Specialty[];
  onSave: (data: Partial<Professional>) => void;
  onCancel: () => void;
}

export default function ProfessionalForm({ professional, specialties, onSave, onCancel }: ProfessionalFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [formData, setFormData] = useState<Partial<Professional>>({
    code: professional?.code || "",
    name: professional?.name || "",
    cpf: professional?.cpf || "",
    registration_number: professional?.registration_number || "",
    specialtyId: professional?.specialtyId || "",
    phone: professional?.phone || "",
    birthday: professional?.birthday ? professional.birthday.slice(0, 10) : "",
    email: professional?.email || "",
    bank: professional?.bank || "",
    agency: professional?.agency || "",
    account: professional?.account || "",
    account_type: professional?.account_type || null,
    pix_key_type: professional?.pix_key_type || null,
    pix_key: professional?.pix_key || "",
    address_type: professional?.address_type || null,
    street: professional?.street || "",
    cep: professional?.cep || "",
    number: professional?.number || "",
    complement: professional?.complement || "",
    neighborhood: professional?.neighborhood || "",
    city: professional?.city || "",
    state: professional?.state || null,
    admin_fee_percentage: professional?.admin_fee_percentage || 0,
    status: professional?.status || "active",
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    const requiredFields = [
      "code",
      "name",
      "cpf",
      "specialtyId",
      "registration_number",
      "phone",
      "email",
      "birthday",
      "address_type",
      "street",
      "number",
      "neighborhood",
      "city",
      "cep",
      "state",
      "admin_fee_percentage",
    ];

    const emptyField = requiredFields.find(
      (field) => !formData[field as keyof Partial<Professional>]
    );

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
    if (professional) {
      setFormData((prev) => ({
        ...prev,
        ...professional,
        birthday: professional.birthday ? professional.birthday.slice(0, 10) : "",
      }));
    }
  }, [professional]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-foreground">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-input border border-border p-1 rounded-xl">
          <TabsTrigger
            value="basic"
            className="text-xs font-semibold text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-primary rounded-lg transition-all"
          >
            Dados Pessoais
          </TabsTrigger>
          <TabsTrigger
            value="address"
            className="text-xs font-semibold text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-primary rounded-lg transition-all"
          >
            Endereço
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="text-xs font-semibold text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-primary rounded-lg transition-all"
          >
            Dados Financeiros
          </TabsTrigger>
        </TabsList>

        {/* Dados Pessoais */}
        <TabsContent value="basic" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Informações Principais</CardTitle>
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
                    disabled={!!professional?.code}
                    className="bg-input border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5 col-span-3">
                  <Label className="text-xs font-medium text-muted-foreground">Nome Completo *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="bg-input border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">CPF *</Label>
                  <Input
                    value={formatCpf(formData.cpf || "")}
                    onChange={(e) => handleChange("cpf", e.target.value.replace(/\D/g, "").slice(0, 11))}
                    required
                    disabled={!!professional?.cpf}
                    className="bg-input border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Especialidade *</Label>
                  <Select value={formData.specialtyId?.toString() || ""} onValueChange={(v) => handleChange("specialtyId", v)} required>
                    <SelectTrigger className="bg-input border-border text-foreground rounded-xl text-sm">
                      <SelectValue placeholder="Selecione uma especialidade..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="focus:bg-accent focus:text-accent-foreground">
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Registro Profissional *</Label>
                  <Input
                    value={formData.registration_number || ""}
                    onChange={(e) => handleChange("registration_number", e.target.value)}
                    required
                    className="bg-input border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Telefone *</Label>
                  <Input
                    value={formatPhone(formData.phone || "")}
                    onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                    required
                    className="bg-input border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Data de Nascimento *</Label>
                  <Input
                    type="date"
                    value={formData.birthday || ""}
                    onChange={(e) => handleChange("birthday", e.target.value)}
                    required
                    className="bg-input border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">E-mail *</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  className="bg-input border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endereço */}
        <TabsContent value="address" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Endereço Residencial</CardTitle>
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
                    className="bg-input border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleSearchCep}
                    disabled={isSearchingCep}
                    className="bg-secondary hover:bg-secondary/80 text-primary border border-primary/30 rounded-xl px-4 text-xs font-semibold shrink-0 transition-all"
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
                <Select value={formData.address_type?.toString() || ""} onValueChange={(v) => handleChange("address_type", v)} required>
                  <SelectTrigger className="bg-input border-border text-foreground rounded-xl text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {addressTypes.map((a) => (
                      <SelectItem key={a.value} value={a.value} className="focus:bg-accent focus:text-accent-foreground">
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
                  className="bg-input border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Número *</Label>
                <Input
                  value={formData.number || ""}
                  onChange={(e) => handleChange("number", e.target.value)}
                  required
                  className="bg-input border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Complemento</Label>
                <Input
                  value={formData.complement || ""}
                  onChange={(e) => handleChange("complement", e.target.value)}
                  className="bg-input border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Bairro *</Label>
                <Input
                  value={formData.neighborhood || ""}
                  onChange={(e) => handleChange("neighborhood", e.target.value)}
                  required
                  className="bg-input border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Cidade *</Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                  className="bg-input border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Estado *</Label>
                <Select value={formData.state?.toString() || ""} onValueChange={(v) => handleChange("state", v)} required>
                  <SelectTrigger className="bg-input border-border text-foreground rounded-xl text-sm">
                    <SelectValue placeholder="Selecione um estado..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {states.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="focus:bg-accent focus:text-accent-foreground">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dados Financeiros */}
        <TabsContent value="financial" className="space-y-4 pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Conta Bancária</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Banco</Label>
                <Input
                  value={formData.bank || ""}
                  onChange={(e) => handleChange("bank", e.target.value)}
                  className="bg-input border-border text-foreground rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Agência</Label>
                <Input
                  value={formData.agency || ""}
                  onChange={(e) => handleChange("agency", e.target.value)}
                  className="bg-input border-border text-foreground rounded-xl text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Conta</Label>
                <Input
                  value={formData.account || ""}
                  onChange={(e) => handleChange("account", e.target.value)}
                  className="bg-input border-border text-foreground rounded-xl text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Tipo de Conta</Label>
                <Select value={formData.account_type || undefined} onValueChange={(v) => handleChange("account_type", v)}>
                  <SelectTrigger className="bg-input border-border text-foreground rounded-xl text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="corrente" className="focus:bg-accent focus:text-accent-foreground">Corrente</SelectItem>
                    <SelectItem value="poupanca" className="focus:bg-accent focus:text-accent-foreground">Poupança</SelectItem>
                    <SelectItem value="pagamento" className="focus:bg-accent focus:text-accent-foreground">Pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Dados PIX</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs font-medium text-muted-foreground">Tipo de Chave PIX</Label>
                <Select value={formData.pix_key_type || undefined} onValueChange={(v) => handleChange("pix_key_type", v)}>
                  <SelectTrigger className="bg-input border-border text-foreground rounded-xl text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    {pixKeyTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="focus:bg-accent focus:text-accent-foreground">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Chave PIX</Label>
                <Input
                  value={formData.pix_key || ""}
                  onChange={(e) => handleChange("pix_key", e.target.value)}
                  className="bg-input border-border text-foreground rounded-xl text-sm font-mono"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Taxa Administrativa (%) *</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.admin_fee_percentage}
                onChange={(e) => handleChange("admin_fee_percentage", parseFloat(e.target.value) || 0)}
                required
                className="bg-input border-border text-foreground rounded-xl text-sm font-bold text-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select value={formData.status || "active"} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="bg-input border-border text-foreground rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="active" className="focus:bg-accent focus:text-accent-foreground">Ativo</SelectItem>
                  <SelectItem value="inactive" className="focus:bg-accent focus:text-accent-foreground">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 rounded-xl text-xs shadow-md border-none"
        >
          {isSaving ? "Salvando..." : professional?.id ? "Atualizar" : "Criar"} Profissional
        </Button>
      </div>
    </form>
  );
}
