import React from 'react';
import { Mail, Phone, MapPin, Globe, Shield, Clock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="gov-footer flex-shrink-0 w-full">
      <div className="gov-container">
        <div className="gov-footer-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Government Information */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="gov-logo">
                  <span className="text-sm font-bold">PWS</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Public Way Service</h3>
                  <p className="text-sm text-gray-400">Digital Grievance Management System</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                Official Public Way Service platform for citizen complaints and grievance redressal. 
                Submit, track, and resolve public issues through our secure digital portal 
                with transparency and accountability.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium gov-bg-primary text-white">
                  <Shield size={12} className="mr-1" />
                  Secure Platform
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-green-800 text-green-200">
                  <Clock size={12} className="mr-1" />
                  24/7 Available
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-800 text-blue-200">
                  <Globe size={12} className="mr-1" />
                  Digital India
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="col-span-1">
              <h4 className="text-base font-semibold mb-4 text-white">Contact Support</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Phone size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-300 text-sm">Toll Free</p>
                    <p className="text-white text-sm font-medium">1800-XXX-XXXX</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-300 text-sm">Email Support</p>
                    <p className="text-white text-sm font-medium">grievances@gov.in</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-300 text-sm">Office Address</p>
                    <p className="text-white text-sm">Secretariat, Government Complex</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access Links */}
            <div className="col-span-1">
              <h4 className="text-base font-semibold mb-4 text-white">Quick Access</h4>
              <div className="space-y-2">
                <a href="/help" className="block text-gray-300 hover:text-white text-sm">
                  Help & Guidelines
                </a>
                <a href="/submit-complaint" className="block text-gray-300 hover:text-white text-sm">
                  File Complaint
                </a>
                <a href="/my-complaints" className="block text-gray-300 hover:text-white text-sm">
                  Track Status
                </a>
                <a href="/privacy-policy" className="block text-gray-300 hover:text-white text-sm">
                  Privacy Policy
                </a>
                <a href="/terms-service" className="block text-gray-300 hover:text-white text-sm">
                  Terms of Service
                </a>
                <a href="/accessibility" className="block text-gray-300 hover:text-white text-sm">
                  Accessibility
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Government Footer Bottom */}
        <div className="gov-footer-bottom">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
            <div className="text-gray-400 text-sm">
              © 2025 Public Way Service. All rights reserved. | Version 2.0
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              <span className="text-gray-400">Office Hours: Mon-Fri 9:00 AM - 6:00 PM</span>
              <span className="text-gray-400">Emergency Support: 24/7</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800 text-center">
            <p className="text-xs text-gray-500">
              Best viewed in latest versions of Chrome, Firefox, Safari, and Edge browsers.
              This is an official Government of [State/Country] website.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;