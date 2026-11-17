import DataUpload from "./DataUpload";
import WorkforceHealth from "./WorkforceHealth";
import EnvironmentAnalytics from "./EnvironmentAnalytics";
import AnalyticsDashboard from "./AnalyticsDashboard";
import CorrelationAnalysis from "./CorrelationAnalysis";
import RiskForecast from "./RiskForecast";
import AIInsights from "./AIInsights";
import ReportGenerator from "./ReportGenerator";
import SettingsPage from "./SettingsPage";
import { useCallback, useEffect, useState } from "react";
import {
  Activity, LayoutDashboard, Bell, Users, Wind,
  ChartNoAxesCombined, Settings, Search, Menu,
  ShieldCheck, ArrowUpRight, MapPin, AlertTriangle,
  UploadCloud, Sun, Moon, FileText, BrainCircuit, TrendingUp
} from "lucide-react";

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

  // Remember the selected appearance across page reloads.
  const [theme, setTheme] = useState(
    () => localStorage.getItem("healthguard-theme") || "dark"
  );

  useEffect(() => {
    localStorage.setItem("healthguard-theme", theme);
  }, [theme]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [apiStatus, setApiStatus] = useState("Connecting");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");
  // Early Warning API state
  const [earlyWarnings, setEarlyWarnings] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState("");

useEffect(() => {
  fetch("https://healthguard-ai-5yi2.onrender.com/api/dashboard")
    .then((response) => {
      if (!response.ok) {
        throw new Error("API request failed");
      }
      return response.json();
    })
    .then((data) => {
      setDashboardData(data);
      setApiStatus("Connected");
    })
    .catch((error) => {
      console.error("Dashboard API error:", error);
      setApiStatus("Disconnected");
    });
}, []);
useEffect(() => {
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      const response = await fetch(
        "https://healthguard-ai-5yi2.onrender.com/api/analytics/combined"
      );

      if (!response.ok) {
        throw new Error("Unable to load analytics.");
      }

      const result = await response.json();

      if (result.status !== "success") {
        throw new Error("Analytics API returned an unsuccessful response.");
      }

      setAnalytics(result);
    } catch (error) {
      setAnalyticsError(error.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  fetchAnalytics();
}, []);

// Fetch generated early warnings. Reused by page entry and Refresh button.
const fetchEarlyWarnings = useCallback(async () => {
  try {
    setAlertsLoading(true);
    setAlertsError("");

    const response = await fetch("https://healthguard-ai-5yi2.onrender.com/api/alerts");

    if (!response.ok) {
      throw new Error("Unable to load early warnings.");
    }

    const result = await response.json();

    if (result.status !== "success") {
      throw new Error("Early Warning API returned an unsuccessful response.");
    }

    setEarlyWarnings(result.alerts || []);
  } catch (error) {
    console.error("Early Warning API error:", error);
    setAlertsError(error.message || "An unexpected error occurred.");
  } finally {
    setAlertsLoading(false);
  }
}, []);

// Automatically fetch alerts when the application starts
useEffect(() => {
  fetchEarlyWarnings();
}, [fetchEarlyWarnings]);

// Called by the Refresh Alerts button.
const refreshAlerts = () => {
  fetchEarlyWarnings();
};

const records = analytics?.records || [];

const monitoredZones = [
  ...new Set(records.map((item) => item.zone))
].length;

const totalVisits = records.reduce(
  (sum, item) => sum + (item.visits || 0),
  0
);

const averageAQI = records.length
  ? Math.round(
      records.reduce((sum, item) => sum + (item.aqi || 0), 0) /
      records.filter((item) => item.aqi !== undefined).length
    )
  : 0;

const latestDate = records.length
  ? records.reduce(
      (latest, item) => item.date > latest ? item.date : latest,
      records[0].date
    )
  : null;

const latestRecords = records.filter(
  (item) => item.date === latestDate
);

const latestAverageAbsenceRate = latestRecords.length
  ? Number((
      latestRecords.reduce(
        (sum, item) => sum + (item.absence_rate_pct || 0),
        0
      ) / latestRecords.length
    ).toFixed(2))
  : 0;

const trendData = records.map((item) => ({
  day: `${item.date.slice(5)} ${item.zone.replace("Zone ", "")}`,
  health: item.visits ?? null,
  environment: item.aqi ?? null
}));


  const navigation = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Data Upload", icon: UploadCloud },
    { name: "Early Warnings", icon: Bell },
    { name: "Workforce Health", icon: Users },
    { name: "Environment", icon: Wind },
    { name: "Analytics", icon: ChartNoAxesCombined },
    { name: "Correlation & Risk", icon: Activity },
    { name: "AI Insights", icon: BrainCircuit },
    { name: "Risk Forecast", icon: TrendingUp },
    { name: "Reports", icon: FileText },
    { name: "Settings", icon: Settings },
  ];
const filteredNavigation = navigation.filter((item) =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
);
const highAlerts = earlyWarnings.filter(
  (alert) => alert.level === "High"
).length;

const mediumAlerts = earlyWarnings.filter(
  (alert) => alert.level === "Medium"
).length;

const totalAlerts = earlyWarnings.length;

  return (
    <div className={`app-layout ${theme}-theme`}>
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button
          className="brand"
          type="button"
          aria-label="Go to HealthGuard AI overview"
          onClick={() => {
            setActivePage("Overview");
            setMenuOpen(false);
            setShowNotifications(false);
            setShowProfile(false);
            setSearchTerm("");
          }}
        >
          <span className="brand-icon">
            <Activity size={25} />
          </span>
          <span className="brand-copy">
            <h2>HealthGuard<span> AI</span></h2>
            <p>HEALTH INTELLIGENCE</p>
          </span>
        </button>

        <div className="nav-scroll">
          
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setMenuOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

        <div className="sidebar-bottom">
          <div className={`system-status ${apiStatus === "Connected" ? "is-connected" : "is-disconnected"}`}>
            <span className="status-dot"></span>
            <div>
              <strong>{apiStatus === "Connected" ? "API Connected" : apiStatus === "Connecting" ? "Connecting to API" : "API Disconnected"}</strong>
              <p>Local demo environment</p>
            </div>
          </div>
          <div className="user-profile">
            <div className="avatar">HN</div>
            <div>
              <strong>HealthNext AI</strong>
              <p>Project Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="top-left">
            <button
              className="menu-button"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="breadcrumb">Workspace / Dashboard</p>
              <h1>{activePage}</h1>
            </div>
          </div>
          
          <div className="top-actions">

            {/* Functional Dashboard Search */}
            <div className="search-wrapper">
              <div className="search-box">
                <Search size={17} />
                <input
                  type="text"
                  placeholder="Search dashboard..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {searchTerm.trim() !== "" && (
                <div className="search-results">
                  {filteredNavigation.length > 0 ? (
                    filteredNavigation.map((item) => {
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            setActivePage(item.name);
                            setSearchTerm("");
                            setMenuOpen(false);
                          }}
                        >
                          <Icon size={16} />
                          {item.name}
                        </button>
                      );
                    })
                  ) : (
                    <p>No matching pages found.</p>
                  )}
                </div>
              )}
            </div>

            <button
              className="theme-toggle"
              type="button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
            >
              <span className="theme-toggle-icon">
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </span>
              <span className="theme-toggle-label">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            </button>

            {/* Functional Notifications */}
            <div className="top-dropdown-wrapper">
              <button
                className="notification-button"
                aria-label="Notifications"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                }}
              >
                <Bell size={19} />
                {earlyWarnings.length > 0 && <span></span>}
              </button>

              {showNotifications && (
                <div className="top-dropdown notification-dropdown">
                  <h3>Notifications</h3>

                  {earlyWarnings.length > 0 ? (
                    earlyWarnings.map((alert, index) => (
                      <button
                        className="notification-item"
                        key={`${alert.date}-${alert.zone}-${index}`}
                        onClick={() => {
                          setActivePage("Early Warnings");
                          setShowNotifications(false);
                        }}
                      >
                        <strong>{alert.level} Priority · {alert.zone}</strong>
                        <p>{alert.detail}</p>
                        <small>{alert.date}</small>
                      </button>
                    ))
                  ) : (
                    <p className="dropdown-empty">No active alerts.</p>
                  )}

                  <button
                    className="dropdown-link"
                    onClick={() => {
                      setActivePage("Early Warnings");
                      setShowNotifications(false);
                    }}
                  >
                    View all alerts
                  </button>
                </div>
              )}
            </div>

            {/* Functional Profile Menu */}
            <div className="top-dropdown-wrapper">
              <button
                className="top-avatar"
                aria-label="Open profile menu"
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
              >
                HN
              </button>

              {showProfile && (
                <div className="top-dropdown profile-dropdown">
                  <div className="profile-heading">
                    <div className="avatar">HN</div>
                    <div>
                      <strong>HealthNext AI</strong>
                      <p>Project Administrator</p>
                    </div>
                  </div>

                  <button
                    className="dropdown-link"
                    onClick={() => {
                      setActivePage("Settings");
                      setShowProfile(false);
                    }}
                  >
                    <Settings size={16} />
                    Open Settings
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        <section className="dashboard-body">
          {activePage === "Overview" && (
          <div className="welcome-row">
            <div>
              <h2>
                {activePage === "Settings"
                  ? "Workspace Configuration"
                  : activePage === "Data Upload"
                    ? "Health Data Management"
                    : "Population Health Overview"}
              </h2>
              <p>
                {activePage === "Data Upload"
                  ? "Upload, validate and preview your health datasets."
                  : activePage === "Early Warnings"
                    ? "Review generated warning signals across monitored zones."
                    : "Monitor population and workforce health indicators across monitored zones."}
              </p>
            </div>
            <div className="demo-tag">
              <span></span>
              {apiStatus === "Connected"
                ? "API CONNECTED · SYNTHETIC DATA"
                : apiStatus.toUpperCase()}
            </div>
          </div>
          )}
          {activePage === "Settings" ? (
            <SettingsPage
              apiStatus={apiStatus}
              theme={theme}
              setTheme={setTheme}
            />
          ) : activePage === "Data Upload" ? (
            <DataUpload />
          ) : activePage === "Workforce Health" ? (
            <WorkforceHealth />
          ) : activePage === "Environment" ? (
            <EnvironmentAnalytics />
          ) : activePage === "Correlation & Risk" ? (
            <CorrelationAnalysis />
          ) : activePage === "Analytics" ? (
            <AnalyticsDashboard />
          ) : activePage === "AI Insights" ? (
            <AIInsights />
          ) : activePage === "Risk Forecast" ? (
            <RiskForecast />
          ) : activePage === "Reports" ? (
            <ReportGenerator />
          ) : activePage === "Early Warnings" ? (
            <div className="panel">
              <div className="early-warning-heading">
                <div>
                  <h2>Early Warnings</h2>
                  <p>Live alerts generated by HealthGuard AI</p>
                </div>

                <button
                  className="refresh-alerts-btn"
                  onClick={refreshAlerts}
                  disabled={alertsLoading}
                >
                  {alertsLoading ? "Refreshing..." : "↻ Refresh Alerts"}
                </button>
              </div>
              <div className="alert-summary-grid">
                <div className="alert-summary-card">
                  <span>Total Alerts</span>
                  <h2>{alertsLoading ? "--" : totalAlerts}</h2>
                </div>

                <div className="alert-summary-card high-summary">
                  <span>High Priority</span>
                  <h2>{alertsLoading ? "--" : highAlerts}</h2>
                </div>

                <div className="alert-summary-card medium-summary">
                  <span>Medium Priority</span>
                  <h2>{alertsLoading ? "--" : mediumAlerts}</h2>
                </div>
              </div>

              {alertsLoading ? (
                <p>Loading alerts...</p>
              ) : alertsError ? (
                <p>{alertsError}</p>
              ) : earlyWarnings.length === 0 ? (
                <p>No warning signals detected.</p>
              ) : (
                earlyWarnings.map((alert, index) => (
                  <div
                    className={`warning-card ${alert.level.toLowerCase()}-warning`}
                    key={`${alert.date}-${alert.zone}-${index}`}
                  >
                    <div className="warning-card-header">
                      <div>
                        <span className={`warning-dot ${alert.level.toLowerCase()}`}></span>
                        <span className="warning-zone">{alert.zone}</span>
                      </div>

                      <span className={`alert-badge ${alert.level.toLowerCase()}`}>
                        {alert.level} Priority
                      </span>
                    </div>

                    <h3>{alert.title}</h3>

                    <p className="warning-detail">{alert.detail}</p>

                    <div className="warning-card-footer">
                      <span>{alert.date}</span>
                      <span>{alert.status}</span>
                    </div>
                  </div>
                ))
              )}

              <p className="bottom-note">
                Synthetic demonstration data. Alerts require human review and are not clinical diagnoses.
              </p>
            </div>
          ) : activePage === "Overview" ? (
            <>
              <div className="kpi-grid">
                {/* Monitored Zones */}
                <div className="kpi-card">
                  <div className="kpi-top">
                    <span>Monitored Zones</span>
                    <div className="kpi-icon blue"><MapPin /></div>
                  </div>
                  <h2>{analyticsLoading ? "--" : monitoredZones}</h2>
                  <p className="kpi-note">Zones found in uploaded datasets</p>
                </div>

                {/* Active Alerts */}
                <div className="kpi-card">
                  <div className="kpi-top">
                    <span>Active Alerts</span>
                    <div className="kpi-icon orange"><Bell /></div>
                  </div>

                  <h2>
                    {alertsLoading ? "--" : earlyWarnings.length}
                  </h2>

                  <p className="kpi-note">
                    {earlyWarnings.length} warning signals require review
                  </p>
                </div>

                {/* Workforce Indicators */}
                <div className="kpi-card">
                  <div className="kpi-top">
                    <span>Workforce Indicators</span>
                    <div className="kpi-icon purple"><Users /></div>
                  </div>
                  <h2>
                    {analyticsLoading
                      ? "--"
                      : records.filter(
                          item => item.absence_count !== undefined
                        ).length}
                  </h2>
                  <p className="kpi-note">Workforce observations available</p>
                </div>

                {/* Environmental Signals */}
                <div className="kpi-card">
                  <div className="kpi-top">
                    <span>Environmental Signals</span>
                    <div className="kpi-icon green"><Wind /></div>
                  </div>
                  <h2>
                    {analyticsLoading
                      ? "--"
                      : records.filter(
                          item => item.aqi !== undefined
                        ).length}
                  </h2>
                  <p className="kpi-note">Environmental observations available</p>
                </div>
              </div>
              
              <div className="content-grid">
                <div className="panel trend-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Health Risk Signal Trends</h3>
                      <p>Actual healthcare visits and environmental AQI</p>
                    </div>
                    <span className="period-tag">Uploaded data</span>
                  </div>

                  <div className="chart-legend">
                    <span><i className="legend-blue"></i> Healthcare visits</span>
                    <span><i className="legend-green"></i> Environmental AQI</span>
                  </div>

                  <div className="chart-container">
                    {analyticsLoading ? (
                      <p>Loading analytics...</p>
                    ) : trendData.length === 0 ? (
                      <p>No combined records available. Upload all three datasets.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 12, right: 28, left: 18, bottom: 8 }}>
                          <defs>
                            <linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3988ff" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#3988ff" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="environmentFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#22c99a" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#22c99a" stopOpacity={0} />
                            </linearGradient>
                          </defs>

                          <CartesianGrid stroke="#cbd5e1" strokeDasharray="4 4" />
                          <XAxis dataKey="day" stroke="#8190a7" />
                          <YAxis
                            yAxisId="visits"
                            orientation="left"
                            stroke="#3988ff"
                            width={48}
                            tick={{ fontSize: 11, fill: "#8190a7" }}
                            tickLine={false}
                            label={{
                              value: "Healthcare visits",
                              angle: -90,
                              position: "insideLeft",
                              fill: "#3988ff",
                              fontSize: 10,
                              offset: 4
                            }}
                          />
                          <YAxis
                            yAxisId="aqi"
                            orientation="right"
                            stroke="#22c99a"
                            width={42}
                            tick={{ fontSize: 11, fill: "#8190a7" }}
                            tickLine={false}
                            label={{
                              value: "AQI",
                              angle: 90,
                              position: "insideRight",
                              fill: "#22c99a",
                              fontSize: 10,
                              offset: 4
                            }}
                          />

                          <Tooltip
                            contentStyle={{
                              background: "#182438",
                              border: "1px solid #34445d",
                              borderRadius: "10px",
                              color: "#fff"
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="health"
                            yAxisId="visits"
                            name="Healthcare visits"
                            stroke="#3988ff"
                            fill="url(#healthFill)"
                            strokeWidth={2.5}
                          />

                          <Area
                            type="monotone"
                            dataKey="environment"
                            yAxisId="aqi"
                            name="Environmental AQI"
                            stroke="#22c99a"
                            fill="url(#environmentFill)"
                            strokeWidth={2.5}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="panel summary-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Population Health Signals</h3>
                      <p>Calculated from uploaded synthetic datasets</p>
                    </div>
                  </div>

                  <div className="risk-summary">
                    <div className="risk-number">
                      <strong>
                        {analyticsLoading ? "--" : `${latestAverageAbsenceRate}%`}
                      </strong>
                      <span>Average absence rate on the latest date</span>
                    </div>

                    <div className="risk-item">
                      <span><i className="dot-high"></i> Average AQI</span>
                      <strong>{analyticsLoading ? "--" : averageAQI}</strong>
                    </div>

                    <div className="risk-item">
                      <span><i className="dot-medium"></i> Healthcare visits</span>
                      <strong>{analyticsLoading ? "--" : totalVisits}</strong>
                    </div>

                    <div className="risk-item">
                      <span><i className="dot-low"></i> Combined observations</span>
                      <strong>{analyticsLoading ? "--" : records.length}</strong>
                    </div>

                    <p className="risk-disclaimer">
                      Observational indicators from synthetic demonstration data.
                      These values are not clinical risk assessments.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="panel alerts-panel">
                <div className="panel-heading">
                  <div>
                    <h3>
                      <AlertTriangle size={18} /> Early Warning Status
                    </h3>
                    <p>Automated warning engine development status</p>
                  </div>

                  <button
                    className="view-all"
                    onClick={() => setActivePage("Early Warnings")}
                  >
                    View all <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="alert-list">
                  {alertsLoading ? (
                    <p>Loading early warnings...</p>
                  ) : alertsError ? (
                    <p>{alertsError}</p>
                  ) : earlyWarnings.length === 0 ? (
                    <p>No warning signals detected.</p>
                  ) : (
                    earlyWarnings.map((alert, index) => (
                      <div className="alert-row" key={`${alert.date}-${alert.zone}-${index}`}>
                        <div className={`alert-indicator ${alert.level.toLowerCase()}`}></div>

                        <div className="alert-info">
                          <strong>{alert.title}</strong>
                          <p>
                            {alert.zone} · {alert.date}
                          </p>
                          <p>{alert.detail}</p>
                        </div>

                        <span className={`alert-badge ${alert.level.toLowerCase()}`}>
                          {alert.level} Priority
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bottom-note">
                <ShieldCheck size={17} />
                <span>
                  Decision-support demonstration only. No individual
                  diagnosis or automated clinical decisions.
                </span>
              </div>
            </>
          ) : (
            <div className="panel placeholder-panel">
              <Activity size={35} />
              <h3>{activePage}</h3>
              <p>
                This module will be implemented in the next development
                stages. The overview dashboard is currently available.
              </p>
              <button onClick={() => setActivePage("Overview")}>
                Return to Overview
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;