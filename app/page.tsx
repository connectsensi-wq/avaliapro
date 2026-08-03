import { Button } from "@/components/ui/button";
import { getRole } from "@/utils/roles";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Building2, FileText, Lock, ShieldCheck, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  const role = await getRole();
  const dashboardUrl = role ? `/${role}` : "/admin";

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#031415] text-slate-100 overflow-hidden font-sans">
      {/* Background Image with Dark Teal Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1920&auto=format&fit=crop"
          alt="VisionMED Gestão Hospitalar"
          fill
          priority
          className="object-cover object-center opacity-20 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#031415] via-[#031415]/85 to-[#062425]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00F5A0]/15 via-transparent to-transparent" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Official VisionMED Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logohorizontal.png"
              alt="VisionMED"
              width={200}
              height={50}
              className="h-10 sm:h-11 w-auto object-contain drop-shadow-md"
              priority
            />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium bg-[#003D38]/80 text-[#00F5A0] border border-[#00F5A0]/30 backdrop-blur-md shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[#00F5A0]" /> Acesso Restrito Interno
          </span>
          {userId && (
            <div className="p-1 rounded-full bg-[#072B2B] border border-[#00F5A0]/30 shadow-md">
              <UserButton />
            </div>
          )}
        </div>
      </header>

      {/* Main Welcome Hero */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl w-full text-center space-y-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#003D38]/90 border border-[#00F5A0]/30 text-[#00F5A0] text-xs sm:text-sm font-medium backdrop-blur-md shadow-lg shadow-[#00F5A0]/5">
            <Building2 className="h-4 w-4 text-[#00F5A0]" />
            Portal Administrativo de Operações
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Controle Financeiro & <br />
              <span className="bg-gradient-to-r from-[#00F5A0] via-[#00D09C] to-[#00A887] bg-clip-text text-transparent">
                Repasses Médico-Societários
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              Plataforma interna da <strong className="text-white font-semibold">VisionMED</strong> para faturamento de NFS-e hospitalar, automação de retenções fiscais e gestão de repasses com taxa de administração.
            </p>
          </div>

          {/* Single Action Button (CTA) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            {userId ? (
              <Link href={dashboardUrl} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-[#00F5A0] to-[#00A887] hover:from-[#00E090] hover:to-[#009678] text-slate-950 font-bold px-8 py-6 rounded-xl shadow-lg shadow-[#00F5A0]/25 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-3 text-base"
                >
                  Acessar Painel Administrativo
                  <ArrowRight className="h-5 w-5 text-slate-950" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-[#00F5A0] to-[#00A887] hover:from-[#00E090] hover:to-[#009678] text-slate-950 font-bold px-8 py-6 rounded-xl shadow-lg shadow-[#00F5A0]/25 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-3 text-base"
                >
                  <Lock className="h-5 w-5 text-slate-950" />
                  Acessar o Sistema (Login)
                  <ArrowRight className="h-5 w-5 text-slate-950" />
                </Button>
              </Link>
            )}
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 text-left">
            <div className="p-5 rounded-2xl bg-[#072526]/80 border border-[#00F5A0]/15 backdrop-blur-md space-y-2 hover:border-[#00F5A0]/40 transition-colors group">
              <div className="h-9 w-9 rounded-lg bg-[#00F5A0]/10 border border-[#00F5A0]/20 flex items-center justify-center text-[#00F5A0] group-hover:bg-[#00F5A0]/20 transition-colors">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Faturamento & NFS-e</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Emissão com retenções tributárias retidas na fonte (ISS, IRPJ, CSLL, PIS/COFINS).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#072526]/80 border border-[#00F5A0]/15 backdrop-blur-md space-y-2 hover:border-[#00F5A0]/40 transition-colors group">
              <div className="h-9 w-9 rounded-lg bg-[#00D09C]/10 border border-[#00D09C]/20 flex items-center justify-center text-[#00D09C] group-hover:bg-[#00D09C]/20 transition-colors">
                <Building2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Hospitais & Recebíveis</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Controle automático de contas a receber e conciliação de pagamentos dos clientes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#072526]/80 border border-[#00F5A0]/15 backdrop-blur-md space-y-2 hover:border-[#00F5A0]/40 transition-colors group">
              <div className="h-9 w-9 rounded-lg bg-[#00A887]/10 border border-[#00A887]/20 flex items-center justify-center text-[#00A887] group-hover:bg-[#00A887]/20 transition-colors">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white text-sm sm:text-base">Repasses Médicos</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Rateio multi-profissional por nota com dedução automática da taxa administrativa.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 text-center sm:flex sm:items-center sm:justify-between border-t border-[#00F5A0]/15 text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} VisionMED Gestão SensiConnect. Todos os direitos reservados.</p>
        <p className="mt-2 sm:mt-0 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#00F5A0]" />
          Ambiente Seguro de Uso Exclusivo Interno
        </p>
      </footer>
    </div>
  );
}