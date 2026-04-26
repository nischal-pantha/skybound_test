import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plane, Loader2 } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Google "G" icon inline SVG
function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, signUp, signInWithGoogle, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/');
  }, [isAuthenticated, loading, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fe: { email?: string; password?: string } = {};
        error.errors.forEach((e) => {
          if (e.path[0] === 'email') fe.email = e.message;
          if (e.path[0] === 'password') fe.password = e.message;
        });
        setErrors(fe);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      let message = 'Failed to sign in';
      if (error.message.includes('Invalid login credentials')) message = 'Invalid email or password';
      else if (error.message.includes('Email not confirmed')) message = 'Please confirm your email address';
      toast({ title: 'Sign in failed', description: message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back!', description: 'Signed in successfully' });
      navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    const { error } = await signUp(email, password);
    setIsLoading(false);
    if (error) {
      let message = 'Failed to create account';
      if (error.message.includes('User already registered')) message = 'An account with this email already exists';
      else if (error.message.includes('Password')) message = error.message;
      toast({ title: 'Sign up failed', description: message, variant: 'destructive' });
    } else {
      toast({ title: 'Account created!', description: 'Welcome to SkyBound' });
      navigate('/');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (error) {
      const msg = typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Google sign-in failed';
      // Ignore user-cancelled popup
      if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled')) {
        toast({ title: 'Google sign-in failed', description: msg, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Welcome!', description: 'Signed in with Google' });
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Plane className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SkyBound</h1>
          <p className="text-sm text-muted-foreground mt-1">Professional flight operations</p>
        </div>

        <Card className="border-border/50 shadow-lg bg-card/80 backdrop-blur-xl">
          <CardContent className="pt-6">
            {/* Google Sign-In Button */}
            <Button
              id="google-signin-btn"
              variant="outline"
              className="w-full h-11 rounded-lg font-medium text-sm gap-3 border-border/60 hover:bg-muted/60 mb-5"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              type="button"
            >
              {isGoogleLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <GoogleIcon />}
              {isGoogleLoading ? 'Signing in…' : 'Continue with Google'}
            </Button>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">or continue with email</span>
              </div>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 rounded-lg bg-muted/60">
                <TabsTrigger value="signin" className="rounded-md text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-md text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-lg bg-muted/40 border-border/60 focus:border-primary transition-colors"
                      required
                    />
                    {errors.email && <p className="text-destructive text-xs animate-fade-in">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-lg bg-muted/40 border-border/60 focus:border-primary transition-colors"
                      required
                    />
                    {errors.password && <p className="text-destructive text-xs animate-fade-in">{errors.password}</p>}
                  </div>
                  <Button
                    id="email-signin-btn"
                    type="submit"
                    className="w-full h-11 rounded-lg font-medium text-sm"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-lg bg-muted/40 border-border/60 focus:border-primary transition-colors"
                      required
                    />
                    {errors.email && <p className="text-destructive text-xs animate-fade-in">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-lg bg-muted/40 border-border/60 focus:border-primary transition-colors"
                      required
                    />
                    {errors.password && <p className="text-destructive text-xs animate-fade-in">{errors.password}</p>}
                  </div>
                  <Button
                    id="email-signup-btn"
                    type="submit"
                    className="w-full h-11 rounded-lg font-medium text-sm"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}
