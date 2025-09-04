import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    checked={checked}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
      "theme-border focus-visible:ring-theme-primary",
      "data-[state=checked]:text-white data-[state=checked]:border-theme-primary",
      className
    )}
    style={{
      background: checked || (props as any)['data-state'] === 'checked' 
        ? 'var(--theme-gradient)' 
        : 'transparent',
      borderColor: checked || (props as any)['data-state'] === 'checked' 
        ? 'hsl(var(--primary))' 
        : 'hsl(var(--primary) / 0.4)'
    }}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" style={{ color: 'white' }} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
