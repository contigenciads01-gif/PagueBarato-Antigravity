import * as React from "react";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary: "bg-violet-600 hover:bg-violet-500 text-white shadow-sm",
      secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
      danger: "bg-rose-600 hover:bg-rose-500 text-white",
      ghost: "hover:bg-slate-800 text-slate-300 hover:text-white",
      outline: "border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: "CONFIRMADO" | "SIMULACAO" | "CONFIG_PENDENTE" | "A_CONFIRMAR" | "INATIVO";
}

export function Badge({ className, status = "CONFIRMADO", children, ...props }: BadgeProps) {
  const styles = {
    CONFIRMADO: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    SIMULACAO: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    CONFIG_PENDENTE: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    A_CONFIRMAR: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    INATIVO: "bg-slate-800 text-slate-400 border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        styles[status],
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          status === "CONFIRMADO" && "bg-emerald-400",
          (status === "SIMULACAO" || status === "A_CONFIRMAR") && "bg-amber-400",
          status === "CONFIG_PENDENTE" && "bg-rose-400",
          status === "INATIVO" && "bg-slate-500"
        )}
      />
      {children || status.replace("_", " ")}
    </span>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all",
            error && "border-rose-500 focus:ring-rose-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-slate-900/60 border border-slate-800 p-5 backdrop-blur-sm shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
