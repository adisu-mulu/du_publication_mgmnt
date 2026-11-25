import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import {
    FileText,
    CheckSquare,
    BarChart3,
    Users,
    PlusCircle,
    LogOut,
    Building2,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    Eye,
    LayoutDashboard
} from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
    researcher: 'Researcher',
    publication_officer: 'Publication Officer',
    vice_dean: 'Vice Dean',
    supervisor: 'Supervisor'
};

export const Layout = ({ children }: { children: ReactNode }) => {
    const { user, roles, activeRole, switchRole, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Responsive state
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(false);

    // Track window resize to auto-adapt
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768;
            setIsMobileScreen(isMobile);
            if (isMobile) {
                setIsMobileOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        if (isMobileScreen) {
            setIsMobileOpen(false);
        }
    }, [location.pathname, isMobileScreen]);

    const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRole = e.target.value as UserRole;
        if (newRole && newRole !== activeRole) {
            await switchRole(newRole);
            navigate('/dashboard');
        }
    };

    const getNavItems = () => {
        if (!activeRole) return [];

        switch (activeRole) {
            case 'researcher':
                return [
                    { label: 'My Publications', path: '/dashboard', icon: FileText },
                    { label: 'Submit Publication', path: '/publications/submit', icon: PlusCircle }
                ];
            case 'publication_officer':
                return [
                    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                    { label: 'Pending Publications', path: '/publications/pending', icon: CheckSquare },
                    { label: 'Add Publication', path: '/publications/submit', icon: PlusCircle },

                    { label: 'View Publications', path: '/publications/view', icon: Eye },
                    { label: 'Reports', path: '/reports', icon: BarChart3 }
                ];
            case 'vice_dean':
                return [
                    { label: 'Dashboard', path: '/dashboard', icon: Building2 },
                    { label: 'View Publications', path: '/publications/view', icon: Eye },
                    { label: 'Reports', path: '/reports', icon: BarChart3 },
                    { label: 'Manage Researchers', path: '/researchers', icon: Users }
                ];
            case 'supervisor':
                return [
                    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
                    { label: 'View Publications', path: '/publications/view', icon: Eye },
                    { label: 'Reports', path: '/reports', icon: BarChart3 }
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();
    const currentSidebarWidth = isMobileScreen
        ? '0px'
        : (isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)');

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
            {/* Mobile Backdrop Overlay */}
            {isMobileScreen && isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.4)',
                        zIndex: 998,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            {/* Sidebar (Desktop Collapsible & Mobile Drawer) */}
            <aside style={{
                width: isMobileScreen ? 'var(--sidebar-width)' : currentSidebarWidth,
                backgroundColor: '#ffffff',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: isMobileScreen ? (isMobileOpen ? 0 : '-100%') : 0,
                zIndex: 999,
                transition: 'all 0.25s ease',
                overflowX: 'hidden'
            }}>
                {/* Header with App Title & Dynamic Role Switcher */}
                <div style={{
                    padding: isCollapsed && !isMobileScreen ? '14px 10px' : '16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isCollapsed && !isMobileScreen ? 'center' : 'stretch'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                minWidth: '32px',
                                backgroundColor: 'var(--primary)',
                                color: '#ffffff',
                                fontWeight: '700',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px'
                            }}>
                                DU
                            </div>
                            {(!isCollapsed || isMobileScreen) && (
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.2 }}>
                                        DU Publication
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        Repository System
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile close button */}
                        {isMobileScreen && (
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Dynamic Role Switcher: Visible only if account holds 2+ roles */}
                    {roles.length > 1 && (!isCollapsed || isMobileScreen) && (
                        <div style={{ marginTop: '8px' }}>
                            <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                ACTIVE ROLE
                            </label>
                            <select
                                value={activeRole || 'researcher'}
                                onChange={handleRoleChange}
                                style={{
                                    fontSize: '12px',
                                    padding: '6px 8px',
                                    backgroundColor: '#f8fafc',
                                    borderColor: 'var(--border)',
                                    width: '100%'
                                }}
                            >
                                {roles.map((r) => (
                                    <option key={r} value={r}>
                                        {ROLE_LABELS[r] || r}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <nav style={{ flex: 1, padding: isCollapsed && !isMobileScreen ? '14px 6px' : '14px 10px', overflowY: 'auto' }}>
                    {(!isCollapsed || isMobileScreen) && (
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-light)', padding: '0 8px 8px 8px', textTransform: 'uppercase' }}>
                            Menu
                        </div>
                    )}
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                title={isCollapsed && !isMobileScreen ? item.label : undefined}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: isCollapsed && !isMobileScreen ? 'center' : 'flex-start',
                                    gap: '10px',
                                    width: '100%',
                                    padding: isCollapsed && !isMobileScreen ? '10px 0' : '8px 12px',
                                    marginBottom: '4px',
                                    fontSize: '13px',
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? 'var(--primary)' : 'var(--text-main)',
                                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                <Icon size={18} style={{ minWidth: '18px' }} />
                                {(!isCollapsed || isMobileScreen) && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Footer User Info */}
                {/* {(!isCollapsed || isMobileScreen) && (
                    <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 600, letterSpacing: '0.04em' }}>
                            COLLEGE / UNIT
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={user?.collegeName}>
                            {user?.collegeName || 'Dilla University'}
                        </div>
                    </div>
                )} */}
            </aside>

            {/* Main Area */}
            <div style={{
                flex: 1,
                marginLeft: currentSidebarWidth,
                display: 'flex',
                flexDirection: 'column',
                transition: 'margin-left 0.25s ease',
                width: '100%',
                minWidth: 0
            }}>
                {/* Slim Top Bar */}
                <header style={{
                    height: 'var(--topbar-height)',
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobileScreen ? '0 14px' : '0 24px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 90
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Mobile Menu Hamburger */}
                        {isMobileScreen && (
                            <button
                                onClick={() => setIsMobileOpen(true)}
                                className="btn-icon"
                                aria-label="Toggle Navigation"
                            >
                                <Menu size={18} />
                            </button>
                        )}

                        {/* Desktop Small Collapse Arrow Toggle */}
                        {!isMobileScreen && (
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '5px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: '#ffffff',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    transition: 'all 0.15s ease'
                                }}
                                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                            >
                                {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                            </button>
                        )}

                        {/* User Name, Role Badge, and College Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                                {user?.fullName}
                            </span>
                            <span style={{
                                backgroundColor: '#e0e7ff',
                                color: 'var(--primary)',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '4px'
                            }}>
                                {activeRole ? ROLE_LABELS[activeRole] : ''}
                            </span>

                            {user?.collegeName && (
                                <span style={{
                                    backgroundColor: '#f1f5f9',
                                    color: '#334155',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border)',
                                    maxWidth: '280px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }} title={user.collegeName}>
                                    {user.collegeName}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <LogOut size={14} /> <span style={{ display: isMobileScreen ? 'none' : 'inline' }}>Sign Out</span>
                    </button>
                </header>

                {/* Page Content */}
                <main style={{
                    flex: 1,
                    padding: isMobileScreen ? '16px' : '28px',
                    maxWidth: '100%',
                    overflowX: 'hidden'
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
