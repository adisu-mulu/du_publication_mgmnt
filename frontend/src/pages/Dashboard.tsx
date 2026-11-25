import { useAuth } from '../context/AuthContext';
import { ResearcherDashboard } from './researcher/ResearcherDashboard';
import { OfficerDashboard } from './publication_officer/OfficerDashboard';

export const Dashboard = () => {
    const { activeRole } = useAuth();

    switch (activeRole) {
        case 'publication_officer':
        case 'supervisor':
        case 'vice_dean':
            return <OfficerDashboard />;
        case 'researcher':
        default:
            return <ResearcherDashboard />;
    }
};

export default Dashboard;
