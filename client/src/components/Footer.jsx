import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white flex-shrink-0 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">GB</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold">GrievanceBot</h3>
            </div>
            <p className="text-gray-300 mb-4 text-sm sm:text-base leading-relaxed">
              AI-powered government complaint management system. Submit, track, and resolve 
              grievances efficiently with automated categorization and smart prioritization.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                AI Enabled
              </span>
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200">
                24/7 Available
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="col-span-1">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Contact Support</h4>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start space-x-3">
                <Phone size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm sm:text-base break-all">+1-800-GOV-HELP</span>
              </div>
              <div className="flex items-start space-x-3">
                <Mail size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm sm:text-base break-all">support@grievancebot.gov</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm sm:text-base">Government Plaza, City Hall</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h4>
            <div className="space-y-2">
              <a href="/help" className="block text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                Help & FAQs
              </a>
              <a href="/submit-complaint" className="block text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                Submit Complaint
              </a>
              <a href="/my-complaints" className="block text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                Track Complaints
              </a>
              <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm sm:text-base">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-4 sm:mt-6 pt-4 sm:pt-6">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
            <div className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              © 2025 GrievanceBot. All rights reserved. Powered by AI.
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 text-center sm:text-right">
              <span className="text-gray-400 text-xs sm:text-sm">Office Hours: Mon-Fri 9AM-5PM</span>
              <span className="text-gray-400 text-xs sm:text-sm">Emergency: 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
