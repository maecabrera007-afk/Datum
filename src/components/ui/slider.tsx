import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/** Control deslizante; con dos valores muestra dos manijas (rango). */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & { etiquetas?: string[] }
>(({ className, etiquetas, ...props }, ref) => {
  const valores = props.value ?? props.defaultValue ?? [0];
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center py-2", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-foreground" />
      </SliderPrimitive.Track>
      {valores.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={etiquetas?.[i]}
          className="block size-5 cursor-grab rounded-full border-2 border-foreground bg-background transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
