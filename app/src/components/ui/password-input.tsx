'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  showToggle?: boolean
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showToggle = true, autoComplete = 'current-password', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative w-full">
        <Input
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={cn('pr-11 font-mono transition-all', className)}
        />
        {showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-full"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 transition-transform duration-200 hover:scale-110" />
            ) : (
              <Eye className="w-4 h-4 transition-transform duration-200 hover:scale-110" />
            )}
          </Button>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
