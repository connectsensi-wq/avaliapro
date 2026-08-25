"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck, Search, Edit, Eye, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ProfessionalForm from "@/components/professionals/professionalform";
import ProfessionalDetails from "@/components/professionals/professionaldetails";
import MonthBirthday from "@/components/professionals/monthbirthday";
import ExpiringCertificates from "@/components/professionals/expiringcertificates";
import { Professional } from "@/src/types/professional";
import { Specialty } from "@/lib/generated/prisma";
import { toast } from "sonner";
import { formatCpf } from "@/lib/utils";

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = localStorage.getItem("selectedCompanyId");
      if (companyId) {
        setSelectedCompanyId(companyId);

        const [profRes, specRes] = await Promise.all([
          fetch(`/api/professionals?companyId=${companyId}`),
          fetch(`/api/specialties`),
        ]);

        let profData: any[] = [];
        let specData: any[] = [];

        if (profRes.ok) {
          try {
            const text = await profRes.text();
            profData = text ? JSON.parse(text) : [];
          } catch (e) {
            console.error("Erro ao ler JSON de profissionais:", e);
          }
        }

        if (specRes.ok) {
          try {
            const text = await specRes.text();
            specData = text ? JSON.parse(text) : [];
          } catch (e) {
            console.error("Erro ao ler JSON de especialidades:", e);
          }
        }

        const safeProfList = Array.isArray(profData) ? profData : [];
        const safeSpecList = Array.isArray(specData) ? specData : [];

        setProfessionals(safeProfList);
        setFilteredProfessionals(safeProfList);
        setSpecialties(safeSpecList);
      } else {
        setProfessionals([]);
        setFilteredProfessionals([]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setProfessionals([]);
      setFilteredProfessionals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filterProfessionals = useCallback(() => {
    if (!Array.isArray(professionals)) {
      setFilteredProfessionals([]);
      return;
    }

    const filtered = professionals.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;

      const cpfNormalized = p.cpf?.replace(/\D/g, "") ?? "";
      const searchNormalized = searchTerm.replace(/\D/g, "");
      const cpfMatch = searchNormalized ? cpfNormalized.includes(searchNormalized) : false;

      const specialtyMatch = p.specialty?.name
        ? p.specialty.name.toLowerCase().includes(searchTerm.toLowerCase())
        : false;

      return nameMatch || cpfMatch || specialtyMatch;
    });
    setFilteredProfessionals(filtered);
  }, [searchTerm, professionals]);

  useEffect(() => {
    filterProfessionals();
  }, [filterProfessionals]);

  const handleSave = async (professionalData: Partial<Professional>) => {
    try {
      const dataToSave = {
        ...professionalData,
        companyId: selectedCompanyId,
      };

      if (editingProfessional?.id) {
        const res = await fetch(`/api/professionals/${editingProfessional.id}`, {
          method: "PUT",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro ao atualizar profissional");
        }
      } else {
        const res = await fetch(`/api/professionals`, {
          method: "POST",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erro ao criar profissional");
        }
      }

      toast.success(
        `Profissional ${editingProfessional?.id ? "atualizado" : "criado"} com sucesso!`
      );

      setShowForm(false);
      setEditingProfessional(null);
      await loadData();
    } catch (error: any) {
      console.error("Erro ao salvar profissional:", error);
      toast.error(error.message || "Erro ao salvar profissional.");
    }
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setShowForm(true);
  };

  const handleView = (professional: Professional) => {
    setSelectedProfessional(professional);
  };

  const handleNew = async () => {
    if (!selectedCompanyId) return;

    try {
      const res = await fetch(`/api/professionals/maxcod?companyId=${selectedCompanyId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao buscar próximo código");

      const newProf: Partial<Professional> = {
        code: data.nextCod,
      };

      setEditingProfessional(newProf as Professional);
      setShowForm(true);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar código do Profissional");
    }
  };

  if (!selectedCompanyId && !isLoading) {
    return (
      <div className="p-8">
        <Alert className="bg-card border-border text-foreground rounded-2xl">
          <AlertDescription className="text-xs font-semibold text-muted-foreground">
            Por favor, selecione uma empresa no menu lateral para gerenciar o corpo médico.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans text-foreground">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#002B27] via-[#003833] to-[#002421] border border-[#004D46]  px-6 py-5 rounded-2xl shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sidebar-primary/10 border border-sidebar-primary/20 text-sidebar-primary text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-sidebar-primary animate-pulse" />
              Cadastros & Equipe Médica
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              Corpo Médico & Profissionais
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Gerencie os médicos e profissionais cadastrados no quadro societário da empresa
            </p>
          </div>

          <Button
            onClick={handleNew}
            disabled={!selectedCompanyId}
            className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 border-none text-xs"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[3]" />
            Novo Profissional
          </Button>
        </div>
      </div>

      {/* Widgets Informativos: Aniversariantes do Mês & Certificados a Vencer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MonthBirthday data={professionals} />
        <ExpiringCertificates data={professionals} />
      </div>

      {/* Search & Metric Counter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-sidebar-primary w-4 h-4" />
          <Input
            placeholder="Buscar por nome, CPF ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-banner-via border-border text-white placeholder:text-muted-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
          />
        </div>
        <div className="text-xs font-semibold text-muted-foreground bg-banner-to border border-border px-4 py-2 rounded-xl">
          Total: <span className="text-sidebar-primary font-bold">{filteredProfessionals.length}</span> profissional(is)
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-48 bg-card border-none rounded-2xl"></div>
          ))
          : filteredProfessionals.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-card border border-border rounded-2xl p-6">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">Nenhum profissional encontrado</h3>
              <p className="text-xs text-muted-foreground mt-1">Tente pesquisar por outro termo ou cadastre um novo profissional.</p>
            </div>
          ) : (
            filteredProfessionals.map((professional) => (
              <Card
                key={professional.id}
                className="bg-card border-none transition-all duration-300 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 hover:overflow-hidden flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-secondary border border-border rounded-xl flex items-center justify-center text-primary shrink-0">
                        <UserCheck className="w-5.5 h-5.5 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <CardTitle className="text-base font-bold text-foreground min-w-0 overflow-hidden" title={professional.name}>
                          {professional.name}
                        </CardTitle>
                        <p className="text-xs text-primary font-semibold truncate">
                          {professional.specialty?.name || "Sem Especialidade"} - Registro: {professional.registration_number || "N/A"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${professional.status === "active"
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-secondary text-muted-foreground border-border"
                        }`}
                    >
                      {professional.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="space-y-1 text-xs text-muted-foreground bg-secondary/50 p-3 rounded-xl border-none">
                    <p className="font-mono flex justify-between">
                      <span className="text-muted-foreground">CPF:</span>
                      <span className="text-foreground font-semibold">{formatCpf(professional.cpf) || "N/A"}</span>
                    </p>
                    <p className="flex justify-between truncate">
                      <span className="text-muted-foreground">E-mail:</span>
                      <span className="text-foreground truncate ml-2" title={professional.email || undefined}>{professional.email || "N/A"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Taxa Admin:</span>
                      <span className="text-primary font-bold">{professional.admin_fee_percentage}%</span>
                    </p>
                    <div className="flex justify-between items-center pt-1 border-t border-border/40 text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Certificado:
                      </span>
                      {professional.certificate_valid_to ? (
                        new Date() > new Date(professional.certificate_valid_to) ? (
                          <span className="text-red-500 font-bold">Expirado</span>
                        ) : (
                          <span className="text-emerald-500 font-bold">
                            {professional.certificate_type || "A1"} (Ativo)
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground">Não cadastrado</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(professional)}
                      className="flex-1 bg-secondary hover:bg-cyan-800 text-primary hover:text-white border-border rounded-xl text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(professional)}
                      className="flex-1 bg-secondary hover:bg-cyan-800 text-primary hover:text-white border-border rounded-xl text-xs font-semibold"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditingProfessional(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-card border-border text-foreground shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6">
          <DialogHeader className="border-b border-border pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              {editingProfessional?.id ? "Editar Profissional" : "Novo Profissional"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
            <ProfessionalForm
              professional={editingProfessional}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingProfessional(null); }}
              specialties={specialties}
              existingProfessionals={professionals}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!selectedProfessional} onOpenChange={() => setSelectedProfessional(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-card border-border text-foreground shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6">
          <DialogHeader className="border-b border-border pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Detalhes do Profissional
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
            {selectedProfessional && <ProfessionalDetails professional={selectedProfessional} specialties={specialties} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
