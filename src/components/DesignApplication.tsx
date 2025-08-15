'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/database';
import type { DesignApplication } from '@/types/database';
import { QuestionRenderer } from './design-application/QuestionRenderer';
import { ReviewSummary } from './design-application/ReviewSummary';
import { PaymentStep } from './design-application/PaymentStep';
import { SuccessStep } from './design-application/SuccessStep';
import { ErrorStep } from './design-application/ErrorStep';
import { WelcomeStep } from './design-application/WelcomeStep';
import type { ApplicationQuestion, ApplicationData } from './design-application/types';

interface DesignApplicationProps {
  product: Product;
  application: DesignApplication;
  questions?: ApplicationQuestion[];
}

export default function DesignApplication({ product, application, questions: initialQuestions = [] }: DesignApplicationProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0); // 0 = welcome
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<ApplicationQuestion[]>(initialQuestions);
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    email: application.email || ''
  });
  const [previews, setPreviews] = useState<Record<string, string[]>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  const [designCode, setDesignCode] = useState<string>(application.design_code);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [customFlowCompletion, setCustomFlowCompletion] = useState<Record<string, boolean>>({});
  const styleQuestionIndex = useMemo(() => {
    return questions.findIndex((q) => q.option_items && Array.isArray(q.option_items) && q.option_items.length > 0 && q.question_text.toLowerCase().includes('style'));
  }, [questions]);

  // Initialize application data with empty values for each question
  useEffect(() => {
    const initialData: ApplicationData = { email: application.email || '' };
    questions.forEach((question: ApplicationQuestion) => {
      initialData[question.id] = '';
    });
    setApplicationData(initialData);
  }, [questions, application.email]);

  const updateApplicationData = (field: string, value: string | File | string[]) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProgress = async () => {
    setIsSaving(true);
    try {
      const answers: { [key: string]: any } = {};
      
      // Build answers object from questions
      questions.forEach(question => {
        const value = applicationData[question.id];
        if (value !== undefined && value !== null && value !== '') {
          answers[question.id] = value;
        }
      });

      const response = await fetch('/api/design-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: application.id,
          answers,
          email: applicationData.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save progress:', errorData);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, questionId: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Only handle a single file even if multiple are somehow provided
    const file = files[0];

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert(`File ${file.name} is too large. File size must be less than 5MB`);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert(`File ${file.name} is not a valid image file. Please upload JPG, PNG, or GIF files only`);
      return;
    }

    // Set uploading state for this question
    setUploadingFiles(prev => ({ ...prev, [questionId]: true }));

    try {
      // Create a local preview immediately for better UX
      const localUrl = URL.createObjectURL(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', application.id);
      formData.append('fileType', questionId === 'styleReferenceImages' ? 'style_reference' : 'question_answer');
      formData.append('questionId', questionId);

      const response = await fetch('/api/upload-design-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Failed to upload ${file.name}: ${errorData.error}`);
        return;
      }

      const { fileUrl } = await response.json();

      // Store the uploaded file URL(s)
      if (questionId === 'styleReferenceImages') {
        // Append to existing array for style references
        const existingFiles = Array.isArray(applicationData[questionId]) ? applicationData[questionId] as string[] : [];
        updateApplicationData(questionId, [...existingFiles, fileUrl]);
      } else {
        updateApplicationData(questionId, fileUrl);
      }

      // Update previews UI: replace for single-upload questions, append for style references
      setPreviews(prev => ({
        ...prev,
        [questionId]: questionId === 'styleReferenceImages' ? [...(prev[questionId] || []), localUrl] : [localUrl],
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload ${file.name}`);
    } finally {
      // Clear uploading state
      setUploadingFiles(prev => ({ ...prev, [questionId]: false }));
      // Clear the input
      event.target.value = '';
    }
  };

  const handleFileRemove = (questionId: string, fileIndex: number) => {
    // Remove the file from previews
    setPreviews(prev => {
      const currentPreviews = prev[questionId] || [];
      const newPreviews = currentPreviews.filter((_, index) => index !== fileIndex);
      return {
        ...prev,
        [questionId]: newPreviews
      };
    });

    // Remove the file from application data
    const currentValue = applicationData[questionId];
    if (Array.isArray(currentValue)) {
      // For array values (like style references), remove the specific index
      const newValue = (currentValue as string[]).filter((_, index) => index !== fileIndex);
      updateApplicationData(questionId, newValue);
    } else {
      // For single file values, clear the entire value
      updateApplicationData(questionId, '');
    }
  };

  // Helper function to check if custom flow is complete (synchronous version)
  const isCustomFlowCompleteSync = (customData: any, templateId: string): boolean => {
    // For now, we'll use a simple check based on the custom data structure
    // This can be enhanced later with cached custom question requirements
    
    if (!customData || typeof customData !== 'object') return false;
    
    // Check if any meaningful data exists (not just 'uploaded' placeholders)
    const hasMeaningfulData = Object.values(customData).some(v => {
      if (typeof v === 'string') {
        return v.trim() !== '' && v.toLowerCase() !== 'uploaded';
      }
      return v !== null && v !== undefined;
    });
    
    // If no meaningful data, check if there are uploaded files for this custom flow
    if (!hasMeaningfulData) {
      const hasUploadedFiles = Object.keys(previews).some(key => 
        key.startsWith(templateId) && previews[key].length > 0
      );
      return hasUploadedFiles;
    }
    
    return true;
  };

  const isNextButtonDisabled = () => {
    if (isSaving) return true;
    
    // Safety check for questions array
    if (!questions || questions.length === 0) return true;
    
    // If a question is recognized as style selection, require a selection
    if (styleQuestionIndex >= 0 && currentStep === styleQuestionIndex + 1) {
      const currentQuestion = questions[styleQuestionIndex];
      if (currentQuestion) {
        const value = applicationData[currentQuestion.id];
        
        // Check if user has selected a predefined style
        if (selectedStyleId) {
          return false; // Allow next if a predefined style is selected
        }
        
        // Check if user has chosen custom option and provided data
        if (typeof value === 'string' && value.trim() !== '') {
          // Check if it's the custom option
          if (value === 'custom') {
            return false; // Allow next if custom option is selected
          }
          // Check if it's custom flow data (JSON)
          try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object') {
              // Check if custom flow is complete (including required file uploads)
              const isComplete = isCustomFlowCompleteSync(parsed, currentQuestion.custom_template_id || '');
              return !isComplete; // Disable next if custom flow is not complete
            }
          } catch {
            // Not JSON, treat as regular string
            return !value.trim(); // Allow next if non-empty string
          }
        }
        
        return true; // Disable next if no selection made
      }
    }
    
    const questionIndex = currentStep - 1;
    if (questionIndex >= 0 && questionIndex < questions.length) {
      const currentQuestion = questions[questionIndex];
      if (currentQuestion) {
        const value = applicationData[currentQuestion.id];
        
        // Email-specific validation regardless of is_required
        if (currentQuestion.question_type === 'email') {
          const email = typeof value === 'string' ? value.trim() : '';
          const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
          return !emailRegex.test(email);
        }
        
        // For file upload questions, always allow skipping (they're typically optional)
        if (currentQuestion.question_type === 'file_upload') {
          return false; // Always allow next for file upload questions
        }
        
        // For optional questions (is_required = false), allow skipping
        if (!currentQuestion.is_required) {
          return false; // Always allow next for optional questions
        }
        
        // For required questions, only enable Next when answered
        if (!value) return true;
        
        // Handle custom flow data (JSON strings)
        if (typeof value === 'string') {
          // Check if it's a JSON string from custom flow
          try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object') {
              // For custom flow data, check if it's complete
              const isComplete = isCustomFlowCompleteSync(parsed, currentQuestion.custom_template_id || '');
              return !isComplete;
            }
          } catch {
            // Not JSON, treat as regular string
          }
          
          // Regular string validation
          return !value.trim();
        }
        
        return false;
      }
    }
    
    return false;
  };

  const nextStep = async () => {
    // From welcome step, just move forward without validations
    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }
    if (currentStep < questions.length + 1) {
      // For style-like question, persist selection as selected_style_id
      if (styleQuestionIndex >= 0 && currentStep === styleQuestionIndex + 1) {
        if (!selectedStyleId) {
          alert('Please select a design style');
          return;
        }
        try {
          await fetch('/api/design-requests', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: application.id, selectedStyleId }),
          });
        } catch {}
        await saveProgress();
        setCurrentStep(currentStep + 1);
        return;
      }
      
      const questionIndex = currentStep - 1;
      if (questionIndex >= 0 && questionIndex < questions.length) {
        const currentQuestion = questions[questionIndex];
        if (currentQuestion && currentQuestion.is_required) {
          const value = applicationData[currentQuestion.id];
          if (!value || (typeof value === 'string' && !value.trim())) {
            alert(`Please answer: ${currentQuestion.question_text}`);
            return;
          }
        }
        // For optional questions, no validation needed - user can skip
      }
      
      // Save progress before moving to next step
      // Persist selection and custom inputs
      await saveProgress();
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Save selected style
      const styleResponse = await fetch('/api/design-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: application.id,
          selectedStyleId: selectedStyleId
        }),
      });

      if (!styleResponse.ok) {
        throw new Error('Failed to save style selection');
      }

      // Final save before submission
      await saveProgress();
      
      // Update status to SUBMITTED
      const response = await fetch('/api/design-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: application.id,
          status: 'SUBMITTED'
        }),
      });

      if (response.ok) {
        setCurrentStep(questions.length + 2); // Move to payment step
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to Review step after last question
  const goToReview = async () => {
    // Persist answers before showing the summary
    await saveProgress();
    setCurrentStep(questions.length + 1);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      // Don't allow Enter on textarea (let users use Shift+Enter for new lines)
      if (event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Safety check for functions
      if (typeof isNextButtonDisabled !== 'function') return;
      
      // Check if the next button should be disabled before proceeding
      if (currentStep < questions.length && isNextButtonDisabled()) {
        return; // Don't proceed if the button would be disabled
      }
      
      // Move to next step or submit based on current step
      if (currentStep < questions.length) {
        if (typeof nextStep === 'function') nextStep();
      } else if (currentStep === questions.length) {
        if (typeof goToReview === 'function') goToReview();
      } else if (currentStep === questions.length + 1) {
        if (typeof handleSubmit === 'function') handleSubmit();
      }
    }
  };

  const handleTextareaKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow Shift+Enter for new lines in textarea
      return;
    }
    
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      // Safety check for functions
      if (typeof isNextButtonDisabled !== 'function' || typeof nextStep !== 'function') return;
      
      // Check if the next button should be disabled before proceeding
      if (isNextButtonDisabled()) {
        return; // Don't proceed if the button would be disabled
      }
      
      nextStep();
    }
  };

  const renderStep = () => {
    // Welcome step at index 0
    if (currentStep === 0) {
      return <WelcomeStep onStart={() => setCurrentStep(1)} />;
    }

    // Question steps (inline style selection when encountering style question)
    const questionIndex = currentStep - 1;
    if (questionIndex >= 0 && questionIndex < questions.length) {
      const question = questions[questionIndex];

      // No special-casing. The style question is rendered via QuestionRenderer using option_items.

      return (
        <div className="step-container">
          <h2 className="step-title">
            {question.question_text}
            {!question.is_required && (
              <span className="optional-tag">(Optional)</span>
            )}
          </h2>
          {question.subtext ? (
            <p className="form-help" style={{ textAlign: 'center', marginTop: 0 }}>{question.subtext}</p>
          ) : null}
          <div className="form-group">
              <QuestionRenderer
              question={question}
              value={applicationData[question.id]}
              updateApplicationData={(field, val) => {
                if (question.question_text.toLowerCase().includes('style') && typeof val === 'string') {
                  const uuidLike = /^[0-9a-fA-F-]{36}$/;
                  if (uuidLike.test(val)) {
                    setSelectedStyleId(val);
                  }
                  updateApplicationData(field, val);
                } else {
                  updateApplicationData(field, val);
                }
              }}
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
              onKeyPress={handleKeyPress}
              onTextareaKeyPress={handleTextareaKeyPress}
              applicationId={application.id}
              getPreviewUrls={(qid) => previews[qid]}
              isUploading={(qid: string) => uploadingFiles[qid] || false}
            />
            {question.question_type === 'file_upload' && (
              <p className="form-help">Accepted formats: JPG, PNG, GIF (Max 5MB)</p>
            )}
            {question.question_type === 'textarea' && (
              <p className="form-help">💡 Press Enter to continue, Shift+Enter for new lines</p>
            )}
            {question.question_type !== 'textarea' && question.question_type !== 'file_upload' && (
              <p className="form-help">💡 Press Enter to continue</p>
            )}
            {!question.is_required && (
              <p className="form-help optional-hint">💡 This question is optional - you can skip it</p>
            )}
          </div>
        </div>
      );
    }

    // Review step
    if (currentStep === questions.length + 1) {
      return (
        <ReviewSummary
          questions={questions}
          getValue={(id) => applicationData[id]}
          getPreviewUrls={(qid) => previews[qid]}
          requestId={application.id}
          selectedStyleName={(() => {
            const q = styleQuestionIndex >= 0 ? questions[styleQuestionIndex] : undefined;
            const it = q?.option_items?.find((i) => i.id === selectedStyleId || i.name === selectedStyleId);
            return it?.name;
          })()}
          customStyleDescription={
            typeof applicationData.customStyleDescription === 'string'
              ? applicationData.customStyleDescription
              : undefined
          }
        />
      );
    }

    // Payment step
    if (currentStep === questions.length + 2) {
      return (
        <PaymentStep
          applicationId={application.id}
          email={applicationData.email || undefined}
          amount={product.price || 2.0}
          isLoading={isLoading}
          onSuccess={() => {
            setPaymentStatus('success');
            setCurrentStep(questions.length + 3);
          }}
          onError={(error) => {
            console.error('Payment error:', error);
            setPaymentStatus('failed');
            setCurrentStep(questions.length + 4);
          }}
        />
      );
    }

    // Success step
    if (currentStep === questions.length + 3) {
      return (
        <SuccessStep
          designCode={designCode}
          productTitle={product.title || ''}
          email={applicationData.email}
          amount={product.price || 2.0}
        />
      );
    }

    // Error step
    if (currentStep === questions.length + 4) {
      return <ErrorStep designCode={designCode} productTitle={product.title || ''} />;
    }

    return null;
  };

  const totalSteps = (questions.length + 2) + 1; // +2 for style+review, +1 for welcome

  return (
    <div className="design-application">
      <div className="container">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="step-content">
          {Object.values(uploadingFiles).some(uploading => uploading) && (
            <div className="upload-overlay">
              <div className="upload-loading">
                <div className="upload-spinner"></div>
                <p>Uploading file...</p>
              </div>
            </div>
          )}
          {renderStep()}
        </div>

        {/* Step Navigation - Now inside container for all steps */}
        <div className="step-navigation">
          <button
            onClick={prevStep}
            disabled={currentStep <= 1 || currentStep > questions.length + 1}
            className="nav-button prev"
          >
            Previous
          </button>
          
          <span className="step-indicator">
            Step {currentStep} of {totalSteps}
            {isSaving && <span className="saving-indicator"> • Saving...</span>}
            {Object.values(uploadingFiles).some(uploading => uploading) && (
              <span className="uploading-indicator"> • Uploading...</span>
            )}
          </span>
          
          {currentStep < questions.length && (
            <button
              onClick={nextStep}
              disabled={isNextButtonDisabled()}
              className="nav-button next"
            >
              {isSaving ? 'Saving...' : 'Next'}
            </button>
          )}
          
          {currentStep === questions.length && (
            <button
              onClick={goToReview}
              disabled={isLoading}
              className="nav-button submit"
            >
              {isLoading ? 'Saving...' : 'Review & Continue'}
            </button>
          )}

          {currentStep === questions.length + 1 && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="nav-button submit"
            >
              {isLoading ? 'Preparing Payment...' : 'Continue to Payment'}
            </button>
          )}
        </div>

        {/* Back to Store */}
        {currentStep <= questions.length && (
          <div className="back-link">
            <button
              onClick={() => router.push(`/store/${product.slug}`)}
              className="back-button"
            >
              ← Back to {product.title}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}