import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: any;
  label?: any;
  rightIcon?: any;
  rightAddon?: any;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      rightIcon = null,
      type,
      error = "",
      label = "",
      rightAddon = <></>,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    return (
      <>
        {label && (
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
        )}
        <div className="w-full">
          <div className="relative w-full">
            {rightIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {rightIcon}
              </div>
            )}
            <input
              id={id}
              type={showPassword ? "text" : type}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                rightIcon && "pl-10",
                className
              )}
              ref={ref}
              {...props}
            />
            {
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-sm">
                {rightAddon}
              </div>
            }
            {type?.toLocaleLowerCase() == "password" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0.5 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-2">
              {error}
            </p>
          )}
        </div>
      </>
    );
  }
);
Input.displayName = "Input";

export { Input };
