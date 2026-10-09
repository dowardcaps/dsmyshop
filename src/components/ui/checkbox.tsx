import * as React from "react";

import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.ComponentProps<"input">, "type"> {
  /** Shows the "some selected" dash. Only a visual state: `checked` still decides the value. */
  indeterminate?: boolean;
}

/** Native checkbox: keyboard and screen-reader friendly, themed with the primary color. */
function Checkbox({ className, indeterminate = false, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      ref={(element) => {
        if (element) element.indeterminate = indeterminate;
      }}
      className={cn(
        "size-4 shrink-0 cursor-pointer rounded border-input accent-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
