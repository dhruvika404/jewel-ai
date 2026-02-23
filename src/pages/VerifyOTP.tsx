import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gem, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authAPI } from "@/services/api";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  // Redirect to forgot password if no email in state
  if (!email) {
    navigate("/forgot-password");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      setError("OTP is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authAPI.verifyOTP(email, otp);
      toast.success("OTP verified successfully");
      // Navigate to reset password page with email in state
      navigate("/reset-password", { state: { email } });
    } catch (error: any) {
      toast.error(error?.message || "Invalid OTP. Please try again.");
      setError(error?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await authAPI.forgotPassword(email, "admin");
      toast.success("OTP has been resent to your email");
      setOtp("");
      setError("");
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border border-border shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/forgot-password")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-md">
                <Gem className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-center">
              Verify OTP
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Enter the OTP sent to {email}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  label="OTP Code"
                  id="otp"
                  type="text"
                  placeholder="Enter OTP"
                  name="otp"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  error={error}
                  autoFocus
                  maxLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="text-sm"
                >
                  {isResending ? "Resending..." : "Resend OTP"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
