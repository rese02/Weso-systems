
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
             <p className="absolute -bottom-6 w-max -translate-x-1/2 left-1/2 text-xs text-center text-muted-foreground sm:hidden">{step}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4 hidden sm:flex justify-between text-sm font-medium text-muted-foreground">
        {steps.map((step, stepIdx) => (
            <div key={step} className={cn("text-center w-8", {"font-bold text-primary": stepIdx <= currentStep})}>{step}</div>
        ))}
      </div>
    </nav>
  );
}
