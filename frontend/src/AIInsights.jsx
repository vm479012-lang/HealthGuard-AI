
import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function generateRecommendations(alert) {
  const reasons = alert.signals || [];
  const description = reasons.join(" ").toLowerCase();

  const recommendations = [];

  if (description.includes("aqi")) {
    recommendations.push(
      "Review local air-quality conditions and consider reducing outdoor exposure during periods of poor air quality."
    );
  }

  if (description.includes("temperature")) {
    recommendations.push(
      "Review heat conditions, provide access to drinking water, and consider additional cooling and rest arrangements."
    );
  }

  if (
    description.includes("absence") ||
    description.includes("workforce")
  ) {
    recommendations.push(
      "Review workforce absence trends and check whether additional staff support or workload adjustments are needed."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Review the available environmental and workforce indicators before deciding on preventive measures."
    );
  }

  recommendations.push(
    "Ask an authorized administrator to review the alert before taking action."
  );

  return recommendations;
}

function explainAlert(alert) {
  const signals = alert.signals || [];

  if (signals.length > 0) {
    return signals.join(" • ");
  }

  return (
    alert.description ||
    alert.message ||
    "Multiple indicators require further review."
  );
}

export default function AIInsights() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/alerts`);

        if (!response.ok) {
          throw new Error("Unable to retrieve alerts from the backend.");
        }

        const result = await response.json();

        const alertList = Array.isArray(result)
          ? result
          : result.alerts || [];

        setAlerts(alertList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="ai-insights-page">
        <div className="insight-card">
          Loading AI insights...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-insights-page">
        <div className="insight-card">
          <h3>Unable to load insights</h3>
          <p>{error}</p>
          <p>Check whether your FastAPI backend is running.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-insights-page">

      <div className="insights-heading">
        <div>
          <h2>AI Health Insights</h2>
          <p>
            Understand warning signals and explore preventive
            recommendations.
          </p>
        </div>

        <span className="insight-status">
          ● Insights Generated
        </span>
      </div>

      <div className="insight-summary-grid">

        <div className="insight-stat-card">
          <span>Total Alerts</span>
          <h2>{alerts.length}</h2>
          <p>Alerts requiring review</p>
        </div>

        <div className="insight-stat-card">
          <span>High Priority</span>
          <h2>
            {
              alerts.filter(
                (item) =>
                  item.level?.toLowerCase() === "high"
              ).length
            }
          </h2>
          <p>High-level warning signals</p>
        </div>

        <div className="insight-stat-card">
          <span>Human Review</span>
          <h2>{alerts.length}</h2>
          <p>Alerts requiring administrator review</p>
        </div>

      </div>

      <div className="insights-section">
        <h3>Explainable AI Insights</h3>
        <p className="insights-subtitle">
          Each insight explains the observed warning signals
          and suggests possible preventive actions.
        </p>

        {alerts.length === 0 ? (
          <div className="insight-card">
            <h3>No active alerts</h3>
            <p>
              No warning signals are currently available
              in the connected dataset.
            </p>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div className="ai-insight-card" key={index}>

              <div className="ai-insight-header">
                <div>
                  <h3>
                    {alert.zone || "Monitored Zone"}
                  </h3>
                  <span>
                    {alert.date || "Date unavailable"}
                  </span>
                </div>

                <span
                  className={`insight-severity ${
                    alert.level?.toLowerCase() || "medium"
                  }`}
                >
                  {alert.level || "Review"}
                </span>
              </div>

              <div className="insight-explanation">
                <h4>Why was this alert generated?</h4>
                <p>{explainAlert(alert)}</p>
              </div>

              <div className="insight-recommendations">
                <h4>Recommended preventive actions</h4>

                <ul>
                  {generateRecommendations(alert).map(
                    (recommendation, i) => (
                      <li key={i}>{recommendation}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="insight-review">
                Human review required before action.
              </div>

            </div>
          ))
        )}
      </div>

      <div className="insight-disclaimer">
        <h3>Important Notice</h3>
        <p>
          These insights are rule-based recommendations generated
          from synthetic demonstration data. They are not
          medical advice, clinical predictions, or diagnoses.
          Thresholds are illustrative and require validation
          before real-world use.
        </p>
      </div>

    </div>
  );
}
