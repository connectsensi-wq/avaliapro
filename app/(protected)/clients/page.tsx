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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );

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

  const handleNew =  async () => {
    if (!selectedCompanyId) return;
    
    try {
      const res = await fetch(`/api/clients/maxcod?companyId=${selectedCompanyId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao buscar próximo código");

      const newClient: Partial<Client> = {
        code: data.nextCod, //novo código
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
        <Alert>
          <AlertDescription>
            Por favor, selecione uma empresa no menu lateral para gerenciar os
            clientes.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-600 mt-1">
            Gerencie os clientes da empresa
          </p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-slate-900 hover:bg-slate-800"
          disabled={!selectedCompanyId}
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Buscar por nome ou documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-40 bg-slate-200 rounded-lg"
                ></div>
              ))
          : filteredClients.map((client) => (
              <Card
                key={client.id}
                className="hover:shadow-lg transition-all duration-200 border-slate-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-900">
                          {client.name}
                        </CardTitle>
                        <p className="text-sm text-slate-500">
                          {client.document_type.toUpperCase()}:{" "}
                          {formatDocument(client.document, client.document_type)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        client.status === "active" ? "default" : "secondary"
                      }
                    >
                      {client.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1 text-sm text-slate-600">
                    {client.email && <p>{client.email}</p>}
                    {client.ddd && client.phone && (
                      <p>
                        ({client.ddd}) {client.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(client)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(client)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Formulário */}
      <Dialog
        open={showForm}
        onOpenChange={() => {
          setShowForm(false);
          setEditingClient(null);
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingClient(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Detalhes */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && <ClientDetails client={selectedClient} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
