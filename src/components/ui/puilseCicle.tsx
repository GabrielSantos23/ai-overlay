interface PulseCircleProps {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "red" | "green" | "yellow" | "purple" | "pink";
  className?: string;
}

export default function PulseCircle({
  size = "sm",
  color = "blue",
  className = "",
}: PulseCircleProps) {
  // Define size classes
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const colorClasses = {
    blue: {
      bg: "bg-blue-500",
      bgLight: "bg-blue-400",
      shadow: "shadow-blue-500/50",
    },
    red: {
      bg: "bg-red-500",
      bgLight: "bg-red-400",
      shadow: "shadow-red-500/50",
    },
    green: {
      bg: "bg-green-500",
      bgLight: "bg-green-400",
      shadow: "shadow-green-500/50",
    },
    yellow: {
      bg: "bg-yellow-500",
      bgLight: "bg-yellow-400",
      shadow: "shadow-yellow-500/50",
    },
    purple: {
      bg: "bg-purple-500",
      bgLight: "bg-purple-400",
      shadow: "shadow-purple-500/50",
    },
    pink: {
      bg: "bg-pink-500",
      bgLight: "bg-pink-400",
      shadow: "shadow-pink-500/50",
    },
  };

  const selectedColor = colorClasses[color];
  const selectedSize = sizeClasses[size];

  return (
    <div className={`relative ${selectedSize} ${className}`}>
      {/* Outer pulse ring */}
      <div
        className={`absolute inset-0 rounded-full border-2 border-current animate-ping opacity-75`}
      ></div>

      {/* Middle pulse ring */}
      <div
        className={`absolute inset-0 rounded-full border border-current animate-pulse opacity-50`}
      ></div>

      {/* Core circle - just border, no fill */}
      <div
        className={`relative ${selectedSize} rounded-full border-2 border-current`}
      ></div>
    </div>
  );
}
