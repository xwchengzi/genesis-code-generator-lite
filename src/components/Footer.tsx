
import { Github, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          <div>
            <h3 className="text-lg font-semibold mb-4">Blank<span className="text-blue-500">Project</span></h3>
            <p className="text-gray-600">
              A clean, modern starting point for your next web project.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">Links</h3>
            <ul className="space-y-3">
              <li><a href="/" className="text-gray-600 hover:text-blue-500 transition-colors">Home</a></li>
              <li><a href="#features" className="text-gray-600 hover:text-blue-500 transition-colors">Features</a></li>
              <li><a href="#about" className="text-gray-600 hover:text-blue-500 transition-colors">About</a></li>
              <li><a href="#contact" className="text-gray-600 hover:text-blue-500 transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Documentation</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase text-gray-500 mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">© {currentYear} BlankProject. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-gray-500 hover:text-blue-500 transition-colors">Privacy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-blue-500 transition-colors">Terms</a>
            <a href="#" className="text-sm text-gray-500 hover:text-blue-500 transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
