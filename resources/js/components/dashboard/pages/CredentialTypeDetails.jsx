import { useEffect } from 'react';

export default function CredentialTypeDetails({ onNavigate }) {
    useEffect(() => { onNavigate('/admin-dashboard'); }, []);
    return null;
}
