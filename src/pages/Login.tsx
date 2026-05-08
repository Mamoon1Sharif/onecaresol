import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Lock, HeartHandshake } from "lucide-react";

const Login = () => {
  const [companyId, setCompanyId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getLoginErrorMessage = (err: any) => {
    const message = typeof err === "string" ? err : err?.message ?? String(err ?? "");

    if (/invalid login credentials|invalid credentials|incorrect password|invalid password|invalid username|invalid user/i.test(message)) {
      return "Invalid username or password. Please try again.";
    }

    if (/company id|username|not found|no user|user not found/i.test(message)) {
      return "Invalid Company ID or username. Please check your details and try again.";
    }

    return "Check your Company ID, username, and password.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Resolve (company_id + username) -> the synthetic auth email.
      const { data, error } = await supabase.functions.invoke("resolve-login", {
        body: { company_code: companyId.trim(), username: username.trim() },
      });
      if (error || !data?.email) {
        throw new Error(data?.error || error?.message || "Invalid Company ID or username");
      }
      // 2. Sign in with that email + the supplied password.
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password,
      });
      if (signInErr) {
        throw new Error(signInErr.message || "Invalid username or password");
      }
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: getLoginErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border border-border shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <HeartHandshake className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to your company workspace</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyId">Company ID</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyId"
                  type="text"
                  placeholder="ACME"
                  autoCapitalize="characters"
                  autoComplete="organization"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username / User Code</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="jdoe"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Need an account? Contact your company administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
