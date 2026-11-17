
import { useEffect, useState } from "react";
import {
  Wind,
  Thermometer,
  Droplets,
  MapPin
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
  ResponsiveContainer,
  Legend
} from "recharts";

function EnvironmentAnalytics() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Safely convert API values into numbers
  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  // Fetch environmental observations
  useEffect(() => {
    const fetchEnvironmentalData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "https://healthguard-ai-5yi2.onrender.com/api/analytics/combined"
        );

        if (!response.ok) {
          throw new Error("Unable to load environmental data.");
        }

        const result = await response.json();

        if (result.status !== "success") {
          throw new Error("Environmental analytics request failed.");
        }

        const environmentalRecords = (result.records || []).filter(
          (item) =>
            item.aqi !== undefined ||
            item.temperature_c !== undefined ||
            item.humidity_pct !== undefined
        );

        setRecords(environmentalRecords);
      } catch (err) {
        console.error("Environment API error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvironmentalData();
  }, []);

  // Calculate average of available numeric observations
  const getAverage = (key) => {
    const values = records
      .map((item) => toNumber(item[key]))
      .filter((value) => value !== null);

    if (values.length === 0) return null;

    return (
      values.reduce((sum, value) => sum + value, 0) /
      values.length
    );
  };

  const averageAQI = getAverage("aqi");
  const averageTemperature = getAverage("temperature_c");
  const averageHumidity = getAverage("humidity_pct");

  // Group environmental observations by zone
  const zoneData = Object.values(
    records.reduce((groups, item) => {
      const zone = item.zone;

      if (!zone) return groups;

      if (!groups[zone]) {
        groups[zone] = {
          zone,
          aqiTotal: 0,
          aqiCount: 0,
          temperatureTotal: 0,
          temperatureCount: 0,
          humidityTotal: 0,
          humidityCount: 0
        };
      }

      const aqi = toNumber(item.aqi);
      const temperature = toNumber(item.temperature_c);
      const humidity = toNumber(item.humidity_pct);

      if (aqi !== null) {
        groups[zone].aqiTotal += aqi;
        groups[zone].aqiCount += 1;
      }

      if (temperature !== null) {
        groups[zone].temperatureTotal += temperature;
        groups[zone].temperatureCount += 1;
      }

      if (humidity !== null) {
        groups[zone].humidityTotal += humidity;
        groups[zone].humidityCount += 1;
      }

      return groups;
    }, {})
  ).map((item) => ({
    zone: item.zone,

    averageAQI: item.aqiCount
      ? Number((item.aqiTotal / item.aqiCount).toFixed(2))
      : null,

    averageTemperature: item.temperatureCount
      ? Number(
          (item.temperatureTotal / item.temperatureCount).toFixed(2)
        )
      : null,

    averageHumidity: item.humidityCount
      ? Number(
          (item.humidityTotal / item.humidityCount).toFixed(2)
        )
      : null
  }));

  // Prepare date-wise environmental trend
  const trendData = [...records]
    .sort((a, b) => {
      const dateComparison = (a.date || "").localeCompare(
        b.date || ""
      );

      if (dateComparison !== 0) return dateComparison;

      return (a.zone || "").localeCompare(b.zone || "");
    })
    .map((item) => {
      const date = item.date || "Unknown";
      const zone = item.zone || "Unknown";

      return {
        label: `${date} - ${zone}`,
        shortLabel: `${date === "Unknown" ? date : date.slice(5)} ${zone.replace(
          "Zone ",
          ""
        )}`,
        aqi: toNumber(item.aqi),
        temperature: toNumber(item.temperature_c)
      };
    })
    .filter(
      (item) => item.aqi !== null || item.temperature !== null
    );

  // Loading state
  if (loading) {
    return (
      <div className="panel">
        <p>Loading environmental analytics...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="panel">
        <h3>Environmental Analytics Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="environment-page">

      {/* Environmental KPI Cards */}
      <div className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Average AQI</span>
            <div className="kpi-icon green">
              <Wind />
            </div>
          </div>

          <h2>
            {averageAQI === null ? "--" : averageAQI.toFixed(1)}
          </h2>

          <p className="kpi-note">
            Average across available observations
          </p>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Average Temperature</span>
            <div className="kpi-icon orange">
              <Thermometer />
            </div>
          </div>

          <h2>
            {averageTemperature === null
              ? "--"
              : `${averageTemperature.toFixed(1)}°C`}
          </h2>

          <p className="kpi-note">
            Recorded environmental temperature
          </p>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Average Humidity</span>
            <div className="kpi-icon blue">
              <Droplets />
            </div>
          </div>

          <h2>
            {averageHumidity === null
              ? "--"
              : `${averageHumidity.toFixed(1)}%`}
          </h2>

          <p className="kpi-note">
            Recorded relative humidity
          </p>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Monitored Zones</span>
            <div className="kpi-icon purple">
              <MapPin />
            </div>
          </div>

          <h2>{zoneData.length}</h2>

          <p className="kpi-note">
            Zones with environmental observations
          </p>
        </div>

      </div>

      {/* Zone-wise AQI Comparison */}
      <div className="panel">

        <div className="panel-heading">
          <div>
            <h3>Zone-wise Air Quality Comparison</h3>
            <p>Average AQI across uploaded observations</p>
          </div>
        </div>

        {zoneData.every((item) => item.averageAQI === null) ? (
          <p>No AQI observations available.</p>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={zoneData}
                margin={{
                  top: 15,
                  right: 20,
                  left: 10,
                  bottom: 10
                }}
              >
                <CartesianGrid
                  stroke="#253247"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="zone"
                  stroke="#8190a7"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />

                <YAxis
                  stroke="#8190a7"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />

                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: "#182438",
                    border: "1px solid #34445d",
                    borderRadius: "10px",
                    color: "#fff"
                  }}
                  formatter={(value) => [
                    Number(value).toFixed(2),
                    "Average AQI"
                  ]}
                />

                <Bar
                  dataKey="averageAQI"
                  name="Average AQI"
                  fill="#22c99a"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {/* Environmental Trend Analysis */}
      <div className="panel">

        <div className="panel-heading">
          <div>
            <h3>Environmental Trend Analysis</h3>
            <p>
              Date-wise AQI and temperature observations
            </p>
          </div>
        </div>

        {trendData.length === 0 ? (
          <p>No environmental trend data available.</p>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{
                  top: 15,
                  right: 25,
                  left: 5,
                  bottom: 30
                }}
              >
                <CartesianGrid
                  stroke="#253247"
                  strokeDasharray="4 4"
                />

                <XAxis
                  dataKey="shortLabel"
                  stroke="#8190a7"
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 11
                  }}
                  interval="preserveStartEnd"
                  minTickGap={15}
                  angle={-20}
                  textAnchor="end"
                  height={55}
                  tickMargin={12}
                />

                {/* AQI axis */}
                <YAxis
                  yAxisId="aqi"
                  orientation="left"
                  stroke="#22c99a"
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 12
                  }}
                  label={{
                    value: "AQI",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#22c99a"
                  }}
                />

                {/* Temperature axis */}
                <YAxis
                  yAxisId="temperature"
                  orientation="right"
                  stroke="#f2a93b"
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 12
                  }}
                  domain={["auto", "auto"]}
                  label={{
                    value: "Temperature (°C)",
                    angle: 90,
                    position: "insideRight",
                    fill: "#f2a93b"
                  }}
                />

                <Tooltip
                  cursor={false}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.label || ""
                  }
                  contentStyle={{
                    background: "#182438",
                    border: "1px solid #34445d",
                    borderRadius: "10px",
                    color: "#fff"
                  }}
                  formatter={(value, name) => [
                    value === null
                      ? "--"
                      : Number(value).toFixed(1),
                    name
                  ]}
                />

                <Legend
                  wrapperStyle={{
                    color: "#94a3b8",
                    paddingTop: "10px"
                  }}
                />

                <Line
                  yAxisId="aqi"
                  type="monotone"
                  dataKey="aqi"
                  name="AQI"
                  stroke="#22c99a"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: "#22c99a",
                    stroke: "#ffffff",
                    strokeWidth: 2
                  }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />

                <Line
                  yAxisId="temperature"
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke="#f2a93b"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: "#f2a93b",
                    stroke: "#ffffff",
                    strokeWidth: 2
                  }}
                  activeDot={{ r: 7 }}
                  connectNulls={false}
                />

              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {/* Zone-wise Environmental Summary */}
      <div className="panel">

        <div className="panel-heading">
          <div>
            <h3>Zone-wise Environmental Summary</h3>
            <p>Average environmental indicators by zone</p>
          </div>
        </div>

        {zoneData.length === 0 ? (
          <p>No environmental data available.</p>
        ) : (
          <div className="environment-table-wrapper">
            <table className="environment-table">

              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Average AQI</th>
                  <th>Temperature</th>
                  <th>Humidity</th>
                </tr>
              </thead>

              <tbody>
                {zoneData.map((item) => (
                  <tr key={item.zone}>
                    <td>{item.zone}</td>

                    <td>
                      {item.averageAQI === null
                        ? "--"
                        : item.averageAQI}
                    </td>

                    <td>
                      {item.averageTemperature === null
                        ? "--"
                        : `${item.averageTemperature}°C`}
                    </td>

                    <td>
                      {item.averageHumidity === null
                        ? "--"
                        : `${item.averageHumidity}%`}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

      <p className="bottom-note">
        Environmental indicators are based on synthetic demonstration
        data. They are monitoring signals, not clinical assessments.
      </p>

    </div>
  );
}

export default EnvironmentAnalytics;
