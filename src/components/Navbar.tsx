
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-sm z-50 py-4 px-6 md:px-10 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <a href="/" className="text-xl font-medium text-gray-900">
            Blank<span className="text-blue-500">Project</span>
          </a>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="/" className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors">
            Home
          </a>
          <a href="#features" className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors">
            Features
          </a>
          <a href="#about" className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors">
            About
          </a>
          <a href="#contact" className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors">
            Contact
          </a>
          <Button size="sm" variant="outline" className="ml-4">
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={toggleMenu} className="md:hidden">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-md p-6 animate-fade-in">
          <div className="flex flex-col space-y-4">
            <a href="/" className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors">
              Home
            </a>
            <a href="#features" className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors">
              Features
            </a>
            <a href="#about" className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors">
              About
            </a>
            <a href="#contact" className="text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors">
              Contact
            </a>
            <Button size="sm" variant="outline" className="w-full">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
