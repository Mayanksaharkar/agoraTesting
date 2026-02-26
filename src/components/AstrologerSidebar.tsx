import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, LogOut, Phone, Package, Sparkles, Layers, Notebook, Shield, MessageCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

export default function AstrologerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: '/astrologer/dashboard' },
    { label: 'Earnings', icon: <BarChart3 className="w-5 h-5" />, path: '/astrologer/earnings' },
    { label: 'Call History', icon: <Phone className="w-5 h-5" />, path: '/astrologer/calls/history' },
    { label: 'Packages', icon: <Package className="w-5 h-5" />, path: '/astrologer/packages' },
    { label: 'Courses', icon: <Layers className="w-5 h-5" />, path: '/astrologer/courses' },
    { label: 'Remedies', icon: <Sparkles className="w-5 h-5" />, path: '/astrologer/remedies' },
    { label: 'Blogs', icon: <Notebook className="w-5 h-5" />, path: '/astrologer/blogs' },
    { label: 'Chat', icon: <MessageCircle className="w-5 h-5" />, path: '/chat' },
    { label: 'Change Password', icon: <Shield className="w-5 h-5" />, path: '/astrologer/change-password' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col sticky top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground">Astrologer</h2>
            <p className="text-xs text-muted-foreground">Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left',
              isActive(item.path)
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
