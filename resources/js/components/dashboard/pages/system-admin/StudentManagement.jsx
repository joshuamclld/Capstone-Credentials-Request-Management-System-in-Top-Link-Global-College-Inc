import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, Plus, X, AlertCircle, Check, Upload, Download, FileSpreadsheet, Trash2, Eye, Power } from 'lucide-react';
import DashboardLayout from '../../DashboardLayout';
import DashboardSearch from '../../DashboardSearch';
import DashboardTable from '../../DashboardTable';
import DashboardMobileCard from '../../DashboardMobileCard';
import DashboardPagination from '../../DashboardPagination';
import StatusBadge from '../../StatusBadge';
import EmptyState from '../../EmptyState';
import { systemAdminSidebarItems } from '../../config/sidebarItems';
import Papa from 'papaparse';

const tableHeaders = ['Student Number', 'Name', 'Email', 'Status', 'Date Created', 'Action'];

export default function StudentManagement({ user, onLogout, onNavigate }) {
  const stripeColors = ['bg-white', 'bg-black/5'];
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ student_number: '', first_name: '', last_name: '', email: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const openViewModal = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  // Toggle status
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openToggleModal = (student) => {
    setToggleTarget(student);
    setShowToggleModal(true);
  };

  const handleToggleStatus = async () => {
    if (!toggleTarget || toggling) return;
    setToggling(true);
    try {
      const res = await fetch(`/admin/system/students/${toggleTarget.id}/toggle-status`, {
        method: 'PATCH',
        headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setStudents(prev => prev.map(s => s.id === toggleTarget.id ? { ...s, is_active: !s.is_active } : s));
        setShowToggleModal(false);
        setToggleTarget(null);
      }
    } catch {}
    setToggling(false);
  };

  const openDeleteModal = (student) => {
    setDeleteTarget(student);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/admin/system/students/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': getCsrf(), 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setStudents(prev => prev.filter(s => s.id !== deleteTarget.id));
        setShowDeleteModal(false);
        setDeleteTarget(null);
      }
    } catch {}
    setDeleting(false);
  };

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  const getCsrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const fetchStudents = (p) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: p });
    if (debouncedQuery) params.append('search', debouncedQuery);

    fetch(`/admin/system/students?${params}`, { credentials: 'same-origin' })
      .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then((j) => { setStudents(j.data || []); setPagination(j.pagination); setLoading(false); })
      .catch((e) => { setError(e.message); setStudents([]); setLoading(false); });
  };

  useEffect(() => { fetchStudents(page); }, [page, debouncedQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => { setPage(1); }, [debouncedQuery]);

  const handlePageChange = (np) => { if (np >= 1 && pagination && np <= pagination.last_page) setPage(np); };

  // Import handlers
  const openImportModal = () => {
    setCsvData(null);
    setCsvPreview(null);
    setImportResult(null);
    setImportError('');
    setShowImportModal(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null);
    setImportError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const required = ['student_number', 'first_name', 'last_name', 'email'];
        const headers = Object.keys(results.data[0] || {});
        const missing = required.filter(h => !headers.includes(h));

        if (missing.length > 0) {
          setImportError(`CSV missing required columns: ${missing.join(', ')}`);
          setCsvData(null);
          setCsvPreview(null);
          return;
        }

        setCsvData(results.data);
        setCsvPreview(results.data.slice(0, 5));
      },
      error: () => {
        setImportError('Failed to parse CSV file.');
        setCsvData(null);
        setCsvPreview(null);
      },
    });
  };

  const handleImport = async () => {
    if (!csvData || csvData.length === 0) return;
    setImporting(true);
    setImportResult(null);
    setImportError('');

    try {
      const res = await fetch('/admin/system/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify({ students: csvData }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setImportResult(data.data);
        setCsvData(null);
        setCsvPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchStudents(page);
      } else {
        setImportError(data.message || 'Import failed.');
      }
    } catch {
      setImportError('Network error.');
    }
    setImporting(false);
  };

  // Add handlers
  const openAddModal = () => {
    setAddForm({ student_number: '', first_name: '', last_name: '', email: '' });
    setAddError('');
    setAddSuccess('');
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.student_number || !addForm.first_name || !addForm.last_name || !addForm.email) {
      setAddError('Please fill in all fields.');
      return;
    }
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');

    try {
      const res = await fetch('/admin/system/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAddSuccess(`Student created. Credentials sent to ${addForm.email}`);
        setAddForm({ student_number: '', first_name: '', last_name: '', email: '' });
        fetchStudents(page);
      } else {
        if (data.errors) {
          const msgs = Object.values(data.errors).flat();
          setAddError(msgs[0] || 'Validation failed.');
        } else {
          setAddError(data.message || 'Failed to create student.');
        }
      }
    } catch {
      setAddError('Network error.');
    }
    setAddLoading(false);
  };

  return (
    <DashboardLayout title="Student Management" subtitle="Manage student accounts" sidebarItems={systemAdminSidebarItems} currentUser={user} roleLabel="System Administrator" onLogout={onLogout} onNavigate={onNavigate}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex-1">
          <DashboardSearch value={query} onChange={setQuery} placeholder="Search by student number, name, or email..." />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={openImportModal}
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-2 text-sm whitespace-nowrap">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={openAddModal}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 transition-all cursor-pointer flex items-center gap-2 text-sm whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-surface-container-high rounded-xl animate-pulse" />)}</div>
      ) : error ? (
        <EmptyState icon={AlertCircle} title="Error" subtitle={error} />
      ) : students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students found" subtitle={debouncedQuery ? 'Try a different search term.' : 'Click "Add Student" or "Import CSV" to get started.'} />
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <DashboardTable headers={tableHeaders}>
              {students.map(s => (
                <tr key={s.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-4 py-3.5">{s.student_number}</td>
                  <td className="px-4 py-3.5">{s.first_name} {s.last_name}</td>
                  <td className="px-4 py-3.5 text-on-surface-variant text-sm">{s.email}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={s.is_active ? 'active' : 'inactive'} type="boolean" /></td>
                  <td className="px-4 py-3.5 text-on-surface-variant text-sm whitespace-nowrap">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openViewModal(s)}
                        className="p-2 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-all cursor-pointer" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openToggleModal(s)}
                        className={`p-2 rounded-lg text-white transition-all cursor-pointer ${s.is_active ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        title={s.is_active ? 'Deactivate' : 'Activate'}>
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDeleteModal(s)}
                        className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </DashboardTable>
          </div>
          <div className="md:hidden space-y-3">
            {students.map(s => (
              <div key={s.id} className="bg-surface rounded-xl border border-outline-variant shadow-sm p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-on-surface">{s.student_number}</span>
                    <StatusBadge status={s.is_active ? 'active' : 'inactive'} type="boolean" />
                  </div>
                  <p className="text-sm text-on-surface">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-on-surface-variant">{s.email}</p>
                  <p className="text-xs text-on-surface-variant">{new Date(s.created_at).toLocaleDateString()}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <button onClick={() => openViewModal(s)}
                      className="p-2 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-all cursor-pointer" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openToggleModal(s)}
                      className={`p-2 rounded-lg text-white transition-all cursor-pointer ${s.is_active ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      title={s.is_active ? 'Deactivate' : 'Activate'}>
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => openDeleteModal(s)}
                      className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {pagination && <DashboardPagination currentPage={pagination.current_page} lastPage={pagination.last_page} onPageChange={handlePageChange} />}
        </>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-sm font-bold text-on-surface">Student Details</h3>
              <button onClick={() => setShowViewModal(false)} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-outline-variant">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                  {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-lg text-on-surface">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                  <p className="text-sm text-on-surface-variant">{selectedStudent.student_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-label-sm text-on-surface-variant font-semibold mb-0.5">First Name</p>
                  <p className="text-body-md text-on-surface">{selectedStudent.first_name}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant font-semibold mb-0.5">Last Name</p>
                  <p className="text-body-md text-on-surface">{selectedStudent.last_name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-label-sm text-on-surface-variant font-semibold mb-0.5">Student Number</p>
                  <p className="text-body-md text-on-surface">{selectedStudent.student_number}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-label-sm text-on-surface-variant font-semibold mb-0.5">Email</p>
                  <p className="text-body-md text-on-surface">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant font-semibold mb-0.5">Status</p>
                  <StatusBadge status={selectedStudent.is_active ? 'Active' : 'Inactive'} type="boolean" />
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant font-semibold mb-0.5">Date Created</p>
                  <p className="text-body-md text-on-surface">{new Date(selectedStudent.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={() => setShowViewModal(false)}
                className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 transition-all cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Status Confirmation Modal */}
      {showToggleModal && toggleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => !toggling && setShowToggleModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-sm font-bold text-on-surface">{toggleTarget.is_active ? 'Deactivate' : 'Activate'} Student</h3>
              <button onClick={() => setShowToggleModal(false)} disabled={toggling} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-body-md text-on-surface-variant mb-6">
              Are you sure you want to <strong>{toggleTarget.is_active ? 'deactivate' : 'activate'}</strong> student <strong>{toggleTarget.first_name} {toggleTarget.last_name}</strong> ({toggleTarget.student_number})?
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowToggleModal(false)} disabled={toggling}
                className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleToggleStatus} disabled={toggling}
                className={`flex-1 py-2.5 rounded-lg font-bold transition-all cursor-pointer disabled:opacity-50 text-white ${toggleTarget.is_active ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {toggling ? 'Processing...' : toggleTarget.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-sm font-bold text-on-surface">Delete Student</h3>
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-body-md text-on-surface-variant mb-6">
              Are you sure you want to permanently delete student <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> ({deleteTarget.student_number})? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-all cursor-pointer disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => !addLoading && setShowAddModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-sm font-bold text-on-surface">Add Student</h3>
              <button onClick={() => setShowAddModal(false)} disabled={addLoading} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/30 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <p className="text-body-sm text-error">{addError}</p>
              </div>
            )}

            {addSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-body-sm text-emerald-800">{addSuccess}</p>
              </div>
            )}

            {!addSuccess && (
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Student Number</label>
                  <input type="text" value={addForm.student_number} onChange={(e) => setAddForm(p => ({ ...p, student_number: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                    placeholder="e.g., 2024-0001" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-md font-bold text-on-surface mb-1">First Name</label>
                    <input type="text" value={addForm.first_name} onChange={(e) => setAddForm(p => ({ ...p, first_name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                      placeholder="Juan" />
                  </div>
                  <div>
                    <label className="block text-label-md font-bold text-on-surface mb-1">Last Name</label>
                    <input type="text" value={addForm.last_name} onChange={(e) => setAddForm(p => ({ ...p, last_name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                      placeholder="Dela Cruz" />
                  </div>
                </div>
                <div>
                  <label className="block text-label-md font-bold text-on-surface mb-1">Email</label>
                  <input type="email" value={addForm.email} onChange={(e) => setAddForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-body-md"
                    placeholder="juan@example.com" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} disabled={addLoading}
                    className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={addLoading}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                    {addLoading ? 'Creating...' : <><Plus className="w-4 h-4" /> Create Student</>}
                  </button>
                </div>
              </form>
            )}

            {addSuccess && (
              <button onClick={() => setShowAddModal(false)}
                className="w-full py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 transition-all cursor-pointer">
                Done
              </button>
            )}
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => !importing && setShowImportModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-sm font-bold text-on-surface">Import Students from CSV</h3>
              <button onClick={() => setShowImportModal(false)} disabled={importing} className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-body-sm text-on-surface-variant mb-4">Upload a CSV file with columns: <strong>student_number</strong>, <strong>first_name</strong>, <strong>last_name</strong>, <strong>email</strong>.</p>

            {!importResult && (
              <>
                <div className="border-2 border-dashed border-outline-variant rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet className="w-10 h-10 text-on-surface-variant/50 mx-auto mb-2" />
                  <p className="text-body-md text-on-surface-variant mb-1">Click to select a CSV file</p>
                  <p className="text-body-sm text-on-surface-variant/60">or drag and drop</p>
                  <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button onClick={() => {
                    const csv = 'student_number,first_name,last_name,email\n2024-0001,Juan,Dela Cruz,juan@example.com\n2024-0002,Maria,Santos,maria@example.com';
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'student-import-template.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                    className="text-sm text-primary font-bold hover:underline cursor-pointer flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Download Template
                  </button>
                </div>
              </>
            )}

            {importError && (
              <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/30 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <p className="text-body-sm text-error">{importError}</p>
              </div>
            )}

            {csvPreview && csvPreview.length > 0 && !importResult && (
              <div className="mt-4">
                <h4 className="font-label-md font-bold text-on-surface mb-2">Preview ({csvData.length} rows)</h4>
                <div className="overflow-x-auto border border-outline-variant rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container-high">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-on-surface-variant">Student #</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-on-surface-variant">First Name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-on-surface-variant">Last Name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-on-surface-variant">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, i) => (
                        <tr key={i} className={`border-t border-outline-variant/50 ${stripeColors[i % 2]}`}>
                          <td className="px-3 py-2 font-mono text-xs">{row.student_number}</td>
                          <td className="px-3 py-2">{row.first_name}</td>
                          <td className="px-3 py-2">{row.last_name}</td>
                          <td className="px-3 py-2 text-on-surface-variant text-xs">{row.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvData.length > 5 && <p className="text-body-sm text-on-surface-variant mt-1.5">...and {csvData.length - 5} more rows</p>}

                <div className="flex items-center gap-3 mt-4">
                  <button type="button" onClick={() => setShowImportModal(false)} disabled={importing}
                    className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleImport} disabled={importing}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                    {importing ? 'Importing...' : <><Upload className="w-4 h-4" /> Import {csvData.length} Student{csvData.length !== 1 ? 's' : ''}</>}
                  </button>
                </div>
              </div>
            )}

            {!csvPreview && !importResult && !importError && (
              <div className="flex items-center gap-3 mt-4">
                <button onClick={() => setShowImportModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-colors cursor-pointer">
                  Cancel
                </button>
              </div>
            )}

            {importResult && (
              <div className="mt-4">
                <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-label-md font-bold text-on-surface">Import Complete</p>
                      <p className="text-body-sm text-on-surface-variant mt-1">
                        <span className="text-emerald-600 font-bold">{importResult.created}</span> created,
                        <span className="text-amber-600 font-bold ml-1">{importResult.skipped}</span> skipped
                        {importResult.errors.length > 0 && <span className="text-red-600 font-bold ml-1">, {importResult.errors.length} errors</span>}
                      </p>
                      {importResult.errors.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {importResult.errors.map((err, i) => (
                            <li key={i} className="text-body-sm text-red-600 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />{err}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowImportModal(false)}
                  className="w-full mt-4 py-2.5 rounded-lg bg-primary text-on-primary font-bold hover:opacity-90 transition-all cursor-pointer">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
