import React, { useState, useEffect } from "react";
import { Line } from "recharts";
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as Select from "@radix-ui/react-select";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Check, Download, Plus, TrendingUp, TrendingDown } from "lucide-react";

function App() {
  const [sipName, setSipName] = useState("");
  const [amount, setAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("");
  const [sips, setSips] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sipOptions = ["Parag Parikh Flexi Cap", "ICICI Prudential Bluechip"];
  const yearOptions = ["2025", "2026", "2027"];
  const monthOptions = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  useEffect(() => {
    fetch("/sips.json")
      .then(res => res.json())
      .then(data => setSips(data))
      .catch(err => console.error("Failed to load JSON:", err));
  }, []);

  const addSIP = () => {
    if (!sipName || !amount || !currentAmount || !year || !month) {
      alert("Please fill all fields including current value");
      return;
    }
    setSips([...sips, {
      sipName,
      amount: parseFloat(amount),
      currentAmount: parseFloat(currentAmount),
      year: parseInt(year),
      month
    }]);
    setSipName(""); setAmount(""); setMonth(""); setCurrentAmount("");
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

  const sipNames = Array.from(new Set(sips.map(s => s.sipName).concat(sipOptions)));

  // Month totals
  const monthTotals = {};
  yearOptions.forEach(y => {
    monthOptions.forEach(m => {
      const total = sips.filter(s => s.year == y && s.month === m)
                        .reduce((acc, s) => acc + s.amount, 0);
      monthTotals[`${m}-${y}`] = total;

      const monthSips = sips.filter(s => s.year == y && s.month === m);
      const totalCurrent = monthSips.reduce((acc, s) => acc + s.currentAmount, 0);
      monthTotals[`current-${m}-${y}`] = totalCurrent || 0;
    });
  });
  
  const overallTotal = sips.reduce((acc, s) => acc + s.amount, 0);

  // Chart Data
  const labels = yearOptions.flatMap(y => monthOptions.map(m => `${m}-${y}`));
  let investedCumulative = 0;
  let lastKnownCurrent = 0;

  const chartData = [];

  labels.forEach(label => {
    const [m, y] = label.split("-");
    const monthSips = sips.filter(s => s.year == y && s.month === m);
    const monthInvested = monthSips.reduce((acc, s) => acc + s.amount, 0);
    investedCumulative += monthInvested;
    const monthCurrent = monthSips.reduce((acc, s) => acc + s.currentAmount, 0);
    
    if (monthCurrent > 0) {
      lastKnownCurrent = monthCurrent;
    }

    chartData.push({
      month: label,
      invested: investedCumulative,
      current: lastKnownCurrent
    });
  });

  const overallCurrentTotal = lastKnownCurrent;
  const lineColor = overallCurrentTotal >= overallTotal ? "#10b981" : "#ef4444";
  const profitLoss = overallCurrentTotal - overallTotal;
  const profitLossPercent = overallTotal > 0 ? (profitLoss / overallTotal * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #0f172a, #1e293b)", color: "#f1f5f9", padding: "2rem" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
       
        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap" }}>
          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Trigger asChild>
              <button style={{ background: "linear-gradient(to right, #3b82f6, #8b5cf6)", color: "white", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem" }}>
                <Plus size={20} /> Add SIP Entry
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay style={{ background: "rgba(0, 0, 0, 0.7)", position: "fixed", inset: 0, zIndex: 50 }} />
              <Dialog.Content style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#1e293b", borderRadius: "1rem", padding: "2rem", width: "90vw", maxWidth: "500px", zIndex: 51, border: "1px solid rgba(255,255,255,0.1)" }}>
                <Dialog.Title style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", color: "#f1f5f9" }}>
                  Add New SIP Entry
                </Dialog.Title>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <CustomSelect value={sipName} onValueChange={setSipName} options={sipOptions} placeholder="Select SIP" />
                  
                  <input 
                    type="number" 
                    placeholder="Invested Amount" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "0.75rem", color: "#f1f5f9", fontSize: "1rem" }}
                  />
                  
                  <input 
                    type="number" 
                    placeholder="Current Value" 
                    value={currentAmount} 
                    onChange={e => setCurrentAmount(e.target.value)}
                    style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "0.75rem", color: "#f1f5f9", fontSize: "1rem" }}
                  />
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <CustomSelect value={year} onValueChange={setYear} options={yearOptions} placeholder="Year" />
                    <CustomSelect value={month} onValueChange={setMonth} options={monthOptions} placeholder="Month" />
                  </div>
                  
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                    <button onClick={addSIP} style={{ flex: 1, background: "linear-gradient(to right, #3b82f6, #8b5cf6)", color: "white", padding: "0.75rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "600" }}>
                      Add Entry
                    </button>
                    <Dialog.Close asChild>
                      <button style={{ flex: 1, background: "rgba(255,255,255,0.1)", color: "#f1f5f9", padding: "0.75rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: "600" }}>
                        Cancel
                      </button>
                    </Dialog.Close>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <button onClick={downloadJSON} style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "1px solid rgba(16, 185, 129, 0.3)", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem" }}>
            <Download size={20} /> Download JSON
          </button>
        </div>

        {/* Chart */}
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", borderRadius: "1rem", padding: "2rem", marginBottom: "3rem", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", color: "#f1f5f9" }}>Portfolio Growth</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} stroke="#94a3b8" style={{ fontSize: "0.75rem" }} />
              <YAxis tickFormatter={(val) => `₹${val}`} stroke="#94a3b8" style={{ fontSize: "0.875rem" }} />
              <Tooltip 
                formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "#f1f5f9" }}
              />
              <Legend wrapperStyle={{ color: "#f1f5f9" }} />
              <Line type="monotone" dataKey="invested" stroke="#60a5fa" strokeWidth={3} name="Invested Amount" dot={false} />
              <Line type="monotone" dataKey="current" stroke={lineColor} strokeWidth={3} name="Current Value" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", borderRadius: "1rem", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.5rem" }}>Total Invested</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#60a5fa" }}>₹{overallTotal.toLocaleString('en-IN')}</div>
          </div>
          
          <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", borderRadius: "1rem", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.5rem" }}>Current Value</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#a78bfa" }}>₹{overallCurrentTotal.toLocaleString('en-IN')}</div>
          </div>
          
          <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", borderRadius: "1rem", padding: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {profitLoss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              Profit/Loss
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: profitLoss >= 0 ? "#10b981" : "#ef4444" }}>
              ₹{profitLoss.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: "0.875rem", color: profitLoss >= 0 ? "#10b981" : "#ef4444", marginTop: "0.25rem" }}>
              {profitLoss >= 0 ? "+" : ""}{profitLossPercent.toFixed(2)}%
            </div>
          </div>
        </div>


        {/* Table */}
        <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", borderRadius: "1rem", padding: "2rem", border: "1px solid rgba(255,255,255,0.1)", overflowX: "auto" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", color: "#f1f5f9" }}>Investment Details</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1200px" }}>
            <thead>
              <tr>
                <th rowSpan="2" style={{ background: "rgba(59, 130, 246, 0.2)", padding: "1rem", textAlign: "left", border: "1px solid rgba(255,255,255,0.1)", position: "sticky", left: 0, zIndex: 2, minWidth: "200px", fontSize: "0.875rem", fontWeight: "600", color: "#60a5fa" }}>
                  SIP Name
                </th>
                {yearOptions.map(y => (
                  <th key={y} colSpan={12} style={{ background: "rgba(139, 92, 246, 0.2)", padding: "1rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", fontSize: "1rem", fontWeight: "600", color: "#a78bfa" }}>
                    {y}
                  </th>
                ))}
              </tr>
              <tr>
                {yearOptions.map(() => monthOptions.map((m, idx) => (
                  <th key={idx} style={{ background: "rgba(100, 116, 139, 0.3)", padding: "0.75rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.75rem", fontWeight: "500", color: "#cbd5e1", minWidth: "90px" }}>
                    {m}
                  </th>
                )))}
              </tr>
            </thead>
            <tbody>
              {sipNames.map((name, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                  <td style={{ padding: "1rem", fontWeight: "600", border: "1px solid rgba(255,255,255,0.1)", position: "sticky", left: 0, zIndex: 1, background: idx % 2 === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", fontSize: "0.875rem" }}>
                    {name}
                  </td>
                  {yearOptions.map(y => monthOptions.map((m, i) => {
                    const sip = sips.find(s => s.sipName === name && s.year == y && s.month === m);
                    if (!sip) return (
                      <td key={`${y}-${i}`} style={{ padding: "0.75rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", color: "#475569", fontSize: "0.875rem" }}>
                        -
                      </td>
                    );
                    
                    return (
                      <td key={`${y}-${i}`} style={{ padding: "0.75rem", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: "800", marginBottom: "0.25rem", color: "#e6e9ecff" }}>
                          ₹{sip.amount.toLocaleString()}
                        </div>
                      </td>
                    );
                  }))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "rgba(59, 130, 246, 0.1)" }}>
                <td style={{ padding: "1rem", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.875rem", color: "#60a5fa" }}>
                  Month Total
                </td>
                {yearOptions.map(y => monthOptions.map(m => {
                  const total = monthTotals[`${m}-${y}`] || 0;
                  const totalCurrent = monthTotals[`current-${m}-${y}`] || 0;
                  const color = totalCurrent >= total ? "#10b981" : "#ef4444";
                  
                  return (
                    <td key={`${y}-total`} style={{ padding: "0.75rem", textAlign: "center", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ fontSize: "0.875rem", marginBottom: "0.25rem", color: "#10b981" }}>
                        ₹{total.toLocaleString()}
                      </div>
                    </td>
                  );
                }))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
}

function CustomSelect({ value, onValueChange, options, placeholder }) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "0.75rem", color: "#f1f5f9", fontSize: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", minWidth: "150px" }}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown size={16} />
        </Select.Icon>
      </Select.Trigger>
      
      <Select.Portal>
        <Select.Content style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", padding: "0.5rem", zIndex: 100, boxShadow: "0 10px 38px -10px rgba(0, 0, 0, 0.35)" }}>
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item key={option} value={option.toString()} style={{ padding: "0.5rem 0.75rem", cursor: "pointer", borderRadius: "0.25rem", color: "#f1f5f9", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between", outline: "none" }}>
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