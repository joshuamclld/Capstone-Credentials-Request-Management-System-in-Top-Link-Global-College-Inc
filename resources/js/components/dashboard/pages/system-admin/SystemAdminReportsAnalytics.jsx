import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Users, ChartColumn, DollarSign, RefreshCw, TrendingUp, Clock, CheckCircle, Download } from 'lucide-react';
import Chart from 'react-apexcharts';
import DashboardLayout from '../../DashboardLayout';
import DashboardStatCard from '../../DashboardStatCard';
import EmptyState from '../../EmptyState';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const statDefs = [
    { label: 'Total Requests', key: 'total_requests', icon: FileText, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
    { label: 'Total Paid', key: 'total_paid', icon: CheckCircle, iconBg: 'bg-blue-50', iconColor: 'text-blue-700' },
    { label: 'Total Revenue', key: 'total_revenue', icon: DollarSign, iconBg: 'bg-green-50', iconColor: 'text-green-700' },
    { label: 'Average Fee', key: 'average_fee', icon: TrendingUp, iconBg: 'bg-purple-50', iconColor: 'text-purple-700' },
    { label: 'This Month', key: 'this_month', icon: Clock, iconBg: 'bg-orange-50', iconColor: 'text-orange-700' },
    { label: 'Month Revenue', key: 'this_month_revenue', icon: DollarSign, iconBg: 'bg-yellow-50', iconColor: 'text-yellow-700' },
];

const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/system-admin-dashboard' },
    { label: 'User Management', icon: Users, path: '/system-admin/users' },
    { label: 'Credential Types', icon: FileText, path: '/system-admin/credentials' },
    { label: 'Reports & Analytics', icon: ChartColumn, path: '/system-admin/reports' },
    { label: 'Audit Logs', icon: RefreshCw, path: '/system-admin/audit-logs' },
];

const STATUS_COLORS = { Pending: '#cea700', Processing: '#326574', 'Ready for Release': '#154212', Claimed: '#2d5a27' };
const TYPE_COLORS = ['#154212', '#065f46', '#2d5a27', '#cea700', '#735c00', '#326574'];

const shortMonth = (v) => {
    if (!v) return '';
    const p = v.split('-');
    return p.length === 2 ? (MONTHS[parseInt(p[1], 10) - 1] || p[1]) : v;
};

const fullMonth = (v) => {
    if (!v) return '';
    const p = v.split('-');
    if (p.length !== 2) return v;
    return `${MONTHS[parseInt(p[1], 10) - 1] || p[1]} ${p[0]}`;
};

const fmtRevenue = (v) => `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SystemAdminReportsAnalytics({ user, onLogout, onNavigate }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(null);

    useEffect(() => {
        fetch('/admin/system/reports', { credentials: 'same-origin' })
            .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then((j) => { setData(j.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const doExport = (format) => {
        setExporting(format);
        const a = document.createElement('a');
        a.href = `/admin/system/reports/export/${format}`;
        a.download = true;
        a.click();
        setTimeout(() => setExporting(null), 1500);
    };

    if (loading) {
        return (
            <DashboardLayout title="Reports & Analytics" subtitle="Loading report data..." sidebarItems={sidebarItems} currentUser={user} roleLabel="System Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <div className="flex items-center justify-center py-20"><p className="text-slate-400 text-sm">Loading reports...</p></div>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout title="Reports & Analytics" subtitle="View system-wide reports and analytics." sidebarItems={sidebarItems} currentUser={user} roleLabel="System Administrator" onLogout={onLogout} onNavigate={onNavigate}>
                <EmptyState icon={ChartColumn} title="No Data" subtitle="Report data could not be loaded." />
            </DashboardLayout>
        );
    }

    const stats = {
        total_requests: data.total_requests,
        total_paid: data.total_paid,
        total_revenue: `₱${parseFloat(data.total_revenue).toLocaleString()}`,
        average_fee: `₱${data.average_fee}`,
        this_month: data.this_month,
        this_month_revenue: `₱${parseFloat(data.this_month_revenue).toLocaleString()}`,
    };

    const byType = data.monthly_requests_by_type || [];

    // Build a 3-month window from the server-reported month (not browser clock)
    const serverMonth = data.server_month;
    const fallback = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`; };
    const base = serverMonth || fallback();
    const [sY, sM] = base.split('-').map(Number);
    const ym = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
    const prevM = sM === 1 ? ym(sY - 1, 12) : ym(sY, sM - 1);
    const nextM = sM === 12 ? ym(sY + 1, 1) : ym(sY, sM + 1);
    const monthOrder = [prevM, base, nextM];

    // Fill missing months with zero-value entries so the chart never stretches
    const lookup = {};
    byType.forEach(m => { lookup[m.month] = m; });
    const paddedByType = monthOrder.map(m => lookup[m] || { month: m });

    const allTypeKeys = [...new Set(byType.flatMap(m => Object.keys(m).filter(k => k !== 'month')))];

    const topTypeKeys = allTypeKeys
        .map(key => ({ key, total: byType.reduce((s, m) => s + (m[key] || 0), 0) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6)
        .map(x => x.key);

    const credentialCategories = paddedByType.map(m => shortMonth(m.month));
    const credentialSeries = topTypeKeys.map(key => ({
        name: key,
        data: paddedByType.map(m => m[key] || 0),
    }));

    const statusData = (data.status_breakdown || []).map(s => ({ name: s.status, count: s.count }));

    const revenueLookup = {};
    (data.monthly_revenue || []).forEach(r => { revenueLookup[r.month] = r; });
    const paddedRevenue = monthOrder.map(m => revenueLookup[m] || { month: m, revenue: 0 });
    const revenueCount = paddedRevenue.length;
    const allZeroRevenue = paddedRevenue.every(r => !r.revenue || parseFloat(r.revenue) === 0);

    return (
        <DashboardLayout
            title="Reports & Analytics"
            subtitle="View system-wide reports and analytics."
            sidebarItems={sidebarItems}
            currentUser={user}
            roleLabel="System Administrator"
            onLogout={onLogout}
            onNavigate={onNavigate}
        >
            <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {statDefs.map((s) => (
                    <DashboardStatCard key={s.label} title={s.label} value={String(stats[s.key] ?? 0)} icon={s.icon} iconBg={s.iconBg} iconColor={s.iconColor} />
                ))}
            </section>

            {/* Export Card */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200">
                    <Download className="w-4 h-4 text-emerald-700" />
                    <h2 className="text-sm font-bold text-slate-900">Export Report</h2>
                </div>
                <div className="px-6 py-4">
                    <p className="text-xs text-slate-500 mb-4">Download filtered request data as Excel, CSV, or PDF.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => doExport('excel')} disabled={exporting !== null} className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${exporting === 'excel' ? 'bg-emerald-600' : 'bg-emerald-700 hover:bg-emerald-800'}`}>
                            {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
                        </button>
                        <button onClick={() => doExport('csv')} disabled={exporting !== null} className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${exporting === 'csv' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}>
                            {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
                        </button>
                        <button onClick={() => doExport('pdf')} disabled={exporting !== null} className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${exporting === 'pdf' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}>
                            {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Requests by Credential Type — Grouped Bar Chart (Monthly) */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-900">Requests by Credential Type</h2>
                    </div>
                    <div className="p-5">
                        {credentialCategories.length > 0 && topTypeKeys.length > 0 ? (
                            <Chart
                                options={{
                                    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit', animations: { enabled: true, easing: 'easeinout', speed: 800 } },
                                    plotOptions: { bar: { horizontal: false, borderRadius: 10, columnWidth: '22%', borderRadiusApplication: 'end', distributed: false, hoverState: { color: '#0a3a0d' } } },
                                    colors: TYPE_COLORS,
                                    dataLabels: { enabled: false },
                                    xaxis: { categories: credentialCategories, labels: { style: { fontSize: '12px', colors: '#475569', fontWeight: 500 } }, axisBorder: { show: true, color: '#e2e8f0' }, axisTicks: { show: false } },
                                    yaxis: { min: 0, forceNiceScale: true, labels: { style: { fontSize: '12px', colors: '#94a3b8' }, formatter: v => Math.round(v) } },
                                    grid: { show: true, borderColor: '#f1f5f9', strokeDashArray: 5 },
                                    tooltip: { theme: 'light', style: { fontSize: '12px' }, intersect: false, x: { formatter: (val, { dataPointIndex }) => fullMonth(paddedByType[dataPointIndex]?.month || val) }, y: { formatter: v => `${v} requests` } },
                                    legend: { position: 'bottom', fontSize: '12px', fontWeight: 500, itemMargin: { horizontal: 20, vertical: 4 }, markers: { width: 10, height: 10, radius: 2 } },
                                    responsive: [{ breakpoint: 1024, options: { plotOptions: { bar: { columnWidth: '30%' } }, xaxis: { labels: { style: { fontSize: '11px' } } }, legend: { fontSize: '11px' } } }, { breakpoint: 640, options: { legend: { fontSize: '10px' }, xaxis: { labels: { style: { fontSize: '10px' } } }, plotOptions: { bar: { columnWidth: '36%' } } } }],
                                }}
                                series={credentialSeries}
                                type="bar"
                                height={320}
                            />
                        ) : (
                            <div className="py-8"><EmptyState icon={ChartColumn} title="No Data" subtitle="No request analytics available." /></div>
                        )}
                    </div>
                </section>

                {/* Monthly Revenue — Area Chart */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-900">Monthly Revenue</h2>
                    </div>
                    <div className="p-5">
                        {allZeroRevenue ? (
                            <div className="py-8"><EmptyState icon={DollarSign} title="No Data" subtitle="No revenue data yet." /></div>
                        ) : (
                            <Chart
                                options={{
                                    chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit', animations: { enabled: true, easing: 'easeinout', speed: 800 } },
                                    stroke: { curve: 'smooth', width: 2, colors: ['#154212'] },
                                    markers: { size: 0, hover: { size: 6 } },
                                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.03, stops: [0, 100] } },
                                    colors: ['#154212'],
                                    dataLabels: { enabled: false },
                                    xaxis: { categories: paddedRevenue.map(r => shortMonth(r.month)), labels: { style: { fontSize: '12px', colors: '#64748b', fontWeight: 500 } }, axisBorder: { show: true, color: '#e2e8f0' }, axisTicks: { show: false } },
                                    yaxis: { min: 0, forceNiceScale: true, labels: { style: { fontSize: '12px', colors: '#94a3b8' }, formatter: v => `₱${Math.round(v).toLocaleString()}` } },
                                    grid: { show: true, borderColor: '#f1f5f9', strokeDashArray: 5 },
                                    tooltip: { theme: 'light', style: { fontSize: '12px' }, intersect: false, y: { formatter: v => fmtRevenue(v) }, x: { formatter: (val, { dataPointIndex }) => fullMonth(paddedRevenue[dataPointIndex]?.month || val) } },
                                    legend: { show: false },
                                    responsive: [{ breakpoint: 1024, options: { xaxis: { labels: { style: { fontSize: '11px' } } } } }, { breakpoint: 640, options: { xaxis: { labels: { style: { fontSize: '10px' } } } } }],
                                }}
                                series={[{ name: 'Revenue', data: paddedRevenue.map(r => parseFloat(r.revenue || 0)) }]}
                                type="area"
                                height={240}
                            />
                        )}
                    </div>
                </section>

                {/* Status Breakdown — Donut Chart */}
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-bold text-slate-900">Status Breakdown</h2>
                    </div>
                    <div className="p-5">
                        {statusData.length > 0 ? (
                            <Chart
                                options={{
                                    chart: { type: 'donut', fontFamily: 'inherit', animations: { enabled: true, easing: 'easeinout', speed: 800 } },
                                    labels: statusData.map(s => s.name),
                                    colors: statusData.map(s => STATUS_COLORS[s.name] || '#94a3b8'),
                                    plotOptions: { pie: { donut: { size: '50%' }, expandOnClick: false } },
                                    dataLabels: { enabled: true, formatter: (val, opts) => opts.w.globals.series[opts.seriesIndex], style: { fontSize: '13px', fontWeight: 700, colors: ['#fff'] }, dropShadow: { enabled: true, top: 1, left: 1, blur: 2, color: '#000', opacity: 0.45 } },
                                    legend: { position: 'bottom', fontSize: '12px', fontWeight: 500, itemMargin: { horizontal: 20, vertical: 4 }, markers: { width: 10, height: 10, radius: 2 }, formatter: (n, opts) => `${n}: ${opts.w.globals.series[opts.seriesIndex]}` },
                                    tooltip: { theme: 'light', style: { fontSize: '13px' }, y: { formatter: (v, opts) => `${v} requests (${((v / opts.w.globals.series.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)` } },
                                    responsive: [{ breakpoint: 1024, options: { legend: { fontSize: '11px' }, dataLabels: { style: { fontSize: '12px' } } } }, { breakpoint: 640, options: { legend: { fontSize: '10px' }, dataLabels: { style: { fontSize: '11px' } } } }],
                                }}
                                series={statusData.map(s => s.count)}
                                type="donut"
                                height={220}
                            />
                        ) : (
                            <div className="py-8"><EmptyState icon={ChartColumn} title="No Data" subtitle="No status breakdown data available." /></div>
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
