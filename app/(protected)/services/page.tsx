"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { toast } from "sonner";
import { Service } from "@/src/types/entities";
import ServiceForm from "@/components/services/serviceform";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = localStorage.getItem("selectedCompanyId");
      if (companyId) {
        setSelectedCompanyId(companyId);

        const res = await fetch(`/api/services?companyId=${companyId}`);
        const data = await res.json();
        setServices(data);
        setFilteredServices(data);
      } else {
        setServices([]);
        setFilteredServices([]);
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      toast.error("Erro ao carregar lista de serviços.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const filterServices = useCallback(() => {
    const filtered = services.filter(
      (s) =>
        s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toString().includes(searchTerm)
    );
    setFilteredServices(filtered);
  }, [searchTerm, services]);

  useEffect(() => {
    filterServices();
  }, [filterServices]);

  const handleSave = async (serviceData: Partial<Service>) => {
    try {
      const dataToSave = { ...serviceData, companyId: selectedCompanyId };

      if (editingService?.id) {
        await fetch(`/api/services/${editingService.id}`, {
          method: "PUT",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await fetch("/api/services", {
          method: "POST",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });
      }

      toast.success(`Serviço ${editingService ? "atualizado" : "criado"} com sucesso!`);
      setShowForm(false);
      setEditingService(null);
      loadServices();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      toast.error("Erro ao salvar serviço.");
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;

    try {
      const res = await fetch(`/api/services/${deletingService.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao excluir serviço");
      }

      toast.success("Serviço excluído com sucesso!");
      setDeletingService(null);
      loadServices();
    } catch (error: any) {
      console.error("Erro ao excluir serviço:", error);
      toast.error(error.message || "Erro ao excluir serviço.");
    }
  };

  const handleNew = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans text-foreground">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#002B27] via-[#003833] to-[#002421] border border-[#004D46] px-6 py-5 rounded-2xl shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Cadastros & Operacional
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              Catálogo de Serviços
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Gerencie os procedimentos e serviços cadastrados para emissão de notas fiscais
            </p>
          </div>

          <Button
            onClick={handleNew}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 border-none text-xs"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[3]" />
            Novo Serviço
          </Button>
        </div>
      </div>

      {/* Search & Metric Counter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4" />
          <Input
            placeholder="Buscar por código ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-banner-via border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
          />
        </div>
        <div className="text-xs font-semibold text-muted-foreground bg-banner-to border border-border px-4 py-2 rounded-xl">
          Total: <span className="text-primary font-bold">{filteredServices.length}</span> serviço(s)
        </div>
      </div>

      {/* Services List Card */}
      <Card className="bg-card border-card-border rounded-2xl shadow-md overflow-hidden">
        <CardHeader className="py-4 px-6 border-b border-border">
          <CardTitle className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Lista de Serviços Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground text-xs font-medium">
              <div className="animate-pulse">Carregando catálogo de serviços...</div>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-secondary border border-border rounded-xl flex items-center justify-center text-primary shrink-0 shadow-inner">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-mono font-bold text-primary bg-secondary px-2 py-0.5 rounded border border-border">
                          CÓD: {service.code}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground text-xs">
                        {service.description}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      className="bg-secondary hover:bg-secondary/80 text-primary border-border rounded-xl text-xs font-semibold"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingService(service)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-500 border-red-500/30  h-8 w-8 p-0 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground text-sm">
              <FileText className="w-8 h-8 text-primary mx-auto opacity-80 mb-2" />
              Nenhum serviço encontrado para o filtro aplicado.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={() => {
          setShowForm(false);
          setEditingService(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border text-popover-foreground shadow-2xl rounded-2xl p-6">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {editingService?.id ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
          </DialogHeader>

          <ServiceForm
            service={editingService}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingService(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deletingService}
        onOpenChange={() => setDeletingService(null)}
      >
        <AlertDialogContent className="bg-popover border-border text-popover-foreground rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Tem certeza que deseja excluir o serviço CÓD{" "}
              <strong className="text-foreground">{deletingService?.code}</strong>? Esta ação não pode ser desfeita.
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
