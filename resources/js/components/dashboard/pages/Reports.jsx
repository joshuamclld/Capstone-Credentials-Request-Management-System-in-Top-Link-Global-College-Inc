import { useEffect } from 'react';

export default function Reports({ onNavigate }) {
    useEffect(() => { onNavigate('/admin-dashboard'); }, []);
    return null;
}
