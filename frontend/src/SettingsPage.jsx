import {
  Settings as SettingsIcon, Server, Palette, Sun, Moon, ShieldCheck,
  Database, Users, GraduationCap, Info, CheckCircle2, Activity
} from "lucide-react";
import "./SettingsPage.css";

const teamMembers = [
  { name: "Challagundla Mahendra Uthej", role: "Team Leader" },
  { name: "Chandraiahgari Subramanyam", role: "Team Member" },
  { name: "Jonnalagadda Venkata Mahesh", role: "Team Member" },
  { name: "Devireddy Tharun Reddy", role: "Team Member" },
  { name: "Kotakonda Nithish Kumar", role: "Team Member" }
];

function SettingsPage({ apiStatus = "Connecting", theme = "dark", setTheme }) {
  const connected = apiStatus === "Connected";

  return (
    <div className="settings-page">
      <section className="settings-hero">
        <div className="settings-hero-icon"><SettingsIcon size={27} /></div>
        <div>
          <span className="settings-eyebrow">WORKSPACE CONTROL CENTER</span>
          <h2>Workspace Settings</h2>
          <p>Manage your HealthGuard AI demonstration environment and preferences.</p>
        </div>
        <span className={`settings-connection ${connected ? "connected" : "disconnected"}`}>
          <i /> {apiStatus}
        </span>
      </section>

      <div className="settings-content-grid">
        <section className="settings-card appearance-card">
          <div className="settings-card-heading">
            <span className="settings-icon purple"><Palette size={19} /></span>
            <div><h3>Appearance</h3><p>Choose how HealthGuard AI looks on this device.</p></div>
          </div>
          <div className="appearance-options">
            <button type="button" className={`appearance-option ${theme === "light" ? "active" : ""}`} onClick={() => setTheme?.("light")} aria-pressed={theme === "light"}>
              <span className="appearance-preview light-preview"><i /><i /><i /></span>
              <span><strong>Light mode</strong><small>Bright and colourful workspace</small></span>
              {theme === "light" && <CheckCircle2 size={18} />}
            </button>
            <button type="button" className={`appearance-option ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme?.("dark")} aria-pressed={theme === "dark"}>
              <span className="appearance-preview dark-preview"><i /><i /><i /></span>
              <span><strong>Dark mode</strong><small>Comfortable low-light workspace</small></span>
              {theme === "dark" && <CheckCircle2 size={18} />}
            </button>
          </div>
          <p className="settings-helper"><Info size={14} /> Your selected appearance is saved automatically.</p>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon green"><Server size={19} /></span>
            <div><h3>Backend connection</h3><p>FastAPI service health and endpoint information.</p></div>
          </div>
          <div className="connection-detail">
            <div className="connection-status-line"><span className={`connection-dot ${connected ? "online" : "offline"}`} /><strong>{connected ? "Backend connected" : "Backend unavailable"}</strong></div>
            <span className={`connection-pill ${connected ? "online" : "offline"}`}>{apiStatus}</span>
          </div>
          <div className="settings-info-row"><span>Service</span><strong>FastAPI</strong></div>
          <div className="settings-info-row"><span>API base URL</span><code>https://healthguard-ai-5yi2.onrender.com</code></div>
          <div className="settings-info-row"><span>Environment</span><strong>Local demonstration</strong></div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon blue"><Database size={19} /></span>
            <div><h3>Data & privacy</h3><p>Understand the data used in this demonstration.</p></div>
          </div>
          <div className="settings-feature-row"><ShieldCheck size={18} /><div><strong>Synthetic demonstration data</strong><p>Sample records are used to demonstrate the platform workflow.</p></div></div>
          <div className="settings-feature-row"><Database size={18} /><div><strong>CSV-based data input</strong><p>Environmental, healthcare and workforce CSV datasets are supported.</p></div></div>
          <div className="settings-feature-row"><Info size={18} /><div><strong>Decision-support only</strong><p>Alerts and forecasts are illustrative and are not clinical diagnoses or medical advice.</p></div></div>
        </section>

        <section className="settings-card project-card">
          <div className="settings-card-heading">
            <span className="settings-icon orange"><GraduationCap size={19} /></span>
            <div><h3>Project information</h3><p>Team and challenge details.</p></div>
          </div>
          <div className="project-brand"><span className="project-brand-mark"><Activity size={20} /></span><div><strong>HealthGuard AI</strong><small>Population Health Intelligence</small></div></div>
          <div className="settings-info-row"><span>Team name</span><strong>HealthNext AI</strong></div>
          <div className="settings-info-row"><span>Institution</span><strong>Prathyusha Engineering College</strong></div>
          <div className="settings-info-row"><span>Challenge</span><strong>Future Health Digital Innovation Challenge</strong></div>
        </section>
      </div>

      <section className="settings-card team-card">
        <div className="settings-card-heading">
          <span className="settings-icon violet"><Users size={19} /></span>
          <div><h3>Team members</h3><p>HealthNext AI project team.</p></div>
          <span className="team-count">05 MEMBERS</span>
        </div>
        <div className="team-member-grid">
          {teamMembers.map((member, index) => (
            <div className="team-member" key={member.name}>
              <span className={`team-avatar avatar-${index + 1}`}>{member.name.split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span>
              <span><strong>{member.name}</strong><small>{member.role}</small></span>
            </div>
          ))}
        </div>
      </section>

      <div className="settings-footer-note"><ShieldCheck size={16} /> HealthGuard AI is a demonstration and decision-support prototype. It is not intended for diagnosis or individual medical advice.</div>
    </div>
  );
}

export default SettingsPage;
