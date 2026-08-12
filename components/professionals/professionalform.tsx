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
import {
  Search,
  Loader2,
  ShieldCheck,
  FileCheck,
  Trash2,
  RefreshCw,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileKey,
  Calendar,
  Building2,
  Hash,
  UserCheck,
} from "lucide-react";

interface ProfessionalFormProps {
  professional?: Professional | null;
  specialties: Specialty[];
  existingProfessionals?: Professional[];
  onSave: (data: Partial<Professional>) => void;
  onCancel: () => void;
}

export default function ProfessionalForm({
  professional,
  specialties,
  existingProfessionals = [],
  onSave,
  onCancel,
}: ProfessionalFormProps) {
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

    // 🔹 Certificado Digital
    certificate_type: professional?.certificate_type || null,
    certificate_subject: professional?.certificate_subject || null,
    certificate_cpf: professional?.certificate_cpf || null,
    certificate_issuer: professional?.certificate_issuer || null,
    certificate_serial_number: professional?.certificate_serial_number || null,
    certificate_valid_from: professional?.certificate_valid_from || null,
    certificate_valid_to: professional?.certificate_valid_to || null,
  });

  // 🔹 Estados locais para upload e validação de certificado
  const [selectedCertType, setSelectedCertType] = useState<"A1" | "A3">("A1");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState("");
  const [showCertPassword, setShowCertPassword] = useState(false);
  const [isValidatingCert, setIsValidatingCert] = useState(false);
  const [isReplacingCert, setIsReplacingCert] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleValidateCertificate = async () => {
    const cleanCpf = (formData.cpf || "").replace(/\D/g, "");
    if (!cleanCpf) {
      toast.error("Por favor, preencha o CPF na aba 'Dados Pessoais' antes de validar o certificado.");
      return;
    }

    if (!certFile) {
      toast.error("Por favor, selecione o arquivo do certificado.");
      return;
    }

    if (selectedCertType === "A1" && !certPassword) {
      toast.error("Por favor, informe a senha do certificado A1 (.pfx/.p12).");
      return;
    }

    setIsValidatingCert(true);
    try {
      const fd = new FormData();
      fd.append("file", certFile);
      fd.append("password", certPassword);
      fd.append("professionalCpf", cleanCpf);
      fd.append("certificateType", selectedCertType);

      const res = await fetch("/api/professionals/validate-certificate", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao validar certificado.");
      }

      setFormData((prev) => ({
        ...prev,
        certificate_type: data.data.certificate_type,
        certificate_subject: data.data.certificate_subject,
        certificate_cpf: data.data.certificate_cpf,
        certificate_issuer: data.data.certificate_issuer,
        certificate_serial_number: data.data.certificate_serial_number,
        certificate_valid_from: data.data.certificate_valid_from,
        certificate_valid_to: data.data.certificate_valid_to,
      }));

      setCertFile(null);
      setCertPassword("");
      setIsReplacingCert(false);

      toast.success("Certificado digital validado e vinculado com sucesso!");
      if (data.data.isExpired) {
        toast.warning("Atenção: Este certificado digital já se encontra expirado.");
      }
    } catch (error: any) {
      console.error("Erro na validação do certificado:", error);
      toast.error(error.message || "Falha na validação do certificado.");
    } finally {
      setIsValidatingCert(false);
    }
  };

  const handleRemoveCertificate = () => {
    setFormData((prev) => ({
      ...prev,
      certificate_type: null,
      certificate_subject: null,
      certificate_cpf: null,
      certificate_issuer: null,
      certificate_serial_number: null,
      certificate_valid_from: null,
      certificate_valid_to: null,
    }));
    setCertFile(null);
    setCertPassword("");
    setIsReplacingCert(false);
    toast.success("Certificado digital removido.");
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

  const cleanTypedCpf = (formData.cpf || "").replace(/\D/g, "");
  const existingCpfMatch =
    !professional?.id && cleanTypedCpf.length === 11
      ? existingProfessionals.find(
          (p) => (p.cpf || "").replace(/\D/g, "") === cleanTypedCpf
        )
      : null;

  const existingEmailMatch =
    !professional?.id &&
    formData.email &&
    formData.email.includes("@") &&
    !existingCpfMatch
      ? existingProfessionals.find(
          (p) =>
            p.email?.toLowerCase().trim() ===
            formData.email?.toLowerCase().trim()
        )
      : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-foreground">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-card border border-border p-1 rounded-xl gap-1">
          <TabsTrigger
            value="basic"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg transition-all"
          >
            Dados Pessoais
          </TabsTrigger>
          <TabsTrigger
            value="address"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg transition-all"
          >
            Endereço
          </TabsTrigger>
          <TabsTrigger
            value="financial"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg transition-all"
          >
            Dados Financeiros
          </TabsTrigger>
          <TabsTrigger
            value="certificate"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Certificado Digital</span>
            {formData.certificate_valid_to && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
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
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5 col-span-3">
                  <Label className="text-xs font-medium text-muted-foreground">Nome Completo *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-semibold"
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
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                  {existingCpfMatch && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs mt-1.5">
                      <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-sky-300">
                          Profissional já cadastrado:{" "}
                        </span>
                        <span className="text-foreground font-medium">
                          {existingCpfMatch.name}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Este novo registro será vinculado ao mesmo login do profissional no sistema.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Especialidade *</Label>
                  <Select value={formData.specialtyId?.toString() || ""} onValueChange={(v) => handleChange("specialtyId", v)} required>
                    <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
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
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Telefone *</Label>
                  <Input
                    value={formatPhone(formData.phone || "")}
                    onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                    required
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Data de Nascimento *</Label>
                  <Input
                    type="date"
                    value={formData.birthday || ""}
                    onChange={(e) => handleChange("birthday", e.target.value)}
                    required
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
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
                  className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
                />
                {existingEmailMatch && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs mt-1.5">
                    <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-sky-300">
                        E-mail já cadastrado:{" "}
                      </span>
                      <span className="text-foreground font-medium">
                        {existingEmailMatch.name}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        O novo cadastro reutilizará a conta de login existente deste profissional.
                      </p>
                    </div>
                  </div>
                )}
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
                <Select value={formData.address_type?.toString() || ""} onValueChange={(v) => handleChange("address_type", v)} required>
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
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
                <Label className="text-xs font-medium text-muted-foreground">Estado *</Label>
                <Select value={formData.state?.toString() || ""} onValueChange={(v) => handleChange("state", v)} required>
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
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
                  className="bg-background border-border text-foreground rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Agência</Label>
                <Input
                  value={formData.agency || ""}
                  onChange={(e) => handleChange("agency", e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Conta</Label>
                <Input
                  value={formData.account || ""}
                  onChange={(e) => handleChange("account", e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Tipo de Conta</Label>
                <Select value={formData.account_type || undefined} onValueChange={(v) => handleChange("account_type", v)}>
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
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
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
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
                  className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
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
                className="bg-background border-border text-foreground rounded-xl text-sm font-bold text-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select value={formData.status || "active"} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
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

        {/* Certificado Digital */}
        <TabsContent value="certificate" className="space-y-4 pt-2">
          {formData.certificate_valid_to && !isReplacingCert ? (
            /* Visualização do Certificado Cadastrado */
            <Card className="bg-card border-border rounded-xl shadow-inner overflow-hidden">
              <CardHeader className="pb-3 border-b border-border bg-secondary/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Certificado Digital Vinculado
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground">
                        Padrão ICP-Brasil validado com o cadastro
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Tipo {formData.certificate_type || "A1"}
                    </span>
                    {new Date() > new Date(formData.certificate_valid_to) ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/30">
                        <AlertTriangle className="w-3 h-3" /> Expirado
                      </span>
                    ) : Math.ceil(
                      (new Date(formData.certificate_valid_to).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                    ) <= 30 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        <AlertCircle className="w-3 h-3" /> Expira em{" "}
                        {Math.ceil(
                          (new Date(formData.certificate_valid_to).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                        )}{" "}
                        dias
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Válido
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-secondary/40 p-3 rounded-xl border border-border">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-primary" /> Titular do Certificado
                    </Label>
                    <p className="text-xs font-bold text-foreground truncate">
                      {formData.certificate_subject || "Não informado"}
                    </p>
                  </div>

                  <div className="space-y-1 bg-secondary/40 p-3 rounded-xl border border-border">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-primary" /> CPF do Titular
                    </Label>
                    <p className="text-xs font-mono font-bold text-foreground flex items-center justify-between">
                      <span>{formatCpf(formData.certificate_cpf || "") || "Não informado"}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                        ✓ CPF Conferido
                      </span>
                    </p>
                  </div>

                  <div className="space-y-1 bg-secondary/40 p-3 rounded-xl border border-border">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-primary" /> Autoridade Emissora (AC)
                    </Label>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {formData.certificate_issuer || "Autoridade Certificadora"}
                    </p>
                  </div>

                  <div className="space-y-1 bg-secondary/40 p-3 rounded-xl border border-border">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-primary" /> Número de Série
                    </Label>
                    <p className="text-xs font-mono text-muted-foreground truncate" title={formData.certificate_serial_number || ""}>
                      {formData.certificate_serial_number || "N/A"}
                    </p>
                  </div>

                  <div className="space-y-1 bg-secondary/40 p-3 rounded-xl border border-border md:col-span-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> Período de Vigência / Validade
                    </Label>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {formData.certificate_valid_from
                          ? new Date(formData.certificate_valid_from).toLocaleDateString("pt-BR")
                          : "N/A"}{" "}
                        até{" "}
                        {formData.certificate_valid_to
                          ? new Date(formData.certificate_valid_to).toLocaleDateString("pt-BR")
                          : "N/A"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formData.certificate_valid_to &&
                          (new Date() > new Date(formData.certificate_valid_to)
                            ? "Certificado expirado"
                            : `${Math.ceil(
                              (new Date(formData.certificate_valid_to).getTime() - Date.now()) /
                              (1000 * 60 * 60 * 24)
                            )} dias restantes`)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsReplacingCert(true)}
                    className="bg-secondary hover:bg-secondary/80 text-foreground border-border rounded-xl text-xs font-semibold gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-primary" />
                    Substituir Certificado
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveCertificate}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30 rounded-xl text-xs font-semibold gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir Certificado
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Formulário de Upload e Validação de Certificado */
            <Card className="bg-card border-border rounded-xl shadow-inner">
              <CardHeader className="pb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">
                      Registrar Certificado Digital (A1 / A3)
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Anexe o certificado para validação automática com o CPF do profissional
                    </p>
                  </div>
                  {isReplacingCert && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsReplacingCert(false);
                        setCertFile(null);
                        setCertPassword("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground h-7"
                    >
                      Cancelar Substituição
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Nota informativa de segurança */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground flex items-start gap-2.5">
                  <FileKey className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">Privacidade e Segurança:</span>
                    <p className="text-[11px] leading-relaxed">
                      O arquivo e a senha são utilizados apenas para validação e leitura dos metadados
                      (titularidade, CPF e data de validade). Nenhum arquivo binário ou senha será armazenado no banco de dados.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de Certificado */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Tipo de Certificado *</Label>
                    <Select
                      value={selectedCertType}
                      onValueChange={(v: "A1" | "A3") => setSelectedCertType(v)}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="A1" className="focus:bg-accent focus:text-accent-foreground">
                          A1 (Arquivo de Software .pfx / .p12)
                        </SelectItem>
                        <SelectItem value="A3" className="focus:bg-accent focus:text-accent-foreground">
                          A3 (Arquivo .cer / .crt / .p7b / .pem / .pfx)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Senha do Certificado (se A1 ou arquivo com senha) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Senha do Certificado {selectedCertType === "A1" ? "*" : "(Opcional se houver)"}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showCertPassword ? "text" : "password"}
                        placeholder={selectedCertType === "A1" ? "Digite a senha do certificado..." : "Senha (se aplicável)..."}
                        value={certPassword}
                        onChange={(e) => setCertPassword(e.target.value)}
                        className="bg-background border-border text-foreground pr-9 rounded-xl text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCertPassword(!showCertPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCertPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload do Arquivo */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Arquivo do Certificado (.pfx, .p12, .cer, .crt, .pem, .p7b) *
                  </Label>
                  <div className="border-2 border-dashed border-border hover:border-primary/50 bg-background/50 rounded-xl p-4 transition-all text-center">
                    <input
                      type="file"
                      id="cert-file-upload"
                      accept=".pfx,.p12,.cer,.crt,.pem,.p7b,.der"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCertFile(file);
                      }}
                    />

                    {certFile ? (
                      <div className="flex items-center justify-between bg-card border border-border p-3 rounded-xl">
                        <div className="flex items-center gap-3 overflow-hidden text-left">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <FileKey className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-foreground truncate">{certFile.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {(certFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCertFile(null)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="cert-file-upload"
                        className="cursor-pointer flex flex-col items-center justify-center gap-2 py-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-primary">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            Clique para selecionar ou arraste o arquivo do certificado
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Extensões aceitas: .pfx, .p12, .cer, .crt, .pem, .p7b
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Botão de Validação */}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleValidateCertificate}
                    disabled={isValidatingCert || !certFile}
                    className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-primary-foreground font-bold rounded-xl text-xs py-2.5 shadow-md flex items-center justify-center gap-2 border-none"
                  >
                    {isValidatingCert ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Validando Certificado com CPF...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Validar e Vincular Certificado
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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
          {isSaving ? "Salvando..." : professional?.id ? "Atualizar" : "Criar"} Profissional
        </Button>
      </div>
    </form>
  );
}
