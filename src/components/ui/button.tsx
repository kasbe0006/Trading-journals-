import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const styles = {
  primary: "bg-blue-500/95 text-white hover:bg-blue-400 shadow-[0_8px_18px_rgba(37,99,235,0.35)]",
  secondary: "border border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800",
  danger: "bg-rose-500 text-white hover:bg-rose-400",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
