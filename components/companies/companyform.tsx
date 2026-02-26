"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { State, AddressType, DocumentType, Status } from "@/lib/generated/prisma";

interface CompanyFormData {
  code: string;
  document: string;
  document_type: DocumentType;
  name: string;
  fantasy_name: string;
  address_type: AddressType;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  cep: string;
  state: State;
  ddd: string;
  phone: string;
  email: string;
  state_registration: string;
  municipal_registration: string;
  constitution_date: Date;
  status: Status;
}


interface CompanyFormProps {
  company?: any;
  onSave?: (data: CompanyFormData) => void;
  onCancel?: () => void;
}

const addressTypes = Object.values(AddressType).map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
const states = Object.values(State).map((v) => ({ value: v, label: v }));

export default function CompanyForm({ company, onSave, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    code: company?.code || "",
    document: company?.document || "",
    document_type: company?.document_type || DocumentType.cnpj,
    name: company?.name || "",
    fantasy_name: company?.fantasy_name || "",
    address_type: company?.address_type || AddressType.rua,
    street: company?.street || "",
    number: company?.number || "",
    complement: company?.complement || "",
    neighborhood: company?.neighborhood || "",
    city: company?.city || "",
    cep: company?.cep || "",
    state: company?.state || State.PE,
    ddd: company?.ddd || "",
    phone: company?.phone || "",
    email: company?.email || "",
    state_registration: company?.state_registration || "",
    municipal_registration: company?.municipal_registration || "",
    constitution_date: company?.constitution_date?.split("T")[0] || "",
    status: company?.status || Status.active,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDocument = (value: string, type: DocumentType) => {
    const numbers = value.replace(/\D/g, '');
    if (type === DocumentType.cpf) return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 9) return numbers.replace(/(\d{5})(\d{4})/, '$1-$2');
    return numbers;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`p-2 rounded ${message.type === "success" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="additional">Informações Adicionais</TabsTrigger>
        </TabsList>

        {/* Basic */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  type="number"
                  value={formData.code}
                  onChange={(e) => handleChange("code", parseInt(e.target.value) || "")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={formData.document_type} onValueChange={(val) => handleChange("document_type", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(DocumentType).map((d) => (
                      <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{formData.document_type.toUpperCase()} *</Label>
                <Input
                  value={formatDocument(formData.document, formData.document_type)}
                  onChange={(e) => handleChange("document", e.target.value.replace(/\D/g, ''))}
                  required
                  maxLength={formData.document_type === 'cpf' ? 11 : 14}
                  minLength={formData.document_type === 'cpf' ? 11 : 14}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input
                  value={formData.fantasy_name}
                  onChange={(e) => handleChange("fantasy_name", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Nome/Razão Social *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address */}
        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Endereço</Label>
                <Select value={formData.address_type} onValueChange={(val) => handleChange("address_type", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {addressTypes.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Logradouro</Label><Input value={formData.street} onChange={(e) => handleChange("street", e.target.value)} /></div>
              <div className="space-y-2"><Label>Número</Label><Input value={formData.number} onChange={(e) => handleChange("number", e.target.value)} /></div>
              <div className="space-y-2"><Label>Complemento</Label><Input value={formData.complement} onChange={(e) => handleChange("complement", e.target.value)} /></div>
              <div className="space-y-2"><Label>Bairro</Label><Input value={formData.neighborhood} onChange={(e) => handleChange("neighborhood", e.target.value)} /></div>
              <div className="space-y-2"><Label>Cidade</Label><Input value={formData.city} onChange={(e) => handleChange("city", e.target.value)} /></div>
              <div className="space-y-2"><Label>Cep</Label><Input value={formData.cep} onChange={(e) => handleChange("cep", e.target.value)} /></div>  
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={formData.state} onValueChange={(val) => handleChange("state", val)} >
                  <SelectTrigger><SelectValue placeholder="Selecione um estado..."/></SelectTrigger>
                  <SelectContent>
                    {states.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional */}
        <TabsContent value="additional" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Contato e Informações Adicionais</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>DDD</Label><Input value={formData.ddd} onChange={(e) => handleChange("ddd", e.target.value.replace(/\D/g, '').slice(0,2))} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={formatPhone(formData.phone)} onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, '').slice(0,9))} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} /></div>
              <div className="space-y-2"><Label>Inscrição Estadual</Label><Input value={formData.state_registration} onChange={(e) => handleChange("state_registration", e.target.value.replace(/\D/g, ''))} /></div>
              <div className="space-y-2"><Label>Inscrição Municipal</Label><Input value={formData.municipal_registration} onChange={(e) => handleChange("municipal_registration", e.target.value)} /></div>
              <div className="space-y-2"><Label>Data de Constituição</Label><Input type="date" value={formData.constitution_date} onChange={(e) => handleChange("constitution_date", e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => handleChange("status", val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(Status).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : company ? "Atualizar" : "Criar"} Empresa
        </Button>
      </div>
    </form>
  );
}
