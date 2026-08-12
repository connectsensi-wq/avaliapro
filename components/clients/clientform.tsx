"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash, Plus, Search, Loader2, AlertTriangle } from "lucide-react";
import { Client, ClientContact } from "@/src/types/client";
import { AddressType, DocumentType, State, Status } from "@/lib/generated/prisma";
import { addressTypes, states } from "@/lib/utils";
import { toast } from "sonner";

interface ClientFormProps {
  client?: Client | null;
  onSave: (data: Partial<Client>) => void;
  onCancel: () => void;
}

export default function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateClientName, setDuplicateClientName] = useState("");
  const [duplicateDocument, setDuplicateDocument] = useState("");
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({
    code: client?.code || "",
    document: client?.document || "",
    document_type: client?.document_type || "cnpj",
    name: client?.name || "",
    fantasy_name: client?.fantasy_name || "",
    address_type: client?.address_type || "rua",
    street: client?.street || "",
    number: client?.number || "",
    complement: client?.complement || "",
    neighborhood: client?.neighborhood || "",
    city: client?.city || "",
    state: client?.state || undefined,
    cep: client?.cep || "",
    ddd: client?.ddd || "",
    phone: client?.phone || "",
    email: client?.email || "",
    state_registration: client?.state_registration || "",
    municipal_registration: client?.municipal_registration || "",
    is_simple_national_optant: client?.is_simple_national_optant || false,
    contacts: client?.contacts || [],
    status: client?.status || "active",
  });

  const handleChange = <K extends keyof Client>(field: K, value: Client[K]) => {
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

  const handleContactChange = (
    index: number,
    field: keyof ClientContact,
    value: string
  ) => {
    const updatedContacts = [...(formData.contacts || [])];
    updatedContacts[index][field] = value;
    handleChange("contacts", updatedContacts as ClientContact[]);
  };

  const addContact = () => {
    handleChange("contacts", [
      ...(formData.contacts || []),
      { name: "", phone: "", email: "" },
    ] as ClientContact[]);
  };

  const removeContact = (index: number) => {
    const updatedContacts = (formData.contacts || []).filter((_, i) => i !== index);
    handleChange("contacts", updatedContacts as ClientContact[]);
  };

  const formatDocument = (value: string, type?: string) => {
    const numbers = value.replace(/\D/g, "");
    if (type === "cpf")
      return numbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    return numbers.slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.slice(0, 9).replace(/(\d{5})(\d{4})/, "$1-$2");
  };

  const executeSave = async () => {
    try {
      await onSave(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const requiredFields = [
      "code",
      "document",
      "name",
      "street",
      "number",
      "neighborhood",
      "city",
      "cep",
    ];

    const emptyField = requiredFields.find(
      (field) => !formData[field as keyof typeof formData]
    );

    if (emptyField) {
      toast.error("Preencha todos os campos obrigatórios (*) antes de salvar.");
      setIsSaving(false);
      return;
    }

    // Verificar se já existe outro cliente cadastrado com o mesmo documento (CPF/CNPJ) na mesma empresa
    const cleanDoc = (formData.document || "").replace(/\D/g, "");
    const companyId = localStorage.getItem("selectedCompanyId");

    if (companyId && cleanDoc && !confirmedDuplicate) {
      try {
        const res = await fetch(`/api/clients?companyId=${companyId}`);
        if (res.ok) {
          const existingClients: Client[] = await res.json();
          const duplicate = existingClients.find(
            (c) =>
              (c.document || "").replace(/\D/g, "") === cleanDoc &&
              c.id !== client?.id
          );

          if (duplicate) {
            setDuplicateClientName(duplicate.name || "Cliente sem nome");
            setDuplicateDocument(formData.document || "");
            setShowDuplicateDialog(true);
            setIsSaving(false);
            return;
          }
        }
      } catch (checkErr) {
        console.error("Erro ao verificar duplicidade de cliente:", checkErr);
      }
    }

    await executeSave();
  };

  const handleConfirmDuplicateSave = async () => {
    setShowDuplicateDialog(false);
    setConfirmedDuplicate(true);
    setIsSaving(true);
    await executeSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-foreground py-1">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border p-1 rounded-xl">
          <TabsTrigger
            value="basic"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg transition-all"
          >
            Dados Básicos
          </TabsTrigger>
          <TabsTrigger
            value="address"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg transition-all"
          >
            Endereço
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg transition-all"
          >
            Contato
          </TabsTrigger>
          <TabsTrigger
            value="additional_contacts"
            className="text-xs font-semibold text-foreground data-[state=active]:bg-input data-[state=active]:text-sidebar-primary rounded-lg transition-all"
          >
            Contatos Adicionais
          </TabsTrigger>
        </TabsList>

        {/* Aba: Dados Básicos */}
        <TabsContent value="basic" className="pt-2 space-y-4">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Informações Principais</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs font-medium text-muted-foreground">Código *</Label>
                  <Input
                    type="number"
                    value={formData.code || ""}
                    onChange={(e) => handleChange("code", e.target.value)}
                    required
                    disabled={!!client?.code}
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs font-medium text-muted-foreground">Tipo de Documento</Label>
                  <Select
                    value={formData.document_type?.toString() ?? "cnpj"}
                    onValueChange={(val) => handleChange("document_type", val as DocumentType)}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      {Object.values(DocumentType).map((d) => (
                        <SelectItem key={d} value={d} className="focus:bg-primary focus:text-white">
                          {d.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs font-medium text-muted-foreground">{formData.document_type?.toString().toUpperCase() || "CNPJ"} *</Label>
                  <Input
                    value={formatDocument(formData.document?.toString() || "", formData.document_type?.toString() || "cnpj")}
                    onChange={(e) => handleChange("document", e.target.value.replace(/\D/g, ""))}
                    required
                    maxLength={formData.document_type === "cpf" ? 14 : 18}
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium text-muted-foreground">Nome/Razão Social *</Label>
                  <Input
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium text-muted-foreground">Nome Fantasia</Label>
                  <Input
                    value={formData.fantasy_name || ""}
                    onChange={(e) => handleChange("fantasy_name", e.target.value)}
                    className="bg-background border-border text-foreground rounded-xl text-sm"
                  />
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

                {formData.document_type?.toString() !== "cpf" && (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="is_simple_national_optant"
                      checked={formData.is_simple_national_optant}
                      onCheckedChange={(c) => handleChange("is_simple_national_optant", !!c)}
                      className="border-border data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-primary-foreground"
                    />
                    <label htmlFor="is_simple_national_optant" className="text-xs text-muted-foreground font-medium cursor-pointer">
                      Optante do Simples Nacional
                    </label>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                  <Select
                    value={formData.status?.toString() || "active"}
                    onValueChange={(v) => handleChange("status", v as Status)}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      <SelectItem value="active" className="focus:bg-primary focus:text-white">Ativo</SelectItem>
                      <SelectItem value="inactive" className="focus:bg-primary focus:text-white">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Endereço com ViaCEP */}
        <TabsContent value="address" className="pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Endereço Comercial / Hospitalar</CardTitle>
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
                <Select
                  value={formData.address_type || "rua"}
                  onValueChange={(v) => handleChange("address_type", v as AddressType)}
                  required
                >
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {addressTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="focus:bg-primary focus:text-white">
                        {t.label}
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
                <Label className="text-xs font-medium text-muted-foreground">Município *</Label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                  className="bg-background border-border text-foreground rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Estado (UF)</Label>
                <Select value={formData.state || undefined} onValueChange={(val) => handleChange("state", val as State)}>
                  <SelectTrigger className="bg-background border-border text-foreground rounded-xl text-sm">
                    <SelectValue placeholder="Selecione um estado..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {states.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="focus:bg-primary focus:text-white">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Contato Principal */}
        <TabsContent value="contact" className="pt-2">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Contato Principal</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs font-medium text-muted-foreground">DDD</Label>
                <Input
                  value={formData.ddd || ""}
                  onChange={(e) => handleChange("ddd", e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Telefone</Label>
                <Input
                  value={formatPhone(formData.phone || "")}
                  onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 9))}
                  className="bg-background border-border text-foreground rounded-xl text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs font-medium text-muted-foreground">E-mail Comercial</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="bg-background border-border text-foreground rounded-xl text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Contatos Adicionais */}
        <TabsContent value="additional_contacts" className="pt-2 space-y-4">
          <Card className="bg-card border-border rounded-xl shadow-inner">
            <CardHeader className="pb-2 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-primary uppercase tracking-wider">Contatos Adicionais</CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={addContact}
                className="bg-secondary hover:bg-secondary/80 text-primary border border-primary/30 rounded-xl text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Contato
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {formData.contacts?.map((contact, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end p-3 bg-secondary/40 border border-border rounded-xl"
                >
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nome</Label>
                    <Input
                      value={contact.name || ""}
                      onChange={(e) => handleContactChange(index, "name", e.target.value)}
                      className="bg-background border-border text-foreground rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                    <Input
                      value={contact.phone || ""}
                      onChange={(e) => handleContactChange(index, "phone", e.target.value)}
                      className="bg-background border-border text-foreground rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">E-mail</Label>
                    <Input
                      type="email"
                      value={contact.email || ""}
                      onChange={(e) => handleContactChange(index, "email", e.target.value)}
                      className="bg-background border-border text-foreground rounded-xl text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeContact(index)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl h-9 w-9"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {formData.contacts && formData.contacts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3 italic">
                  Nenhum contato adicional registrado.
                </p>
              )}
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
          {isSaving ? "Salvando..." : client?.id ? "Atualizar" : "Criar"} Cliente
        </Button>
      </div>

      {/* Dialog de Aviso para Cliente com CPF/CNPJ Duplicado */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="bg-card border-border text-foreground rounded-2xl max-w-md">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-amber-500">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              CPF / CNPJ Já Cadastrado
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              Já existe um cliente cadastrado nesta empresa com o mesmo número de documento (<strong>{duplicateDocument}</strong>):
              <br />
              <span className="font-semibold text-foreground mt-1.5 block text-sm">
                Cliente: {duplicateClientName}
              </span>
              <span className="block mt-2 text-muted-foreground">
                Deseja cancelar para corrigir ou continuar com o cadastro assim mesmo?
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDuplicateDialog(false)}
              className="bg-secondary hover:bg-secondary/80 text-foreground border-border rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDuplicateSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs shadow-md border-none"
            >
              Continuar com o cadastro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}