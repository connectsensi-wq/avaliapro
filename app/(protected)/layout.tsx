"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  Building2,
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  TrendingUp,
  TrendingDown,
  Bell,
  Settings,
  ChevronDownIcon,
  Menu,
  Grid2x2Plus,
  ArrowLeftRight,
  Percent,
  Stethoscope,
  Receipt,
} from "lucide-react";

const registerItems = [
  { name: 'Empresas', description: 'Gerencie a estrutura societária e empresas administradas', href: '/companies', icon: Building2 },
  { name: 'Especialidades', description: 'Gerencie a qualificação técnica e especialidades cadastradas no sistema', href: '/specialties', icon: Stethoscope },
  { name: 'Serviços', description: 'Gerencie os procedimentos e serviços cadastrados para emissão de notas fiscais', href: '/services', icon: FileText },
  { name: 'Profissionais', description: 'Gerencie os médicos e profissionais cadastrados no quadro societário da empresa', href: '/professionals', icon: UserCheck },
  { name: 'Clientes', description: 'Gerencie a carteira de clientes, hospitais e clínicas contratantes dos serviços médicos', href: '/clients', icon: Users },
];

const financialItems = [
  { name: 'Notas Fiscais', description: 'Gerencie a emissão, retenções tributárias e acompanhamento de NFS-e da empresa', href: '/invoices', icon: Receipt },
  { name: 'Contas a Receber', description: 'Acompanhe a liquidação de NFS-e emitidas para hospitais e clínicas contratantes', href: '/accountsreceivable', icon: TrendingUp },
  { name: 'Contas a Pagar', description: 'Gerencie a liquidação de repasses aos médicos com desconto automático da taxa de administração', href: '/accountspayable', icon: TrendingDown },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openRegisterPopover, setOpenRegisterPopover] = useState(false);
  const [openFinancialPopover, setOpenFinancialPopover] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav aria-label="Global" className="mx-auto flex max-w-8xl items-center justify-between p-4 gap-4">

          {/* Logo & Seletor de Empresa */}
          <div className="flex items-center gap-4 lg:flex-1">
            <Link href="/admin" className="-m-1.5 p-1.5 flex items-center">
              <span className="sr-only">VisionMED</span>
              <Image
                src="/logohorizontal.png"
                alt="VisionMED"
                width={170}
                height={42}
                className="h-7 w-auto object-contain drop-shadow"
                priority
              />
            </Link>

            {/* Seletor de Empresa */}
            {companies.length > 0 && (
              <div className="w-48 sm:w-56 hidden lg:flex">
                <Select value={selectedCompany?.id || ""} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="w-full text-xs bg-transparent border-none rounded-full focus:ring-1 focus:ring-emerald-500 shadow-none">
                    <SelectValue placeholder="Selecionar empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-emerald-100 shadow-xl border-slate-200">
                    {companies.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        className="text-xs hover:bg-emerald-200
                                   focus:bg-emerald-200
                                   data-[state=checked]:bg-emerald-300
                                   data-[state=checked]:text-white"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Menus Desktop (Visível em LG+) */}
          <div className="hidden lg:flex items-center bg-transparent rounded-full border-none p-1 gap-1 border border-green-100">
            <Button
              asChild
              className={`bg-transparent hover:bg-emerald-200 border-none rounded-full text-sm font-semibold shadow-none ${pathname === "/admin" ? "bg-emerald-200 text-emerald-900" : "text-slate-700"
                }`}
            >
              <Link href="/admin">Dashboard</Link>
            </Button>

            <Popover open={openRegisterPopover} onOpenChange={setOpenRegisterPopover}>
              <PopoverTrigger asChild>
                <Button className="group bg-transparent hover:bg-emerald-200 border-none rounded-full flex items-center gap-x-1 text-sm font-semibold text-slate-700 shadow-none">
                  Cadastros & Operacional
                  <ChevronDownIcon aria-hidden="true" className="size-4 flex-none text-gray-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-slate-900 rounded-2xl p-2 border-slate-800 shadow-2xl">
                <div className="p-2 space-y-1">
                  {registerItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpenRegisterPopover(false)}
                      className="group relative flex items-center gap-x-3 rounded-xl p-2 text-sm/6 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-gray-800 group-hover:bg-emerald-600 transition-colors">
                        <item.icon aria-hidden="true" className="size-4 text-gray-300 group-hover:text-white" />
                      </div>
                      <div className="flex-auto">
                        <span className="block font-semibold text-white">{item.name}</span>
                        <p className="text-gray-400 text-xs line-clamp-1">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={openFinancialPopover} onOpenChange={setOpenFinancialPopover}>
              <PopoverTrigger asChild>
                <Button className="group bg-transparent hover:bg-emerald-200 border-none rounded-full flex items-center gap-x-1 text-sm font-semibold text-slate-700 shadow-none">
                  Financeiro & Repasses
                  <ChevronDownIcon aria-hidden="true" className="size-4 flex-none text-gray-500" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-slate-900 rounded-2xl p-2 border-slate-800 shadow-2xl">
                <div className="p-2 space-y-1">
                  {financialItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpenFinancialPopover(false)}
                      className="group relative flex items-center gap-x-3 rounded-xl p-2 text-sm/6 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-gray-800 group-hover:bg-emerald-600 transition-colors">
                        <item.icon aria-hidden="true" className="size-4 text-gray-300 group-hover:text-white" />
                      </div>
                      <div className="flex-auto">
                        <span className="block font-semibold text-white">{item.name}</span>
                        <p className="text-gray-400 text-xs line-clamp-1">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              asChild
              className={`bg-transparent hover:bg-emerald-200 border-none rounded-full text-sm font-semibold shadow-none ${pathname === "/taxes" ? "bg-emerald-200 text-emerald-900" : "text-slate-700"
                }`}
            >
              <Link href="/taxes">Projeção de Impostos</Link>
            </Button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Button size="icon" className="text-slate-700 size-9 rounded-full bg-green-50 hover:bg-emerald-200 ">
              <Settings className="size-5" />
            </Button>
            <Button size="icon" className="text-slate-700 relative size-9 rounded-full bg-green-50 hover:bg-emerald-200 ">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            <div className="flex items-center justify-center size-9 rounded-full bg-green-50 hover:bg-emerald-200">
              <UserButton />
            </div>
          </div>

          <div className="flex lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100"
            >
              <span className="sr-only">Abrir menu principal</span>
              <Menu className="size-6" />
            </button>
          </div>
        </nav>
      </header>

      <Drawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} direction="right">
        <DrawerContent className="lg:hidden p-4 max-w-xs ml-auto">
          <DrawerHeader className="px-2 pt-2 pb-4 border-b border-gray-100 flex items-start borber-b border-gray-300 mb-4">
            <DrawerTitle className="text-lg font-bold text-slate-800">Menu</DrawerTitle>
          </DrawerHeader>
          {/* Seletor de Empresa */}
          {companies.length > 0 && (
            <div className="w-60 sm:w-56">
              <Select value={selectedCompany?.id || ""} onValueChange={handleCompanyChange}>
                <SelectTrigger className="w-full h-8 text-xs bg-slate-50 border-slate-200 rounded-full focus:ring-1 focus:ring-emerald-500 shadow-none">
                  <SelectValue placeholder="Selecionar empresa" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-xl">
                  {companies.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="text-xs hover:bg-[#B9F8CF]/70
                                 focus:bg-[#B9F8CF]/70
                                 data-[state=checked]:bg-[#B9F8CF]
                                 data-[state=checked]:text-black"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="py-4 space-y-3 overflow-y-auto max-h-[calc(100vh-100px)]">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <LayoutDashboard className="size-5 text-emerald-600" />
              <span>Dashboard</span>
            </Link>

            <Accordion type="single" collapsible className="w-full border-none">
              <AccordionItem value="register" className="border-none">
                <AccordionTrigger className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:no-underline py-2">
                  <div className="flex items-center gap-x-3">
                    <Grid2x2Plus className="size-5 text-emerald-600" />
                    <span>Cadastros & Operacional</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-2 pl-4 pr-2 space-y-1">
                  {registerItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-x-3 rounded-md p-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <div className="flex size-7 flex-none items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <item.icon aria-hidden="true" className="size-4" />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Accordion type="single" collapsible className="w-full border-none">
              <AccordionItem value="financial" className="border-none">
                <AccordionTrigger className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:no-underline py-2">
                  <div className="flex items-center gap-x-3">
                    <ArrowLeftRight className="size-5 text-emerald-600" />
                    <span>Financeiro & Repasses</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-2 pl-4 pr-2 space-y-1">
                  {financialItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-x-3 rounded-md p-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <div className="flex size-7 flex-none items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <item.icon aria-hidden="true" className="size-4" />
                      </div>
                      <span className="truncate">{item.name}</span>
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Link
              href="/taxes"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Percent className="size-5 text-emerald-600" />
              <span>Projeção de Impostos</span>
            </Link>


            <div className="my-2 border-t border-gray-300 pt-4 space-y-1">
              <a href="#" className="flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                <Settings className="size-5 text-slate-500" />
                <span>Configurações</span>
              </a>
              <a href="#" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-x-3">
                  <Bell className="size-5 text-slate-500" />
                  <span>Notificações</span>
                </div>
                <span className="flex size-2 rounded-full bg-red-500"></span>
              </a>
            </div>
          </div>

          <div className="mt-auto border-t border-gray-100 pt-4 px-2 flex items-center gap-x-3">
            <UserButton />
            <span className="text-sm font-medium text-slate-700">Minha Conta</span>
          </div>
        </DrawerContent>
      </Drawer>

      <main className="relative flex-1 overflow-auto bg-slate-50/90 p-4 sm:p-6 md:p-8">
        {/* Fundo Abstrato com Luz Vetorial Esmeralda/Verde */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[120px]" />
          <div className="absolute -bottom-32 left-1/4 w-[600px] h-[600px] rounded-full bg-teal-400/10 blur-[140px]" />
          <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]" />
        </div>

        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
