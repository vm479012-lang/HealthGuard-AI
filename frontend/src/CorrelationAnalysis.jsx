
import { useEffect, useState } from "react";
import {
  Activity,
  Wind,
  Users,
  Thermometer,
  ShieldAlert
} from "lucide-react";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function CorrelationAnalysis() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch combined observations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/analytics/combined"
        );

        if (!response.ok) {
          throw new Error("Unable to load correlation data.");
        }

        const result = await response.json();

        if (result.status !== "success") {
          throw new Error("Analytics request failed.");
        }

        setRecords(result.records || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate Pearson correlation using available paired values
  const calculateCorrelation = (xKey, yKey) => {
    const pairs = records
      .filter(
        (item) =>
          typeof item[xKey] === "number" &&
          Number.isFinite(item[xKey]) &&
          typeof item[yKey] === "number" &&
          Number.isFinite(item[yKey])
      )
      .map((item) => ({
        x: item[xKey],
        y: item[yKey]
      }));

    if (pairs.length < 2) {
      return { value: null, count: pairs.length };
    }

    const meanX =
      pairs.reduce((sum, item) => sum + item.x, 0) / pairs.length;

    const meanY =
      pairs.reduce((sum, item) => sum + item.y, 0) / pairs.length;

    const numerator = pairs.reduce(
      (sum, item) =>
        sum + (item.x - meanX) * (item.y - meanY),
      0
    );

    const denominatorX = Math.sqrt(
      pairs.reduce(
        (sum, item) => sum + (item.x - meanX) ** 2,
        0
      )
    );

    const denominatorY = Math.sqrt(
      pairs.reduce(
        (sum, item) => sum + (item.y - meanY) ** 2,
        0
      )
    );

    if (denominatorX === 0 || denominatorY === 0) {
      return { value: null, count: pairs.length };
    }

    return {
      value: numerator / (denominatorX * denominatorY),
      count: pairs.length
    };
  };

  const correlationItems = [
    {
      title: "AQI vs Healthcare Visits",
      description: "Air quality and healthcare visit observations",
      xKey: "aqi",
      yKey: "visits",
      xLabel: "AQI",
      yLabel: "Healthcare Visits",
      icon: Wind,
      color: "#22c99a"
    },
    {
      title: "AQI vs Workforce Absences",
      description: "Air quality and workforce absence observations",
      xKey: "aqi",
      yKey: "absence_rate_pct",
      xLabel: "AQI",
      yLabel: "Absence Rate (%)",
      icon: Users,
      color: "#3988ff"
    },
    {
      title: "Temperature vs Workforce Absences",
      description: "Temperature and workforce absence observations",
      xKey: "temperature_c",
      yKey: "absence_rate_pct",
      xLabel: "Temperature (°C)",
      yLabel: "Absence Rate (%)",
      icon: Thermometer,
      color: "#f2a93b"
    }
  ];

  const correlations = correlationItems.map((item) => ({
    ...item,
    ...calculateCorrelation(item.xKey, item.yKey)
  }));

  // Transparent illustrative warning signals
  const warningSignals = records.flatMap((item) => {
    const signals = [];

    if (item.aqi >= 120) {
      signals.push("AQI at or above 120");
    }

    if (item.temperature_c >= 38) {
      signals.push("Temperature at or above 38°C");
    }

    if (item.absence_rate_pct >= 8) {
      signals.push("Absence rate at or above 8%");
    }

    if (signals.length === 0) return [];

    return [{
      date: item.date,
      zone: item.zone,
      signals
    }];
  });

  const getCorrelationLabel = (value) => {
    if (value === null) return "Insufficient variation";
    const strength = Math.abs(value);

    if (strength < 0.3) return "Weak";
    if (strength < 0.7) return "Moderate";
    return "Strong";
  };

  const getCorrelationColor = (value) => {
    if (value === null) return "#91a7c2";

    if (Math.abs(value) < 0.3) return "#91a7c2";
    if (Math.abs(value) < 0.7) return "#f2a93b";

    return "#22c99a";
  };

  if (loading) {
    return (
      <div className="panel">
        Loading correlation analysis...
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <h3>Correlation Analysis Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="correlation-page">

      {/* Page Heading */}
      <div className="panel">
        <h2>Correlation & Risk Intelligence</h2>
        <p>
          Explore relationships between environmental,
          healthcare and workforce indicators.
        </p>
      </div>

      {/* Correlation Cards */}
      <div className="correlation-grid">

        {correlations.map((item) => {
          const Icon = item.icon;

          return (
            <div className="kpi-card" key={item.title}>
              <div className="kpi-top">
                <span>{item.title}</span>
                <div className="kpi-icon blue">
                  <Icon />
                </div>
              </div>

              <h2>
                {item.value === null
                  ? "--"
                  : item.value.toFixed(3)}
              </h2>

              <p className="kpi-note">
                {getCorrelationLabel(item.value)} correlation
              </p>

              <p className="kpi-note">
                Paired observations: {item.count}
              </p>
            </div>
          );
        })}

      </div>

      {/* Scatter Charts */}
      {correlations.map((item) => {
        const chartData = records
          .filter(
            (record) =>
              typeof record[item.xKey] === "number" &&
              Number.isFinite(record[item.xKey]) &&
              typeof record[item.yKey] === "number" &&
              Number.isFinite(record[item.yKey])
          )
          .map((record) => ({
            x: record[item.xKey],
            y: record[item.yKey],
            zone: record.zone,
            date: record.date
          }));

        return (
          <div className="panel" key={item.title}>
            <div className="panel-heading">
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>

            {chartData.length < 2 ? (
              <p>Not enough paired observations for this chart.</p>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid
                      stroke="#253247"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      type="number"
                      dataKey="x"
                      name={item.xLabel}
                      stroke="#8190a7"
                      label={{
                        value: item.xLabel,
                        position: "insideBottom",
                        offset: -5,
                        fill: "#91a7c2"
                      }}
                    />

                    <YAxis
                      type="number"
                      dataKey="y"
                      name={item.yLabel}
                      stroke="#8190a7"
                    />

                    <Tooltip
                      cursor={{
                        strokeDasharray: "4 4",
                        stroke: "#64748b"
                      }}
                      contentStyle={{
                        backgroundColor: "#17263b",
                        border: "1px solid #34445d",
                        borderRadius: "10px",
                        color: "#ffffff"
                      }}
                      formatter={(value, name) => [
                        value,
                        name
                      ]}
                      labelFormatter={() => ""}
                    />

                    <Scatter
                      name={item.title}
                      data={chartData}
                      fill={item.color}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            <p className="kpi-note">
              {item.count} paired observations used.
            </p>
          </div>
        );
      })}

      {/* Explainable Warning Signals */}
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>
              <ShieldAlert size={19} /> Explainable Warning Signals
            </h3>
            <p>
              Transparent threshold-based indicators requiring review
            </p>
          </div>
        </div>

        {warningSignals.length === 0 ? (
          <p>No configured warning thresholds were reached.</p>
        ) : (
          warningSignals.map((item, index) => (
            <div
              className="correlation-warning"
              key={`${item.date}-${item.zone}-${index}`}
            >
              <div>
                <strong>{item.zone}</strong>
                <p>{item.date}</p>
                <p>{item.signals.join(" · ")}</p>
              </div>

              <span className="alert-badge medium">
                Review required
              </span>
            </div>
          ))
        )}
      </div>

      {/* Important Disclaimer */}
      <div className="panel">
        <h3>Analysis Limitations</h3>
        <p>
          Correlation describes statistical association, not causation.
          Results are exploratory because the current dataset contains
          only a small number of synthetic observations.
        </p>
        <p>
          Thresholds are illustrative development settings,
          not clinically validated risk criteria.
        </p>
        <p>
          All warning signals require human review.
          This system does not diagnose individuals.
        </p>
      </div>

    </div>
  );
}

export default CorrelationAnalysis;
