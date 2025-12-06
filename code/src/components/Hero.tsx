import { Brain } from "lucide-react";
import { Button } from "./ui/button";

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-hero opacity-10" />
      
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-gradient-hero rounded-2xl shadow-glow-primary">
              <Brain className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            SkillPulse
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your GitHub into an AI-powered learning brain. Ask questions about your code, 
            discover patterns, and accelerate your development journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow-primary text-lg px-8"
              onClick={onGetStarted}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/50 hover:border-primary hover:bg-primary/10 text-lg px-8"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
