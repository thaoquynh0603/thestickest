'use client';

import { useState, useEffect } from 'react';
import { DesignApplicationData } from '@/app/design/page';

interface DesignQuizProps {
  onComplete: (data: DesignApplicationData) => void;
  initialData: DesignApplicationData;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'boolean' | 'multiple_choice' | 'file_upload';
  options?: string[];
  required: boolean;
}

const questions: Question[] = [
  {
    id: 'email',
    text: 'Email - make sure it\'s correct since it\'s how we interact with you',
    type: 'text',
    required: true,
  },
  {
    id: 'designDescription',
    text: 'What do you want to design?',
    type: 'text',
    required: true,
  },
  {
    id: 'hasReferenceImage',
    text: 'Do you have a reference image?',
    type: 'boolean',
    required: true,
  },
  {
    id: 'stylePreference',
    text: 'What style do you want?',
    type: 'multiple_choice',
    options: ['Minimalist', 'Vintage', 'Modern', 'Cute', 'Professional', 'Artistic'],
    required: true,
  },
  {
    id: 'shapePreference',
    text: 'What shape do you like?',
    type: 'multiple_choice',
    options: ['Circle', 'Square', 'Rectangle', 'Hexagon', 'Custom'],
    required: true,
  },
  {
    id: 'additionalDetails',
    text: 'Any more details you want to add?',
    type: 'text',
    required: false,
  },
];

export function DesignQuiz({ onComplete, initialData }: DesignQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<DesignApplicationData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (value: string | boolean) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save application to database
      const response = await fetch('/api/design-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),
      });

      if (response.ok) {
        onComplete(answers);
      } else {
        console.error('Failed to save application');
      }
    } catch (error) {
      console.error('Error saving application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAnswerValid = () => {
    const currentAnswer = answers[currentQuestion.id as keyof DesignApplicationData];
    if (currentQuestion.required) {
      if (currentQuestion.type === 'boolean') {
        return currentAnswer !== undefined;
      }
      return currentAnswer && String(currentAnswer).trim() !== '';
    }
    return true;
  };

  const renderQuestion = () => {
    const currentAnswer = answers[currentQuestion.id as keyof DesignApplicationData];

    switch (currentQuestion.type) {
      case 'text':
        return (
          <textarea
            value={String(currentAnswer || '')}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Type your answer here..."
          />
        );

      case 'boolean':
        return (
          <div className="space-y-3">
            <button
              onClick={() => handleAnswer(true)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                currentAnswer === true
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              Yes, I have a reference image
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                currentAnswer === false
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              No, I don't have a reference image
            </button>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                  currentAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      {/* Question counter */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {currentQuestion.text}
        </h2>
        {renderQuestion()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!isAnswerValid() || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : currentQuestionIndex === questions.length - 1 ? (
            'Complete'
          ) : (
            'Next'
          )}
        </button>
      </div>
    </div>
  );
}
