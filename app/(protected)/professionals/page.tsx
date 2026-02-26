"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck, Search, Edit, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Professional } from "@/src/types/professional";
import { Specialty } from "@/lib/generated/prisma";
import ProfessionalForm from "@/components/professionals/professionalform";
import { toast } from "sonner";
import ProfessionalDetails from "@/components/professionals/professionaldetails";
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

  // Load professionals and specialties
  const loadProfessionals = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = localStorage.getItem("selectedCompanyId");
      if (!companyId) {
        setProfessionals([]);
        setFilteredProfessionals([]);
        setSpecialties([]);
        setSelectedCompanyId(null);
        return;
      }

      setSelectedCompanyId(companyId);

      // Fetch professionals
      const profRes = await fetch(`/api/professionals?companyId=${companyId}`);
      if (!profRes.ok) throw new Error("Erro ao carregar profissionais");
      const profData: Professional[] = await profRes.json();

      // Fetch specialties
      const specRes = await fetch(`/api/specialties?companyId=${companyId}`);
      if (!specRes.ok) throw new Error("Erro ao carregar especialidades");
      const specData: Specialty[] = await specRes.json();

      setProfessionals(profData);
      setFilteredProfessionals(profData);
      setSpecialties(specData);
    } catch (error) {
      console.error("Erro ao carregar profissionais:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfessionals();
  }, [loadProfessionals]);

  // Filter professionals by name, CPF, or specialty
  const filterProfessionals = useCallback(() => {
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
  }, [searchTerm, professionals]);

  //Função para bloquear o usuário no Clerk
  const lockClerkUser = async (clerkUserId: string) => {
    try {
      const res = await fetch(`/api/professionals/${clerkUserId}/lock-user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        // É importante logar/toast se o bloqueio falhar, mas não interromper o fluxo principal
        console.error("Falha ao bloquear o usuário no Clerk:", await res.json());
        toast.warning("Profissional atualizado, mas houve falha ao bloquear a conta Clerk.");
      } else {
        toast.success("Conta Clerk do profissional bloqueada.");
      }
    } catch (error) {
      console.error("Erro na comunicação com a API de bloqueio do Clerk:", error);
      toast.warning("Profissional atualizado, mas houve erro ao tentar bloquear a conta Clerk.");
    }
  };

  // Função para desbloquear o usuário no Clerk
  const unlockClerkUser = async (clerkUserId: string) => {
    try {
      const res = await fetch(`/api/professionals/${clerkUserId}/unlock-user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        console.error("Falha ao desbloquear o usuário no Clerk:", await res.json());
        toast.warning("Profissional atualizado, mas houve falha ao desbloquear a conta Clerk.");
      } else {
        toast.success("Conta Clerk do profissional desbloqueada.");
      }
    } catch (error) {
      console.error("Erro na comunicação com a API de desbloqueio do Clerk:", error);
      toast.warning("Profissional atualizado, mas houve erro ao tentar desbloquear a conta Clerk.");
    }
  };


  // Save or update professional
  const handleSave = async (professionalData: Partial<Professional>) => {
    if (!selectedCompanyId) return;

    // 1. Lógica para bloqueio (Active -> Inactive)
    const isStatusChangeToInactive =
      editingProfessional &&
      editingProfessional.status === "active" &&
      professionalData.status === "inactive";

    // 2. Lógica para desbloqueio (Inactive -> Active)
    const isStatusChangeToActive =
      editingProfessional &&
      editingProfessional.status === "inactive" &&
      professionalData.status === "active";

    try {
      const dataToSave = { ...professionalData, companyId: selectedCompanyId };
      let res;

      if (editingProfessional?.id) {
        // Atualização no DB
        res = await fetch(`/api/professionals/${editingProfessional.id}`, {
          method: "PUT",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });

        // *** LÓGICA DE SINCRONIZAÇÃO CLERK ***
        if (isStatusChangeToInactive && editingProfessional.clerkUserId) {
          await lockClerkUser(editingProfessional.clerkUserId);
        } else if (isStatusChangeToActive && editingProfessional.clerkUserId) {
          await unlockClerkUser(editingProfessional.clerkUserId);
        }
        // *************************************
      } else {
        // Criação via POST
        res = await fetch(`/api/professionals`, {
          method: "POST",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await res.json();

      if (!res.ok) {
        // Mostra mensagem vinda do backend (CPF/E-mail duplicado, etc)
        toast.error(result.error || "Falha ao salvar o profissional.");
        return;
      }

      toast.success(
        `Profissional ${
          editingProfessional ? "atualizado" : "criado"
        } com sucesso!`
      );

      setShowForm(false);
      setEditingProfessional(null);
      loadProfessionals();
    } catch (error) {
      console.error("Erro ao salvar profissional:", error);
      toast.error("Erro inesperado ao salvar profissional.");
    }
  };

  // Open edit form
  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setShowForm(true);
  };

  // Open details modal
  const handleView = (professional: Professional) => {
    setSelectedProfessional(professional);
  };

  // Open new form
  const handleNew = async () => {
    if (!selectedCompanyId) return;

    try {
      const res = await fetch(`/api/professionals/maxcod?companyId=${selectedCompanyId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao buscar próximo código");

      const newProfessional: Partial<Professional> = {
        code: data.nextCod, //novo código
      };

      setEditingProfessional(newProfessional as Professional); // envia para o form
      setShowForm(true);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar código do profissional");
    }
  };


  if (!selectedCompanyId && !isLoading) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>
            Por favor, selecione uma empresa no menu lateral para gerenciar os profissionais.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Profissionais</h1>
          <p className="text-slate-600 mt-1">Gerencie os profissionais da empresa</p>
        </div>
        <Button onClick={handleNew} className="bg-slate-900 hover:bg-slate-800" disabled={!selectedCompanyId}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Profissional
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Buscar por nome, CPF ou especialidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse h-44 bg-slate-200 rounded-lg"></div>
            ))
          : filteredProfessionals.map((professional) => (
              <Card key={professional.id} className="hover:shadow-lg transition-all duration-200 border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-900">{professional.name}</CardTitle>
                        <p className="text-sm text-slate-500">{professional.specialty?.name}</p>
                      </div>
                    </div>
                    <Badge variant={professional.status === "active" ? "default" : "secondary"}>
                      {professional.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>CPF: {formatCpf(professional.cpf)}</p>
                    <p>Email: {professional.email}</p>
                    <p>Taxa Admin: {professional.admin_fee_percentage}%</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleView(professional)} className="flex-1">
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(professional)} className="flex-1">
                      <Edit className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Form */}
      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditingProfessional(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProfessional ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
          </DialogHeader>
          <ProfessionalForm
            professional={editingProfessional}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingProfessional(null); }}
            specialties={specialties}
          />
        </DialogContent>
      </Dialog>

      {/* Details */}
      <Dialog open={!!selectedProfessional} onOpenChange={() => setSelectedProfessional(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Profissional</DialogTitle>
          </DialogHeader>
          {selectedProfessional && <ProfessionalDetails professional={selectedProfessional} specialties={specialties} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
