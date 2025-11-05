"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface GranularitySelectProps {
  value: "day" | "month" | "year";
  onChange: (value: "day" | "month" | "year") => void;
}

export default function GranularitySelect({ value, onChange }: GranularitySelectProps) {
  return (
    <div className="space-y-2">
      <Label>Granularidade</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Dia</SelectItem>
          <SelectItem value="month">Mês</SelectItem>
          <SelectItem value="year">Ano</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

