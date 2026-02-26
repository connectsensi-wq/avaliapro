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
import { Trash, Plus } from "lucide-react";
import { Client, ClientContact } from "@/src/types/client";
import { AddressType, DocumentType, State, Status } from "@/lib/generated/prisma";
import { addressTypes, states } from "@/lib/utils";
import { toast } from "sonner";

interface ClientFormProps {
  client?: Client | null;
  onSave: (data: Partial<Client>) => void;
  onCancel: () => void;
}

export default function ClientForm({client, onSave, onCancel,}: ClientFormProps) {
  const [isSaving, setIsSaving] = useState(false)
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
    state: client?.state,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true)
    // Campos obrigatórios
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
      toast.error("Preencha todos os campos obrigatórios antes de salvar.");
      setIsSaving(false)
      return;
    }

    try{
      await onSave(formData);
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
    
  };

  const handleChange = <K extends keyof Client>(
    field: K,
    value: Client[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    const updatedContacts = (formData.contacts || []).filter(
      (_, i) => i !== index
    );
    handleChange("contacts", updatedContacts as ClientContact[]);
  };

  const formatDocument = (value: string, type?: string) => {
    const numbers = value.replace(/\D/g, "");
    if (type === "cpf")
      return numbers
        .slice(0, 11)
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    return numbers
      .slice(0, 14)
      .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .slice(0, 9)
      .replace(/(\d{5})(\d{4})/, "$1-$2");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-h-[80vh] overflow-y-auto pr-4"
    >
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="contact">Contato Principal</TabsTrigger>
          <TabsTrigger value="additional_contacts">Contatos</TabsTrigger>
        </TabsList>

        {/* ------------------- Aba: Dados Básicos ------------------- */}
        <TabsContent value="basic" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Principais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    id="code"
                    type="number"
                    value={formData.code}
                    onChange={(e) => handleChange("code", parseInt(e.target.value).toString() || "")}
                    required
                    disabled={!!client?.code}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select
                    value={formData.document_type?.toString() ?? "cnpj"}
                    onValueChange={(val) => handleChange("document_type", val as any)}
                    >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(DocumentType).map((d) => (
                        <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 ">
                  <Label>{formData.document_type?.toString().toUpperCase() || "CNPJ"} *</Label>
                  <Input
                    id="document"
                    value={formatDocument(formData.document?.toString() || "", formData.document_type?.toString() || "cnpj")}
                    onChange={(e) => handleChange("document", e.target.value.replace(/\D/g, ''))}
                    required
                    maxLength={formData.document_type === 'cpf' ? 11 : 14}
                    minLength={formData.document_type === 'cpf' ? 11 : 14}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome Fantasia</Label>
                  <Input
                    value={formData.fantasy_name?.toString()}
                    onChange={(e) => handleChange("fantasy_name", e.target.value)}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Nome/Razão Social *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>
                      
                <div className="space-y-2">
                  <Label>Inscrição Estadual</Label>
                  <Input
                    value={formData.state_registration?.toString()}
                    onChange={(e) =>
                      handleChange("state_registration", e.target.value)
                    }
                  />
                </div>
                  
                <div className="space-y-2">
                  <Label>Inscrição Municipal</Label>
                  <Input
                    value={formData.municipal_registration?.toString()}
                    onChange={(e) =>
                      handleChange("municipal_registration", e.target.value)
                    }
                  />
                </div>
                  
                {formData.document_type?.toString() !== "cpf" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_simple_national_optant"
                      checked={formData.is_simple_national_optant}
                      onCheckedChange={(c) =>
                        handleChange("is_simple_national_optant", !!c)
                      }
                    />
                    <label htmlFor="is_simple_national_optant">
                      Optante do Simples Nacional
                    </label>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status?.toString() || "active"}
                    onValueChange={(v) => handleChange("status", v as Status)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
            
        {/* ------------------- Aba: Endereço ------------------- */}
        <TabsContent value="address" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label>Tipo *</Label>
                  <Select
                    value={formData.address_type || "rua"}
                    onValueChange={(v) => handleChange("address_type", v as AddressType)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {addressTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-3">
                  <Label>Logradouro *</Label>
                  <Input
                    id="street"
                    value={formData.street?.toString()}
                    onChange={(e) => handleChange("street", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label>Número *</Label>
                  <Input
                    id="number"
                    value={formData.number?.toString()}
                    onChange={(e) => handleChange("number", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complement?.toString()}
                    onChange={(e) => handleChange("complement", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood?.toString()}
                    onChange={(e) => handleChange("neighborhood", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Município *</Label>
                  <Input
                    id="city"
                    value={formData.city?.toString()}
                    onChange={(e) => handleChange("city", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cep *</Label>
                  <Input
                    id="cep"
                    value={formData.cep?.toString()}
                    onChange={(e) => handleChange("cep", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado (UF)</Label>
                  <Select value={formData.state?.toString() || ""} onValueChange={(val) => handleChange("state", val as State)} >
                    <SelectTrigger><SelectValue placeholder="Selecione um estado..."/></SelectTrigger>
                    <SelectContent>
                      {states.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
                  
        {/* ------------------- Aba: Contato Principal ------------------- */}
        <TabsContent value="contact" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contato Principal</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>DDD</Label>
                <Input
                  value={formData.ddd?.toString()}
                  onChange={(e) =>
                    handleChange(
                      "ddd",
                      e.target.value.replace(/\D/g, "").slice(0, 2)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formatPhone(formData.phone || "")}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email?.toString()}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
                
        {/* ------------------- Aba: Contatos Adicionais ------------------- */}
        <TabsContent value="additional_contacts" className="pt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contatos Adicionais</CardTitle>
              <Button type="button" size="sm" onClick={addContact}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Contato
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.contacts?.map((contact, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <Label>Nome</Label>
                    <Input
                      value={contact.name}
                      onChange={(e) =>
                        handleContactChange(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone</Label>
                    <Input
                      value={contact.phone?.toString()}
                      onChange={(e) =>
                        handleContactChange(index, "phone", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={contact.email?.toString()}
                      onChange={(e) =>
                        handleContactChange(index, "email", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeContact(index)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {formData.contacts && formData.contacts.length === 0 && (
                <p className="text-sm text-slate-500 text-center">
                  Nenhum contato adicional.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>     
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-slate-900 hover:bg-slate-800"
          disabled={isSaving}
        >
          {client?.name ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}