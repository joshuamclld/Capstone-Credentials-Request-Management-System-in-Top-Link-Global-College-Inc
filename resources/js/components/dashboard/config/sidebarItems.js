import { LayoutDashboard, FileText, Clock, CheckCircle, Search, Users, ChartColumn, RefreshCw } from 'lucide-react';

export const registrarSidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
    { label: 'Request Management', icon: FileText, path: '/admin/requests' },
    { label: 'Process Requests', icon: Clock, path: '/admin/process' },
    { label: 'Release Credentials', icon: CheckCircle, path: '/admin/release' },
    { label: 'Search Records', icon: Search, path: '/admin/search' },
];

export const cashierSidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/cashier-dashboard' },
    { label: 'Payment Queue', icon: Clock, path: '/cashier/payments' },
    { label: 'Paid Transactions', icon: CheckCircle, path: '/cashier/transactions' },
];

export const systemAdminSidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/system-admin-dashboard' },
    { label: 'User Management', icon: Users, path: '/system-admin/users' },
    { label: 'Credential Types', icon: FileText, path: '/system-admin/credentials' },
    { label: 'Reports & Analytics', icon: ChartColumn, path: '/system-admin/reports' },
    { label: 'Audit Logs', icon: RefreshCw, path: '/system-admin/audit-logs' },
];
