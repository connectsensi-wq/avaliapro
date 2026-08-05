"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Stethoscope } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Specialty } from "@/lib/generated/prisma";
import { toast } from "sonner";

export default function Specialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [filteredSpecialties, setFilteredSpecialties] = useState<Specialty[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [deletingSpecialty, setDeletingSpecialty] = useState<Specialty | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const loadSpecialties = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/specialties");
      const data = await res.json();
      setSpecialties(data);
      setFilteredSpecialties(data);
    } catch (error) {
      console.error("Erro ao carregar especialidades:", error);
      toast.error("Erro ao carregar especialidades.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  const filterSpecialties = useCallback(() => {
    const filtered = specialties.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSpecialties(filtered);
  }, [searchTerm, specialties]);

  useEffect(() => {
    filterSpecialties();
  }, [filterSpecialties]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!formData.name.trim()) {
      toast.error("O nome da especialidade é obrigatório.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingSpecialty) {
        await fetch(`/api/specialties/${editingSpecialty.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await fetch("/api/specialties", {
          method: "POST",
          body: JSON.stringify(formData),
          headers: { "Content-Type": "application/json" },
        });
      }

      toast.success(`Especialidade ${editingSpecialty ? "atualizada" : "criada"} com sucesso!`);
      setShowForm(false);
      setEditingSpecialty(null);
      setFormData({ name: "", description: "" });
      loadSpecialties();
    } catch (error) {
      console.error("Erro ao salvar especialidade:", error);
      toast.error("Erro ao salvar especialidade.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSpecialty) return;

    try {
      const res = await fetch(`/api/specialties/${deletingSpecialty.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao excluir especialidade");
      }

      toast.success("Especialidade excluída com sucesso!");
      setDeletingSpecialty(null);
      loadSpecialties();
    } catch (error: any) {
      console.error("Erro ao excluir especialidade:", error);
      toast.error(error.message || "Erro ao excluir especialidade.");
    }
  };

  const handleEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name,
      description: specialty.description || "",
    });
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingSpecialty(null);
    setFormData({ name: "", description: "" });
    setShowForm(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans text-foreground">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#002B27] via-[#003833] to-[#002421] border border-[#004D46] px-6 py-5 rounded-2xl shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sidebar-primary/10 border border-sidebar-primary/20 text-sidebar-primary text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-sidebar-primary animate-pulse" />
              Cadastros & Categorização Médica
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              Especialidades Médicas
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Gerencie a qualificação técnica e especialidades cadastradas no sistema
            </p>
          </div>
          <Button
            onClick={handleNew}
            className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 border-none text-xs"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[3]" />
            Nova Especialidade
          </Button>
        </div>
      </div>

      {/* Search & Counter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-sidebar-primary w-4 h-4" />
          <Input
            placeholder="Buscar especialidade por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-banner-via border-border text-white placeholder:text-muted-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
          />
        </div>
        <div className="text-xs font-semibold text-muted-foreground bg-banner-to border border-border px-4 py-2 rounded-xl">
          Total: <span className="text-sidebar-primary font-bold">{filteredSpecialties.length}</span> especialidade(s)
        </div>
      </div>

      {/* Specialties Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="animate-pulse h-36 bg-card border border-border rounded-2xl"></div>
            ))
        ) : filteredSpecialties.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-card border border-border rounded-2xl p-6">
            <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Nenhuma especialidade encontrada</h3>
            <p className="text-xs text-muted-foreground mt-1">Tente pesquisar por outro termo ou cadastre uma nova especialidade.</p>
          </div>
        ) : (
          filteredSpecialties.map((specialty) => (
            <Card
              key={specialty.id}
              className="bg-card border-border transition-all duration-300 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 hover:overflow-hidden flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary border border-border rounded-xl flex items-center justify-center text-primary shrink-0">
                      <Stethoscope className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">{specialty.name}</CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(specialty)}
                      className="bg-secondary hover:bg-secondary/80 text-primary border-border h-8 w-8 p-0 rounded-lg"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingSpecialty(specialty)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-500 border-red-500/30  h-8 w-8 p-0 rounded-lg"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {specialty.description || "Sem descrição cadastrada."}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Form Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={() => {
          setShowForm(false);
          setEditingSpecialty(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border text-popover-foreground shadow-2xl rounded-2xl p-6">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              {editingSpecialty ? "Editar Especialidade" : "Nova Especialidade"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cardiologia"
                required
                className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional..."
                className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingSpecialty(null);
                }}
                className="bg-secondary hover:bg-secondary/80 text-foreground border-border rounded-xl text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-sidebar-primary hover:bg-cyan-800 text-primary-foreground hover:text-white font-bold px-6 rounded-xl text-xs shadow-md border-none"
              >
                {isSaving ? "Salvando..." : editingSpecialty ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deletingSpecialty}
        onOpenChange={() => setDeletingSpecialty(null)}
      >
        <AlertDialogContent className="bg-popover border-border text-popover-foreground rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">Excluir Especialidade</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Tem certeza que deseja excluir a especialidade{" "}
              <strong className="text-foreground">{deletingSpecialty?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-secondary hover:bg-secondary/80 text-foreground border-border rounded-xl text-xs font-semibold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold border-none"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
