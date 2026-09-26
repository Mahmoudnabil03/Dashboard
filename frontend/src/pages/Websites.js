import React, { useState, useEffect } from "react";
import { Globe, Plus, Trash2, Edit2, ShieldCheck, Activity, Loader2, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
const emptyForm = { url: "", name: "" };
export default function Websites() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [working, setWorking] = useState(null);
  useEffect(() => { fetchSites(); }, []);
  const fetchSites = async () => {
    try {
      const res = await api.get("/websites");
      setSites(res.data || []);
    } catch { toast.error("Failed to load websites"); } finally { setLoading(false); }
  };
  const openCreate = () => { setEditingId(null); setFormData(emptyForm); setShowModal(true); };
  const openEdit = (w) => { setEditingId(w.id); setFormData({ url: w.url || "", name: w.name || "" }); setShowModal(true); };
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingId) { await api.put("/websites/" + editingId, formData); toast.success("Website updated"); }
      else { await api.post("/websites", formData); toast.success("Website added"); }
      setShowModal(false); fetchSites();
    } catch { toast.error("Failed to save website"); } finally { setSaving(false); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this website?")) return;
    try { await api.delete("/websites/" + id); toast.success("Website deleted"); fetchSites(); }
    catch { toast.error("Failed to delete website"); }
  };
  const handleVerify = async (id) => {
    setWorking("verify-" + id);
    try { await api.post("/websites/" + id + "/verify"); toast.success("Website verified"); fetchSites(); }
    catch { toast.error("Verification failed"); } finally { setWorking(null); }
  };
  const handleScan = async (id) => {
    setWorking("scan-" + id);
    try { await api.post("/websites/" + id + "/scan"); toast.success("Scan complete"); fetchSites(); }
    catch { toast.error("Scan failed"); } finally { setWorking(null); }
  };
  if (loading) return (<div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[var(--brand-primary)]" size={32} /></div>);
  return (
    <div>
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Websites</h1>
          <p className="text-[var(--text-secondary)]">Connect and monitor your websites</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus size={18} className="mr-2" /> Add Website</button>
      </div>
      {sites.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <Globe size={48} className="mx-auto mb-4 text-[var(--text-tertiary)] opacity-50" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No websites yet</h3>
          <p className="text-[var(--text-secondary)] mb-6">Add your website to verify ownership and track performance</p>
          <button onClick={openCreate} className="btn btn-primary">Add Website</button>
        </div>
      ) : (
        <div className="card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Website</th><th>Verification</th><th>Tracking</th><th>Last Scan</th><th>Actions</th></tr></thead>
              <tbody>
                {sites.map((w) => (
                  <tr key={w.id}>
                    <td><div className="font-medium text-[var(--text-primary)]">{w.name || w.url}</div><div className="text-xs text-[var(--text-tertiary)]">{w.url}</div></td>
                    <td><span className={"badge " + (w.verification_status === "verified" ? "badge-success" : "badge-warning")}>{w.verification_status || "pending"}</span></td>
                    <td><span className={"badge " + (w.tracking_status === "active" ? "badge-success" : "badge-neutral")}>{w.tracking_status || "inactive"}</span></td>
                    <td className="text-[var(--text-secondary)]">{w.last_scan_at ? new Date(w.last_scan_at).toLocaleString() : "Never"}</td>
                    <td><div className="flex items-center gap-2">
                      <button onClick={() => handleVerify(w.id)} disabled={working === "verify-" + w.id} className="btn btn-ghost btn-sm" title="Verify"><ShieldCheck size={16} /></button>
                      <button onClick={() => handleScan(w.id)} disabled={working === "scan-" + w.id} className="btn btn-ghost btn-sm" title="Scan">{working === "scan-" + w.id ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}</button>
                      <button onClick={() => openEdit(w)} className="btn btn-ghost btn-sm" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(w.id)} className="btn btn-ghost btn-sm text-[var(--error)]" title="Delete"><Trash2 size={16} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false) } } }>
          <div className="card p-6 max-w-md w-full animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{editingId ? "Edit Website" : "Add Website"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label>Website URL</label><input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://example.com" className="input" required /></div>
              <div><label>Name (optional)</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="My Business Site" className="input" /></div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}{editingId ? "Update" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
