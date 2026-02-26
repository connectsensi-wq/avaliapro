"use client";

import { InvoiceStatus} from "@/src/types/enums";
import { FC } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "lucide-react";


interface StatusUpdaterProps {
  invoiceId: string;
  currentStatus: InvoiceStatus;
  onStatusChange: (invoiceId: string, newStatus: InvoiceStatus) => void;
  locked: boolean
}

const statusConfig: Record<InvoiceStatus, { color: string }> = {
  "regular": { color: "bg-green-100 text-green-800" },
  "cancelada": { color: "bg-red-100 text-red-800" },
  "pendente_de_cancelamento": { color: "bg-yellow-100 text-yellow-800" },
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
  const config = statusConfig[currentStatus] || { color: "" };

  return (
    <Select value={currentStatus} onValueChange={(newStatus) => onStatusChange(invoiceId, newStatus as InvoiceStatus)}>
      <SelectTrigger className="w-auto border-none focus:ring-0" disabled={locked}>
        <SelectValue asChild>
          <Badge className={`${config.color} hover:bg-opacity-80`}>
            {getStatusLabel(currentStatus)}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((status) => (
          <SelectItem key={status} value={status}>
            {getStatusLabel(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusUpdater;