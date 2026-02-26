"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Search, Edit, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


import type { Company as CompanyType } from "@/lib/generated/prisma";
import CompanyForm from "@/components/companies/companyform";
import CompanyDetails from "@/components/companies/companydetails";
import { toast } from "sonner";
import { formatDocument } from "@/lib/utils";

export default function Companies() {
  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyType | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyType | null>(null);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/companies");
      const data: CompanyType[] = await res.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error loading companies:", error);
    }
    setIsLoading(false);
  }, []);

  const filterCompanies = useCallback(() => {
    const filtered = companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.document.includes(searchTerm)
    );
    setFilteredCompanies(filtered);
  }, [searchTerm, companies]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    filterCompanies();
  }, [filterCompanies]);

  const handleSave = async (companyData: Partial<CompanyType>) => {
    try {
      const method = editingCompany ? "PUT" : "POST";
      const url = editingCompany ? `/api/companies/${editingCompany.id}` : "/api/companies";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });
    
      const responseText = await res.text();
      console.log("Status:", res.status);
      console.log("Response:", responseText);

      if (!res.ok) throw new Error("Erro ao salvar empresa");
    
      toast.success(`Empresa ${editingCompany ? "atualizada" : "criada"} com sucesso!`);
      setShowForm(false);
      setEditingCompany(null);
      loadCompanies();
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error(`Erro ao salvar empresa: ${error}`);
    }
  };

  const handleEdit = (company: CompanyType) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleView = (company: CompanyType) => {
    setSelectedCompany(company);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Empresas</h1>
          <p className="text-slate-600 mt-1">Gerencie as empresas do sistema</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Buscar por nome ou documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-slate-200 rounded-lg"></div>
            </div>
          ))
        ) : (
          filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-all duration-200 border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-900">{company.name}</CardTitle>
                      {company.fantasy_name && <p className="text-sm text-slate-600">{company.fantasy_name}</p>}
                      <p className="text-sm text-slate-500">
                        {company.document_type?.toUpperCase()}: {formatDocument(company.document, company.document_type)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                    {company.status === 'active' ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {company.email && <p className="text-sm text-slate-600">{company.email}</p>}
                  {company.ddd && company.phone && <p className="text-sm text-slate-600">({company.ddd}) {company.phone}</p>}
                  {company.city && company.state && <p className="text-sm text-slate-600">{company.city}/{company.state}</p>}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleView(company)} className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(company)} className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Company Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
          </DialogHeader>
          {showForm && (
            <CompanyForm
              company={editingCompany || undefined}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingCompany(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Company Details Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Empresa</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <CompanyDetails
              company={selectedCompany}
              onEdit={() => {
                setSelectedCompany(null);
                handleEdit(selectedCompany);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
