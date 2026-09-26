import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }
  static getDerivedStateFromError() {
    return { hasError: true, errorId: Math.random().toString(36).slice(2, 10) };
  }
  componentDidCatch(error) {
    try { console.error("[SocialHub error]", this.state.errorId, error); } catch {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000000", color: "#f1f5f9", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>Something went wrong</div>
            <p style={{ color: "#9a9a9a" }}>The app hit an unexpected error instead of going blank. Your data is safe.</p>
            {this.state.errorId ? <p style={{ color: "#bdbdbd", fontSize: 13 }}>Error ref: {this.state.errorId}</p> : null}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
              <button onClick={() => window.location.reload()} style={{ background: "#8052ff", color: "#fff", border: 0, borderRadius: 24, padding: "10px 20px", cursor: "pointer" }}>Reload app</button>
              <button onClick={() => { this.setState({ hasError: false }); window.location.href = "/"; }} style={{ background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155", borderRadius: 24, padding: "10px 20px", cursor: "pointer" }}>Go to dashboard</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
