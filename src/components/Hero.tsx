
import { Button } from '@/components/ui/button';

const Hero = () => {
  return (
    <section className="min-h-screen flex flex-col justify-center items-center pt-20 px-4">
      <div className="max-w-3xl mx-auto text-center animate-fade-up">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
          Welcome to Your <span className="text-blue-500">Blank Project</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          A clean starting point for your next amazing project. Build something beautiful with this minimal template.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
            Get Started
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </div>
      
      <div className="mt-16 w-full max-w-3xl mx-auto px-4">
        <div className="w-full h-64 md:h-80 bg-gray-100 rounded-lg shadow-sm flex items-center justify-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-gray-500 text-sm">Your content goes here</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
