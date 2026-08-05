"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { Client } from "@/src/types/client";
import { formatDocument, formatPhone } from "@/lib/utils";

interface ClientDetailsProps {
  client: Client;
}

export default function ClientDetails({ client }: ClientDetailsProps) {
  const getFullAddress = () => {
    const type = client.address_type ?? "";
    const parts = [
      type.charAt(0).toUpperCase() + type.slice(1),
      client.street,
      client.number,
      client.complement,
      client.neighborhood,
      client.cep,
      client.city,
      client.state,
    ]
      .filter(Boolean)
      .join(", ");
    return parts || "Endereço não informado";
  };

  return (
    <div className="space-y-4 bg-card font-sans text-foreground py-2">
      {/* Header Info */}
      <div className="flex items-center gap-4 bg-banner-via border border-border p-4 rounded-xl">
        <div className="w-12 h-12 bg-banner-via border border-border rounded-xl flex items-center justify-center text-primary shrink-0">
          <Users className="w-6 h-6 text-sidebar-primary" />
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white truncate">{client.name}</h2>
            <Badge
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${client.status === "active"
                ? "bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary/30"
                : "bg-secondary text-muted-foreground border-border"
                }`}
            >
              {client.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          {client.fantasy_name && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{client.fantasy_name}</p>
          )}
          <p className="text-[11px] font-mono text-sidebar-primary mt-1">
            {client.document_type?.toUpperCase()}: {formatDocument(client.document, client.document_type)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informações Fiscais */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Informações Fiscais</h3>
          <div className="text-xs space-y-2 text-muted-foreground">
            {client.state_registration && (
              <p className="font-mono flex items-center justify-between">
                <span className="text-muted-foreground">Inscrição Estadual:</span>
                <span className="text-foreground font-medium">{client.state_registration}</span>
              </p>
            )}
            {client.municipal_registration && (
              <p className="font-mono flex items-center justify-between">
                <span className="text-muted-foreground">Inscrição Municipal:</span>
                <span className="text-foreground font-medium">{client.municipal_registration}</span>
              </p>
            )}
            {client.is_simple_national_optant && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Optante do Simples Nacional
              </div>
            )}
          </div>
        </div>

        {/* Contato Principal */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Contato Principal</h3>
          <div className="text-xs space-y-2 text-muted-foreground">
            <p className="flex items-center gap-2 truncate" title={client.email || undefined}>
              <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate text-foreground">{client.email || "Sem e-mail cadastrado"}</span>
            </p>
            {(client.ddd || client.phone) && (
              <p className="flex items-center gap-2 font-mono">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" /> ({client.ddd}) {client.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contatos Adicionais */}
      {client.contacts && client.contacts.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Contatos Adicionais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {client.contacts.map((contact, index) => (
              <div key={index} className="bg-secondary/60 border border-border p-3 rounded-lg text-xs space-y-1">
                <p className="font-bold text-foreground">{contact.name}</p>
                <p className="text-muted-foreground truncate">{contact.email}</p>
                <p className="text-muted-foreground font-mono">{formatPhone(contact.phone)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Endereço */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Endereço</h3>
        <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <p className="leading-relaxed text-foreground">{getFullAddress()}</p>
        </div>
      </div>
    </div>
  );
}
