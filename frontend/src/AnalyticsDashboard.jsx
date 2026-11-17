
import { useEffect, useState } from "react";
import {
  Activity,
  Users,
  Wind,
  HeartPulse,
  Download
} from "lucide-react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function AnalyticsDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch combined analytics from FastAPI
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "https://healthguard-ai-5yi2.onrender.com/api/analytics/combined"
        );

        if (!response.ok) {
          throw new Error("Unable to load combined analytics.");
        }

        const result = await response.json();

        if (result.status !== "success") {
          throw new Error("Analytics request failed.");
        }

        setRecords(result.records || []);

      } catch (err) {
        console.error("Analytics API error:", err);
        setError(err.message);

      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Safely calculate averages
  const getAverage = (key) => {
    const values = records
      .map((item) => item[key])
      .filter(
        (value) =>
          typeof value === "number" &&
          Number.isFinite(value)
      );

    if (values.length === 0) return 0;

    return values.reduce((sum, value) => sum + value, 0)
      / values.length;
  };

  // Combined KPI calculations
  const totalVisits = records.reduce(
    (sum, item) => sum + (item.visits || 0),
    0
  );

  const totalAbsences = records.reduce(
    (sum, item) => sum + (item.absence_count || 0),
    0
  );

  const averageAQI = getAverage("aqi");
  const averageAbsenceRate = getAverage("absence_rate_pct");

  // Zone-wise combined calculations
  const zones = Object.values(
    records.reduce((groups, item) => {
      if (!groups[item.zone]) {
        groups[item.zone] = {
          zone: item.zone,
          visits: 0,
          absences: 0,
          workforce: 0,
          aqiTotal: 0,
          aqiCount: 0
        };
      }

      groups[item.zone].visits += item.visits || 0;
      groups[item.zone].absences += item.absence_count || 0;
      groups[item.zone].workforce += item.workforce_count || 0;

      if (
        typeof item.aqi === "number" &&
        Number.isFinite(item.aqi)
      ) {
        groups[item.zone].aqiTotal += item.aqi;
        groups[item.zone].aqiCount += 1;
      }

      return groups;
    }, {})
  ).map((item) => ({
    ...item,

    averageAQI: item.aqiCount
      ? Number(
          (item.aqiTotal / item.aqiCount).toFixed(2)
        )
      : 0,

    absenceRate: item.workforce
      ? Number(
          (
            (item.absences / item.workforce) * 100
          ).toFixed(2)
        )
      : 0
  }));

  // Combined date-wise trend
  const trendData = [...records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: `${item.date} ${item.zone}`,
      visits: item.visits ?? null,
      aqi: item.aqi ?? null,
      absenceRate: item.absence_rate_pct ?? null
    }));

  // Export combined analytics as CSV
  const exportCSV = () => {
    const headers = [
      "Date",
      "Zone",
      "Healthcare Visits",
      "AQI",
      "Temperature",
      "Humidity",
      "Absences",
      "Workforce",
      "Absence Rate"
    ];

    const rows = records.map((item) => [
      item.date,
      item.zone,
      item.visits ?? "",
      item.aqi ?? "",
      item.temperature_c ?? "",
      item.humidity_pct ?? "",
      item.absence_count ?? "",
      item.workforce_count ?? "",
      item.absence_rate_pct ?? ""
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "HealthGuard_Analytics.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  // Shared dark tooltip styling
  const darkTooltipStyle = {
    backgroundColor: "#17263b",
    border: "1px solid #34445d",
    borderRadius: "10px",
    color: "#ffffff",
    padding: "12px"
  };

  if (loading) {
    return (
      <div className="panel">
        <p>Loading advanced analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <h3>Analytics Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">

      {/* Page Heading */}
      <div className="analytics-heading">
        <div>
          <h2>Advanced Analytics</h2>
          <p>
            Combined population, workforce and environmental indicators
          </p>
        </div>

        <button
          className="analytics-export-btn"
          onClick={exportCSV}
        >
          <Download size={17} />
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Healthcare Visits</span>
            <div className="kpi-icon blue">
              <HeartPulse />
            </div>
          </div>

          <h2>{totalVisits}</h2>

          <p className="kpi-note">
            Summed across observations
          </p>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Workforce Absences</span>
            <div className="kpi-icon purple">
              <Users />
            </div>
          </div>

          <h2>{totalAbsences}</h2>

          <p className="kpi-note">
            Reported absence observations
          </p>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Average AQI</span>
            <div className="kpi-icon green">
              <Wind />
            </div>
          </div>

          <h2>{averageAQI.toFixed(1)}</h2>

          <p className="kpi-note">
            Environmental observations
          </p>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Average Absence Rate</span>
            <div className="kpi-icon orange">
              <Activity />
            </div>
          </div>

          <h2>{averageAbsenceRate.toFixed(2)}%</h2>

          <p className="kpi-note">
            Average across observations
          </p>
        </div>

      </div>

      {/* Combined Health and Environment Trends */}
      <div className="panel">

        <div className="panel-heading">
          <div>
            <h3>Combined Health and Environment Trends</h3>
            <p>
              Healthcare visits and AQI across observations
            </p>
          </div>
        </div>

        {trendData.length === 0 ? (
          <p>No combined trend data available.</p>
        ) : (
          <div className="chart-container">

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>

                <CartesianGrid
                  stroke="#253247"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="date"
                  stroke="#8190a7"
                />

                <YAxis stroke="#8190a7" />

                <Tooltip
                  contentStyle={darkTooltipStyle}
                  labelStyle={{
                    color: "#ffffff",
                    fontWeight: "600",
                    marginBottom: "8px"
                  }}
                  itemStyle={{
                    fontSize: "13px"
                  }}
                  cursor={{
                    stroke: "#64748b",
                    strokeDasharray: "4 4"
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="visits"
                  name="Healthcare Visits"
                  stroke="#3988ff"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="aqi"
                  name="AQI"
                  stroke="#22c99a"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  connectNulls={false}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>
        )}
      </div>

      {/* Zone-wise Combined Comparison */}
      <div className="panel">

        <div className="panel-heading">
          <div>
            <h3>Zone-wise Combined Comparison</h3>
            <p>
              Healthcare visits and workforce absences by zone
            </p>
          </div>
        </div>

        {zones.length === 0 ? (
          <p>No zone comparison data available.</p>
        ) : (
          <div className="chart-container">

            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones}>

                <CartesianGrid
                  stroke="#253247"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="zone"
                  stroke="#8190a7"
                />

                <YAxis stroke="#8190a7" />

                <Tooltip
                  contentStyle={darkTooltipStyle}
                  labelStyle={{
                    color: "#ffffff",
                    fontWeight: "600",
                    marginBottom: "8px"
                  }}
                  itemStyle={{
                    fontSize: "13px"
                  }}
                  cursor={{
                    fill: "rgba(100, 116, 139, 0.12)"
                  }}
                />

                <Bar
                  dataKey="visits"
                  name="Healthcare Visits"
                  fill="#3988ff"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="absences"
                  name="Absences"
                  fill="#f2a93b"
                  radius={[5, 5, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>
        )}
      </div>

      {/* Combined Zone Summary */}
      <div className="panel">

        <div className="panel-heading">
          <div>
            <h3>Combined Zone Summary</h3>
            <p>
              Aggregated indicators from uploaded datasets
            </p>
          </div>
        </div>

        <div className="analytics-table-wrapper">

          <table className="analytics-table">

            <thead>
              <tr>
                <th>Zone</th>
                <th>Visits</th>
                <th>Absences</th>
                <th>Absence Rate</th>
                <th>Average AQI</th>
              </tr>
            </thead>

            <tbody>
              {zones.map((item) => (
                <tr key={item.zone}>
                  <td>{item.zone}</td>
                  <td>{item.visits}</td>
                  <td>{item.absences}</td>
                  <td>{item.absenceRate}%</td>
                  <td>{item.averageAQI}</td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>
      </div>

      {/* Disclaimer */}
      <p className="bottom-note">
        Analytics are based on synthetic demonstration data.
        Observed relationships do not establish causation or clinical risk.
      </p>

    </div>
  );
}

export default AnalyticsDashboard;
