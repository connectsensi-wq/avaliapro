import { NextResponse } from "next/server";
import forge from "node-forge";

// Helper para formatar CPF
function formatCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Extrai CPF do Subject ou extensões SAN ICP-Brasil
function extractCpfFromCertificate(cert: forge.pki.Certificate): string | null {
  // 1. Procurar no CN (ex: "NOME DO TITULAR:12345678909")
  const cnField = cert.subject.getField("CN");
  if (cnField && typeof cnField.value === "string") {
    const cn = cnField.value;
    // Padrão ICP-Brasil: "NOME:12345678901"
    const colonMatch = cn.match(/:(\d{11})\b/);
    if (colonMatch && colonMatch[1]) {
      return colonMatch[1];
    }
    // Outros padrões com pontuação ou 11 dígitos no final
    const cpfFormattedMatch = cn.match(/\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/);
    if (cpfFormattedMatch && cpfFormattedMatch[1]) {
      const clean = cpfFormattedMatch[1].replace(/\D/g, "");
      if (clean.length === 11) return clean;
    }
    const elevenDigitsMatch = cn.match(/\b(\d{11})\b/);
    if (elevenDigitsMatch && elevenDigitsMatch[1]) {
      return elevenDigitsMatch[1];
    }
  }

  // 2. Procurar nas extensões (SAN - Subject Alternative Name / OID 2.16.76.1.3.1 para PF)
  try {
    const altNameExt = cert.getExtension("subjectAltName") as any;
    if (altNameExt && altNameExt.altNames) {
      for (const alt of altNameExt.altNames) {
        if (alt.type === 0 && alt.value) {
          // otherName
          const val = typeof alt.value === "string" ? alt.value : JSON.stringify(alt.value);
          const elevenDigits = val.match(/\d{11}/g);
          if (elevenDigits) {
            for (const d of elevenDigits) {
              if (d.length === 11) return d;
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn("Erro ao ler extensões do certificado:", e);
  }

  // 3. Procurar em todos os atributos do Subject
  for (const attr of cert.subject.attributes) {
    if (typeof attr.value === "string") {
      const match = attr.value.match(/:(\d{11})\b/) || attr.value.match(/\b(\d{11})\b/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  return null;
}

// Extrai o nome limpo do titular
function extractSubjectName(cert: forge.pki.Certificate): string {
  const cnField = cert.subject.getField("CN");
  if (cnField && typeof cnField.value === "string") {
    return cnField.value.trim();
  }
  return cert.subject.attributes
    .map((a) => `${a.shortName || a.name || ""}=${a.value || ""}`)
    .filter(Boolean)
    .join(", ");
}

// Extrai o emissor
function extractIssuerName(cert: forge.pki.Certificate): string {
  const cnField = cert.issuer.getField("CN");
  if (cnField && typeof cnField.value === "string") {
    return cnField.value.trim();
  }
  const oField = cert.issuer.getField("O");
  if (oField && typeof oField.value === "string") {
    return oField.value.trim();
  }
  return "Autoridade Certificadora";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const password = (formData.get("password") as string | null) || "";
    const professionalCpf = (formData.get("professionalCpf") as string | null) || "";
    const requestedType = (formData.get("certificateType") as string | null) || "A1";

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo de certificado foi enviado." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let cert: forge.pki.Certificate | null = null;
    let detectedType = requestedType;

    // Tentativa 1: PKCS#12 (.pfx / .p12)
    const isPfxP12 = fileName.endsWith(".pfx") || fileName.endsWith(".p12") || requestedType === "A1";
    if (isPfxP12 || buffer.length > 0) {
      try {
        const p12Der = buffer.toString("binary");
        const p12Asn1 = forge.asn1.fromDer(p12Der);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const bags = certBags[forge.pki.oids.certBag];
        if (bags && bags.length > 0) {
          cert = bags[0].cert || null;
        }

        if (!cert) {
          // Tentar procurar em outros bags
          const anyP12 = p12 as any;
          if (anyP12.bags) {
            for (const bagType in anyP12.bags) {
              const bagList = anyP12.bags[bagType];
              if (Array.isArray(bagList)) {
                for (const item of bagList) {
                  if (item.cert) {
                    cert = item.cert;
                    break;
                  }
                }
              }
              if (cert) break;
            }
          }
        }

        if (cert) {
          detectedType = "A1";
        }
      } catch (err: any) {
        // Se falhou por senha incorreta no formato PKCS#12
        const errMsg = err?.message || "";
        if (isPfxP12) {
          if (
            errMsg.includes("Invalid password") ||
            errMsg.includes("MAC is invalid") ||
            errMsg.includes("PKCS#12") ||
            errMsg.includes("mac")
          ) {
            return NextResponse.json(
              {
                error:
                  "Senha do certificado incorreta ou arquivo protegido por senha.",
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Tentativa 2: X.509 PEM
    if (!cert) {
      try {
        const pemText = buffer.toString("utf-8");
        if (pemText.includes("-----BEGIN CERTIFICATE-----")) {
          cert = forge.pki.certificateFromPem(pemText);
          detectedType = requestedType || "A3";
        }
      } catch {}
    }

    // Tentativa 3: X.509 DER (.cer / .crt / .der)
    if (!cert) {
      try {
        const der = buffer.toString("binary");
        const asn1 = forge.asn1.fromDer(der);
        cert = forge.pki.certificateFromAsn1(asn1);
        detectedType = requestedType || "A3";
      } catch {}
    }

    if (!cert) {
      return NextResponse.json(
        {
          error:
            "Não foi possível ler o certificado. Verifique se o arquivo está no formato correto (.pfx, .p12, .cer, .crt, .pem) e se a senha está correta.",
        },
        { status: 400 }
      );
    }

    // Extrair dados do certificado
    const subjectName = extractSubjectName(cert);
    const issuerName = extractIssuerName(cert);
    const extractedCpf = extractCpfFromCertificate(cert);
    const serialNumber = cert.serialNumber || "";
    const validFrom = cert.validity.notBefore;
    const validTo = cert.validity.notAfter;

    const now = new Date();
    const isExpired = now > validTo;
    const daysUntilExpiration = Math.ceil(
      (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Validação de CPF do profissional
    const cleanProfCpf = professionalCpf.replace(/\D/g, "");
    const cleanExtractedCpf = (extractedCpf || "").replace(/\D/g, "");

    if (cleanProfCpf) {
      if (!cleanExtractedCpf) {
        return NextResponse.json(
          {
            error:
              "Não foi possível identificar o CPF do titular no certificado digital.",
            extractedData: {
              subject: subjectName,
              issuer: issuerName,
              serialNumber,
              validFrom,
              validTo,
              isExpired,
            },
          },
          { status: 400 }
        );
      }

      if (cleanProfCpf !== cleanExtractedCpf) {
        return NextResponse.json(
          {
            error: `O CPF do certificado (${formatCpf(
              cleanExtractedCpf
            )}) não corresponde ao CPF do profissional cadastrado (${formatCpf(
              cleanProfCpf
            )}).`,
            extractedData: {
              cpf: cleanExtractedCpf,
              subject: subjectName,
              issuer: issuerName,
              serialNumber,
              validFrom,
              validTo,
              isExpired,
            },
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        valid: true,
        message: "Certificado validado com sucesso!",
        data: {
          certificate_type: detectedType,
          certificate_subject: subjectName,
          certificate_cpf: cleanExtractedCpf || null,
          certificate_issuer: issuerName,
          certificate_serial_number: serialNumber,
          certificate_valid_from: validFrom.toISOString(),
          certificate_valid_to: validTo.toISOString(),
          isExpired,
          daysUntilExpiration,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao validar certificado:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "Erro interno ao processar e validar o certificado digital.",
      },
      { status: 500 }
    );
  }
}
