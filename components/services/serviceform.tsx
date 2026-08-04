"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Service } from "@/src/types/entities";
import { toast } from "sonner";

interface ServiceFormProps {
  service?: Service | null;
  onSave: (data: Partial<Service>) => void;
  onCancel: () => void;
}

export default function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Service>>({
    code: service?.code || 0,
    description: service?.description || "",
  });

  useEffect(() => {
    if (service) {
      setFormData({
        code: service.code,
        description: service.description,
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!formData.description?.trim()) {
      toast.error("A descrição do serviço é obrigatória.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans text-foreground pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Código *</Label>
        <Input
          type="number"
          value={formData.code || ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, code: parseInt(e.target.value) || 0 }))}
          required
          disabled={!!service?.id}
          className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Descrição do Serviço *</Label>
        <Textarea
          value={formData.description || ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Ex: Plantão Médico UTI Neonatal 12h..."
          required
          className="bg-background border-border text-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm min-h-[90px]"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-secondary hover:bg-secondary/80 text-foreground border-border rounded-xl text-xs font-semibold"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 rounded-xl text-xs shadow-md border-none"
        >
          {isSaving ? "Salvando..." : service?.id ? "Atualizar" : "Criar"} Serviço
        </Button>
      </div>
    </form>
  );
}
