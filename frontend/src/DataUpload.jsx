import { useRef, useState } from "react";
import {
  UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, X, Database,
  FileCheck, CloudUpload, Leaf, HeartPulse, Users, ShieldCheck,
  ArrowRight, RefreshCw
} from "lucide-react";
import "./DataUpload.css";

const datasetOptions = [
  {
    id: "environmental",
    title: "Environmental Data",
    description: "Temperature, humidity and air quality indicators",
    columns: "date, zone, temperature_c, humidity_pct, aqi",
    icon: Leaf,
    tone: "mint",
    number: "01"
  },
  {
    id: "healthcare",
    title: "Healthcare Indicators",
    description: "Aggregated healthcare visits by monitored zone",
    columns: "date, zone, visits",
    icon: HeartPulse,
    tone: "rose",
    number: "02"
  },
  {
    id: "workforce",
    title: "Workforce Health",
    description: "Aggregated workforce absence indicators",
    columns: "date, zone, absence_count, workforce_count",
    icon: Users,
    tone: "violet",
    number: "03"
  }
];

function DataUpload() {
  const [datasetType, setDatasetType] = useState("environmental");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const selectedDataset = datasetOptions.find((item) => item.id === datasetType);

  function selectFile(selectedFile) {
    setResult(null);
    setError("");
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setError("Please select a CSV file. Only .csv format is supported.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("File size must not exceed 5 MB.");
      return;
    }
    setFile(selectedFile);
  }

  async function uploadFile() {
    if (!file) {
      setError("Please choose a CSV file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`https://healthguard-ai-5yi2.onrender.com/api/upload/${datasetType}`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data.detail === "string" ? data.detail : "Unable to process the CSV file.");
      }
      setResult(data.data);
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  function changeDataset(id) {
    setDatasetType(id);
    setFile(null);
    setResult(null);
    setError("");
  }

  return (
    <div className="upload-page">
      <section className="upload-hero">
        <div className="upload-hero-copy">
          <span className="upload-eyebrow"><ShieldCheck size={14} /> DATA MANAGEMENT</span>
          <h2>Bring your health data together.</h2>
          <p>Upload, validate and preview the datasets that power your HealthGuard AI workspace.</p>
          <div className="upload-hero-points">
            <span><CheckCircle size={15} /> CSV validation</span>
            <span><CheckCircle size={15} /> Instant preview</span>
            <span><CheckCircle size={15} /> Secure local demo</span>
          </div>
        </div>
        <div className="upload-hero-art" aria-hidden="true">
          <div className="upload-art-orbit orbit-one"></div>
          <div className="upload-art-orbit orbit-two"></div>
          <div className="upload-art-core"><Database size={37} /></div>
          <span className="art-chip chip-one"><Leaf size={17} /></span>
          <span className="art-chip chip-two"><HeartPulse size={17} /></span>
          <span className="art-chip chip-three"><Users size={17} /></span>
        </div>
        <div className="upload-api-status"><span /> FastAPI service · {loading ? "Processing" : "Ready"}</div>
      </section>

      <section className="upload-section">
        <div className="upload-section-heading">
          <div>
            <span className="upload-step">STEP 01</span>
            <h3>Choose a dataset</h3>
            <p>Select the category that matches your CSV file.</p>
          </div>
          <span className="upload-selection-count">3 DATA TYPES</span>
        </div>

        <div className="upload-dataset-grid">
          {datasetOptions.map((item) => {
            const Icon = item.icon;
            const active = datasetType === item.id;
            return (
              <button
                type="button"
                key={item.id}
                className={`dataset-option ${item.tone} ${active ? "selected" : ""}`}
                onClick={() => changeDataset(item.id)}
                aria-pressed={active}
              >
                <div className="dataset-card-top">
                  <span className="dataset-number">{item.number}</span>
                  {active && <CheckCircle className="dataset-check" size={19} />}
                </div>
                <div className="dataset-option-icon"><Icon size={22} /></div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <span className="dataset-card-action">{active ? "Selected" : "Choose dataset"} <ArrowRight size={14} /></span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="upload-panel">
        <div className="upload-section-heading">
          <div>
            <span className="upload-step">STEP 02</span>
            <h3>Upload your CSV file</h3>
            <p>Adding to <strong>{selectedDataset.title}</strong></p>
          </div>
          <div className="upload-file-limit"><FileSpreadsheet size={16} /> CSV · Up to 5 MB</div>
        </div>

        <div
          className={`drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            selectFile(event.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => {
              selectFile(event.target.files[0]);
              event.target.value = "";
            }}
          />
          <div className="drop-zone-icon"><CloudUpload size={31} /></div>
          <h3>{dragging ? "Drop your file to add it" : "Drag and drop your CSV here"}</h3>
          <p>or <strong>browse files</strong> from your computer</p>
          <span>Supported format: .CSV <i /> Maximum file size: 5 MB</span>
        </div>

        {file && (
          <div className="selected-file">
            <div className="selected-file-icon"><FileSpreadsheet size={21} /></div>
            <div className="selected-file-details">
              <strong>{file.name}</strong>
              <p>{(file.size / 1024).toFixed(1)} KB · Ready to upload</p>
            </div>
            <span className="file-ready"><CheckCircle size={14} /> Ready</span>
            <button type="button" aria-label="Remove selected file" onClick={() => { setFile(null); setResult(null); }}>
              <X size={18} />
            </button>
          </div>
        )}

        <div className="expected-columns">
          <div><Database size={17} /><strong>Required CSV columns</strong></div>
          <p>{selectedDataset.columns}</p>
          <small>Make sure your column names match the required format exactly.</small>
        </div>

        <button className="upload-submit" onClick={uploadFile} disabled={!file || loading}>
          {loading ? <><RefreshCw size={17} className="upload-spinner" /> Processing dataset...</> : <><UploadCloud size={18} /> Upload and validate dataset <ArrowRight size={17} /></>}
        </button>

        {error && <div className="upload-error"><AlertCircle size={19} /><span>{error}</span></div>}
      </section>

      {result && (
        <section className="upload-results">
          <div className="results-heading">
            <div className="results-title">
              <span className="results-success-icon"><CheckCircle size={22} /></span>
              <div><span className="upload-step">UPLOAD COMPLETE</span><h3>Dataset processed successfully</h3><p>Your file was received and the validation summary is ready.</p></div>
            </div>
            <span className="success-label">SUCCESS</span>
          </div>

          <div className="result-metrics">
            <div className="metric-total"><span>Total rows</span><strong>{result.total_rows}</strong><small>Rows inspected</small></div>
            <div className="metric-valid"><span>Valid rows</span><strong>{result.valid_rows}</strong><small>Passed validation</small></div>
            <div className="metric-invalid"><span>Invalid rows</span><strong>{result.invalid_rows}</strong><small>Need attention</small></div>
            <div className="metric-zones"><span>Monitored zones</span><strong>{result.zone_count}</strong><small>Zones detected</small></div>
          </div>

          <div className="result-section">
            <h4>Detected zones</h4>
            <div className="zone-list">{result.zones.map((zone) => <span key={zone}>{zone}</span>)}</div>
          </div>

          <div className="result-section">
            <h4><FileCheck size={17} /> Data preview</h4>
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead><tr>{Object.keys(result.preview[0] || {}).map((column) => <th key={column}>{column}</th>)}</tr></thead>
                <tbody>{result.preview.map((row, index) => <tr key={index}>{Object.values(row).map((value, cellIndex) => <td key={cellIndex}>{String(value)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>

          {result.errors?.length > 0 && (
            <div className="result-section validation-list">
              <h4><AlertCircle size={17} /> Validation notes</h4>
              {result.errors.map((item, index) => <p className="validation-error" key={index}>Row {item.row}: {item.reason}</p>)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default DataUpload;
