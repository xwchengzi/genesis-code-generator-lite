
import { Code, Layout, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Layout className="w-10 h-10 text-blue-500" />,
      title: 'Responsive Design',
      description: 'Fully responsive layout that looks great on any device, from mobile to desktop.'
    },
    {
      icon: <Code className="w-10 h-10 text-blue-500" />,
      title: 'Modern Stack',
      description: 'Built with React, TypeScript, and Tailwind CSS for a modern development experience.'
    },
    {
      icon: <Zap className="w-10 h-10 text-blue-500" />,
      title: 'Fast & Optimized',
      description: 'Optimized for performance to ensure your project loads quickly and runs smoothly.'
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to start building your next project right away.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow animate-fade-up"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
