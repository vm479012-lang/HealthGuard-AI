
import { useEffect, useState } from "react";

const API_URL = "https://healthguard-ai-5yi2.onrender.com";

const teamMembers = [
  {
    name: "Challagundla Mahendra Uthej",
    role: "Team Leader",
  },
  {
    name: "Chandraiahgari Subramanyam",
    role: "Team Member",
  },
  {
    name: "Jonnalagadda Venkata Mahesh",
    role: "Team Member",
  },
  {
    name: "Devireddy Tharun Reddy",
    role: "Team Member",
  },
  {
    name: "Kotakonda Nithish Kumar",
    role: "Team Member",
  },
];

export default function ReportGenerator() {
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        setError("");

        const [analyticsResponse, alertsResponse] = await Promise.all([
          fetch(`${API_URL}/api/analytics/combined`),
          fetch(`${API_URL}/api/alerts`),
        ]);

        if (!analyticsResponse.ok || !alertsResponse.ok) {
          throw new Error("Unable to retrieve report data.");
        }

        const analyticsResult = await analyticsResponse.json();
        const alertsResult = await alertsResponse.json();

        const analyticsData = Array.isArray(analyticsResult)
          ? analyticsResult
          : analyticsResult.records || analyticsResult.data || [];

        setRecords(analyticsData);
        setAlerts(alertsResult.alerts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, []);

  if (loading) {
    return <div className="report-page">Preparing your report...</div>;
  }

  if (error) {
    return (
      <div className="report-page">
        <div className="report-card">
          <h3>Report generation failed</h3>
          <p>{error}</p>
          <p>Check whether your FastAPI backend is running.</p>
        </div>
      </div>
    );
  }

  const validNumbers = (key) =>
    records
      .map((item) => Number(item[key]))
      .filter((value) => Number.isFinite(value));

  const sum = (key) =>
    validNumbers(key).reduce((total, value) => total + value, 0);

  const average = (key) => {
    const values = validNumbers(key);

    return values.length
      ? values.reduce((total, value) => total + value, 0) /
          values.length
      : 0;
  };

  const zones = [
    ...new Set(records.map((item) => item.zone).filter(Boolean)),
  ];

  const highAlerts = alerts.filter(
    (item) => item.level?.toLowerCase() === "high"
  ).length;

  const mediumAlerts = alerts.filter(
    (item) => item.level?.toLowerCase() === "medium"
  ).length;

  const reportDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const zoneSummaries = zones.map((zone) => {
    const zoneRecords = records.filter(
      (item) => item.zone === zone
    );

    const aqiValues = zoneRecords
      .map((item) => item.aqi)
      .filter(
        (value) => value !== null && value !== undefined &&
          value !== "" && Number.isFinite(Number(value))
      );

    const temperatureValues = zoneRecords
      .map((item) => item.temperature_c)
      .filter(
        (value) => value !== null && value !== undefined &&
          value !== "" && Number.isFinite(Number(value))
      );

    return {
      zone,
      observations: zoneRecords.length,
      averageAQI: aqiValues.length
        ? aqiValues.reduce(
            (total, value) => total + Number(value), 0
          ) / aqiValues.length
        : 0,
      averageTemperature: temperatureValues.length
        ? temperatureValues.reduce(
            (total, value) => total + Number(value), 0
          ) / temperatureValues.length
        : 0,
      absences: zoneRecords.reduce(
        (total, item) => total + (Number(item.absence_count) || 0),
        0
      ),
    };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-page">

      <div className="report-heading no-print">
        <div>
          <h2>Health Intelligence Reports</h2>
          <p>Generate and export population health reports.</p>
        </div>

        <button
          className="report-generate-btn"
          onClick={handlePrint}
        >
          Export / Save as PDF
        </button>
      </div>

      <div className="report-document">

        {/* Report Header */}
        <div className="report-document-header">
          <div>
            <h1>HealthGuard AI</h1>
            <p>Population Health Intelligence Report</p>
          </div>

          <div className="report-date">
            <span>Report Generated</span>
            <strong>{reportDate}</strong>
          </div>
        </div>

        <div className="report-divider" />

        {/* Executive Summary */}
        <section className="report-section">
          <h2>1. Executive Summary</h2>
          <p>
            This report presents an overview of environmental,
            healthcare and workforce indicators across the
            monitored zones using the connected demonstration
            dataset.
          </p>
        </section>

        {/* Team Details */}
        <section className="report-section">
          <h2>2. Team Details</h2>

          <div className="report-team-info">
            <p>
              <strong>Team Name:</strong> HealthNext AI
            </p>

            <p>
              <strong>Project Name:</strong> HealthGuard AI
            </p>

            <p>
              <strong>Institution:</strong> Prathyusha Engineering College
            </p>

            <p>
              <strong>Challenge:</strong> Future Health Digital
              Innovation Challenge
            </p>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>S. No.</th>
                  <th>Team Member</th>
                  <th>Role</th>
                </tr>
              </thead>

              <tbody>
                {teamMembers.map((member, index) => (
                  <tr key={member.name}>
                    <td>{index + 1}</td>
                    <td>{member.name}</td>
                    <td>{member.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Population Health Indicators */}
        <section className="report-section">
          <h2>3. Population Health Indicators</h2>

          <div className="report-kpi-grid">
            <div>
              <span>Total Healthcare Visits</span>
              <strong>{sum("visits")}</strong>
            </div>

            <div>
              <span>Total Workforce Absences</span>
              <strong>{sum("absence_count")}</strong>
            </div>

            <div>
              <span>Average AQI</span>
              <strong>{average("aqi").toFixed(2)}</strong>
            </div>

            <div>
              <span>Average Temperature</span>
              <strong>
                {average("temperature_c").toFixed(2)}°C
              </strong>
            </div>
          </div>

          <p>
            Monitored zones: <strong>{zones.length}</strong>
            {" | "}
            Total observations: <strong>{records.length}</strong>
          </p>
        </section>

        {/* Zone-wise Analysis */}
        <section className="report-section">
          <h2>4. Zone-wise Analysis</h2>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Observations</th>
                  <th>Average AQI</th>
                  <th>Average Temperature</th>
                  <th>Absences</th>
                </tr>
              </thead>

              <tbody>
                {zoneSummaries.map((item) => (
                  <tr key={item.zone}>
                    <td>{item.zone}</td>
                    <td>{item.observations}</td>
                    <td>{item.averageAQI.toFixed(2)}</td>
                    <td>
                      {item.averageTemperature.toFixed(2)}°C
                    </td>
                    <td>{item.absences}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Early Warning Summary */}
        <section className="report-section">
          <h2>5. Early Warning Summary</h2>

          <div className="report-kpi-grid">
            <div>
              <span>Total Alerts</span>
              <strong>{alerts.length}</strong>
            </div>

            <div>
              <span>High Priority</span>
              <strong>{highAlerts}</strong>
            </div>

            <div>
              <span>Medium Priority</span>
              <strong>{mediumAlerts}</strong>
            </div>
          </div>

          {alerts.length === 0 ? (
            <p>No alerts are currently available.</p>
          ) : (
            alerts.map((alert, index) => (
              <div className="report-alert" key={index}>
                <div>
                  <strong>
                    {alert.zone} — {alert.level} Priority
                  </strong>
                  <span>{alert.date}</span>
                </div>

                <p>{alert.detail}</p>
                <small>{alert.status}</small>
              </div>
            ))
          )}
        </section>

        {/* Recommendations */}
        <section className="report-section">
          <h2>6. Preventive Recommendations</h2>

          <ul>
            <li>
              Review areas with elevated air-quality indicators.
            </li>
            <li>
              Consider suitable heat-safety and hydration measures
              when temperature indicators are elevated.
            </li>
            <li>
              Monitor workforce absence trends and review staffing
              requirements.
            </li>
            <li>
              Ensure authorized administrators review all warning
              signals before taking action.
            </li>
          </ul>
        </section>

        {/* Data Limitations */}
        <section className="report-section report-notice">
          <h2>7. Data Limitations</h2>
          <p>
            This report uses synthetic demonstration data.
            Aggregated workforce observations do not represent
            unique individuals. Alert thresholds are illustrative,
            and forecasts or statistical relationships are not
            clinically validated. This report is for demonstration
            and decision-support purposes only, not medical
            diagnosis or individual medical advice.
          </p>
        </section>

        <div className="report-footer">
          HealthGuard AI | HealthNext AI | Prathyusha Engineering
          College
        </div>

      </div>
    </div>
  );
}
