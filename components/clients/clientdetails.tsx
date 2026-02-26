"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <Users className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {client.name}
          </h2>
          <p className="text-slate-600">
            {client.fantasy_name || " "}
          </p>
          <Badge
            variant={client.status === "active" ? "default" : "secondary"}
            className="mt-1"
          >
            {client.status === "active" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <FileText className="w-4 h-4 inline mr-2" />
            {client.document_type?.toString().toLocaleUpperCase()}: {formatDocument(client.document, client.document_type)}
          </p>
          {client.state_registration && (
            <p>Inscrição Estadual: {client.state_registration}</p>
          )}
          {client.municipal_registration && (
            <p>Inscrição Municipal: {client.municipal_registration}</p>
          )}
          {client.is_simple_national_optant && (
            <p className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              Optante do Simples Nacional
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contato Principal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <Mail className="w-4 h-4 inline mr-2" /> {client.email || "N/A"}
          </p>
          {(client.ddd || client.phone) && (
            <p>
              <Phone className="w-4 h-4 inline mr-2" /> ({client.ddd}){" "}
              {client.phone}
            </p>
          )}
        </CardContent>
      </Card>

      {client.contacts && client.contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contatos Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.contacts.map((contact, index) => (
              <React.Fragment key={index}>
                <div className="text-sm">
                  <p className="font-semibold">{contact.name}</p>
                  <p>{contact.email}</p>
                  <p>{formatPhone(contact.phone)}</p>
                </div>
                {index < client.contacts!.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            <MapPin className="w-4 h-4 inline mr-2" /> {getFullAddress()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
