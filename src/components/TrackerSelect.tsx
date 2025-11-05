"use client";

import { useEffect, useState, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Tracker {
  id: string;
  trackerId: string;
  name: string;
}

interface TrackerSelectProps {
  value?: string;
  onChange: (trackerId: string) => void;
}

export default function TrackerSelect({ value, onChange }: TrackerSelectProps) {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrackers = useCallback(async () => {
    try {
      const res = await fetch("/api/trackers");
      if (res.ok) {
        const data = await res.json();
        setTrackers(data);
        if (data.length > 0 && !value) {
          onChange(data[0].trackerId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch trackers:", err);
    } finally {
      setLoading(false);
    }
  }, [value, onChange]);

  useEffect(() => {
    fetchTrackers();
  }, [fetchTrackers]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Tracker</Label>
        <div className="h-10 w-full rounded-md border bg-gray-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Tracker</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-[250px]">
          <SelectValue placeholder="Selecione um tracker" />
        </SelectTrigger>
        <SelectContent>
          {trackers.map((tracker) => (
            <SelectItem key={tracker.trackerId} value={tracker.trackerId}>
              {tracker.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

