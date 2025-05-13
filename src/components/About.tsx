
const About = () => {
  return (
    <section id="about" className="py-16 md:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">About This Template</h2>
            <p className="text-lg text-gray-600 mb-6">
              This minimal starter template provides everything you need to start building
              your project quickly. It comes with a clean design, essential components,
              and is fully customizable to suit your needs.
            </p>
            <p className="text-lg text-gray-600">
              Whether you're building a personal website, a landing page, or a full web
              application, this template gives you a solid foundation to build upon.
            </p>
          </div>
          
          <div className="h-64 md:h-96 bg-gray-100 rounded-lg shadow-sm flex items-center justify-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-gray-500 text-sm">About image placeholder</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
