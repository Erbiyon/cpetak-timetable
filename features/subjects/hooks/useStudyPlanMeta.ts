import { useState, useEffect } from "react";

export interface TermItem {
  id: number;
  name: string;
}

export interface YearLevelItem {
  id: number;
  name: string;
}

export function useStudyPlanMeta() {
  const [year, setYear] = useState<string>("");
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [yearLevels, setYearLevels] = useState<YearLevelItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear() + 543;
        if (isMounted) setYear(currentYear.toString());

        const [termRes, yearRes] = await Promise.all([
          fetch("/api/term"),
          fetch("/api/year-level"),
        ]);

        if (termRes.ok && isMounted) {
          const termData = await termRes.json();
          setTerms(termData);
        }

        if (yearRes.ok && isMounted) {
          const yearData = await yearRes.json();
          setYearLevels(yearData);
        }
      } catch (error) {
        console.error("Error fetching study plan meta:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
  };

  return {
    year,
    setYear,
    handleYearChange,
    terms,
    yearLevels,
    loading,
  };
}

