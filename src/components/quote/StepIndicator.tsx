import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-card/50 backdrop-blur-sm border-b border-border">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <button
            onClick={() => onStepClick?.(step.id)}
            disabled={step.id > currentStep}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
              step.id === currentStep
                ? "bg-primary text-primary-foreground shadow-md"
                : step.id < currentStep
                ? "bg-success/20 text-success cursor-pointer hover:bg-success/30"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {step.id < currentStep ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Circle className={cn("w-5 h-5", step.id === currentStep && "fill-current")} />
            )}
            <span className="font-medium text-sm whitespace-nowrap">{step.title}</span>
          </button>
          
          {index < steps.length - 1 && (
            <ArrowRight className="w-5 h-5 mx-2 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}
