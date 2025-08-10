'use client';

import { useState } from 'react';

interface DesignSuccessProps {
  designCode: string;
}

export function DesignSuccess({ designCode }: DesignSuccessProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(designCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto text-center">
      {/* Success icon */}
      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Success message */}
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Payment Successful!
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        Thank you for your design application. We've received your payment and will start working on your design soon.
      </p>

      {/* Design code section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your Design Code
        </h3>
        <p className="text-gray-600 mb-4">
          Please save this code for easy reference when contacting us about your design:
        </p>
        
        <div className="flex items-center justify-center space-x-3">
          <div className="bg-white border border-blue-300 rounded-lg px-4 py-3">
            <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
              {designCode}
            </span>
          </div>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {copied ? (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What happens next?
        </h3>
        <div className="space-y-3 text-left">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">Design Review</p>
              <p className="text-sm text-gray-600">Our team will review your requirements and start the design process</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">Initial Draft</p>
              <p className="text-sm text-gray-600">You'll receive the first draft within 3-5 business days</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Revisions</p>
              <p className="text-sm text-gray-600">We'll work with you to perfect the design with up to 3 revisions</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
              4
            </div>
            <div>
              <p className="font-medium text-gray-900">Final Delivery</p>
              <p className="text-sm text-gray-600">You'll receive the final design files in all required formats</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact information */}
      <div className="border-t border-gray-200 pt-6">
        <p className="text-gray-600 mb-4">
          Have questions? Contact us anytime:
        </p>
        <div className="space-y-2">
          <p className="text-blue-600 font-medium">
            Email: hello@stickest.com
          </p>
          <p className="text-gray-600">
            Please include your design code: <span className="font-mono font-medium">{designCode}</span>
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 space-y-4">
        <a
          href="/"
          className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </a>
        <a
          href="/store"
          className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Browse Our Store
        </a>
      </div>
    </div>
  );
}
