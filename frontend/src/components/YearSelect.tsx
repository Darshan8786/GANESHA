import { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";
import { api } from "../api/client";

interface Props {
  value: number;
  onChange: (year: number) => void;
}

export function YearSelect({ value, onChange }: Props) {
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    let alive = true;
    api
      .get("/receipts/years")
      .then((res) => {
        const list: number[] = Array.isArray(res.data.years) ? res.data.years : [];
        if (!list.includes(value)) list.push(value);
        list.sort((a, b) => b - a);
        if (alive) setYears(list);
      })
      .catch(() => {
        if (alive) setYears([value]);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <CalendarRange size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input !py-2 !pl-9 !pr-8 !rounded-xl font-bold text-brand-green appearance-none w-full"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}