"use client";

import { useState } from "react";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { ptBR, enUS, fr, es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

const locales = { pt: ptBR, en: enUS, fr: fr, es: es };
const locale = ptBR;

interface DateRangePickerProps {
  from?: number;
  to?: number;
  onChange: (from: number | undefined, to: number | undefined) => void;
}

const presets = [
  { label: "Hoje", getRange: () => ({ from: Date.now(), to: Date.now() }) },
  { label: "Últimos 7 dias", getRange: () => ({ from: subDays(new Date(), 6).getTime(), to: Date.now() }) },
  { label: "Últimos 30 dias", getRange: () => ({ from: subDays(new Date(), 29).getTime(), to: Date.now() }) },
  { label: "Mês atual", getRange: () => ({ from: startOfMonth(new Date()).getTime(), to: Date.now() }) },
  { label: "Ano atual", getRange: () => ({ from: startOfYear(new Date()).getTime(), to: Date.now() }) },
];

export default function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [fromDate, setFromDate] = useState(from ? format(new Date(from), "yyyy-MM-dd") : "");
  const [toDate, setToDate] = useState(to ? format(new Date(to), "yyyy-MM-dd") : "");

  const handlePreset = (preset: typeof presets[0]) => {
    const { from: f, to: t } = preset.getRange();
    setFromDate(format(new Date(f), "yyyy-MM-dd"));
    setToDate(format(new Date(t), "yyyy-MM-dd"));
    onChange(f, t);
  };

  const handleFromChange = (value: string) => {
    setFromDate(value);
    if (value && toDate) {
      onChange(new Date(value).getTime(), new Date(toDate).getTime());
    }
  };

  const handleToChange = (value: string) => {
    setToDate(value);
    if (fromDate && value) {
      onChange(new Date(fromDate).getTime(), new Date(value).getTime());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="from-date" className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            De
          </Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => handleFromChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="to-date" className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            Até
          </Label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => handleToChange(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

