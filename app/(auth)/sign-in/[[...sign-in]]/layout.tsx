import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, FileCheck2, ShieldCheck, Stethoscope } from "lucide-react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex bg-[#031415] text-slate-100 overflow-hidden font-sans">
      {/* Form Section (Left Side) */}
      <div className="w-full md:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-12 z-10 relative bg-[#031415]/95 border-r border-[#00F5A0]/15">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-block transition-opacity hover:opacity-90">
            <Image
              src="/logohorizontal.png"
              alt="VisionMED"
              width={180}
              height={45}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#003D38]/80 text-[#00F5A0] border border-[#00F5A0]/30 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" /> Uso Interno
          </span>
        </div>

        {/* Center Auth Form Container */}
        <div className="my-auto py-8 flex items-center justify-center">
          {children}
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-400 text-center sm:text-left flex items-center justify-between border-t border-[#00F5A0]/10 pt-4">
          <p>&copy; {new Date().getFullYear()} VisionMED SensiConnect</p>
          <p className="hidden sm:block text-slate-500">Sistema Financeiro Restrito</p>
        </div>
      </div>

      {/* Brand Hero Showcase Section (Right Side) */}
      <div className="hidden md:flex md:w-1/2 relative min-h-screen items-center justify-center p-12 overflow-hidden bg-slate-950">
        {/* Background Medical Hero Image */}
        <Image
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1920&auto=format&fit=crop"
          alt="VisionMED Gestão Hospitalar"
          fill
          priority
          className="object-cover object-center opacity-30 filter blur-[0.5px]"
        />
        {/* Dark Teal Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#031415] via-[#031415]/85 to-[#062425]/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00F5A0]/20 via-transparent to-transparent" />

        {/* Hero Content Card */}
        <div className="relative z-10 max-w-lg space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#003D38]/90 border border-[#00F5A0]/30 text-[#00F5A0] text-xs font-semibold backdrop-blur-md shadow-lg shadow-[#00F5A0]/10">
            <Stethoscope className="h-4 w-4 text-[#00F5A0]" />
            Plataforma de Operações Financeiras
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            Gestão de NFS-e & <br />
            <span className="bg-gradient-to-r from-[#00F5A0] via-[#00D09C] to-[#00A887] bg-clip-text text-transparent">
              Repasses Societários Médicos
            </span>
          </h2>

          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
            Faça login para gerenciar o faturamento de hospitais, automação de retenções fiscais na fonte e repasses com taxa de administração.
          </p>

          {/* Feature Badges */}
          <div className="space-y-3 pt-4 border-t border-[#00F5A0]/15">
            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center text-[#00F5A0] shrink-0">
                <FileCheck2 className="h-3 w-3" />
              </div>
              <span>Emissão de NFS-e de forma prática e segura</span>
            </div>

            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center text-[#00F5A0] shrink-0">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <span>Rateio multi-profissional proporcional por nota fiscal</span>
            </div>

            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 flex items-center justify-center text-[#00F5A0] shrink-0">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <span>Controle integrado de Contas a Receber e Pagar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
