// @ts-nocheck
import * as XLSX from "xlsx";
import { BR_CLASS, LEAD_STATUS } from "./constants";

type Row = Record<string, unknown>;

export function toExportRows(leads: Row[]) {
  return leads.map((l) => ({
    Empresa: l.company_name, Empresario: l.owner_name, Segmento: l.segment, Pais: l.country, Cidade: l.city,
    Endereco: l.address, Email: l.email, StatusEmail: l.email_status, Telefone: l.phone, Website: l.website,
    Instagram: l.instagram, LinkedIn: l.linkedin,
    Classificacao: BR_CLASS[l.br_classification as keyof typeof BR_CLASS],
    Confianca: l.br_confidence, Score: l.score, Status: LEAD_STATUS[l.status as keyof typeof LEAD_STATUS],
    Fonte: l.source, Demonstracao: l.is_demo ? "sim" : "nao", Descoberto: l.discovered_at,
  }));
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function exportLeads(leads: Row[], format: "xlsx" | "csv" | "json") {
  const rows = toExportRows(leads);
  const stamp = new Date().toISOString().slice(0, 10);
  const name = `leads-${stamp}.${format}`;
  if (format === "json") return download(new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }), name);
  const ws = XLSX.utils.json_to_sheet(rows);
  if (format === "csv") return download(new Blob(["\ufeff" + XLSX.utils.sheet_to_csv(ws)], { type: "text/csv;charset=utf-8" }), name);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), name);
}
