import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Satellite, Brain, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export const LoadingState = () => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Satellite, label: 'Processing images', duration: 2000 },
    { icon: Brain, label: 'Analyzing changes', duration: 3000 },
    { icon: Zap, label: 'Generating results', duration: 1000 }
  ];

  useEffect(() => {
    const totalDuration = 6000; // 6 seconds total
    const interval = 50; // Update every 50ms
    const increment = (100 / totalDuration) * interval;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + increment, 100);
        
        // Update current step based on progress
        if (newProgress < 33) setCurrentStep(0);
        else if (newProgress < 66) setCurrentStep(1);
        else setCurrentStep(2);
        
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <Card className="p-8 bg-gradient-subtle shadow-card">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-earth flex items-center justify-center mx-auto animate-pulse">
            <CurrentIcon className="h-10 w-10 text-white animate-bounce" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-earth-cyan/20 animate-spin"></div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-satellite-deep">
            Analyzing Satellite Images
          </h3>
          <p className="text-muted-foreground">
            {steps[currentStep].label}...
          </p>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="w-full max-w-sm mx-auto h-2" />
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>

        <div className="flex justify-center gap-4 pt-2">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs transition-all duration-300 ${
                index === currentStep 
                  ? 'bg-earth-blue text-white' 
                  : index < currentStep
                  ? 'bg-earth-green text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <step.icon className="h-3 w-3" />
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};