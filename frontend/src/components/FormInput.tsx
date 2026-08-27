import { useId } from "react";

/**
 * Labelled text input. The label is tied to the input with a generated id so
 * screen readers announce it and clicking the label focuses the field.
 */
export default function FormInput({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  [key: string]: any;
}) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-300 mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-700 border border-zinc-600 rounded-md py-2 px-3 text-sm"
        {...props}
      />
    </div>
  );
}
