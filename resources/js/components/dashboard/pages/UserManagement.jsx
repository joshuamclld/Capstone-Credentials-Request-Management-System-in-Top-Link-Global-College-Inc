import { useEffect } from 'react';

export default function UserManagement({ onNavigate }) {
    useEffect(() => { onNavigate('/admin-dashboard'); }, []);
    return null;
}
