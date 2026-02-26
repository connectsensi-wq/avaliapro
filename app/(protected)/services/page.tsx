"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Search, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function ServiceForm({ service, onSave, onCancel }: any) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    code: service?.code || "",
    description: service?.description || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);

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
        <label htmlFor="code">Código *</label>
        <Input
          id="code"
          type="number"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: parseInt(e.target.value) || "" })}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="description">Descrição *</label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
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

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [deletingService, setDeletingService] = useState<any>(null);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      setServices(data);
      setFilteredServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const filterServices = useCallback(() => {
    const filtered = services.filter(service =>
      service.code?.toString().includes(searchTerm) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [searchTerm, services]);

  useEffect(() => {
    filterServices();
  }, [filterServices]);

  const handleSave = async (serviceData: any) => {
    try {
      if (editingService) {
        await fetch(`/api/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serviceData),
        });
      } else {
        await fetch(`/api/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serviceData),
        });
      }
      setShowForm(false);
      setEditingService(null);
      loadServices();
    } catch (error) {
      console.error("Error saving service:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/services/${deletingService.id}`, {
        method: "DELETE",
      });
      setDeletingService(null);
      loadServices();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleNew = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setShowForm(true);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Serviços</h1>
          <p className="text-slate-600 mt-1">Gerencie os serviços disponíveis</p>
        </div>
        <Button onClick={handleNew} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Buscar por código ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">Carregando serviços...</div>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredServices.map((service) => (
                <div key={service.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {service.code} - {service.description}
                      </h4>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingService(service)}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum serviço encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Form Dialog */}
      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditingService(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <ServiceForm
            service={editingService}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingService(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingService} onOpenChange={() => setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{deletingService?.code} - {deletingService?.description}"?
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
