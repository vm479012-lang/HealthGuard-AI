
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const API_URL = "https://healthguard-ai-5yi2.onrender.com";

// Simple least-squares linear trend forecast
function forecastValues(values, steps = 3) {
  if (values.length < 2) return [];

  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  values.forEach((value, index) => {
    numerator += (index - meanX) * (value - meanY);
    denominator += (index - meanX) ** 2;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  return Array.from({ length: steps }, (_, index) => {
    const predicted = intercept + slope * (n + index);
    return Math.max(0, predicted);
  });
}

function formatDate(date, daysAhead) {
  const nextDate = new Date(`${date}T00:00:00`);
  nextDate.setDate(nextDate.getDate() + daysAhead);

  return nextDate.toISOString().slice(0, 10);
}

function getRiskLevel(aqi, absenceRate, temperature) {
  let signals = 0;

  if (aqi >= 120) signals++;
  if (absenceRate >= 8) signals++;
  if (temperature >= 38) signals++;

  if (signals >= 3) return "High";
  if (signals === 2) return "Medium";
  if (signals === 1) return "Low";

  return "Normal";
}

export default function RiskForecast() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/analytics/combined`
        );

        if (!response.ok) {
          throw new Error("Unable to load analytics data.");
        }

        const result = await response.json();

        const data = Array.isArray(result)
          ? result
          : result.records || result.data || [];

        setRecords(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="risk-forecast-page">Loading forecasts...</div>;
  }

  if (error) {
    return (
      <div className="risk-forecast-page">
        <div className="forecast-card">
          <h3>Unable to load forecast</h3>
          <p>{error}</p>
          <p>Check whether your FastAPI backend is running.</p>
        </div>
      </div>
    );
  }

  const validRecords = records
    .filter((item) => item.date && item.zone)
    .sort((a, b) => a.date.localeCompare(b.date));

  const zones = [...new Set(validRecords.map((item) => item.zone))];

  const forecasts = zones.map((zone) => {
    const zoneRecords = validRecords.filter(
      (item) =>
        item.zone === zone &&
        Number.isFinite(Number(item.aqi)) &&
        Number.isFinite(Number(item.absence_rate_pct)) &&
        Number.isFinite(Number(item.temperature_c))
    );

    const aqiValues = zoneRecords.map((item) => Number(item.aqi));
    const absenceValues = zoneRecords.map(
      (item) => Number(item.absence_rate_pct)
    );
    const temperatureValues = zoneRecords.map(
      (item) => Number(item.temperature_c)
    );

    const lastDate = zoneRecords[zoneRecords.length - 1]?.date;

    if (zoneRecords.length < 2) return null;

    const aqiForecast = forecastValues(aqiValues);
    const absenceForecast = forecastValues(absenceValues);
    const temperatureForecast = forecastValues(temperatureValues);

    const chartData = [
      ...zoneRecords.map((item) => ({
        date: item.date,
        actualAQI: Number(item.aqi),
        forecastAQI: null,
      })),
      ...aqiForecast.map((value, index) => ({
        date: formatDate(lastDate, index + 1),
        actualAQI: null,
        forecastAQI: Number(value.toFixed(2)),
      })),
    ];

    const futureRisk = getRiskLevel(
      aqiForecast[2],
      absenceForecast[2],
      temperatureForecast[2]
    );

    return {
      zone,
      observations: zoneRecords.length,
      aqi: aqiForecast[2],
      absenceRate: absenceForecast[2],
      temperature: temperatureForecast[2],
      futureRisk,
      chartData,
    };
  }).filter(Boolean);

  const highRiskCount = forecasts.filter(
    (item) => item.futureRisk === "High"
  ).length;

  return (
    <div className="risk-forecast-page">

      <div className="forecast-heading">
        <div>
          <h2>Predictive Risk Forecasting</h2>
          <p>
            Explore estimated future environmental and workforce indicators.
          </p>
        </div>

        <span className="forecast-status">
          ● Forecast Generated
        </span>
      </div>

      <div className="forecast-summary-grid">

        <div className="forecast-stat-card">
          <span>Monitored Zones</span>
          <h2>{forecasts.length}</h2>
          <p>Zones with sufficient observations</p>
        </div>

        <div className="forecast-stat-card">
          <span>Forecast Period</span>
          <h2>3 Days</h2>
          <p>Illustrative trend projection</p>
        </div>

        <div className="forecast-stat-card">
          <span>High Risk Estimates</span>
          <h2>{highRiskCount}</h2>
          <p>Zones with three threshold signals</p>
        </div>

      </div>

      <div className="forecast-section">
        <h3>Zone-wise Forecast Results</h3>
        <p className="forecast-subtitle">
          Estimated indicator values for the third forecast day.
        </p>

        {forecasts.length === 0 ? (
          <div className="forecast-card">
            Not enough complete observations to generate forecasts.
          </div>
        ) : (
          forecasts.map((item) => (
            <div className="forecast-card" key={item.zone}>

              <div className="forecast-zone-heading">
                <div>
                  <h3>{item.zone}</h3>
                  <span>
                    Based on {item.observations} historical observations
                  </span>
                </div>

                <span
                  className={`forecast-risk ${item.futureRisk.toLowerCase()}`}
                >
                  {item.futureRisk}
                </span>
              </div>

              <div className="forecast-metrics">

                <div>
                  <span>Estimated AQI</span>
                  <strong>{item.aqi.toFixed(2)}</strong>
                </div>

                <div>
                  <span>Estimated Absence Rate</span>
                  <strong>{item.absenceRate.toFixed(2)}%</strong>
                </div>

                <div>
                  <span>Estimated Temperature</span>
                  <strong>{item.temperature.toFixed(2)}°C</strong>
                </div>

              </div>

              <p className="forecast-explanation">
                This estimate is based on the recent linear trend in
                the available observations. It is not a validated
                health-risk prediction.
              </p>

              <div className="forecast-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={item.chartData}>
                    <CartesianGrid stroke="#293d56" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#91a7c2" />
                    <YAxis stroke="#91a7c2" />
                    <Tooltip
                      contentStyle={{
                        background: "#132238",
                        border: "1px solid #293d56",
                        borderRadius: "8px",
                        color: "#f1f5f9",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actualAQI"
                      name="Historical AQI"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="forecastAQI"
                      name="Estimated AQI"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>
          ))
        )}
      </div>

      <div className="forecast-disclaimer">
        <h3>Forecast Limitations</h3>
        <p>
          Forecasts use a simple linear trend calculated from a small
          synthetic dataset. Only three future days are estimated.
          These estimates are not clinically validated, do not
          establish causation, and must not be used for individual
          medical decisions. More historical data and model validation
          are required before real-world use.
        </p>
      </div>

    </div>
  );
}
