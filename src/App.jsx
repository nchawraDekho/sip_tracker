import React, { useState, useEffect, useRef, useMemo } from "react";
import { Line, Bar, Pie, Area } from "recharts";
import {
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import * as Select from "@radix-ui/react-select";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronDown,
  Check,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://srtqlkhwyslggmuowxmi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VTd4qwbXTIKnzlyPSOfzlg_uDdJ1KB_";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];
const SIP_OPTIONS = ["Parag Parikh Flexi Cap", "ICICI Prudential Bluechip"];
const YEAR_OPTIONS = ["2025", "2026", "2027"];
const MONTH_OPTIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Custom Hooks
const useHasViewed = (options = { threshold: 0.1 }) => {
  const ref = useRef(null);
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasViewed) setHasViewed(true);
    }, options);

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options, hasViewed]);

  return [ref, hasViewed];
};

// Components
const AnimatedNumber = ({
  value,
  duration = 1500,
  prefix = "",
  suffix = "",
  decimals = 0,
  start = false,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!start) {
      setDisplayValue(0);
      return;
    }
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.abs(value) * eased * (value >= 0 ? 1 : -1));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [start, value, duration]);

  const rounded =
    Math.round(displayValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
  const absRounded = Math.abs(rounded);
  const sign = rounded < 0 ? "-" : "";
  const formatted =
    decimals === 0
      ? absRounded.toLocaleString("en-IN")
      : absRounded.toFixed(decimals);

  return (
    <>
      {prefix}
      {sign}
      {formatted}
      {suffix}
    </>
  );
};

const StatsCard = ({
  theme,
  title,
  value,
  color,
  subtitle,
  icon,
  hasViewed = false,
}) => (
  <div
    style={{
      background: theme.cardBg,
      borderRadius: "1rem",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
      border: `1px solid ${theme.cardBorder}`,
      opacity: hasViewed ? 1 : 0,
      transform: hasViewed ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = hasViewed
        ? "translateY(0)"
        : "translateY(20px)";
      e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
    }}
  >
    <div
      style={{
        fontSize: "0.875rem",
        color: theme.mutedText,
        marginBottom: "0.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      {icon}
      {title}
    </div>
    <div style={{ fontSize: "2rem", fontWeight: "bold", color }}>
      <AnimatedNumber value={value} prefix="₹" decimals={0} start={hasViewed} />
    </div>
    {subtitle !== undefined && (
      <div style={{ fontSize: "0.875rem", color, marginTop: "0.25rem" }}>
        <AnimatedNumber
          value={subtitle}
          prefix={subtitle >= 0 ? "+" : ""}
          decimals={2}
          suffix="%"
          start={hasViewed}
        />
      </div>
    )}
  </div>
);

const ChartCard = React.forwardRef(
  ({ theme, title, children, hasViewed = false }, ref) => (
    <div
      ref={ref}
      style={{
        background: theme.cardBg,
        borderRadius: "1rem",
        padding: "2rem",
        marginBottom: "3rem",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        border: `1px solid ${theme.cardBorder}`,
        opacity: hasViewed ? 1 : 0,
        transform: hasViewed ? "translateY(0)" : "translateY(30px)",
        transition:
          "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}
    >
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1.5rem",
          color: theme.text,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          opacity: hasViewed ? 1 : 0.3,
          transform: hasViewed ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  )
);
ChartCard.displayName = "ChartCard";

const CustomTooltip = ({ active, payload, theme }) => {
  if (!active || !payload?.length) return null;

  const invested = payload[0].value;
  const current = payload[1]?.value || 0;
  const diff = current - invested;
  const diffPercent = invested > 0 ? (diff / invested) * 100 : 0;

  return (
    <div
      style={{
        background: theme.tooltipBg,
        border: `1px solid ${theme.tooltipBorder}`,
        borderRadius: "0.5rem",
        padding: "0.75rem",
        color: theme.text,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
        {payload[0].payload.month}
      </div>
      <div style={{ color: "#3b82f6" }}>
        Invested: ₹{invested.toLocaleString("en-IN")}
      </div>
      <div style={{ color: current >= invested ? "#10b981" : "#ef4444" }}>
        Current: ₹{current.toLocaleString("en-IN")}
      </div>
      <div
        style={{
          color: diff >= 0 ? "#10b981" : "#ef4444",
          fontWeight: "bold",
          marginTop: "0.5rem",
          paddingTop: "0.5rem",
          borderTop: `1px solid ${theme.cardBorder}`,
        }}
      >
        {diff >= 0 ? "+" : ""}₹{diff.toLocaleString("en-IN")} (
        {diffPercent.toFixed(2)}%)
      </div>
    </div>
  );
};

const CustomSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  theme,
}) => (
  <Select.Root value={value} onValueChange={onValueChange}>
    <Select.Trigger
      style={{
        background: theme.inputBg,
        border: `1px solid ${theme.inputBorder}`,
        borderRadius: "0.5rem",
        padding: "0.75rem",
        color: theme.text,
        fontSize: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        minWidth: "150px",
      }}
    >
      <Select.Value placeholder={placeholder} />
      <Select.Icon>
        <ChevronDown size={16} />
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content
        style={{
          background: theme.selectBg,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: "0.5rem",
          padding: "0.5rem",
          zIndex: 100,
          boxShadow: "0 10px 38px -10px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Select.Viewport>
          {options.map((option) => (
            <Select.Item
              key={option}
              value={option.toString()}
              style={{
                padding: "0.5rem 0.75rem",
                cursor: "pointer",
                borderRadius: "0.25rem",
                color: theme.text,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                outline: "none",
              }}
            >
              <Select.ItemText>{option}</Select.ItemText>
              <Select.ItemIndicator>
                <Check size={16} color="#10b6d4" />
              </Select.ItemIndicator>
            </Select.Item>
          ))}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
);

function App() {
  const [sipName, setSipName] = useState("");
  const [amount, setAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("");
  const [sips, setSips] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [statsRef, statsHasViewed] = useHasViewed({ threshold: 0.3 });
  const [growthRef, growthHasViewed] = useHasViewed();
  const [allocRef, allocHasViewed] = useHasViewed();
  const [trendRef, trendHasViewed] = useHasViewed();
  const [sipGrowthRef, sipGrowthHasViewed] = useHasViewed();
  const [profitRef, profitHasViewed] = useHasViewed();
  const [returnsRef, returnsHasViewed] = useHasViewed();
  const [yearRef, yearHasViewed] = useHasViewed();
  const [tableRef, tableHasViewed] = useHasViewed();
  const [yearProfitRef, yearProfitHasViewed] = useHasViewed();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const fetchSips = async () => {
      try {
        const { data, error } = await supabase
          .from("sip_investments")
          .select("*")
          .order("year", { ascending: true })
          .order("month", { ascending: true });
        if (error) throw error;
        setSips(
          data?.map((s) => ({
            sipName: s.sipname,
            amount: s.amount,
            currentAmount: s.currentamount,
            year: s.year,
            month: s.month,
          })) || []
        );
      } catch (err) {
        console.error("Failed to load from Supabase:", err);
        alert("Failed to load SIP data from Supabase.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSips();
  }, []);

  const addSIP = async () => {
    if (!sipName || !amount || !currentAmount || !year || !month) {
      alert("Please fill all fields including current value");
      return;
    }
    const newSip = {
      sipname: sipName,
      amount: parseFloat(amount),
      currentamount: parseFloat(currentAmount),
      year: parseInt(year),
      month,
    };
    try {
      const { data, error } = await supabase
        .from("sip_investments")
        .insert([newSip])
        .select();
      if (error) throw error;
      setSips([...sips, ...data]);
      setSipName("");
      setAmount("");
      setMonth("");
      setCurrentAmount("");
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to add SIP:", err);
      alert("Failed to add SIP entry. Please try again.");
    }
  };

  const theme = useMemo(
    () => ({
      bg: isDarkMode
        ? "linear-gradient(to bottom, #0f172a, #1e293b)"
        : "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
      text: isDarkMode ? "#f1f5f9" : "#1e293b",
      cardBg: isDarkMode ? "rgba(255,255,255,0.05)" : "white",
      cardBorder: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0",
      inputBg: isDarkMode ? "#0f172a" : "#f8fafc",
      inputBorder: isDarkMode ? "rgba(255,255,255,0.1)" : "#cbd5e1",
      tableBorder: isDarkMode ? "rgba(255,255,255,0.2)" : "#cbd5e1",
      tableHeaderBg: isDarkMode ? "#1e293b" : "#eff6ff",
      tableYearBg: isDarkMode ? "rgba(139, 92, 246, 0.15)" : "#f3e8ff",
      tableMonthBg: isDarkMode ? "rgba(100, 116, 139, 0.2)" : "#f1f5f9",
      tableRowEven: isDarkMode ? "#0f172a" : "#ffffff",
      tableRowOdd: isDarkMode ? "#1e293b" : "#f8fafc",
      tableFooterBg: isDarkMode ? "#1e293b" : "#eff6ff",
      headerColor: isDarkMode ? "#60a5fa" : "#1e40af",
      yearColor: isDarkMode ? "#a78bfa" : "#6b21a8",
      monthColor: isDarkMode ? "#cbd5e1" : "#475569",
      gridColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#cbd5e1",
      axisColor: isDarkMode ? "#94a3b8" : "#64748b",
      tooltipBg: isDarkMode ? "#1e293b" : "white",
      tooltipBorder: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0",
      mutedText: isDarkMode ? "#94a3b8" : "#64748b",
      dialogBg: isDarkMode ? "#1e293b" : "white",
      dialogOverlay: isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
      selectBg: isDarkMode ? "#1e293b" : "white",
      cancelBg: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0",
      cancelText: isDarkMode ? "#f1f5f9" : "#1e293b",
      emptyCell: isDarkMode ? "#475569" : "#94a3b8",
    }),
    [isDarkMode]
  );

  const calculations = useMemo(() => {
    const sipNames = Array.from(
      new Set(sips.map((s) => s.sipName).concat(SIP_OPTIONS))
    );
    const funds = Array.from(new Set(sips.map((s) => s.sipName)));

    let firstYear = parseInt(YEAR_OPTIONS[0]);
    let firstMonthIdx = 0;
    if (sips.length > 0) {
      const first = sips.reduce(
        (min, s) => {
          const idx =
            MONTH_OPTIONS.indexOf(s.month) + (s.year - firstYear) * 12;
          return idx < min.idx ? { idx, year: s.year, month: s.month } : min;
        },
        { idx: Infinity }
      );
      firstYear = first.year;
      firstMonthIdx = MONTH_OPTIONS.indexOf(first.month);
    }

    const fullPeriods = [];
    YEAR_OPTIONS.forEach((yStr) => {
      const y = parseInt(yStr);
      const monthsStart = y === firstYear ? firstMonthIdx : 0;
      fullPeriods.push(
        ...MONTH_OPTIONS.slice(monthsStart).map((m) => `${m}-${y}`)
      );
    });

    const periodData = sips.map((s) => ({
      label: `${s.month}-${s.year}`,
      year: s.year,
      month: s.month,
      monthIdx: MONTH_OPTIONS.indexOf(s.month),
    }));
    const uniquePeriodsSet = new Set(periodData.map((p) => p.label));
    const actualPeriods = Array.from(uniquePeriodsSet)
      .map((label) => {
        const [m, y] = label.split("-");
        const entry = periodData.find((p) => p.label === label);
        return { ...entry, year: parseInt(y), label };
      })
      .sort((a, b) => a.year - b.year || a.monthIdx - b.monthIdx)
      .map((p) => p.label);

    const overallTotal = sips.reduce((acc, s) => acc + s.amount, 0);
    let investedCumulative = 0;
    const chartData = [];
    let lastKnownCurrent = 0;

    fullPeriods.forEach((label) => {
      const [m, yStr] = label.split("-");
      const y = parseInt(yStr);
      const monthSips = sips.filter((s) => s.year == y && s.month === m);
      const monthInvested = monthSips.reduce((acc, s) => acc + s.amount, 0);
      investedCumulative += monthInvested;
      const monthCurrentTotal =
        monthSips.reduce((acc, s) => acc + s.currentAmount, 0) || 0;
      if (monthCurrentTotal > 0) lastKnownCurrent = monthCurrentTotal;
      chartData.push({
        month: label,
        invested: investedCumulative,
        current: lastKnownCurrent,
      });
    });

    const overallCurrentTotal = lastKnownCurrent;
    const profitLoss = overallCurrentTotal - overallTotal;
    const profitLossPercent =
      overallTotal > 0 ? (profitLoss / overallTotal) * 100 : 0;
    const lineColor =
      overallCurrentTotal >= overallTotal ? "#10b981" : "#ef4444";

    const monthlyProfits = [];
    let prevCurrentForProfit = 0;
    actualPeriods.forEach((label) => {
      const [m, yStr] = label.split("-");
      const y = parseInt(yStr);
      const monthSips = sips.filter((s) => s.year == y && s.month === m);
      const monthInvested = monthSips.reduce((acc, s) => acc + s.amount, 0);
      const monthCurrentTotal =
        monthSips.reduce((acc, s) => acc + s.currentAmount, 0) || 0;
      const monthProfit =
        monthCurrentTotal - prevCurrentForProfit - monthInvested;

      let prevIdx = MONTH_OPTIONS.indexOf(m) - 1;
      let prevY = y;
      if (prevIdx < 0) {
        prevIdx = 11;
        prevY -= 1;
      }
      const profitMonth = `${MONTH_OPTIONS[prevIdx]}-${prevY}`;

      monthlyProfits.push({ month: profitMonth, profit: monthProfit });
      prevCurrentForProfit = monthCurrentTotal;
    });

    const portfolioAllocation = sipNames
      .map((name) => {
        const total = sips
          .filter((s) => s.sipName === name)
          .reduce((acc, s) => acc + s.amount, 0);
        return { name, value: total };
      })
      .filter((item) => item.value > 0);

    const monthlyTrend = fullPeriods.map((label) => {
      const [m, yStr] = label.split("-");
      const y = parseInt(yStr);
      const total = sips
        .filter((s) => s.year == y && s.month === m)
        .reduce((acc, s) => acc + s.amount, 0);
      return { month: label, amount: total };
    });

    const avgMonthlyInvestment =
      monthlyTrend.length > 0
        ? monthlyTrend.reduce((acc, m) => acc + m.amount, 0) /
          monthlyTrend.length
        : 0;

    const sipWiseGrowth = fullPeriods.map((label) => {
      const [m, yStr] = label.split("-");
      const y = parseInt(yStr);
      const dataPoint = { month: label };
      sipNames.forEach((name) => {
        const sipData = sips.filter(
          (s) => s.sipName === name && s.year == y && s.month === m
        );
        dataPoint[name] = sipData.reduce((acc, s) => acc + s.amount, 0);
      });
      return dataPoint;
    });

    const returnsComparison = sipNames
      .map((name) => {
        const sipEntries = sips.filter((s) => s.sipName === name);
        if (sipEntries.length === 0) return { name, returns: 0 };
        const sorted = sipEntries.sort(
          (a, b) =>
            a.year - b.year ||
            MONTH_OPTIONS.indexOf(a.month) - MONTH_OPTIONS.indexOf(b.month)
        );
        const latest = sorted[sorted.length - 1];
        const invested = sipEntries.reduce((acc, s) => acc + s.amount, 0);
        const current = latest.currentAmount;
        const returns =
          invested > 0 ? ((current - invested) / invested) * 100 : 0;
        return { name, returns: parseFloat(returns.toFixed(2)) };
      })
      .filter((item) => item.returns !== 0);

    const yearWiseInvestment = YEAR_OPTIONS.map((yStr) => {
      const y = parseInt(yStr);
      const total = sips
        .filter((s) => s.year == y)
        .reduce((acc, s) => acc + s.amount, 0);
      return { name: yStr, value: total };
    }).filter((item) => item.value > 0);

    const yearlyProfits = YEAR_OPTIONS.map((yStr) => {
      const y = parseInt(yStr);
      const dataPoint = { year: yStr, totalProfit: 0 };
      let totalYearProfit = 0;

      funds.forEach((name) => {
        // Get all entries for this fund, sorted by date
        const fundEntries = sips
          .filter((s) => s.sipName === name)
          .sort(
            (a, b) =>
              a.year - b.year ||
              MONTH_OPTIONS.indexOf(a.month) - MONTH_OPTIONS.indexOf(b.month)
          );

        // Get entries for previous year, current year, and next year
        const prevYearEntries = fundEntries.filter((e) => e.year === y - 1);
        const currentYearEntries = fundEntries.filter((e) => e.year === y);
        const nextYearEntries = fundEntries.filter((e) => e.year === y + 1);
        let profit = 0;

        // Only calculate if there are entries in current year
        if (currentYearEntries.length > 0) {
          // Starting value = last entry of previous year (or 0 if no previous year)
          const starting =
            prevYearEntries.length > 0
              ? prevYearEntries[prevYearEntries.length - 1].currentAmount
              : 0;

          let ending;
          let invested;

          // If next year has data, use it to calculate ending value
          if (nextYearEntries.length > 0) {
            const firstNextYearEntry = nextYearEntries[0];
            // Ending = first entry of next year's current - first entry of next year's investment
            ending =
              firstNextYearEntry.currentAmount - firstNextYearEntry.amount;
            // Invested = all investments made in current year
            invested = currentYearEntries.reduce((sum, e) => sum + e.amount, 0);
            console.log(`    Has next year data`);
          } else {
            // No next year data means we just invested this year but no growth yet
            ending = starting;
            invested = 0;
            console.log(`    NO next year data - setting profit to 0`);
          }

          profit = ending - starting - invested;
          console.log(
            `    PROFIT: ${profit} = ${ending} - ${starting} - ${invested}`
          );
        }

        dataPoint[name] = profit;
        totalYearProfit += profit;
      });

      dataPoint.totalProfit = totalYearProfit;
      return dataPoint;
    });

    const monthTotals = {};
    YEAR_OPTIONS.forEach((yStr) => {
      const y = parseInt(yStr);
      MONTH_OPTIONS.forEach((m) => {
        const monthSips = sips.filter((s) => s.year == y && s.month === m);
        monthTotals[`${m}-${y}`] = monthSips.reduce(
          (acc, s) => acc + s.amount,
          0
        );
      });
    });

    const getMonthsForYear = (yStr) => {
      const y = parseInt(yStr);
      return y === firstYear
        ? MONTH_OPTIONS.slice(firstMonthIdx)
        : MONTH_OPTIONS;
    };

    const healthPercent = profitLossPercent;
    const healthColor =
      healthPercent >= 15
        ? "#10b981"
        : healthPercent >= 5
        ? "#f59e0b"
        : healthPercent >= 0
        ? "#3b82f6"
        : "#ef4444";
    const healthStatus =
      healthPercent >= 15
        ? "Excellent"
        : healthPercent >= 5
        ? "Good"
        : healthPercent >= 0
        ? "Fair"
        : "Poor";

    return {
      sipNames,
      funds,
      fullPeriods,
      chartData,
      overallTotal,
      overallCurrentTotal,
      profitLoss,
      profitLossPercent,
      lineColor,
      portfolioAllocation,
      monthlyTrend,
      avgMonthlyInvestment,
      sipWiseGrowth,
      returnsComparison,
      yearWiseInvestment,
      yearlyProfits,
      monthTotals,
      getMonthsForYear,
      healthPercent,
      healthColor,
      healthStatus,
      filteredMonthlyProfits: monthlyProfits.filter((p) => p.profit !== 0),
      zeroChartData: chartData.map((d) => ({ ...d, invested: 0, current: 0 })),
      zeroMonthlyTrend: monthlyTrend.map((d) => ({ ...d, amount: 0 })),
      zeroSipGrowth: sipWiseGrowth.map((d) => {
        const zd = { month: d.month };
        sipNames.forEach((n) => (zd[n] = 0));
        return zd;
      }),
      zeroYearlyProfits: YEAR_OPTIONS.map((yStr) => {
        const dp = { year: yStr, totalProfit: 0 };
        funds.forEach((n) => (dp[n] = 0));
        return dp;
      }),
    };
  }, [sips]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #0f172a, #1e293b)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#f1f5f9",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "4px solid rgba(59, 130, 246, 0.3)",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ fontSize: "1.125rem", margin: 0 }}>
            Loading your SIP data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "3rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Trigger asChild>
              <button
                style={{
                  background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "1rem",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <Plus size={20} /> Add SIP Entry
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay
                style={{
                  background: theme.dialogOverlay,
                  position: "fixed",
                  inset: 0,
                  zIndex: 50,
                }}
              />
              <Dialog.Content
                style={{
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: theme.dialogBg,
                  borderRadius: "1rem",
                  padding: "2rem",
                  width: "90vw",
                  maxWidth: "500px",
                  zIndex: 51,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                  border: `1px solid ${theme.cardBorder}`,
                }}
              >
                <Dialog.Title
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    marginBottom: "1.5rem",
                    color: theme.text,
                  }}
                >
                  Add New SIP Entry
                </Dialog.Title>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <CustomSelect
                    value={sipName}
                    onValueChange={setSipName}
                    options={SIP_OPTIONS}
                    placeholder="Select SIP"
                    theme={theme}
                  />
                  <input
                    type="number"
                    placeholder="Invested Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      background: theme.inputBg,
                      border: `1px solid ${theme.inputBorder}`,
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      color: theme.text,
                      fontSize: "1rem",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Current Value"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    style={{
                      background: theme.inputBg,
                      border: `1px solid ${theme.inputBorder}`,
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      color: theme.text,
                      fontSize: "1rem",
                    }}
                  />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <CustomSelect
                      value={year}
                      onValueChange={setYear}
                      options={YEAR_OPTIONS}
                      placeholder="Year"
                      theme={theme}
                    />
                    <CustomSelect
                      value={month}
                      onValueChange={setMonth}
                      options={MONTH_OPTIONS}
                      placeholder="Month"
                      theme={theme}
                    />
                  </div>
                  <div
                    style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
                  >
                    <button
                      onClick={addSIP}
                      style={{
                        flex: 1,
                        background:
                          "linear-gradient(to right, #3b82f6, #8b5cf6)",
                        color: "white",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      Add Entry
                    </button>
                    <Dialog.Close asChild>
                      <button
                        style={{
                          flex: 1,
                          background: theme.cancelBg,
                          color: theme.cancelText,
                          padding: "0.75rem",
                          borderRadius: "0.5rem",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Cancel
                      </button>
                    </Dialog.Close>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              background: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0",
              color: isDarkMode ? "#f1f5f9" : "#1e293b",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "1rem",
              marginLeft: "auto",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {isDarkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* Stats Cards */}
        <div
          ref={statsRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <StatsCard
            theme={theme}
            title="Total Invested"
            value={calculations.overallTotal}
            color="#3b82f6"
            hasViewed={statsHasViewed}
          />
          <StatsCard
            theme={theme}
            title="Current Value"
            value={calculations.overallCurrentTotal}
            color="#8b5cf6"
            hasViewed={statsHasViewed}
          />
          <StatsCard
            theme={theme}
            title="Profit/Loss"
            value={calculations.profitLoss}
            color={calculations.profitLoss >= 0 ? "#10b981" : "#ef4444"}
            subtitle={calculations.profitLossPercent}
            icon={
              calculations.profitLoss >= 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )
            }
            hasViewed={statsHasViewed}
          />
          <div
            style={{
              background: theme.cardBg,
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: `1px solid ${theme.cardBorder}`,
              opacity: statsHasViewed ? 1 : 0,
              transform: statsHasViewed ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = statsHasViewed
                ? "translateY(0)"
                : "translateY(20px)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: theme.mutedText,
                marginBottom: "0.5rem",
              }}
            >
              Portfolio Health
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: calculations.healthColor,
              }}
            >
              {calculations.healthStatus}
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                background: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                borderRadius: "999px",
                marginTop: "0.75rem",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${
                    statsHasViewed
                      ? Math.min(
                          Math.max(calculations.healthPercent + 50, 0),
                          100
                        )
                      : 0
                  }%`,
                  height: "100%",
                  background: calculations.healthColor,
                  transition: "width 1.5s ease-out",
                }}
              ></div>
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: theme.mutedText,
                marginTop: "0.5rem",
              }}
            >
              Returns:{" "}
              <AnimatedNumber
                value={calculations.profitLossPercent}
                prefix={calculations.profitLoss >= 0 ? "+" : ""}
                decimals={2}
                suffix="%"
                start={statsHasViewed}
              />
            </div>
          </div>
        </div>

        {/* Portfolio Growth */}
        <ChartCard
          ref={growthRef}
          theme={theme}
          title="Portfolio Growth (Cumulative)"
          hasViewed={growthHasViewed}
        >
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={
                growthHasViewed
                  ? calculations.chartData
                  : calculations.zeroChartData
              }
            >
              <defs>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={calculations.lineColor}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={calculations.lineColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
              <XAxis
                dataKey="month"
                angle={-45}
                textAnchor="end"
                height={100}
                stroke={theme.axisColor}
                style={{ fontSize: "0.75rem" }}
              />
              <YAxis
                tickFormatter={(val) => `₹${val}`}
                stroke={theme.axisColor}
                style={{ fontSize: "0.875rem" }}
              />
              <Tooltip content={<CustomTooltip theme={theme} />} />
              <Legend wrapperStyle={{ color: theme.text }} />
              <ReferenceLine
                y={calculations.overallTotal}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{ value: "Break Even", fill: "#f59e0b", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#colorInvested)"
                name="Invested Amount"
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke={calculations.lineColor}
                strokeWidth={3}
                fill="url(#colorCurrent)"
                name="Current Value"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Charts Grid - Row 1 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <ChartCard
            ref={allocRef}
            theme={theme}
            title="Portfolio Allocation"
            hasViewed={allocHasViewed}
          >
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={allocHasViewed ? calculations.portfolioAllocation : []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  label={(entry) =>
                    `${entry.name}: ${(
                      (entry.value / calculations.overallTotal) *
                      100
                    ).toFixed(1)}%`
                  }
                >
                  {calculations.portfolioAllocation.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  contentStyle={{
                    background: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    color: theme.text,
                    borderRadius: "0.5rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard
            ref={trendRef}
            theme={theme}
            title="Monthly Investment Trend"
            hasViewed={trendHasViewed}
          >
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={
                  trendHasViewed
                    ? calculations.monthlyTrend
                    : calculations.zeroMonthlyTrend
                }
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke={theme.axisColor}
                  style={{ fontSize: "0.7rem" }}
                />
                <YAxis
                  tickFormatter={(val) => `₹${val}`}
                  stroke={theme.axisColor}
                />
                <Tooltip
                  formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  contentStyle={{
                    background: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    color: theme.text,
                    borderRadius: "0.5rem",
                  }}
                />
                <ReferenceLine
                  y={calculations.avgMonthlyInvestment}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{
                    value: `Avg: ₹${calculations.avgMonthlyInvestment.toFixed(
                      0
                    )}`,
                    fill: "#f59e0b",
                    fontSize: 11,
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="url(#barGradient)"
                  name="Investment"
                  radius={[8, 8, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Trend"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Grid - Row 2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <ChartCard
            ref={sipGrowthRef}
            theme={theme}
            title="SIP-wise Contribution (Stacked)"
            hasViewed={sipGrowthHasViewed}
          >
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={
                  sipGrowthHasViewed
                    ? calculations.sipWiseGrowth
                    : calculations.zeroSipGrowth
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke={theme.axisColor}
                  style={{ fontSize: "0.7rem" }}
                />
                <YAxis
                  tickFormatter={(val) => `₹${val}`}
                  stroke={theme.axisColor}
                />
                <Tooltip
                  formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  contentStyle={{
                    background: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    color: theme.text,
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend wrapperStyle={{ color: theme.text }} />
                {calculations.sipNames.map((name, idx) => (
                  <Area
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stackId="1"
                    stroke={COLORS[idx % COLORS.length]}
                    fill={COLORS[idx % COLORS.length]}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard
            ref={profitRef}
            theme={theme}
            title="Monthly Profit/Loss"
            hasViewed={profitHasViewed}
          >
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={
                  profitHasViewed ? calculations.filteredMonthlyProfits : []
                }
              >
                <defs>
                  <linearGradient
                    id="profitAreaGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme.gridColor}
                  opacity={0.3}
                />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke={theme.axisColor}
                  style={{ fontSize: "0.7rem" }}
                />
                <YAxis
                  tickFormatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  stroke={theme.axisColor}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const value = payload[0].value;
                      const isProfit = value >= 0;
                      return (
                        <div
                          style={{
                            background: theme.tooltipBg,
                            border: `2px solid ${
                              isProfit ? "#10b981" : "#ef4444"
                            }`,
                            borderRadius: "0.75rem",
                            padding: "1rem",
                            color: theme.text,
                            boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              marginBottom: "0.5rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            {payload[0].payload.month}
                          </div>
                          <div
                            style={{
                              color: isProfit ? "#10b981" : "#ef4444",
                              fontWeight: "bold",
                              fontSize: "1.125rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            {isProfit ? "+" : ""}₹
                            {value.toLocaleString("en-IN")}
                            {isProfit ? (
                              <TrendingUp size={16} />
                            ) : (
                              <TrendingDown size={16} />
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: theme.mutedText,
                              marginTop: "0.25rem",
                            }}
                          >
                            {isProfit ? "Profit" : "Loss"}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke={theme.axisColor}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="none"
                  fill="url(#profitAreaGradient)"
                  fillOpacity={1}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const isProfit = payload.profit >= 0;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={isProfit ? "#10b981" : "#ef4444"}
                        stroke={isDarkMode ? "#1e293b" : "white"}
                        strokeWidth={3}
                        style={{
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                        }}
                      />
                    );
                  }}
                  activeDot={(props) => {
                    const { cx, cy, payload } = props;
                    const isProfit = payload.profit >= 0;
                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={12}
                          fill={isProfit ? "#10b981" : "#ef4444"}
                          fillOpacity={0.2}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={8}
                          fill={isProfit ? "#10b981" : "#ef4444"}
                          stroke={isDarkMode ? "#1e293b" : "white"}
                          strokeWidth={3}
                        />
                      </g>
                    );
                  }}
                  name="Monthly P/L"
                >
                  {calculations.filteredMonthlyProfits.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      stroke={entry.profit >= 0 ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Grid - Row 3 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <ChartCard
            ref={yearRef}
            theme={theme}
            title="Year-wise Investment Distribution"
            hasViewed={yearHasViewed}
          >
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={yearHasViewed ? calculations.yearWiseInvestment : []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  label={(entry) =>
                    `${entry.name}: ₹${entry.value.toLocaleString()}`
                  }
                  labelLine={{ stroke: theme.text, strokeWidth: 1 }}
                >
                  {calculations.yearWiseInvestment.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  contentStyle={{
                    background: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    color: theme.text,
                    borderRadius: "0.5rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard
            ref={yearProfitRef}
            theme={theme}
            title="Yearly Profit by Fund (Stacked)"
            hasViewed={yearProfitHasViewed}
          >
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={
                  yearProfitHasViewed
                    ? calculations.yearlyProfits
                    : calculations.zeroYearlyProfits
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
                <XAxis dataKey="year" stroke={theme.axisColor} />
                <YAxis
                  tickFormatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  stroke={theme.axisColor}
                />
                <Tooltip
                  formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  contentStyle={{
                    background: theme.tooltipBg,
                    border: `1px solid ${theme.tooltipBorder}`,
                    color: theme.text,
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend wrapperStyle={{ color: theme.text }} />
                <ReferenceLine
                  y={0}
                  stroke={theme.axisColor}
                  strokeDasharray="3 3"
                />
                {calculations.funds.map((name, idx) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    stackId="profit"
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="totalProfit"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                  name="Total Profit"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        {/* Table */}
        <div
          ref={tableRef}
          style={{
            background: theme.cardBg,
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            border: `1px solid ${theme.cardBorder}`,
            opacity: tableHasViewed ? 1 : 0,
            transform: tableHasViewed ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              color: theme.text,
            }}
          >
            Investment Details
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1200px",
              }}
            >
              <thead>
                <tr>
                  <th
                    rowSpan="2"
                    style={{
                      background: theme.tableHeaderBg,
                      padding: "1rem",
                      textAlign: "left",
                      border: `1px solid ${theme.tableBorder}`,
                      position: "sticky",
                      left: 0,
                      zIndex: 3,
                      minWidth: "200px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: theme.headerColor,
                      boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                    }}
                  >
                    SIP Name
                  </th>
                  {YEAR_OPTIONS.map((yStr) => (
                    <th
                      key={yStr}
                      colSpan={calculations.getMonthsForYear(yStr).length}
                      style={{
                        background: theme.tableYearBg,
                        padding: "1rem",
                        textAlign: "center",
                        border: `1px solid ${theme.tableBorder}`,
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: theme.yearColor,
                      }}
                    >
                      {yStr}
                    </th>
                  ))}
                </tr>
                <tr>
                  {YEAR_OPTIONS.map((yStr) =>
                    calculations.getMonthsForYear(yStr).map((m, idx) => (
                      <th
                        key={`${yStr}-${m}-${idx}`}
                        style={{
                          background: theme.tableMonthBg,
                          padding: "0.75rem",
                          textAlign: "center",
                          border: `1px solid ${theme.tableBorder}`,
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          color: theme.monthColor,
                          minWidth: "90px",
                        }}
                      >
                        {m}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {calculations.sipNames.map((name, idx) => (
                  <tr key={idx}>
                    <td
                      style={{
                        padding: "1rem",
                        fontWeight: "600",
                        border: `1px solid ${theme.tableBorder}`,
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        background:
                          idx % 2 === 0
                            ? theme.tableRowEven
                            : theme.tableRowOdd,
                        fontSize: "0.875rem",
                        color: theme.text,
                        boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                      }}
                    >
                      {name}
                    </td>
                    {YEAR_OPTIONS.map((yStr) =>
                      calculations.getMonthsForYear(yStr).map((m, i) => {
                        const y = parseInt(yStr);
                        const sip = sips.find(
                          (s) =>
                            s.sipName === name && s.year == y && s.month === m
                        );
                        return sip ? (
                          <td
                            key={`${yStr}-${m}-${i}`}
                            style={{
                              padding: "0.75rem",
                              textAlign: "center",
                              border: `1px solid ${theme.tableBorder}`,
                              background:
                                idx % 2 === 0
                                  ? theme.tableRowEven
                                  : theme.tableRowOdd,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "700",
                                color: "#059669",
                              }}
                            >
                              ₹{sip.amount.toLocaleString()}
                            </div>
                          </td>
                        ) : (
                          <td
                            key={`${yStr}-${m}-${i}`}
                            style={{
                              padding: "0.75rem",
                              textAlign: "center",
                              border: `1px solid ${theme.tableBorder}`,
                              color: theme.emptyCell,
                              fontSize: "0.875rem",
                              background:
                                idx % 2 === 0
                                  ? theme.tableRowEven
                                  : theme.tableRowOdd,
                            }}
                          >
                            -
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "bold",
                      border: `1px solid ${theme.tableBorder}`,
                      fontSize: "0.875rem",
                      color: theme.headerColor,
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      background: theme.tableFooterBg,
                      boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                    }}
                  >
                    Month Total
                  </td>
                  {YEAR_OPTIONS.map((yStr) =>
                    calculations.getMonthsForYear(yStr).map((m) => {
                      const y = parseInt(yStr);
                      const total = calculations.monthTotals[`${m}-${y}`] || 0;
                      return (
                        <td
                          key={`${yStr}-${m}`}
                          style={{
                            padding: "0.75rem",
                            textAlign: "center",
                            fontWeight: "bold",
                            border: `1px solid ${theme.tableBorder}`,
                            background: theme.tableFooterBg,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.875rem",
                              color: theme.headerColor,
                            }}
                          >
                            ₹{total.toLocaleString()}
                          </div>
                        </td>
                      );
                    })
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
