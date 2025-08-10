'use client';

import { useState } from 'react';
import { DesignQuiz } from '@/components/DesignQuiz';
import { DesignSummary } from '@/components/DesignSummary';
import { PaymentGateway } from '@/components/PaymentGateway';
import { DesignSuccess } from '@/components/DesignSuccess';

export type DesignApplicationData = {
  email: string;
  designDescription: string;
  hasReferenceImage: boolean;
  referenceImageUrl?: string;
  stylePreference: string;
  shapePreference: string;
  additionalDetails?: string;
};

export type ApplicationStep = 'quiz' | 'summary' | 'payment' | 'success';

export default function DesignPage() {
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('quiz');
  const [applicationData, setApplicationData] = useState<DesignApplicationData>({
    email: '',
    designDescription: '',
    hasReferenceImage: false,
    stylePreference: '',
    shapePreference: '',
  });
  const [designCode, setDesignCode] = useState<string>('');

  const handleQuizComplete = (data: DesignApplicationData) => {
    setApplicationData(data);
    setCurrentStep('summary');
  };

  const handleSummaryProceed = () => {
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = (code: string) => {
    setDesignCode(code);
    setCurrentStep('success');
  };

  const handlePaymentFailure = () => {
    // Handle payment failure - could show error message or redirect
    console.log('Payment failed');
  };

  const handleEditApplication = () => {
    setCurrentStep('quiz');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Design Your Sticker
          </h1>
          <p className="text-lg text-gray-600">
            Let's create something amazing together
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['quiz', 'summary', 'payment', 'success'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step
                      ? 'bg-blue-600 text-white'
                      : index < ['quiz', 'summary', 'payment', 'success'].indexOf(currentStep)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      index < ['quiz', 'summary', 'payment', 'success'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        {currentStep === 'quiz' && (
          <DesignQuiz onComplete={handleQuizComplete} initialData={applicationData} />
        )}

        {currentStep === 'summary' && (
          <DesignSummary
            data={applicationData}
            onProceed={handleSummaryProceed}
            onEdit={handleEditApplication}
          />
        )}

        {currentStep === 'payment' && (
          <PaymentGateway
            applicationData={applicationData}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
          />
        )}

        {currentStep === 'success' && (
          <DesignSuccess designCode={designCode} />
        )}
      </div>
    </div>
  );
}
