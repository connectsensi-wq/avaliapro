"use client";

import { InvoiceStatus } from "@/src/types/enums";
import { FC } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";

interface StatusUpdaterProps {
  invoiceId: string;
  currentStatus: InvoiceStatus;
  onStatusChange: (invoiceId: string, newStatus: InvoiceStatus) => void;
  locked: boolean;
}

const statusConfig: Record<InvoiceStatus, { color: string }> = {
  regular: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  cancelada: { color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
  pendente_de_cancelamento: { color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
};

const getStatusLabel = (status: InvoiceStatus) => {
  switch (status) {
    case "regular":
      return "Regular";
    case "pendente_de_cancelamento":
      return "Pendente de Cancelamento";
    case "cancelada":
      return "Cancelada";
    default:
      return status;
  }
};

const statusOptions: InvoiceStatus[] = ["regular", "pendente_de_cancelamento", "cancelada"];

const StatusUpdater: FC<StatusUpdaterProps> = ({ invoiceId, currentStatus, onStatusChange, locked }) => {
  const config = statusConfig[currentStatus] || { color: "bg-secondary text-muted-foreground border-border" };

  return (
    <Select value={currentStatus} onValueChange={(newStatus) => onStatusChange(invoiceId, newStatus as InvoiceStatus)}>
      <SelectTrigger className="w-auto h-auto p-0 border-none bg-transparent focus:ring-0 focus:outline-none" disabled={locked}>
        <SelectValue placeholder={getStatusLabel(currentStatus)}>
          <Badge className={`${config.color} border px-2.5 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer hover:opacity-80 transition-opacity`}>
            {getStatusLabel(currentStatus)}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-emerald-100 border-none text-popover-foreground rounded-xl">
        {statusOptions.map((status) => (
          <SelectItem
            key={status}
            value={status}
            className="
              focus:bg-accent 
              focus:text-foreground 
              text-xs text-foreground
              hover:bg-emerald-200
              focus:bg-emerald-300">
            {getStatusLabel(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusUpdater;