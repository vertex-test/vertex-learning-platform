import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "text";
type ButtonSize = "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: "leading" | "trailing";
  children: ReactNode;
}

/* Design system §07. Hover darkens; disabled fades — never a grey wash. */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 disabled:bg-primary-100 disabled:text-primary-300",
  secondary:
    "bg-white text-primary-500 border border-primary-500 hover:shadow-md disabled:border-primary-200 disabled:text-primary-200 disabled:shadow-none",
  tertiary:
    "bg-white text-neutral-900 border border-neutral-200 hover:shadow-md disabled:text-neutral-300 disabled:shadow-none",
  text: "bg-transparent text-primary-500 hover:text-primary-600 disabled:text-primary-200",
};

/* Height 44px, radius 12px, padding 0 16px (lg) / 0 12px (md). */
const sizeClasses: Record<ButtonSize, string> = {
  lg: "h-11 px-4 text-body-lg",
  md: "h-11 px-3 text-body",
};

export function Button({
  variant = "primary",
  size = "lg",
  icon,
  iconPosition = "trailing",
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-shadow transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${variant === "text" ? "h-auto px-0" : sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon && iconPosition === "leading" && icon}
      {children}
      {icon && iconPosition === "trailing" && icon}
    </button>
  );
}
