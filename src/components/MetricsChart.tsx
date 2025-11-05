"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DataPoint {
  date: string;
  visits?: number;
  starts?: number;
  completes?: number;
  leads?: number;
}

interface MetricsChartProps {
  data: DataPoint[];
  groupBy: "day" | "month" | "year";
}

export default function MetricsChart({ data, groupBy }: MetricsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="visits" stroke="#8884d8" name="Visitas" />
          <Line type="monotone" dataKey="starts" stroke="#82ca9d" name="Inícios" />
          <Line type="monotone" dataKey="completes" stroke="#ffc658" name="Completos" />
          <Line type="monotone" dataKey="leads" stroke="#ff7300" name="Leads" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

