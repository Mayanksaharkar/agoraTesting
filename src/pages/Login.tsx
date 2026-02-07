import { useState } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, Eye, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { login, loginWithToken, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jwtToken, setJwtToken] = useState('');
  const [showTokenField, setShowTokenField] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (jwtToken.trim()) {
      loginWithToken(jwtToken.trim(), role);
      navigate(role === 'astrologer' ? '/astrologer' : '/user');
      return;
    }

    try {
      await login(email, password, role);
      navigate(role === 'astrologer' ? '/astrologer' : '/user');
      toast({ title: 'Welcome!', description: 'Login successful' });
    } catch {
      toast({ title: 'Login Failed', description: 'Check your credentials', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen cosmic-gradient flex items-center justify-center p-4">
      {/* Decorative stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-foreground/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gold-gradient mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">Astrology Live</h1>
          <p className="text-muted-foreground mt-2">Connect with the cosmos in real-time</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-card border border-border p-8 card-glow">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('astrologer')}
              className={`flex items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'astrologer'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-muted-foreground/50'
              }`}
            >
              <Star className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold text-sm">Astrologer</div>
                <div className="text-xs opacity-70">Broadcast</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'user'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-muted-foreground/50'
              }`}
            >
              <Eye className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold text-sm">User</div>
                <div className="text-xs opacity-70">Watch</div>
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!showTokenField && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-secondary-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={role === 'astrologer' ? 'astrologer@example.com' : 'user@example.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-secondary-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}

            {showTokenField && (
              <div className="space-y-2">
                <Label htmlFor="jwt" className="text-secondary-foreground">JWT Token</Label>
                <Input
                  id="jwt"
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  value={jwtToken}
                  onChange={(e) => setJwtToken(e.target.value)}
                  className="bg-secondary border-border font-mono text-xs"
                />
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full gold-gradient text-primary-foreground font-semibold h-12">
              {isLoading ? (
                <Radio className="w-4 h-4 animate-spin" />
              ) : (
                <>Sign In as {role === 'astrologer' ? 'Astrologer' : 'User'}</>
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setShowTokenField(!showTokenField)}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
          >
            {showTokenField ? '← Back to email login' : 'Quick login with JWT token →'}
          </button>
        </div>
      </div>
    </div>
  );
}
