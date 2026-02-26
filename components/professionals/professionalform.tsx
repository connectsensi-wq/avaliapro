"use client";

import React, { useState, useEffect } from "react";
import { Professional } from "@/src/types/professional";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Specialty } from "@/lib/generated/prisma";
import { addressTypes, formatCpf, formatPhone, pixKeyTypes, states } from "@/lib/utils";
import { toast } from "sonner";

interface ProfessionalFormProps {
  professional?: Professional | null;
  specialties: Specialty[];
  onSave: (data: Partial<Professional>) => void;
  onCancel: () => void;
}

export default function ProfessionalForm({ professional, specialties, onSave, onCancel }: ProfessionalFormProps) {
  const [isSaving, setIsSaving] = useState(false)
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
    status: professional?.status || "active", // Default
  });
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true)
    // Campos obrigatórios
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

  useEffect(() => {
    if (professional) {
      setFormData(prev => ({
        ...prev,
        ...professional,
        birthday: professional.birthday ? professional.birthday.slice(0, 10) : ""
      }));
    }
  }, [professional]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="financial">Dados Financeiros</TabsTrigger>
        </TabsList>

        {/* Dados Pessoais */}
        <TabsContent value="basic" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Principais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="name">Código *</Label>
                    <Input 
                      id="code" 
                      type="number" 
                      value={formData.code} 
                      onChange={e => handleChange('code', e.target.value)} 
                      required 
                      disabled={!!professional}
                      />
                  </div>
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input id="name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input 
                      id="cpf" 
                      value={formatCpf(formData.cpf || "")} 
                      onChange={e => handleChange('cpf', e.target.value)} 
                      required
                      maxLength={11}
                      minLength={11}
                      disabled={!!professional?.cpf}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty_id">Especialidade *</Label>
                    <Select value={formData.specialtyId?.toString()} onValueChange={v => handleChange('specialtyId', v)} required>
                      <SelectTrigger><SelectValue placeholder="Selecione uma especialidade..." /></SelectTrigger>
                      <SelectContent>
                        {specialties.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registration_number">Nº de Registro Profissional *</Label>
                    <Input id="registration_number" value={formData.registration_number?.toString()} onChange={e => handleChange('registration_number', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input 
                      id="phone" 
                      value={formatPhone(formData.phone || "")} 
                      placeholder="Digite apenas os números" 
                      onChange={e => handleChange('phone', e.target.value.replace(/\D/g, "").slice(0, 11)
                      )}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input id="email" type="email" value={formData.email?.toString()} onChange={e => handleChange('email', e.target.value)} required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthday">Data de Aniversário *</Label>
                    <Input id="birthday" type="date" value={formData.birthday || ""} onChange={e => handleChange('birthday', e.target.value)} required/>
                  </div>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* Endereço */}
        <TabsContent value="address" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle>Endereço do Profissional</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Tipo *</Label>
                <Select value={formData.address_type?.toString()} onValueChange={v => handleChange('address_type', v)} required>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {addressTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-3" ><Label>Logradouro *</Label><Input value={formData.street?.toString()} onChange={e => handleChange('street', e.target.value)} required/></div>
              <div className="space-y-2 col-span-1"><Label>Número *</Label><Input value={formData.number?.toString()} onChange={e => handleChange('number', e.target.value)} required/></div>
              <div className="space-y-2 col-span-3"><Label>Complemento</Label><Input value={formData.complement?.toString()} onChange={e => handleChange('complement', e.target.value)}/></div>
              <div className="space-y-2 col-span-2"><Label>Bairro *</Label><Input value={formData.neighborhood?.toString()} onChange={e => handleChange('neighborhood', e.target.value)} required/></div>
              <div className="space-y-2 col-span-2"><Label>Cidade *</Label><Input value={formData.city?.toString()} onChange={e => handleChange('city', e.target.value)} required/></div>
              <div className="space-y-2 col-span-2"><Label>CEP *</Label><Input value={formData.cep?.toString()} onChange={e => handleChange('cep', e.target.value.replace(/\D/g, "").slice(0, 8))} required/></div> 
              <div className="col-span-2 space-y-2">
                <Label>Estado (UF) *</Label>
                <Select value={formData.state?.toString()} onValueChange={v => handleChange('state', v)} required>
                  <SelectTrigger><SelectValue placeholder="Selecione um estado..."/></SelectTrigger>
                  <SelectContent>
                    {states.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dados Financeiros */}
        <TabsContent value="financial" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle>Conta Bancária</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Banco</Label>
                <Input value={formData.bank?.toString()} onChange={e => handleChange('bank', e.target.value)} />
              </div>
              <div className="space-y-2"><Label>Agência</Label><Input value={formData.agency?.toString()} onChange={e => handleChange('agency', e.target.value)} /></div>
              <div className="space-y-2"><Label>Conta</Label><Input value={formData.account?.toString()} onChange={e => handleChange('account', e.target.value)} /></div>
              <div className="col-span-2 space-y-2">
                <Label>Tipo de Conta</Label>
                <Select value={formData.account_type?.toString()} onValueChange={v => handleChange('account_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dados PIX</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label>Tipo de Chave PIX</Label>
                <Select value={formData.pix_key_type?.toString()} onValueChange={v => handleChange('pix_key_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {pixKeyTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Chave PIX</Label>
                <Input value={formData.pix_key?.toString()} onChange={e => handleChange('pix_key', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taxa Administrativa (%) *</Label>
              <Input type="number" min="0" max="100" step="0.01"
                value={formData.admin_fee_percentage} 
                onChange={e => handleChange('admin_fee_percentage', parseFloat(e.target.value) || 0)} 
                required    
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button 
          type="submit" 
          className="bg-slate-900 hover:bg-slate-800"
          disabled={isSaving}
        >{professional?.name ? 'Atualizar' : 'Criar'}</Button>
      </div>
    </form>
  );
}
