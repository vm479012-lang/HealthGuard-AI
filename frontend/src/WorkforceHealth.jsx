
import { useEffect, useState } from "react";
import {
  Users,
  UserMinus,
  Activity,
  TrendingUp
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function WorkforceHealth() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch workforce data from FastAPI
  useEffect(() => {
    const fetchWorkforceData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "https://healthguard-ai-5yi2.onrender.com/api/analytics/combined"
        );

        if (!response.ok) {
          throw new Error("Unable to load workforce data.");
        }

        const result = await response.json();

        if (result.status !== "success") {
          throw new Error("Workforce analytics request failed.");
        }

        const workforceRecords = (result.records || []).filter(
          (item) => item.workforce_count !== undefined
        );

        setRecords(workforceRecords);

      } catch (err) {
        console.error("Workforce API error:", err);
        setError(err.message);

      } finally {
        setLoading(false);
      }
    };

    fetchWorkforceData();
  }, []);

  // Total workforce observations
  const totalWorkforce = records.reduce(
    (sum, item) => sum + (item.workforce_count || 0),
    0
  );

  // Total reported absences
  const totalAbsences = records.reduce(
    (sum, item) => sum + (item.absence_count || 0),
    0
  );

  // Average absence rate across observations
  const averageAbsenceRate = records.length
    ? (
        records.reduce(
          (sum, item) => sum + (item.absence_rate_pct || 0),
          0
        ) / records.length
      ).toFixed(2)
    : "0.00";

  // Zone-wise workforce comparison
  const zoneData = Object.values(
    records.reduce((groups, item) => {
      const zone = item.zone;

      if (!groups[zone]) {
        groups[zone] = {
          zone,
          absences: 0,
          workforce: 0
        };
      }

      groups[zone].absences += item.absence_count || 0;
      groups[zone].workforce += item.workforce_count || 0;

      return groups;
    }, {})
  ).map((item) => ({
    ...item,
    absenceRate: item.workforce
      ? Number(
          (
            (item.absences / item.workforce) * 100
          ).toFixed(2)
        )
      : 0
  }));

  // Date-wise absence trend with short labels for a cleaner X-axis
  const trendData = [...records]
    .sort((a, b) => {
      const dateOrder = a.date.localeCompare(b.date);
      return dateOrder || a.zone.localeCompare(b.zone);
    })
    .map((item) => ({
      // Example: 11-10 A (full date and zone remain in the tooltip)
      date: `${item.date.slice(5)} ${item.zone.replace("Zone ", "")}`,
      fullDate: `${item.date} - ${item.zone}`,
      absenceRate: Number(item.absence_rate_pct || 0),
      absences: item.absence_count || 0
    }));

  // Loading state
  if (loading) {
    return (
      <div className="panel">
        <p>Loading workforce analytics...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="panel">
        <h3>Workforce Analytics Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="workforce-page">

      {/* Workforce KPI Cards */}
      <div className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Total Workforce Observations</span>
            <div className="kpi-icon blue">
              <Users />
            </div>
          </div>

          <h2>{totalWorkforce}</h2>

          <p className="kpi-note">
            Summed across uploaded observations
          </p>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Total Absences</span>
            <div className="kpi-icon orange">
              <UserMinus />
            </div>
          </div>

          <h2>{totalAbsences}</h2>

          <p className="kpi-note">
            Reported absence observations
          </p>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Average Absence Rate</span>
            <div className="kpi-icon purple">
              <Activity />
            </div>
          </div>

          <h2>{averageAbsenceRate}%</h2>

          <p className="kpi-note">
            Average across combined records
          </p>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Monitored Zones</span>
            <div className="kpi-icon green">
              <TrendingUp />
            </div>
          </div>

          <h2>{zoneData.length}</h2>

          <p className="kpi-note">
            Zones with workforce data
          </p>
        </div>

      </div>

      {/* Zone-wise Workforce Absence */}
      <div className="panel">

        <div className="panel-heading">
          <div>
            <h3>Zone-wise Workforce Absence</h3>
            <p>
              Absence rate calculated from uploaded observations
            </p>
          </div>
        </div>

        {zoneData.length === 0 ? (
          <p>No workforce observations available.</p>
        ) : (
          <div className="chart-container">

            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneData}>

                <CartesianGrid
                  stroke="#253247"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="zone"
                  stroke="#8190a7"
                />

                <YAxis
                  stroke="#8190a7"
                  unit="%"
                />

                <Tooltip
                  contentStyle={{
                    background: "#182438",
                    border: "1px solid #34445d",
                    borderRadius: "10px",
                    color: "#fff"
                  }}
                  formatter={(value) => [
                    `${value}%`,
                    "Absence Rate"
                  ]}
                />

                <Bar
                  dataKey="absenceRate"
                  name="Absence Rate"
                  fill="#3988ff"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>

          </div>
        )}
      </div>

      {/* Workforce Absence Trend */}
      <div className="panel">

        <div className="panel-heading">
          <div>
            <h3>Workforce Absence Trend</h3>
            <p>
              Date-wise absence rate from uploaded observations
            </p>
          </div>
        </div>

        {trendData.length === 0 ? (
          <p>No workforce trend data available.</p>
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
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  tickMargin={12}
                />

                <YAxis
                  stroke="#8190a7"
                  unit="%"
                />

                <Tooltip
                  contentStyle={{
                    background: "#182438",
                    border: "1px solid #34445d",
                    borderRadius: "10px",
                    color: "#fff"
                  }}
                  labelStyle={{ color: "#ffffff", marginBottom: "6px" }}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullDate || label
                  }
                  formatter={(value) => [
                    `${Number(value).toFixed(2)}%`,
                    "Absence Rate"
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="absenceRate"
                  name="Absence Rate"
                  stroke="#22c99a"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>
        )}
      </div>

      {/* Workforce Comparison Table */}
      <div className="panel">

        <div className="panel-heading">
          <div>
            <h3>Zone-wise Workforce Summary</h3>
            <p>
              Workforce and absence observations by zone
            </p>
          </div>
        </div>

        {zoneData.length === 0 ? (
          <p>No workforce data available.</p>
        ) : (
          <div className="workforce-table-wrapper">
            <table className="workforce-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Workforce Observations</th>
                  <th>Absences</th>
                  <th>Absence Rate</th>
                </tr>
              </thead>

              <tbody>
                {zoneData.map((item) => (
                  <tr key={item.zone}>
                    <td>{item.zone}</td>
                    <td>{item.workforce}</td>
                    <td>{item.absences}</td>
                    <td>
                      <span className="workforce-rate">
                        {item.absenceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="bottom-note">
        Workforce indicators are based on synthetic demonstration data.
        These aggregated observations are not individual health assessments.
      </p>

    </div>
  );
}

export default WorkforceHealth;
