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
import { Plus, Users, Search, Edit, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ClientForm from "@/components/clients/clientform";
import ClientDetails from "@/components/clients/clientdetails";
import { Client } from "@/src/types/client";
import { toast } from "sonner";
import { formatDocument } from "@/lib/utils";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = localStorage.getItem("selectedCompanyId");
      if (companyId) {
        setSelectedCompanyId(companyId);

        const res = await fetch(`/api/clients?companyId=${companyId}`);
        const data = await res.json();

        setClients(data);
        setFilteredClients(data);
      } else {
        setClients([]);
        setFilteredClients([]);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filterClients = useCallback(() => {
    const filtered = clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.document?.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  useEffect(() => {
    filterClients();
  }, [filterClients]);

  const handleSave = async (clientData: Partial<Client>) => {
    try {
      const dataToSave = { ...clientData, companyId: selectedCompanyId };

      if (editingClient?.id) {
        await fetch(`/api/clients/${editingClient.id}`, {
          method: "PUT",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await fetch(`/api/clients`, {
          method: "POST",
          body: JSON.stringify(dataToSave),
          headers: { "Content-Type": "application/json" },
        });
      }

      toast.success(`Cliente ${editingClient ? "atualizado" : "criado"} com sucesso!`);
      setShowForm(false);
      setEditingClient(null);
      loadClients();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleView = (client: Client) => {
    setSelectedClient(client);
  };

  const handleNew = async () => {
    if (!selectedCompanyId) return;

    try {
      const res = await fetch(`/api/clients/maxcod?companyId=${selectedCompanyId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao buscar próximo código");

      const newClient: Partial<Client> = {
        code: data.nextCod,
      };

      setEditingClient(newClient as Client);
      setShowForm(true);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar código do Cliente");
    }
  };

  if (!selectedCompanyId && !isLoading) {
    return (
      <div className="p-8">
        <Alert className="bg-card border-border text-foreground rounded-2xl">
          <AlertDescription className="text-xs font-semibold text-muted-foreground">
            Por favor, selecione uma empresa no menu lateral para gerenciar os clientes.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans text-foreground">
      {/* Banner Executivo */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[var(--banner-from)] via-[var(--banner-via)] to-[var(--banner-to)] border border-[var(--banner-border)] px-6 py-5 rounded-2xl shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sidebar-primary/10 border border-sidebar-primary/20 text-sidebar-primary text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-sidebar-primary animate-pulse" />
              Cadastros & Hospitais/Clínicas
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              Clientes, Hospitais e Clínicas Contratantes
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm">
              Gerencie a carteira de clientes, hospitais e clínicas contratantes dos serviços médicos
            </p>
          </div>

          <Button
            onClick={handleNew}
            disabled={!selectedCompanyId}
            className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-primary-foreground font-bold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 border-none text-xs"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[3]" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Busca & Contador */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-sidebar-primary w-4 h-4" />
          <Input
            placeholder="Buscar por nome, razão social ou CNPJ/CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-banner-via border-border text-white placeholder:text-muted-foreground focus:ring-1 focus:ring-ring rounded-xl text-sm"
          />
        </div>
        <div className="text-xs font-semibold text-muted-foreground bg-banner-to border border-border px-4 py-2 rounded-xl">
          Total: <span className="text-sidebar-primary font-bold">{filteredClients.length}</span> cliente(s)
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-48 bg-card border border-border rounded-2xl"
              ></div>
            ))
          : filteredClients.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-card border border-border rounded-2xl p-6">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">Nenhum cliente encontrado</h3>
              <p className="text-xs text-muted-foreground mt-1">Tente pesquisar por outro termo ou cadastre um novo cliente.</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <Card
                key={client.id}
                className="bg-card border-border transition-all duration-300 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 hover:overflow-hidden flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-secondary border border-border rounded-xl flex items-center justify-center text-primary shrink-0">
                        <Users className="w-5.5 h-5.5 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <CardTitle className="text-base font-bold text-foreground min-w-0 overflow-hidden" title={client.name}>
                          {client.name}
                        </CardTitle>
                        <p className="text-[11px] font-mono text-primary bg-secondary/80 px-2 py-0.5 rounded border border-border inline-block mt-1">
                          {client.document_type?.toUpperCase()}: {formatDocument(client.document, client.document_type)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${client.status === "active"
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-secondary text-muted-foreground border-border"
                        }`}
                    >
                      {client.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="space-y-1 text-xs text-muted-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                    {client.email ? (
                      <p className="truncate" title={client.email}>
                        <span className="text-muted-foreground">E-mail: </span>
                        <span className="text-foreground">{client.email}</span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">Sem e-mail cadastrado</p>
                    )}
                    {client.ddd && client.phone ? (
                      <p className="font-mono">
                        <span className="text-muted-foreground">Tel: </span>
                        <span className="text-foreground">({client.ddd}) {client.phone}</span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">Sem telefone cadastrado</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(client)}
                      className="flex-1 bg-secondary hover:bg-cyan-800 text-primary hover:text-white border-border rounded-xl text-xs font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(client)}
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

      {/* Formulário Modal */}
      <Dialog
        open={showForm}
        onOpenChange={() => {
          setShowForm(false);
          setEditingClient(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-card border-border text-foreground shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6">
          <DialogHeader className="border-b border-border pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {editingClient?.id ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
            <ClientForm
              client={editingClient}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingClient(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalhes Modal */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-card border-border text-foreground shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-6">
          <DialogHeader className="border-b border-border pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Detalhes do Cliente
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
            {selectedClient && <ClientDetails client={selectedClient} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
