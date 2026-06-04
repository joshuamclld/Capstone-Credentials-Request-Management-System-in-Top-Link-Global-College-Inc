import { useEffect } from 'react';

export default function CredentialTypes({ onNavigate }) {
    useEffect(() => { onNavigate('/admin-dashboard'); }, []);
    return null;
}
