import { Input as InputComponent } from "@/components/ui/input";

interface InputProps {
  value?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
}

export const Input = ({ value, onChange, onKeyDown, disabled }: InputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="input-container">
      <InputComponent
        type="text"
        placeholder="Type a message..."
        className="outline-none! border-none! bg-transparent! ring-0! w-full h-full"
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
      />
    </div>
  );
};
