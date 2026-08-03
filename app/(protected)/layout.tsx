"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  TrendingUp,
  TrendingDown,
  Stethoscope,
  Receipt,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { formatDocument } from "@/lib/utils";

const navigationGroups = [
  {
    label: "Visão Geral",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Cadastros & Operacional",
    items: [
      { title: "Empresas", url: "/companies", icon: Building2 },
      { title: "Especialidades", url: "/specialties", icon: Stethoscope },
      { title: "Serviços", url: "/services", icon: FileText },
      { title: "Profissionais", url: "/professionals", icon: UserCheck },
      { title: "Clientes", url: "/clients", icon: Users },
    ],
  },
  {
    label: "Financeiro & Repasses",
    items: [
      { title: "Notas Fiscais", url: "/invoices", icon: Receipt },
      { title: "Contas a Receber", url: "/accountsreceivable", icon: TrendingUp },
      { title: "Contas a Pagar", url: "/accountspayable", icon: TrendingDown },
    ],
  },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const loadCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      setCompanies(data);

      if (data.length > 0) {
        const storedCompanyId = localStorage.getItem("selectedCompanyId");
        let initialCompany = data[0];
        if (storedCompanyId) {
          const foundCompany = data.find((c: any) => c.id === storedCompanyId);
          if (foundCompany) initialCompany = foundCompany;
        }
        setSelectedCompany(initialCompany);
        localStorage.setItem("selectedCompanyId", initialCompany.id);
      }
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    setSelectedCompany(company);
    localStorage.setItem("selectedCompanyId", companyId);
    window.location.reload();
  };

  // Find active item title for top header
  const allItems = navigationGroups.flatMap((g) => g.items);
  const activeItem = allItems.find((item) => pathname === item.url);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground font-sans antialiased">
        {/* Sidebar estilizada usando variáveis CSS globais */}
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">

          {/* Header da Sidebar com Logo e Selector de Empresa */}
          <SidebarHeader className="border-b border-sidebar-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Link href="/admin" className="flex items-center gap-2 group transition-transform duration-200 hover:scale-[1.02]">
                <Image
                  src="/logohorizontal.png"
                  alt="VisionMED"
                  width={170}
                  height={42}
                  className="h-9 w-auto object-contain drop-shadow"
                  priority
                />
              </Link>
            </div>

            {/* Select de empresas com visual Premium */}
            {companies.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5 opacity-90">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  Empresa Ativa
                </label>
                <Select value={selectedCompany?.id || ""} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="w-full bg-input border-border text-foreground focus:ring-1 focus:ring-ring focus:border-primary rounded-xl h-10 shadow-inner">
                    <SelectValue placeholder="Selecionar empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground shadow-xl">
                    {companies.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        className="focus:bg-accent focus:text-accent-foreground cursor-pointer rounded-lg my-0.5"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </SidebarHeader>

          {/* Menu Grupos de Navegação */}
          <SidebarContent className="p-3 space-y-4">
            {navigationGroups.map((group) => (
              <SidebarGroup key={group.label} className="p-0">
                <SidebarGroupLabel className="text-[10px] font-bold text-primary/70 uppercase tracking-widest px-3 py-1.5">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`group relative transition-all duration-200 rounded-xl px-3 py-2.5 flex items-center justify-between ${isActive
                              ? "bg-primary/15 text-primary font-semibold border-l-4 border-primary shadow-sm"
                              : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                              }`}
                          >
                            <Link href={item.url} className="flex items-center gap-3 w-full">
                              <item.icon
                                className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                                  }`}
                              />
                              <span className="text-sm font-medium">{item.title}</span>
                              {isActive && (
                                <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary opacity-80" />
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          {/* Rodapé da Sidebar com Card de Perfil e Empresa */}
          <SidebarFooter className="border-t border-sidebar-border p-4 bg-sidebar">
            {selectedCompany && (
              <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex items-center justify-between">
                <div className="truncate space-y-0.5">
                  <p className="text-xs font-semibold text-foreground truncate">{selectedCompany.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">CNPJ: {formatDocument(selectedCompany.document, selectedCompany.document_type) || "Não informado"}</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" title="Empresa Ativa" />
              </div>
            )}

            {/* User Details & Sign Out Button */}
            <div className="flex items-center justify-between pt-2 px-1">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-0.5 rounded-full bg-secondary border border-primary/30">
                  <UserButton />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-medium text-foreground truncate">
                    {user?.fullName || user?.firstName || "Usuário"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user?.primaryEmailAddress?.emailAddress || "Logado"}
                  </span>
                </div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Área de Conteúdo Principal */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
          {/* Top Header Bar */}
          <header className="h-16 bg-sidebar border-b border-sidebar-border px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-secondary p-2 rounded-xl transition-colors duration-200" />
              <div className="h-4 w-px bg-sidebar-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {activeItem ? activeItem.title : "Painel"}
                </h1>
                {selectedCompany && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-primary border border-primary/20">
                    <Sparkles className="w-3 h-3 text-primary" />
                    {selectedCompany.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary/80 text-primary border border-primary/30 shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Sistema Ativo
              </span>
            </div>
          </header>

          {/* Área Principal de Renderização da Rota */}
          <div className="flex-1 overflow-auto bg-background p-4 sm:p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

