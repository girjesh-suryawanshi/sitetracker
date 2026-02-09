import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";
import { HardHat } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false); // Toggle between Login and Register

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { email, password, name } : { email, password };

      const response = await api.post(endpoint, payload);

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast({
        title: "Success",
        description: isRegister ? "Account created successfully" : "Signed in successfully",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Authentication failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-accent p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-lg mb-4">
            <HardHat className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Site Expense Tracker</h1>
          <p className="text-primary-foreground/80">Manage construction expenses efficiently</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isRegister ? "Create Account" : "Sign In"}</CardTitle>
            <CardDescription>{isRegister ? "Create a new account to get started" : "Sign in to access the dashboard"}</CardDescription>
          </CardHeader>
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="Your Name"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : (isRegister ? "Sign Up" : "Sign In")}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setIsRegister(!isRegister)}
              >
                {isRegister ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Auth;