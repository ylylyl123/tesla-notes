interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  bgColor?: string;
}

export default function Badge({ children, className = "", color, bgColor }: BadgeProps) {
  const style = color && bgColor
    ? { backgroundColor: bgColor, color: color }
    : undefined;

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${className}`} style={style}>
      {children}
    </span>
  );
}
