import React, { useState, useEffect } from "react";
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
  RadialBarChart,
  RadialBar,
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
} from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

const StatsCard = ({ theme, title, value, color, subtitle, icon }) => (
  <div
    style={{
      background: theme.cardBg,
      borderRadius: "1rem",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
      border: `1px solid ${theme.cardBorder}`,
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
    }}
  >
    <div style={{ fontSize: "0.875rem", color: theme.mutedText, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {icon}
      {title}
    </div>
    <div style={{ fontSize: "2rem", fontWeight: "bold", color }}>{value}</div>
    {subtitle && <div style={{ fontSize: "0.875rem", color, marginTop: "0.25rem" }}>{subtitle}</div>}
  </div>
);

const ChartCard = ({ theme, title, children }) => (
  <div
    style={{
      background: theme.cardBg,
      borderRadius: "1rem",
      padding: "2rem",
      marginBottom: "3rem",
      boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
      border: `1px solid ${theme.cardBorder}`,
    }}
  >
    <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", color: theme.text }}>{title}</h2>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length) {
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
        <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>{payload[0].payload.month}</div>
        <div style={{ color: "#3b82f6" }}>Invested: ₹{invested.toLocaleString("en-IN")}</div>
        <div style={{ color: current >= invested ? "#10b981" : "#ef4444" }}>Current: ₹{current.toLocaleString("en-IN")}</div>
        <div
          style={{
            color: diff >= 0 ? "#10b981" : "#ef4444",
            fontWeight: "bold",
            marginTop: "0.5rem",
            paddingTop: "0.5rem",
            borderTop: `1px solid ${theme.cardBorder}`,
          }}
        >
          {diff >= 0 ? "+" : ""}₹{diff.toLocaleString("en-IN")} ({diffPercent.toFixed(2)}%)
        </div>
      </div>
    );
  }
  return null;
};

function CustomSelect({ value, onValueChange, options, placeholder, theme }) {
  return (
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
                  <Check size={16} color="#10b981" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function App() {
  const [sipName, setSipName] = useState("");
  const [amount, setAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("");
  const [sips, setSips] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const sipOptions = ["Parag Parikh Flexi Cap", "ICICI Prudential Bluechip"];
  const yearOptions = ["2025", "2026", "2027"];
  const monthOptions = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    fetch("/sips.json")
      .then((res) => res.json())
      .then((data) => setSips(data))
      .catch((err) => console.error("Failed to load JSON:", err));
  }, []);

  const addSIP = () => {
    if (!sipName || !amount || !currentAmount || !year || !month) {
      alert("Please fill all fields including current value");
      return;
    }
    setSips([...sips, { sipName, amount: parseFloat(amount), currentAmount: parseFloat(currentAmount), year: parseInt(year), month }]);
    setSipName("");
    setAmount("");
    setMonth("");
    setCurrentAmount("");
    setDialogOpen(false);
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(sips, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sips.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const sipNames = Array.from(new Set(sips.map((s) => s.sipName).concat(sipOptions)));

  let firstYear = parseInt(yearOptions[0]);
  let firstMonthIdx = 0;
  if (sips.length > 0) {
    const first = sips.reduce(
      (min, s) => {
        const idx = monthOptions.indexOf(s.month) + (s.year - firstYear) * 12;
        return idx < min.idx ? { idx, year: s.year, month: s.month } : min;
      },
      { idx: Infinity }
    );
    firstYear = first.year;
    firstMonthIdx = monthOptions.indexOf(first.month);
  }

  const fullPeriods = [];
  yearOptions.forEach((yStr) => {
    const y = parseInt(yStr);
    const monthsStart = y === firstYear ? firstMonthIdx : 0;
    const months = monthOptions.slice(monthsStart);
    fullPeriods.push(...months.map((m) => `${m}-${y}`));
  });

  const periodData = sips.map((s) => ({
    label: `${s.month}-${s.year}`,
    year: s.year,
    month: s.month,
    monthIdx: monthOptions.indexOf(s.month),
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

  const getPreviousMonthLabel = (currentLabel) => {
    const [m, yStr] = currentLabel.split("-");
    const y = parseInt(yStr);
    const monthIdx = monthOptions.indexOf(m);
    let prevIdx = monthIdx - 1;
    let prevY = y;
    if (prevIdx < 0) {
      prevIdx = 11;
      prevY -= 1;
    }
    const prevM = monthOptions[prevIdx];
    return `${prevM}-${prevY}`;
  };

  const monthTotals = {};
  yearOptions.forEach((yStr) => {
    const y = parseInt(yStr);
    monthOptions.forEach((m) => {
      const monthSips = sips.filter((s) => s.year == y && s.month === m);
      const total = monthSips.reduce((acc, s) => acc + s.amount, 0);
      monthTotals[`${m}-${y}`] = total;
      const totalCurrent = monthSips.reduce((acc, s) => acc + s.currentAmount, 0);
      monthTotals[`current-${m}-${y}`] = totalCurrent;
    });
  });

  const overallTotal = sips.reduce((acc, s) => acc + s.amount, 0);

  let investedCumulative = 0;
  const chartData = [];
  const monthlyProfits = [];

  let prevCurrentForProfit = 0;
  actualPeriods.forEach((label) => {
    const [m, yStr] = label.split("-");
    const y = parseInt(yStr);
    const monthSips = sips.filter((s) => s.year == y && s.month === m);
    const monthInvested = monthSips.reduce((acc, s) => acc + s.amount, 0);
    const monthCurrentTotal = monthSips.reduce((acc, s) => acc + s.currentAmount, 0) || 0;
    const monthProfit = monthCurrentTotal - prevCurrentForProfit - monthInvested;
    const profitMonth = getPreviousMonthLabel(label);
    monthlyProfits.push({ month: profitMonth, profit: monthProfit });
    prevCurrentForProfit = monthCurrentTotal;
  });

  let lastKnownCurrent = 0;
  fullPeriods.forEach((label) => {
    const [m, yStr] = label.split("-");
    const y = parseInt(yStr);
    const monthSips = sips.filter((s) => s.year == y && s.month === m);
    const monthInvested = monthSips.reduce((acc, s) => acc + s.amount, 0);
    investedCumulative += monthInvested;
    const monthCurrentTotal = monthSips.reduce((acc, s) => acc + s.currentAmount, 0) || 0;
    if (monthCurrentTotal > 0) {
      lastKnownCurrent = monthCurrentTotal;
    }

    chartData.push({
      month: label,
      invested: investedCumulative,
      current: lastKnownCurrent,
    });
  });

  const overallCurrentTotal = lastKnownCurrent;
  const lineColor = overallCurrentTotal >= overallTotal ? "#10b981" : "#ef4444";
  const profitLoss = overallCurrentTotal - overallTotal;
  const profitLossPercent = overallTotal > 0 ? (profitLoss / overallTotal) * 100 : 0;

  const portfolioAllocation = sipNames
    .map((name) => {
      const total = sips.filter((s) => s.sipName === name).reduce((acc, s) => acc + s.amount, 0);
      return { name, value: total };
    })
    .filter((item) => item.value > 0);

  const monthlyTrend = fullPeriods.map((label) => {
    const [m, yStr] = label.split("-");
    const y = parseInt(yStr);
    const total = sips.filter((s) => s.year == y && s.month === m).reduce((acc, s) => acc + s.amount, 0);
    return { month: label, amount: total };
  });

  const avgMonthlyInvestment = monthlyTrend.length > 0 ? monthlyTrend.reduce((acc, m) => acc + m.amount, 0) / monthlyTrend.length : 0;

  const sipWiseGrowth = fullPeriods.map((label) => {
    const [m, yStr] = label.split("-");
    const y = parseInt(yStr);
    const dataPoint = { month: label };
    sipNames.forEach((name) => {
      const sipData = sips.filter((s) => s.sipName === name && s.year == y && s.month === m);
      dataPoint[name] = sipData.reduce((acc, s) => acc + s.amount, 0);
    });
    return dataPoint;
  });

  const returnsComparison = sipNames
    .map((name) => {
      const sipEntries = sips.filter((s) => s.sipName === name);
      if (sipEntries.length === 0) return { name, returns: 0 };
      const sorted = sipEntries.sort((a, b) => a.year - b.year || monthOptions.indexOf(a.month) - monthOptions.indexOf(b.month));
      const latest = sorted[sorted.length - 1];
      const invested = sipEntries.reduce((acc, s) => acc + s.amount, 0);
      const current = latest.currentAmount;
      const returns = invested > 0 ? ((current - invested) / invested) * 100 : 0;
      return { name, returns: parseFloat(returns.toFixed(2)) };
    })
    .filter((item) => item.returns !== 0);

  const yearWiseInvestment = yearOptions
    .map((yStr) => {
      const y = parseInt(yStr);
      const total = sips.filter((s) => s.year == y).reduce((acc, s) => acc + s.amount, 0);
      return { name: yStr, value: total };
    })
    .filter((item) => item.value > 0);

  const monthlySipFlow = fullPeriods.map((label) => {
    const [m, yStr] = label.split("-");
    const y = parseInt(yStr);
    const amount = monthTotals[`${m}-${y}`] || 0;
    return { month: label, amount };
  });

  const healthPercent = profitLossPercent;
  const healthColor = healthPercent >= 15 ? "#10b981" : healthPercent >= 5 ? "#f59e0b" : healthPercent >= 0 ? "#3b82f6" : "#ef4444";
  const healthStatus = healthPercent >= 15 ? "Excellent" : healthPercent >= 5 ? "Good" : healthPercent >= 0 ? "Fair" : "Poor";

  const radialSipData = sipNames
    .map((name, idx) => {
      const sipEntries = sips.filter((s) => s.sipName === name);
      if (sipEntries.length === 0) return null;
      const sorted = sipEntries.sort((a, b) => a.year - b.year || monthOptions.indexOf(a.month) - monthOptions.indexOf(b.month));
      const latest = sorted[sorted.length - 1];
      const invested = sipEntries.reduce((acc, s) => acc + s.amount, 0);
      const current = latest.currentAmount;
      const returns = invested > 0 ? ((current - invested) / invested) * 100 : 0;
      return {
        name,
        value: Math.min(Math.max(returns + 50, 0), 100),
        actualReturns: returns,
        fill: COLORS[idx % COLORS.length],
      };
    })
    .filter((item) => item);

  const getMonthsForYear = (yStr) => {
    const y = parseInt(yStr);
    return y === firstYear ? monthOptions.slice(firstMonthIdx) : monthOptions;
  };

  const getColSpanForYear = (yStr) => getMonthsForYear(yStr).length;

  const theme = {
    bg: isDarkMode ? "linear-gradient(to bottom, #0f172a, #1e293b)" : "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
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
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, padding: "2rem" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap", alignItems: "center" }}>
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
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <Plus size={20} /> Add SIP Entry
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay style={{ background: theme.dialogOverlay, position: "fixed", inset: 0, zIndex: 50 }} />
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
                <Dialog.Title style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", color: theme.text }}>Add New SIP Entry</Dialog.Title>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <CustomSelect value={sipName} onValueChange={setSipName} options={sipOptions} placeholder="Select SIP" theme={theme} />
                  <input
                    type="number"
                    placeholder="Invested Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "0.5rem", padding: "0.75rem", color: theme.text, fontSize: "1rem" }}
                  />
                  <input
                    type="number"
                    placeholder="Current Value"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "0.5rem", padding: "0.75rem", color: theme.text, fontSize: "1rem" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <CustomSelect value={year} onValueChange={setYear} options={yearOptions} placeholder="Year" theme={theme} />
                    <CustomSelect value={month} onValueChange={setMonth} options={monthOptions} placeholder="Month" theme={theme} />
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button
                      onClick={addSIP}
                      style={{
                        flex: 1,
                        background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
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
                      <button style={{ flex: 1, background: theme.cancelBg, color: theme.cancelText, padding: "0.75rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "600" }}>
                        Cancel
                      </button>
                    </Dialog.Close>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <button
            onClick={downloadJSON}
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #86efac",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "1rem",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Download size={20} /> Download JSON
          </button>

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
            onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {isDarkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <StatsCard theme={theme} title="Total Invested" value={`₹${overallTotal.toLocaleString("en-IN")}`} color="#3b82f6" />
          <StatsCard theme={theme} title="Current Value" value={`₹${overallCurrentTotal.toLocaleString("en-IN")}`} color="#8b5cf6" />
          <StatsCard
            theme={theme}
            title="Profit/Loss"
            value={`₹${profitLoss.toLocaleString("en-IN")}`}
            color={profitLoss >= 0 ? "#10b981" : "#ef4444"}
            subtitle={`${profitLoss >= 0 ? "+" : ""}${profitLossPercent.toFixed(2)}%`}
            icon={profitLoss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          />
          <div
            style={{
              background: theme.cardBg,
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: `1px solid ${theme.cardBorder}`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
            }}
          >
            <div style={{ fontSize: "0.875rem", color: theme.mutedText, marginBottom: "0.5rem" }}>Portfolio Health</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: healthColor }}>{healthStatus}</div>
            <div style={{ width: "100%", height: "8px", background: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0", borderRadius: "999px", marginTop: "0.75rem", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(Math.max(healthPercent + 50, 0), 100)}%`, height: "100%", background: healthColor, transition: "width 0.3s" }}></div>
            </div>
            <div style={{ fontSize: "0.75rem", color: theme.mutedText, marginTop: "0.5rem" }}>Returns: {profitLossPercent.toFixed(2)}%</div>
          </div>
        </div>

        {/* Portfolio Growth with Gradient */}
        <ChartCard theme={theme} title="Portfolio Growth (Cumulative)">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} stroke={theme.axisColor} style={{ fontSize: "0.75rem" }} />
              <YAxis tickFormatter={(val) => `₹${val}`} stroke={theme.axisColor} style={{ fontSize: "0.875rem" }} />
              <Tooltip content={<CustomTooltip theme={theme} />} />
              <Legend wrapperStyle={{ color: theme.text }} />
              <ReferenceLine y={overallTotal} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Break Even", fill: "#f59e0b", fontSize: 12 }} />
              <Area type="monotone" dataKey="invested" stroke="#3b82f6" strokeWidth={3} fill="url(#colorInvested)" name="Invested Amount" />
              <Area type="monotone" dataKey="current" stroke={lineColor} strokeWidth={3} fill="url(#colorCurrent)" name="Current Value" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Charts Grid - Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <ChartCard theme={theme} title="Portfolio Allocation">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={portfolioAllocation}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  label={(entry) => `${entry.name}: ${((entry.value / overallTotal) * 100).toFixed(1)}%`}
                >
                  {portfolioAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val) => `₹${val.toLocaleString("en-IN")}`} 
                  contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, color: theme.text, borderRadius: "0.5rem" }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard theme={theme} title="Monthly Investment Trend">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} stroke={theme.axisColor} style={{ fontSize: "0.7rem" }} />
                <YAxis tickFormatter={(val) => `₹${val}`} stroke={theme.axisColor} />
                <Tooltip
                  formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, color: theme.text, borderRadius: "0.5rem" }}
                />
                <ReferenceLine y={avgMonthlyInvestment} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Avg: ₹${avgMonthlyInvestment.toFixed(0)}`, fill: "#f59e0b", fontSize: 11 }} />
                <Bar dataKey="amount" fill="url(#barGradient)" name="Investment" radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={false} name="Trend" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Grid - Row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <ChartCard theme={theme} title="SIP-wise Contribution (Stacked)">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={sipWiseGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} stroke={theme.axisColor} style={{ fontSize: "0.7rem" }} />
                <YAxis tickFormatter={(val) => `₹${val}`} stroke={theme.axisColor} />
                <Tooltip
                  formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, color: theme.text, borderRadius: "0.5rem" }}
                />
                <Legend wrapperStyle={{ color: theme.text }} />
                {sipNames.map((name, index) => (
                  <Area key={name} type="monotone" dataKey={name} stackId="1" stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard theme={theme} title="Monthly Profit/Loss">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyProfits.filter((p) => p.profit !== 0)}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="lossGradient" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} stroke={theme.axisColor} style={{ fontSize: "0.7rem" }} />
                <YAxis tickFormatter={(val) => `₹${val.toLocaleString("en-IN")}`} stroke={theme.axisColor} />
                <Tooltip
                  formatter={(val) => [`₹${val.toLocaleString("en-IN")}`, "Profit/Loss"]}
                  contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, color: theme.text, borderRadius: "0.5rem" }}
                />
                <ReferenceLine y={0} stroke={theme.axisColor} />
                <Bar dataKey="profit" name="Monthly P/L" radius={[8, 8, 8, 8]}>
                  {monthlyProfits.filter((p) => p.profit !== 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? "url(#profitGradient)" : "url(#lossGradient)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Grid - Row 3 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <ChartCard theme={theme} title="Returns Comparison (%)">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={returnsComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
                <XAxis type="number" tickFormatter={(val) => `${val}%`} stroke={theme.axisColor} />
                <YAxis type="category" dataKey="name" width={150} stroke={theme.axisColor} style={{ fontSize: "0.875rem" }} />
                <Tooltip
                  formatter={(val) => `${val}%`}
                  contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, color: theme.text, borderRadius: "0.5rem" }}
                />
                <ReferenceLine x={0} stroke={theme.axisColor} />
                <Bar dataKey="returns" name="Returns %" radius={[0, 8, 8, 0]}>
                  {returnsComparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.returns >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard theme={theme} title="Year-wise Investment Distribution">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={yearWiseInvestment}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  label={(entry) => `${entry.name}: ₹${entry.value.toLocaleString()}`}
                  labelLine={{ stroke: theme.text, strokeWidth: 1 }}
                >
                  {yearWiseInvestment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                  contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, color: theme.text, borderRadius: "0.5rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Monthly SIP Flow */}
        <ChartCard theme={theme} title="Monthly SIP Flow (Non-Cumulative)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySipFlow}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} stroke={theme.axisColor} style={{ fontSize: "0.75rem" }} />
              <YAxis tickFormatter={(val) => `₹${val}`} stroke={theme.axisColor} />
              <Tooltip
                formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, color: theme.text, borderRadius: "0.5rem" }}
              />
              <Line type="monotone" dataKey="amount" stroke="url(#lineGradient)" strokeWidth={3} name="Monthly Investment" dot={{ r: 5, fill: "#8b5cf6" }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Table */}
        <div style={{ background: theme.cardBg, borderRadius: "1rem", padding: "2rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", border: `1px solid ${theme.cardBorder}` }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", color: theme.text }}>Investment Details</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1200px" }}>
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
                  {yearOptions.map((yStr) => (
                    <th
                      key={yStr}
                      colSpan={getColSpanForYear(yStr)}
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
                  {yearOptions.map((yStr) =>
                    getMonthsForYear(yStr).map((m, idx) => (
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
                {sipNames.map((name, idx) => (
                  <tr key={idx}>
                    <td
                      style={{
                        padding: "1rem",
                        fontWeight: "600",
                        border: `1px solid ${theme.tableBorder}`,
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        background: idx % 2 === 0 ? theme.tableRowEven : theme.tableRowOdd,
                        fontSize: "0.875rem",
                        color: theme.text,
                        boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                      }}
                    >
                      {name}
                    </td>
                    {yearOptions.map((yStr) =>
                      getMonthsForYear(yStr).map((m, i) => {
                        const y = parseInt(yStr);
                        const sip = sips.find((s) => s.sipName === name && s.year == y && s.month === m);
                        if (!sip)
                          return (
                            <td
                              key={`${yStr}-${m}-${i}`}
                              style={{
                                padding: "0.75rem",
                                textAlign: "center",
                                border: `1px solid ${theme.tableBorder}`,
                                color: theme.emptyCell,
                                fontSize: "0.875rem",
                                background: idx % 2 === 0 ? theme.tableRowEven : theme.tableRowOdd,
                              }}
                            >
                              -
                            </td>
                          );

                        return (
                          <td
                            key={`${yStr}-${m}-${i}`}
                            style={{
                              padding: "0.75rem",
                              textAlign: "center",
                              border: `1px solid ${theme.tableBorder}`,
                              background: idx % 2 === 0 ? theme.tableRowEven : theme.tableRowOdd,
                            }}
                          >
                            <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#059669" }}>₹{sip.amount.toLocaleString()}</div>
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
                  {yearOptions.map((yStr) =>
                    getMonthsForYear(yStr).map((m) => {
                      const y = parseInt(yStr);
                      const total = monthTotals[`${m}-${y}`] || 0;

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
                          <div style={{ fontSize: "0.875rem", color: theme.headerColor }}>₹{total.toLocaleString()}</div>
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