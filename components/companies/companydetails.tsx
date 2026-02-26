import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, Mail, Phone, MapPin, Edit, FileText, Calendar, Hash
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale"
import { State, AddressType, Status } from "@/lib/generated/prisma"; // enums do Prisma

interface CompanyViewerProps {
  company: any;
  onEdit: () => void;
}

export default function CompanyDetails({ company, onEdit }: CompanyViewerProps) {
  const states: Record<State, string> = {
    AC:"Acre", AL:"Alagoas", AM:"Amazonas", BA:"Bahia", CE:"Ceará",
    DF:"Distrito Federal", ES:"Espírito Santo", GO:"Goiás", MA:"Maranhão",
    MG:"Minas Gerais", MS:"Mato Grosso do Sul", MT:"Mato Grosso", PA:"Pará",
    PB:"Paraíba", PE:"Pernambuco", PI:"Piauí", PR:"Paraná", RJ:"Rio de Janeiro",
    RN:"Rio Grande do Norte", RO:"Rondônia", RR:"Roraima", RS:"Rio Grande do Sul",
    SC:"Santa Catarina", SE:"Sergipe", SP:"São Paulo", TO:"Tocantins"
  };

  const addressTypes: Record<AddressType, string> = {
    alameda:"Alameda", avenida:"Avenida", estrada:"Estrada", loteamento:"Loteamento", praça:"Praça", 
    quadra:"Quadra", rodovia:"Rodovia", rua:"Rua", travessa:"Travessa"
  };

  const formatDocument = (document: string | undefined, type: "cpf" | "cnpj") => {
    if (!document) return "";
    const numbers = document.replace(/\D/g, "");
    if (type === "cpf") return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatPhone = (ddd?: string, phone?: string) => {
    if (!ddd || !phone) return "";
    const formattedPhone = phone.replace(/(\d{5})(\d{4})/, "$1-$2");
    return `(${ddd}) ${formattedPhone}`;
  };

  const getFullAddress = () => {
    const parts: string[] = [];
    if (company.address_type) parts.push(addressTypes[company.address_type as AddressType]);
    if (company.street) parts.push(company.street);
    if (company.number) parts.push(company.number);
    if (company.complement) parts.push(company.complement);

    const address = parts.join(" ");
    const locationParts: string[] = [];
    if (company.cep) locationParts.push(company.cep)
    if (company.neighborhood) locationParts.push(company.neighborhood);
    if (company.city) locationParts.push(company.city);
    if (company.state) locationParts.push(company.state);

    return address + (locationParts.length ? ` - ${locationParts.join(", ")}` : "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{company.name}</h2>
            <p className="text-slate-500">{formatDocument(company.document, company.document_type)}</p>
            {company.fantasy_name && <p className="text-sm text-slate-500">{company.fantasy_name}</p>}
          </div>
        </div>
        <Badge variant={company.status === Status.active ? "default" : "secondary"}>
          {company.status === Status.active ? "Ativa" : "Inativa"}
        </Badge>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Informações Básicas</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {company.code && (
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Código</p>
                <p className="font-medium text-slate-900">{company.code}</p>
              </div>
            </div>
          )}

          {company.constitution_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Data de Constituição</p>
                <p className="font-medium text-slate-900">
                  {format(new Date(company.constitution_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Contato</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {company.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">E-mail</p>
                <p className="font-medium text-slate-900">{company.email}</p>
              </div>
            </div>
          )}

          {(company.ddd || company.phone) && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Telefone</p>
                <p className="font-medium text-slate-900">{formatPhone(company.ddd, company.phone)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      {getFullAddress() && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Endereço</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="font-medium text-slate-900">{getFullAddress()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registration */}
      {(company.state_registration || company.municipal_registration) && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Inscrições</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {company.state_registration && (
              <div>
                <p className="text-sm text-slate-500">Inscrição Estadual</p>
                <p className="font-medium text-slate-900">{company.state_registration}</p>
              </div>
            )}
            {company.municipal_registration && (
              <div>
                <p className="text-sm text-slate-500">Inscrição Municipal</p>
                <p className="font-medium text-slate-900">{company.municipal_registration}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={onEdit} className="bg-slate-900 hover:bg-slate-800">
          <Edit className="w-4 h-4 mr-2" /> Editar Empresa
        </Button>
      </div>
    </div>
  );
}
