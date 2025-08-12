
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type StepIndicatorProps = {
  steps: string[];
  currentStep: number;
};

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={cn('relative', stepIdx !== steps.length - 1 ? 'flex-1' : '')}>
            {stepIdx < currentStep ? (
              <>
                <div className="absolute inset-0 top-1/2 -translate-y-1/2 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                >
                  <Check className="h-5 w-5 text-white" aria-hidden="true"/>
                  <span className="sr-only">{step}</span>
                </div>
              </>
            ) : stepIdx === currentStep ? (
              <>
                 <div className="absolute inset-0 top-1/2 -translate-y-1/2 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                   <span className="sr-only">{step}</span>
                </div>
              </>
            ) : (
              <>
                 <div className="absolute inset-0 top-1/2 -translate-y-1/2 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-background"
                >
                   <span className="sr-only">{step}</span>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-4 hidden sm:flex text-sm font-medium text-muted-foreground">
        {steps.map((step, stepIdx) => (
            <div key={step} className={cn(
                "w-full text-center", 
                stepIdx <= currentStep ? "font-bold text-primary" : "",
                stepIdx === 0 ? "text-left" : "",
                stepIdx === steps.length - 1 ? "text-right" : ""
            )}>
                {step}
            </div>
        ))}
      </div>
       <div className="mt-4 sm:hidden flex justify-between text-xs font-medium text-muted-foreground">
        {steps.map((step, stepIdx) => (
            <div key={step} className={cn("w-1/5 text-center px-1", {"font-bold text-primary": stepIdx <= currentStep})}>{step}</div>
        ))}
      </div>
    </nav>
  );
}
