import React, { useMemo, useState } from 'react';
import {
    Bell,
    CheckCircle2,
    Clock3,
    FileCheck2,
    Filter,
    KeyRound,
    LayoutDashboard,
    Plus,
    Search,
    ShieldCheck,
    UserRoundCheck,
    LogOut
} from 'lucide-react';

const initialRequests = [
    {
        id: 'CR-1028',
        requester: 'Mara Santos',
        credential: 'VPN access',
        department: 'Operations',
        priority: 'High',
        status: 'Pending review',
        submitted: 'Today, 9:24 AM',
    },
    {
        id: 'CR-1027',
        requester: 'Andre Lim',
        credential: 'Finance dashboard',
        department: 'Accounting',
        priority: 'Medium',
        status: 'Manager approved',
        submitted: 'Today, 8:10 AM',
    },
    {
        id: 'CR-1026',
        requester: 'Grace Villanueva',
        credential: 'Email distribution group',
        department: 'HR',
        priority: 'Low',
        status: 'Provisioned',
        submitted: 'Yesterday, 4:42 PM',
    },
    {
        id: 'CR-1025',
        requester: 'Jon Reyes',
        credential: 'Database read role',
        department: 'Engineering',
        priority: 'High',
        status: 'Security check',
        submitted: 'Yesterday, 2:18 PM',
    },
];

const metrics = [
    { label: 'Open requests', value: '42', trend: '+8 this week', icon: FileCheck2 },
    { label: 'Pending approvals', value: '16', trend: '5 high priority', icon: Clock3 },
    { label: 'Provisioned today', value: '11', trend: '98% SLA met', icon: CheckCircle2 },
    { label: 'Access reviews', value: '7', trend: 'Due in 3 days', icon: ShieldCheck },
];

function StatusBadge({ status }) {
    const styles = {
        'Pending review': 'bg-amber-50 text-amber-800 ring-amber-200',
        'Manager approved': 'bg-sky-50 text-sky-800 ring-sky-200',
        Provisioned: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
        'Security check': 'bg-rose-50 text-rose-800 ring-rose-200',
    };

    return (
        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ${styles[status]}`}>
            {status}
        </span>
    );
}

export default function Dashboard({ backendStatus, onLogout }) {
    const [query, setQuery] = useState('');

    const filteredRequests = useMemo(() => {
        const normalized = query.trim().toLowerCase();

        if (!normalized) {
            return initialRequests;
        }

        return initialRequests.filter((request) =>
            [request.id, request.requester, request.credential, request.department, request.status]
                .join(' ')
                .toLowerCase()
                .includes(normalized),
        );
    }, [query]);

    return (
        <div className="min-h-dvh bg-slate-50 font-body-md">
            <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:flex lg:flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-white">
                            <KeyRound aria-hidden="true" className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-950">CRMS</p>
                            <p className="text-xs text-slate-500">Credential Requests</p>
                        </div>
                    </div>

                    <nav aria-label="Primary" className="mt-8 space-y-1">
                        {[
                            { label: 'Dashboard', icon: LayoutDashboard, active: true },
                            { label: 'Requests', icon: FileCheck2 },
                            { label: 'Approvals', icon: UserRoundCheck },
                            { label: 'Audit', icon: ShieldCheck },
                        ].map((item) => (
                            <a
                                key={item.label}
                                href="#"
                                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                                    item.active
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                                }`}
                            >
                                <item.icon aria-hidden="true" className="size-4" />
                                {item.label}
                            </a>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                    <button
                        onClick={onLogout}
                        className="flex w-full min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-950 transition cursor-pointer"
                    >
                        <LogOut aria-hidden="true" className="size-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header (Shows Logout button too) */}
            <main className="lg:pl-72">
                <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                        <div>
                            <h1 className="text-lg font-semibold text-slate-950 sm:text-xl font-headline-sm">Credential Request Management</h1>
                            <p className="text-sm text-slate-500 font-body-sm">Backend: Laravel API {backendStatus.toLowerCase()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                aria-label="Notifications"
                                className="inline-flex size-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            >
                                <Bell aria-hidden="true" className="size-4" />
                            </button>
                            <button
                                type="button"
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition cursor-pointer"
                            >
                                <Plus aria-hidden="true" className="size-4" />
                                New request
                            </button>
                            {/* Mobile only sign out */}
                            <button
                                onClick={onLogout}
                                type="button"
                                className="lg:hidden inline-flex size-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut aria-hidden="true" className="size-4" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="px-4 py-6 sm:px-6 lg:px-8">
                    <section aria-label="Request summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {metrics.map((metric) => (
                            <article key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 font-body-sm">{metric.label}</p>
                                        <p className="mt-2 text-3xl font-semibold text-slate-950 font-headline-lg">{metric.value}</p>
                                    </div>
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-primary">
                                        <metric.icon aria-hidden="true" className="size-5" />
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-slate-600 font-body-sm">{metric.trend}</p>
                            </article>
                        ))}
                    </section>

                    <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-xs">
                        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-slate-950 font-headline-sm">Active credential requests</h2>
                                <p className="text-sm text-slate-500 font-body-sm">Review, approve, and track provisioning work.</p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <label className="relative block">
                                    <span className="sr-only">Search requests</span>
                                    <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        className="min-h-11 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-950 placeholder:text-slate-400 sm:w-64"
                                        placeholder="Search requests"
                                        type="search"
                                    />
                                </label>
                                <button
                                    type="button"
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                    <Filter aria-hidden="true" className="size-4" />
                                    Filter
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 font-label-md">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Request</th>
                                        <th scope="col" className="px-4 py-3">Requester</th>
                                        <th scope="col" className="px-4 py-3">Credential</th>
                                        <th scope="col" className="px-4 py-3">Priority</th>
                                        <th scope="col" className="px-4 py-3">Status</th>
                                        <th scope="col" className="px-4 py-3">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white font-body-sm">
                                    {filteredRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-4 font-medium text-slate-950">{request.id}</td>
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-slate-900">{request.requester}</p>
                                                <p className="text-xs text-slate-500">{request.department}</p>
                                            </td>
                                            <td className="px-4 py-4 text-slate-700">{request.credential}</td>
                                            <td className="px-4 py-4 text-slate-700">{request.priority}</td>
                                            <td className="px-4 py-4"><StatusBadge status={request.status} /></td>
                                            <td className="px-4 py-4 text-slate-600">{request.submitted}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
