import { useEffect } from 'react';

export default function AdminDashboard({ onNavigate }) {
    useEffect(() => { onNavigate('/admin-dashboard'); }, []);
    return null;
}
