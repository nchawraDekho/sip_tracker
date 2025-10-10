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
  const monthOptions = [
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
    setSips([
      ...sips,
      {
        sipName,
        amount: parseFloat(amount),
        currentAmount: parseFloat(currentAmount),
        year: parseInt(year),
        month,
      },
    ]);
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

  const sipNames = Array.from(
    new Set(sips.map((s) => s.sipName).concat(sipOptions))
  );

  // Month totals
  const monthTotals = {};
  yearOptions.forEach((y) => {
    monthOptions.forEach((m) => {
      const total = sips
        .filter((s) => s.year == y && s.month === m)
        .reduce((acc, s) => acc + s.amount, 0);
      monthTotals[`${m}-${y}`] = total;

      const monthSips = sips.filter((s) => s.year == y && s.month === m);
      const totalCurrent = monthSips.reduce(
        (acc, s) => acc + s.currentAmount,
        0
      );
      monthTotals[`current-${m}-${y}`] = totalCurrent || 0;
    });
  });

  const overallTotal = sips.reduce((acc, s) => acc + s.amount, 0);

  // Chart Data - Portfolio Growth
  const labels = yearOptions.flatMap((y) =>
    monthOptions.map((m) => `${m}-${y}`)
  );
  let investedCumulative = 0;
  let lastKnownCurrent = 0;

  const chartData = [];

  labels.forEach((label) => {
    const [m, y] = label.split("-");
    const monthSips = sips.filter((s) => s.year == y && s.month === m);
    const monthInvested = monthSips.reduce((acc, s) => acc + s.amount, 0);
    investedCumulative += monthInvested;
    const monthCurrent = monthSips.reduce((acc, s) => acc + s.currentAmount, 0);

    if (monthCurrent > 0) {
      lastKnownCurrent = monthCurrent;
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
  const profitLossPercent =
    overallTotal > 0 ? (profitLoss / overallTotal) * 100 : 0;

  // 1. Portfolio Allocation (Pie Chart)
  const portfolioAllocation = sipNames
    .map((name) => {
      const total = sips
        .filter((s) => s.sipName === name)
        .reduce((acc, s) => acc + s.amount, 0);
      return { name, value: total };
    })
    .filter((item) => item.value > 0);

  // 2. Monthly Investment Trend (Bar Chart)
  const monthlyTrend = labels
    .map((label) => {
      const total = monthTotals[label] || 0;
      return { month: label, amount: total };
    })
    .filter((item) => item.amount > 0);

  // 3. SIP-wise Growth (Stacked Area Chart)
  const sipWiseGrowth = labels.map((label) => {
    const [m, y] = label.split("-");
    const dataPoint = { month: label };
    sipNames.forEach((name) => {
      const sipData = sips.filter(
        (s) => s.sipName === name && s.year == y && s.month === m
      );
      dataPoint[name] = sipData.reduce((acc, s) => acc + s.amount, 0);
    });
    return dataPoint;
  });

  // 4. Profit/Loss by SIP (Pie Chart)
  const profitLossBySip = sipNames
    .map((name) => {
      const invested = sips
        .filter((s) => s.sipName === name)
        .reduce((acc, s) => acc + s.amount, 0);
      const current = sips
        .filter((s) => s.sipName === name)
        .reduce((acc, s) => acc + s.currentAmount, 0);
      const pl = current - invested;
      return { name, value: pl };
    })
    .filter((item) => item.value !== 0);

  // 5. Returns Comparison (Bar Chart)
  const returnsComparison = sipNames
    .map((name) => {
      const invested = sips
        .filter((s) => s.sipName === name)
        .reduce((acc, s) => acc + s.amount, 0);
      const current = sips
        .filter((s) => s.sipName === name)
        .reduce((acc, s) => acc + s.currentAmount, 0);
      const returns =
        invested > 0 ? ((current - invested) / invested) * 100 : 0;
      return { name, returns: parseFloat(returns.toFixed(2)) };
    })
    .filter((item) => item.returns !== 0);

  // 6. Year-wise Investment (Donut/Pie Chart)
  const yearWiseInvestment = yearOptions
    .map((y) => {
      const total = sips
        .filter((s) => s.year == y)
        .reduce((acc, s) => acc + s.amount, 0);
      return { name: y, value: total };
    })
    .filter((item) => item.value > 0);

  // 7. Monthly SIP Flow (Line Chart - not cumulative)
  const monthlySipFlow = labels.map((label) => {
    const amount = monthTotals[label] || 0;
    return { month: label, amount };
  });

  // 8. Portfolio Health Gauge
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

  // Theme colors
  const theme = {
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
  };

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
        {/* Action Buttons */}
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
                }}
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
                    options={sipOptions}
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
                      options={yearOptions}
                      placeholder="Year"
                      theme={theme}
                    />
                    <CustomSelect
                      value={month}
                      onValueChange={setMonth}
                      options={monthOptions}
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
            }}
          >
            <Download size={20} /> Download JSON
          </button>

          {/* Theme Toggle */}
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
            }}
          >
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <div
            style={{
              background: theme.cardBg,
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: theme.mutedText,
                marginBottom: "0.5rem",
              }}
            >
              Total Invested
            </div>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}
            >
              ₹{overallTotal.toLocaleString("en-IN")}
            </div>
          </div>

          <div
            style={{
              background: theme.cardBg,
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                color: theme.mutedText,
                marginBottom: "0.5rem",
              }}
            >
              Current Value
            </div>
            <div
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#8b5cf6" }}
            >
              ₹{overallCurrentTotal.toLocaleString("en-IN")}
            </div>
          </div>

          <div
            style={{
              background: theme.cardBg,
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: `1px solid ${theme.cardBorder}`,
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
              {profitLoss >= 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              Profit/Loss
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: profitLoss >= 0 ? "#10b981" : "#ef4444",
              }}
            >
              ₹{profitLoss.toLocaleString("en-IN")}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: profitLoss >= 0 ? "#10b981" : "#ef4444",
                marginTop: "0.25rem",
              }}
            >
              {profitLoss >= 0 ? "+" : ""}
              {profitLossPercent.toFixed(2)}%
            </div>
          </div>

          {/* Portfolio Health Gauge */}
          <div
            style={{
              background: theme.cardBg,
              borderRadius: "1rem",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: `1px solid ${theme.cardBorder}`,
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
                color: healthColor,
              }}
            >
              {healthStatus}
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
                  width: `${Math.min(Math.max(healthPercent + 50, 0), 100)}%`,
                  height: "100%",
                  background: healthColor,
                  transition: "width 0.3s",
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
              Returns: {profitLossPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Main Chart - Portfolio Growth */}
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
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              color: theme.text,
            }}
          >
            Portfolio Growth (Cumulative)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
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
              <Tooltip
                formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                contentStyle={{
                  background: theme.tooltipBg,
                  border: `1px solid ${theme.tooltipBorder}`,
                  borderRadius: "0.5rem",
                  color: theme.text,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              />
              <Legend wrapperStyle={{ color: theme.text }} />
              <Line
                type="monotone"
                dataKey="invested"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Invested Amount"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="current"
                stroke={lineColor}
                strokeWidth={3}
                name="Current Value"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid - Row 1 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          {/* 1. Portfolio Allocation */}
          <div
            style={{
              background: theme.cardBg,
              borderRadius: "1rem",
              padding: "2rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "1.5rem",
                color: theme.text,
              }}
            >
              Portfolio Allocation
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={portfolioAllocation}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) =>
                    `${entry.name}: ${(
                      (entry.value / overallTotal) *
                      100
                    ).toFixed(1)}%`
                  }
                >
                  {portfolioAllocation.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 2. Monthly Investment Trend */}
          <div
            style={{
              background: theme.cardBg,
              borderRadius: "1rem",
              padding: "2rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "1.5rem",
                color: theme.text,
              }}
            >
              Monthly Investment Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
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
                  }}
                />
                <Bar dataKey="amount" fill="#3b82f6" name="Investment" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
        {/* 3. SIP-wise Growth (Stacked Area) */}
        <div
          style={{
            background: theme.cardBg,
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            border: `1px solid ${theme.cardBorder}`,
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              color: theme.text,
            }}
          >
            SIP-wise Contribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={sipWiseGrowth}>
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
                }}
              />
              <Legend wrapperStyle={{ color: theme.text }} />
              {sipNames.map((name, index) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stackId="1"
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

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
        {/* 5. Returns Comparison */}
        <div
          style={{
            background: theme.cardBg,
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            border: `1px solid ${theme.cardBorder}`,
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              color: theme.text,
            }}
          >
            Returns Comparison (%)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={returnsComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
              <XAxis dataKey="name" stroke={theme.axisColor} />
              <YAxis
                tickFormatter={(val) => `${val}%`}
                stroke={theme.axisColor}
              />
              <Tooltip
                formatter={(val) => `${val}%`}
                contentStyle={{
                  background: theme.tooltipBg,
                  border: `1px solid ${theme.tooltipBorder}`,
                  color: theme.text,
                }}
              />
              <Bar dataKey="returns" name="Returns %">
                {returnsComparison.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.returns >= 0 ? "#10b981" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 6. Year-wise Investment */}
        <div
          style={{
            background: theme.cardBg,
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            border: `1px solid ${theme.cardBorder}`,
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              color: theme.text,
            }}
          >
            Year-wise Investment
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={yearWiseInvestment}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label={(entry) =>
                  `${entry.name}: ₹${entry.value.toLocaleString()}`
                }
              >
                {yearWiseInvestment.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(val) => `₹${val.toLocaleString("en-IN")}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart - Monthly SIP Flow */}
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
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            color: theme.text,
          }}
        >
          Monthly SIP Flow (Non-Cumulative)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlySipFlow}>
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
            />
            <Tooltip
              formatter={(val) => `₹${val.toLocaleString("en-IN")}`}
              contentStyle={{
                background: theme.tooltipBg,
                border: `1px solid ${theme.tooltipBorder}`,
                color: theme.text,
              }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Monthly Investment"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div
        style={{
          background: theme.cardBg,
          borderRadius: "1rem",
          padding: "2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          border: `1px solid ${theme.cardBorder}`,
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
                {yearOptions.map((y) => (
                  <th
                    key={y}
                    colSpan={12}
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
                    {y}
                  </th>
                ))}
              </tr>
              <tr>
                {yearOptions.map(() =>
                  monthOptions.map((m, idx) => (
                    <th
                      key={idx}
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
                      background:
                        idx % 2 === 0 ? theme.tableRowEven : theme.tableRowOdd,
                      fontSize: "0.875rem",
                      color: theme.text,
                      boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
                    }}
                  >
                    {name}
                  </td>
                  {yearOptions.map((y) =>
                    monthOptions.map((m, i) => {
                      const sip = sips.find(
                        (s) =>
                          s.sipName === name && s.year == y && s.month === m
                      );
                      if (!sip)
                        return (
                          <td
                            key={`${y}-${i}`}
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

                      return (
                        <td
                          key={`${y}-${i}`}
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
                {yearOptions.map((y) =>
                  monthOptions.map((m) => {
                    const total = monthTotals[`${m}-${y}`] || 0;

                    return (
                      <td
                        key={`${y}-${m}`}
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
    // </div>
  );
}

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

export default App;