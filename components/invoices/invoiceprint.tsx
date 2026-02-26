"use client";

import React from "react";
import { FileText } from "lucide-react";
import { Invoice, InvoiceServiceItem } from "@/src/types/invoice";
import { Professional } from "@/src/types/professional";
import { Company } from "@/src/types/company";
import { formatCpf, formatDate, formatDocument, toBRLDecimal } from "@/lib/utils";

interface InvoicePrintMultiProps {
  invoice: Invoice;
  professionals: Professional[];
  company?: Company | null;
}


export default function InvoicePrintMulti({
  invoice,
  professionals,
  company,
}: InvoicePrintMultiProps) {
  const handlePrint = () => {
    if (!invoice.service_items?.length) {
      alert("Nenhum profissional vinculado à nota fiscal.");
      return;
    }

    const getFullAddress = () => {
    const type = invoice.client?.address_type ?? "";
    const parts = [
      type.charAt(0).toUpperCase() + type.slice(1),
      invoice.client?.street,
      invoice.client?.number,
      invoice.client?.complement,
      invoice.client?.neighborhood,
      invoice.client?.cep,
      invoice.client?.city,
      invoice.client?.state,
    ]
      .filter(Boolean)
      .join(", ");
    return parts || "Endereço não informado";
  };

    // cria uma nova janela
    const win = window.open("", "_blank", "width=900,height=700");

    if (!win) return;

    win.document.title = `Demonstrativo NFS-e ${invoice.invoice_number}`;

    // monta o HTML completo
    const html = `
      <html>
        <head>
          <title></title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; font-size: 11.5px; color: #333; }
            header { display: flex; border-bottom: 2px solid #3e3e3e; padding-bottom: 10px; justify-content: space-between; margin-bottom: 20px; }
            header img { height: 40px; margin-top: 30px; }
            header .header-text { flex: 1; }
            h1 { font-size: 1.2em; margin-top: 40px; }
            h3 { margin-top: 5px; margin-bottom: 6px; font-size: 1em; font-weight: bold; color: #333; }
            .meta {color: #665; font-size: 1.1.em}
            .grid { display:grid; }
            .card { border: 1px solid #3e3e3e; padding: 12px; margin-bottom:20px; border-radius: 8px; background #fff; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.9em; }
            th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #6d6d6d; vertical-align: top; }
            th { width:20%; color: #444; font-weight: 600; background: #fafafa; }
            .right { text-align: rigth; }
            .totals { display:flex gap:20px; justify-content:flex-end; margin-top:12px; }
            .valor { text-align: right; }
            .small { font-size:1em; color: #555; }
            .highlight { font-weight: bold; color: #000; }
            footer { margin-top: 24px; border-top: 2px solid #000; padding-top: 10px; font-size: 0.85em; }
            .repasse { background: #f9f9f9; border: 1px solid #3e3e3e; padding: 10px; margin-top: 15px; border-radius: 6px; }
            @media print { 
              body { margin: 10mm; }
              header { page-break-before: always; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          ${invoice.service_items
            .map((item: InvoiceServiceItem, idx) => {
              const prof = professionals.find((p) => p.id === item.professional_id);
              const repasse =
                item.service_value -
                (item.service_value * (prof?.admin_fee_percentage || 0)) / 100;

              return `
              <header>
                <div class="header-text"  >
                  <h1>DEMONSTRATIVO NFS-e Nº ${invoice.invoice_number}</h1>
                  <div class="meta">${company?.name} | Data de inclusão: ${formatDate(invoice.issue_date)}</div>
                </div>
                <img src="logohorizontal.png" alt="Logo" />
              </header>

              <section class="grid">
                <div class="card">
                  <h3>Dados do Tomador do Serviço</h3>
                  <table>
                    <tr><th>Cliente:</th><td>${invoice.client?.name || ""}</td></tr>
                    <tr><th>${invoice.client?.document_type.toLocaleUpperCase()}:</th><td>${formatDocument(invoice.client?.document!, invoice.client?.document_type!) || ""}</td></tr>
                    <tr><th>Endereço:</th><td>${getFullAddress()}</td></tr>
                    <tr><th>Tefone:</th><td>${invoice.client?.phone}</td></tr>
                    <tr><th>E-mail:</th><td>${invoice.client?.email}</td></tr>
                  </table>
                </div>
              </section>

              <section class="grid">
                <div class="card">
                  <h3>Profissional Participante</h3>
                  <table>
                    <tr><th>Nome:</th><td>${prof?.name || "Profissional não identificado"}</td></tr>
                    <tr><th>CPF:</th><td>${formatCpf(prof?.cpf) || ""}</td></tr>
                    <tr><th>Id. Profissional:</th><td>${prof?.registration_number}</td></tr>
                  </table>
                  <h4>Informações Financeiras</h4>
                  <table>
                    <tr><th>Banco:</th><td>${prof?.bank || ""}</td><th>Tipo de Conta:</th><td>${prof?.account_type || ""}</td></tr>
                    <tr><th>Abgência:</th><td>${prof?.agency || ""}</td><th>C. Corrente:</th><td>${prof?.account || ""}</td></tr>
                    <tr><th>Chave Pix:</th><td>${prof?.pix_key_type?.toLocaleUpperCase() || ""}</td><th>Pix:</th><td>${prof?.pix_key || ""}</td></tr>
                  </table>
                </div>
              </section>

              <section class="grid">
                <div class="card">
                  <h3>Valores do Demonstrativo</h3>
                  <table>
                      <tr>
                        <th style="width:14%; text-align:center;">INSS</th>
                        <th style="width:14%; text-align:center;">IRPJ</th>
                        <th style="width:14%; text-align:center;">CSLL</th>
                        <th style="width:14%; text-align:center;">COFINS</th>
                        <th style="width:14%; text-align:center;">PIS</th>
                        <th style="width:15%; text-align:center;">Outras Retenções</th>
                        <th style="width:15%; text-align:right;">Valor Bruto</th>
                      </tr>
                      <tr>
                        <td style="text-align:center;">
                          ${toBRLDecimal((item.service_value * ((invoice.retentions?.inss_percentage || 0) / 100)).toFixed(2)) }
                        </td>
                        <td style="text-align:center;">
                          ${toBRLDecimal((item.service_value * ((invoice.retentions?.irpj_percentage || 0) / 100)).toFixed(2)) }
                        </td>
                        <td style="text-align:center;">
                          ${toBRLDecimal((item.service_value * ((invoice.retentions?.csll_percentage || 0) / 100)).toFixed(2)) }
                        </td>
                        <td style="text-align:center;">
                          ${toBRLDecimal((item.service_value * ((invoice.retentions?.cofins_percentage || 0) / 100)).toFixed(2)) }
                        </td>
                        <td style="text-align:center;">
                          ${toBRLDecimal((item.service_value * ((invoice.retentions?.pis_pasep_percentage || 0) / 100)).toFixed(2)) }
                        </td>
                        <td style="text-align:center;">
                          ${toBRLDecimal((item.service_value * ((invoice.retentions?.other_retentions_percentage || 0) / 100)).toFixed(2)) }
                        </td>
                        <td style="text-align:right;">
                          <strong>R$ ${toBRLDecimal(item.service_value.toFixed(2))}</strong>
                        </td>
                      </tr>                   
                  </table>
                  <h4 style="text-align:right;">Valor do Repasse ao Profissional: R$ ${toBRLDecimal(repasse.toFixed(2))}</h4>
                  <p style="margin-bottom:5px">${item.description}</p>
                </div>
              </section>

              <div class="repasse">
                <p><strong>Observações:</strong></p>
                <p>${invoice.observations}</p>
              </div>
              <footer></footer>

              ${idx < invoice.service_items!.length - 1 ? '<div class="page-break"></div>' : ""}
              `;
            })
            .join("")}

          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  return (
    <FileText
      onClick={handlePrint}
      className="w-5 h-5 text-slate-600 cursor-pointer hover:text-slate-900 transition"
    />
  );
}
