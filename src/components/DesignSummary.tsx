'use client';

import { DesignApplicationData } from '@/app/design/page';

interface DesignSummaryProps {
  data: DesignApplicationData;
  onProceed: () => void;
  onEdit: () => void;
}

export function DesignSummary({ data, onProceed, onEdit }: DesignSummaryProps) {
  const formatAnswer = (key: keyof DesignApplicationData, value: any) => {
    if (key === 'hasReferenceImage') {
      return value ? 'Yes' : 'No';
    }
    if (key === 'additionalDetails' && !value) {
      return 'None provided';
    }
    return value || 'Not provided';
  };

  const summaryItems = [
    { key: 'email', label: 'Email', value: data.email },
    { key: 'designDescription', label: 'Design Description', value: data.designDescription },
    { key: 'hasReferenceImage', label: 'Reference Image', value: data.hasReferenceImage },
    { key: 'stylePreference', label: 'Style Preference', value: data.stylePreference },
    { key: 'shapePreference', label: 'Shape Preference', value: data.shapePreference },
    { key: 'additionalDetails', label: 'Additional Details', value: data.additionalDetails },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Review Your Application
        </h2>
        <p className="text-gray-600">
          Please review your design application before proceeding to payment
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {summaryItems.map((item) => (
          <div key={item.key} className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {item.label}
                </h3>
                <p className="text-gray-600 break-words">
                  {formatAnswer(item.key as keyof DesignApplicationData, item.value)}
                </p>
              </div>
              <button
                onClick={onEdit}
                className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing information */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pricing
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Custom Design Service</span>
            <span className="font-semibold">$49.99</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Processing Fee</span>
            <span className="font-semibold">$2.50</span>
          </div>
          <div className="border-t border-gray-300 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-blue-600">$52.49</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onEdit}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Edit Application
        </button>
        <button
          onClick={onProceed}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Proceed with Application
        </button>
      </div>

      {/* Terms and conditions */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          By proceeding, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
