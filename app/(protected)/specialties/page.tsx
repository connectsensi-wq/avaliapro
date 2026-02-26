"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Stethoscope, Search, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function SpecialtyForm({ specialty, onSave, onCancel }: any) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: specialty?.name || "",
    description: specialty?.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true)

    try{
      await onSave(formData);
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name">Nome da Especialidade *</label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="description">Descrição</label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={isSaving}>
          Salvar
        </Button>
      </div>
    </form>
  );
}

export default function Specialties() {
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [filteredSpecialties, setFilteredSpecialties] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<any>(null);
  const [deletingSpecialty, setDeletingSpecialty] = useState<any>(null);

  const loadSpecialties = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/specialties");
      const data = await res.json();
      setSpecialties(data);
      setFilteredSpecialties(data);
    } catch (error) {
      console.error("Error loading specialties:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  useEffect(() => {
    const filtered = specialties.filter((s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSpecialties(filtered);
  }, [searchTerm, specialties]);

  const handleSave = async (specialtyData: any) => {
    try {
      if (editingSpecialty) {
        await fetch(`/api/specialties/${editingSpecialty.id}`, {
          method: "PUT",
          body: JSON.stringify(specialtyData),
        });
      } else {
        await fetch(`/api/specialties`, {
          method: "POST",
          body: JSON.stringify(specialtyData),
        });
      }
      setShowForm(false);
      setEditingSpecialty(null);
      loadSpecialties();
    } catch (error) {
      console.error("Error saving specialty:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/specialties/${deletingSpecialty.id}`, {
        method: "DELETE",
      });
      setDeletingSpecialty(null);
      loadSpecialties();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleEdit = (specialty: any) => {
    setEditingSpecialty(specialty);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingSpecialty(null);
    setShowForm(true);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Especialidades</h1>
          <p className="text-slate-600 mt-1">Gerencie as especialidades médicas</p>
        </div>
        <Button onClick={handleNew} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-2" />
          Nova Especialidade
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="animate-pulse h-32 bg-slate-200 rounded-lg"></div>
            ))
        ) : (
          filteredSpecialties.map((specialty) => (
            <Card key={specialty.id} className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg text-slate-900">
                    <Stethoscope className="w-5 h-5 text-slate-600" />
                    {specialty.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(specialty)}>
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingSpecialty(specialty)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>

                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-2">{specialty.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={showForm}
        onOpenChange={() => {
          setShowForm(false);
          setEditingSpecialty(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSpecialty ? "Editar Especialidade" : "Nova Especialidade"}</DialogTitle>
          </DialogHeader>
          <SpecialtyForm
            specialty={editingSpecialty}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingSpecialty(null);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSpecialty} onOpenChange={() => setDeletingSpecialty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a especialidade "{deletingSpecialty?.code} - {deletingSpecialty?.description}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
