"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarHeader, SidebarFooter, SidebarProvider, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, LayoutDashboard, Users, UserCheck, FileText, TrendingUp, TrendingDown, Stethoscope } from "lucide-react";

const navigationItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Empresas", url: "/companies", icon: Building2 },
  { title: "Especialidades", url: "/specialties", icon: Stethoscope },
  { title: "Serviços", url: "/services", icon: FileText },
  { title: "Profissionais", url: "/professionals", icon: UserCheck },
  { title: "Clientes", url: "/clients", icon: Users },
  { title: "Notas Fiscais", url: "/invoices", icon: FileText },
  { title: "Contas a Receber", url: "/accountsreceivable", icon: TrendingUp },
  { title: "Contas a Pagar", url: "/accountspayable", icon: TrendingDown },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    setSelectedCompany(company);
    localStorage.setItem("selectedCompanyId", companyId);
    window.location.reload();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-200 p-6">
            {/* Logo e título */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">HealthFinance</h2>
                <p className="text-xs text-slate-500">Sistema Financeiro</p>
              </div>
            </div>

            {/* Select de empresas */}
            {companies.length > 0 && (
              <div className="mt-4">
                <Select value={selectedCompany?.id || ""} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </SidebarHeader>

          {/* Menu */}
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Navegação</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className={`hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 rounded-lg mb-1 ${pathname === item.url ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-600"}`}>
                        <Link href={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            {selectedCompany && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-medium text-slate-900">{selectedCompany.name}</p>
                <p className="text-xs text-slate-500">{selectedCompany.cnpj}</p>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-semibold text-slate-900">HealthFinance</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-slate-50">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
