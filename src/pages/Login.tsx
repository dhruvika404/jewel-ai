import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gem, Shield, Users } from "lucide-react";
import { toast } from "sonner";

type RoleType = "admin" | "sales_executive";

export default function Login() {
  const { login, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<RoleType>("admin");
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    identifier: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {
      identifier: formData.identifier ? "" : "Field is required",
      password: formData.password ? "" : "Password is required",
    };
    setErrors(newErrors);
    return !newErrors.identifier && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await login(formData.identifier, formData.password, selectedRole);
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-md">
                <Gem className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold">
              Welcome back
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection Tabs */}
              <Tabs
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value as RoleType)
                  setErrors({ identifier: "", password: "" })
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="admin" className="gap-2">
                    <Shield className="w-4 h-4" />
                    Admin
                  </TabsTrigger>
                  <TabsTrigger value="sales_executive" className="gap-2">
                    <Users className="w-4 h-4" />
                    Sales Executive
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="space-y-2">
                <Input
                  label={selectedRole === "admin" ? "Email" : "User Code"}
                  id="identifier"
                  type="text"
                  placeholder={
                    selectedRole === "admin"
                      ? "Enter your email or user code"
                      : "Enter your user code"
                  }
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  error={errors.identifier}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Input
                  label="Password"
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  error={errors.password}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
