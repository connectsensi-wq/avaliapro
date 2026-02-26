"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Mail, Phone, Hash, Banknote, Percent, MapPin, CreditCard, RotateCw } from "lucide-react";
import { Professional } from "@/src/types/professional";
import { Specialty } from "@/lib/generated/prisma";
import { useSignIn } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatCpf, formatPhone } from "@/lib/utils";

interface ProfessionalDetailsProps {
  professional: Professional;
  specialties: Specialty[];
}

const pixKeyTypeLabels: Record<string, string> = {
  cpf: "CPF",
  email: "E-mail",
  phone: "Número telefone",
  random: "Chave Aleatória",
};

export default function ProfessionalDetails({ professional, specialties }: ProfessionalDetailsProps) {
  const specialtyName =
    specialties.find((s) => s.id === professional.specialtyId)?.name || "N/A";

  const handleAdminResetPassword = async () => {
  try {
    const res = await fetch(`/api/professionals/${professional.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkUserId: professional.clerkUserId}),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao resetar senha");
    }

    toast.success("Senha resetada com sucesso. Usuário precisará redefinir no próximo login.");
  } catch (err: any) {
    console.error("Erro ao resetar senha:", err);
    toast.error(err.message || "Erro ao resetar senha");
  }
};

  const getFullAddress = () => {
    if (!professional) return "Endereço não informado";
    const { address_type, street, number, complement, neighborhood, city, cep, state } =
      professional;
    return [
      address_type ? `${address_type.charAt(0).toUpperCase() + address_type.slice(1)} ` : "",
      street,
      number,
      complement,
      neighborhood,
      city,
      cep,
      state,
    ]
      .filter(Boolean)
      .join(", ");
  };


  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <UserCheck className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{professional.name}</h2>
          <p className="text-slate-600">{specialtyName}</p>
          <Badge
            variant={professional.status === "active" ? "default" : "secondary"}
            className="mt-1"
          >
            {professional.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>

      {/* Informações Pessoais */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800">Informações Pessoais</h3>
        <div className="text-sm space-y-2 text-slate-700">
          <p>
            <Mail className="w-4 h-4 inline mr-2" /> {professional.email || "N/A"}
          </p>
          <p>
            <Phone className="w-4 h-4 inline mr-2" /> {formatPhone(professional.phone) || "N/A"}
          </p>
          <p>
            <Hash className="w-4 h-4 inline mr-2" /> CPF: {formatCpf(professional.cpf) || "N/A"}
          </p>
          <p>
            <Hash className="w-4 h-4 inline mr-2" /> Registro:{" "}
            {professional.registration_number || "N/A"}
          </p>
        </div>
      </div>

      {/* Endereço */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800">Endereço</h3>
        <p className="text-sm text-slate-700">
          <MapPin className="w-4 h-4 inline mr-2" /> {getFullAddress()}
        </p>
      </div>

      {/* Informações Financeiras */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800">Informações Financeiras</h3>
        <div className="text-sm space-y-2 text-slate-700">
          <p>
            <Percent className="w-4 h-4 inline mr-2" /> Taxa Admin:{" "}
            {professional.admin_fee_percentage}%
          </p>

          {professional && (
            <div className="pl-6 border-l-2 ml-2 mt-2 pt-2">
              <p className="font-medium">Conta Bancária</p>
              <p>
                <Banknote className="w-4 h-4 inline mr-2" /> Banco:{" "}
                {professional.bank || "N/A"}
              </p>
              <p>
                <Hash className="w-4 h-4 inline mr-2" /> Agência:{" "}
                {professional.agency || "N/A"} | Conta:{" "}
                {professional.account || "N/A"} (
                {professional.account_type || "N/A"})
              </p>
            </div>
          )}

          {professional.pix_key_type && professional.pix_key && (
            <div className="pl-6 border-l-2 ml-2 mt-2 pt-2">
              <p className="font-medium">Dados PIX</p>
              <p>
                <CreditCard className="w-4 h-4 inline mr-2" /> Tipo:{" "}
                {pixKeyTypeLabels[professional.pix_key_type] ||
                  professional.pix_key_type}
              </p>
              <p>
                <Hash className="w-4 h-4 inline mr-2" /> Chave: {professional.pix_key}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Ações */}
      <div className="pt-4 flex gap-2">
        <Button onClick={handleAdminResetPassword} className="bg-gray-500 hover:bg-gray-600">
          <RotateCw className="w-4 h-4 mr-2" />
          Redefinir senha
        </Button>
        {/* opcional: botão para editar */}
      </div>
    </div>
  );
}
