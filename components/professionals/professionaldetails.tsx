"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserCheck,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  CreditCard,
  Building2,
  Percent,
  Banknote,
  Hash,
  KeyRound,
  Loader2,
} from "lucide-react";
import { Professional } from "@/src/types/professional";
import { Specialty } from "@/lib/generated/prisma";
import { addressTypes, formatCpf, formatPhone, pixKeyTypes, states } from "@/lib/utils";
import { toast } from "sonner";

interface ProfessionalDetailsProps {
  professional: Professional;
  specialties: Specialty[];
}

export default function ProfessionalDetails({ professional, specialties }: ProfessionalDetailsProps) {
  const [isSendingReset, setIsSendingReset] = useState(false);

  const getSpecialtyName = (id?: string | null) => {
    if (!id) return "Não informada";
    return specialties.find((s) => s.id === id)?.name || "Não informada";
  };

  const getFullAddress = () => {
    const typeLabel = addressTypes.find((a) => a.value === professional.address_type)?.label || "";
    const stateLabel = states.find((s) => s.value === professional.state)?.label || professional.state || "";

    const parts = [
      typeLabel,
      professional.street,
      professional.number,
      professional.complement,
      professional.neighborhood,
      professional.cep,
      professional.city,
      stateLabel,
    ]
      .filter(Boolean)
      .join(", ");
    return parts || "Endereço não informado";
  };

  const handleSendPasswordReset = async () => {
    if (!professional.email) {
      toast.error("O profissional não possui e-mail cadastrado.");
      return;
    }

    setIsSendingReset(true);
    try {
      const res = await fetch("/api/clerk/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: professional.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao solicitar redefinição de senha");
      }

      toast.success(`E-mail de redefinição de senha enviado para ${professional.email}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Falha ao enviar e-mail de redefinição.");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-foreground py-2">
      {/* Header Info */}
      <div className="flex items-center gap-4 bg-banner-via border border-border p-4 rounded-xl">
        <div className="w-12 h-12 bg-banner-via border border-border rounded-xl flex items-center justify-center text-primary shrink-0">
          <UserCheck className="w-6 h-6 text-sidebar-primary" />
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white truncate">{professional.name}</h2>
            <Badge
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${professional.status === "active"
                ? "bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary/30"
                : "bg-secondary text-muted-foreground border-border"
                }`}
            >
              {professional.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="text-xs text-sidebar-primary font-semibold truncate mt-0.5">
            {getSpecialtyName(professional.specialtyId)}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground mt-1">
            Código: <span className="text-foreground font-semibold">#{professional.code}</span> | CRM/Reg:{" "}
            <span className="text-foreground font-semibold">{professional.registration_number}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informações Pessoais */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Dados Pessoais</h3>
          <div className="text-xs space-y-2 text-muted-foreground">
            <p className="flex items-center gap-2 font-mono">
              <FileText className="w-3.5 h-3.5 text-primary shrink-0" /> CPF: <span className="text-foreground font-medium">{formatCpf(professional.cpf) || "N/A"}</span>
            </p>
            <p className="flex items-center gap-2 truncate" title={professional.email || undefined}>
              <Mail className="w-3.5 h-3.5 text-primary shrink-0" /> <span className="truncate text-foreground">{professional.email || "N/A"}</span>
            </p>
            <p className="flex items-center gap-2 font-mono">
              <Phone className="w-3.5 h-3.5 text-primary shrink-0" /> {formatPhone(professional.phone || "") || "N/A"}
            </p>
            {professional.birthday && (
              <p className="flex items-center gap-2 font-mono">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" /> Nasc: {new Date(professional.birthday).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>

        {/* Informações Financeiras */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Dados Financeiros</h3>
          <div className="text-xs space-y-2 text-muted-foreground">
            <p className="flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-primary shrink-0" /> Taxa Adm: <span className="font-bold text-foreground">{professional.admin_fee_percentage}%</span>
            </p>
            <p className="flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5 text-primary shrink-0" /> Banco: {professional.bank || "N/A"}
            </p>
            <p className="flex items-center gap-2 font-mono">
              <Hash className="w-3.5 h-3.5 text-primary shrink-0" /> Ag: {professional.agency || "N/A"} | CC: {professional.account || "N/A"}
            </p>
            {professional.pix_key && (
              <p className="flex items-center gap-2 font-mono truncate">
                <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" /> PIX ({(professional.pix_key_type && pixKeyTypes.find((p) => p.value === professional.pix_key_type)?.label) || professional.pix_key_type || "Chave"}): <span className="truncate text-foreground">{professional.pix_key}</span>
              </p>
            )}
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-card border border-border rounded-xl p-4 sm:col-span-2">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Endereço</h3>
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <p className="leading-relaxed text-foreground">{getFullAddress()}</p>
          </div>
        </div>
      </div>

      {/* Ação de Segurança (Redefinição de Senha Clerk) */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleSendPasswordReset}
          disabled={isSendingReset}
          className="w-full bg-secondary hover:bg-secondary/80 text-foreground border-border rounded-xl text-xs font-semibold py-2.5 flex items-center justify-center gap-2"
        >
          {isSendingReset ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Enviando e-mail...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4 text-primary" />
              Enviar E-mail de Redefinição de Senha (Clerk)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
