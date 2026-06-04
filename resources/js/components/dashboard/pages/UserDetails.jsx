import { useEffect } from 'react';

export default function UserDetails({ onNavigate }) {
    useEffect(() => { onNavigate('/admin-dashboard'); }, []);
    return null;
}
