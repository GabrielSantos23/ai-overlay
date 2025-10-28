import { useEffect, useState } from "react";

interface TypeEffectProps {
  text: string;
  speed?: number; // ms per character
  onComplete?: () => void;
}

export const TypeEffect: React.FC<TypeEffectProps> = ({
  text,
  speed = 50,
  onComplete,
}) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    // Reset and restart animation only when text changes completely
    setDisplayed("");
    let idx = 0;

    const timer = setInterval(() => {
      if (idx < text.length) {
        setDisplayed(text.slice(0, idx + 1));
        idx++;
      } else {
        clearInterval(timer);
        onComplete && onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return <span className="whitespace-pre-wrap">{displayed}</span>;
};
