"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Search, Edit, Eye, Mail, Phone, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CompanyForm from "@/components/companies/companyform";
import CompanyDetails from "@/components/companies/companydetails";
import { Company } from "@/src/types/company";
import { toast } from "sonner";
import { formatDocument } from "@/lib/utils";

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      setCompanies(data);
      setFilteredCompanies(data);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      toast.error("Falha ao carregar lista de empresas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const filterCompanies = useCallback(() => {
    const filtered = companies.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const fantasyMatch = c.fantasy_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const docMatch = c.document?.includes(searchTerm.replace(/\D/g, ""));
      return nameMatch || fantasyMatch || docMatch;
    });
    setFilteredCompanies(filtered);
  }, [searchTerm, companies]);

  useEffect(() => {
    filterCompanies();
  }, [filterCompanies]);

  const handleSave = async (companyData: Partial<Company>) => {
    try {
      if (editingCompany?.id) {
        await fetch(`/api/companies/${editingCompany.id}`, {
          method: "PUT",
          body: JSON.stringify(companyData),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await fetch("/api/companies", {
          method: "POST",
          body: JSON.stringify(companyData),
          headers: { "Content-Type": "application/json" },
        });
      }

      toast.success(`Empresa ${editingCompany ? "atualizada" : "criada"} com sucesso!`);
      setShowForm(false);
      setEditingCompany(null);
      loadCompanies();
    } catch (error) {
      console.error("Erro ao salvar empresa:", error);
      toast.error("Erro ao salvar dados da empresa.");
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleView = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleNew = () => {
    setEditingCompany(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans text-foreground">
      {/* Banner Executivo */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#002B27] via-[#003833] to-[#002421] border border-[#004D46] px-6 py-5 rounded-2xl shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Gestão Corporativa
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              Empresas
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Gerencie a estrutura societária e empresas administradas
            </p>
          </div>

          <Button
            onClick={handleNew}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 border-none text-xs"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[3]" />
            Nova Empresa
          </Button>
        </div>
      </div>

      {/* Busca & Contador */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
          <Input
            placeholder="Buscar por Razão Social, Fantasia ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-banner-via border-border text-white placeholder:text-muted-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
          />
        </div>
        <div className="text-xs font-semibold text-muted-foreground bg-banner-to border border-border px-4 py-2 rounded-xl">
          Total: <span className="text-primary font-bold">{filteredCompanies.length}</span> empresa(s)
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse bg-card border border-card rounded-2xl h-48" />
          ))
        ) : filteredCompanies.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-card border border-border rounded-2xl text-muted-foreground space-y-2">
            <Building2 className="w-8 h-8 text-primary mx-auto opacity-80" />
            <p className="font-semibold text-foreground">Nenhuma empresa encontrada</p>
            <p className="text-xs">Tente ajustar os termos de busca ou cadastre uma nova empresa.</p>
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <Card
              key={company.id}
              className="bg-card border-border transition-all duration-300 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 hover:overflow-hidden flex flex-col justify-between"
            >
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-secondary border border-border rounded-xl flex items-center justify-center text-primary shrink-0">
                      <Building2 className="w-5.5 h-5.5 text-primary" />
                    </div>
                    <div className="overflow-hidden">
                      <CardTitle className="text-base font-bold text-foreground truncate" title={company.name}>
                        {company.name}
                      </CardTitle>
                      {company.fantasy_name && (
                        <p className="text-xs text-muted-foreground truncate" title={company.fantasy_name}>
                          {company.fantasy_name}
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-primary bg-secondary/80 px-2 py-0.5 rounded border border-border inline-block mt-1">
                        CNPJ: {formatDocument(company.document, "CNPJ")}
                      </p>
                    </div>
                  </div>

                  <Badge
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${company.status === "active"
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-secondary text-muted-foreground border-border"
                      }`}
                  >
                    {company.status === "active" ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs text-muted-foreground">
                  {company.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate text-foreground">{company.email}</span>
                    </div>
                  )}
                  {company.ddd && company.phone && (
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-foreground">({company.ddd}) {company.phone}</span>
                    </div>
                  )}
                  {company.city && company.state && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-foreground">{company.city} / {company.state}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(company)}
                    className="flex-1 bg-secondary hover:bg-cyan-800 text-primary hover:text-white rounded-xl text-xs font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(company)}
                    className="flex-1 bg-secondary hover:bg-cyan-800 text-primary hover:text-white border-border rounded-xl text-xs font-semibold"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Formulário Modal */}
      <Dialog
        open={showForm}
        onOpenChange={() => {
          setShowForm(false);
          setEditingCompany(null);
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col bg-card border-border text-foreground shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6">
          <DialogHeader className="border-b border-border pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {editingCompany ? "Editar Empresa" : "Nova Empresa"}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
            <CompanyForm
              company={editingCompany}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingCompany(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalhes Modal */}
      <Dialog
        open={!!selectedCompany}
        onOpenChange={() => setSelectedCompany(null)}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col bg-card border-border text-foreground shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6">
          <DialogHeader className="border-b border-border pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Detalhes da Empresa
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
            {selectedCompany && <CompanyDetails company={selectedCompany} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
