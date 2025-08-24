'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/database';
import type { DesignApplication } from '@/types/database';
import { QuestionRenderer } from './design-application/QuestionRenderer';
import { ReviewSummary } from './design-application/ReviewSummary';
import HowDidYouHear from './design-application/HowDidYouHear';
import { PaymentStep } from './design-application/PaymentStep';
import { SuccessStep } from './design-application/SuccessStep';
import { ErrorStep } from './design-application/ErrorStep';
import { WelcomeStep } from './design-application/WelcomeStep';
import type { ApplicationQuestion, ApplicationData } from './design-application/types';
import { supabase } from '@/lib/supabase/client';

// Configurable max upload size for client-side checks (in MB)
const CLIENT_MAX_UPLOAD_SIZE_MB = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || '50', 10);
const CLIENT_MAX_UPLOAD_SIZE = CLIENT_MAX_UPLOAD_SIZE_MB * 1024 * 1024;

interface DesignApplicationProps {
  product: Product;
  application: DesignApplication;
  questions?: ApplicationQuestion[];
}

export default function DesignApplication({ product, application, questions: initialQuestions = [] }: DesignApplicationProps) {
  // Error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Error handler
  const handleError = (error: Error, errorInfo: any) => {
    console.error('DesignApplication: Error caught:', error, errorInfo);
    setHasError(true);
    setErrorDetails(error.message);
  };

  // If there's an error, show error UI
  if (hasError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Something went wrong</h1>
        <p>We encountered an error while rendering the design application.</p>
        <p>Error: {errorDetails}</p>
        <button 
          onClick={() => {
            setHasError(false);
            setErrorDetails('');
            window.location.reload();
          }}
          style={{ padding: '0.5rem 1rem', margin: '1rem' }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0); // 0 = welcome
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSnapshots, setSaveSnapshots] = useState<Array<any>>([]);
  const [questions, setQuestions] = useState<ApplicationQuestion[]>(initialQuestions);
  const storageKey = `design_application:${application.id}`;

  // Safety check to prevent hydration issues
  if (!application || !product) {
    console.error('DesignApplication: Missing required props:', { application, product });
    return <div>Loading...</div>;
  }

  // Additional safety check for questions
  if (!Array.isArray(questions)) {
    console.error('DesignApplication: Questions is not an array:', questions);
    return <div>Error: Invalid question data</div>;
  }

  // Validate each question has required fields
  const invalidQuestions = questions.filter(q => !q || !q.id || !q.question_text || !q.question_type);
  if (invalidQuestions.length > 0) {
    console.error('DesignApplication: Found invalid questions:', invalidQuestions);
    return <div>Error: Some questions are missing required data</div>;
  }

  const [applicationData, setApplicationData] = useState<ApplicationData>({ 
    email: application.email || '', 
    howDidYouHear: [] // Initialize as empty array immediately
  } as ApplicationData);
  
    // Initialize application data from localStorage after component mounts
    useEffect(() => {
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw || '{}');
            const data = { ...(parsed as ApplicationData), email: application.email || '' } as ApplicationData;
            
            // Ensure howDidYouHear is always an array to prevent .includes() errors
            if (!Array.isArray((data as any).howDidYouHear)) {
              console.warn('DesignApplication: howDidYouHear was not an array, fixing:', (data as any).howDidYouHear);
              (data as any).howDidYouHear = [];
            }
            
            // Additional safety check: ensure all checkbox questions have array values
            questions.forEach((question: ApplicationQuestion) => {
              if (question.question_type === 'checkboxes') {
                const existingValue = (data as any)[question.id];
                if (!Array.isArray(existingValue)) {
                  console.warn('DesignApplication: localStorage had non-array value for checkbox question, fixing:', {
                    questionId: question.id,
                    value: existingValue
                  });
                  (data as any)[question.id] = [];
                }
              }
            });
            
            console.log('DesignApplication: Loaded and sanitized localStorage data:', {
              keys: Object.keys(data),
              checkboxValues: questions.filter(q => q.question_type === 'checkboxes').map(q => ({
                questionId: q.id,
                value: (data as any)[q.id],
                isArray: Array.isArray((data as any)[q.id])
              }))
            });
            
            setApplicationData(data);
          }
        }
      } catch (e) {
        console.error('DesignApplication: Error parsing localStorage data:', e);
        // Initialize with safe defaults - preserve the howDidYouHear array
        setApplicationData(prev => ({ 
          ...prev, 
          email: application.email || '',
          howDidYouHear: prev.howDidYouHear || [] // Keep existing array or use empty array
        } as ApplicationData));
      }
    }, [storageKey, application.email]);


    const [previews, setPreviews] = useState<Record<string, string[]>>({});
    const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
    // selections are stored in applicationData[question.id] (prefer stable IDs when provided)
    const [designCode, setDesignCode] = useState<string>(application.design_code);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const [customFlowCompletion, setCustomFlowCompletion] = useState<Record<string, boolean>>({});
    // Find the first question that has option_items from a design-style-like source.
    // The API now returns `option_source_type` per question (e.g. 'design_styles', 'question_demo_items').
    const styleQuestionIndex = useMemo(() => {
      return questions.findIndex((q) => q.option_items && Array.isArray(q.option_items) && q.option_items.length > 0 && (q as any).option_source_type === 'design_styles');
    }, [questions]);

    // Initialize application data with empty values for each question
    useEffect(() => {
      // Only seed missing keys so we don't clobber user-entered answers when questions change
      setApplicationData((prev) => {
        const next: ApplicationData = { ...(prev ?? {}), email: application.email || '' } as ApplicationData;
        
        console.log('DesignApplication: Initializing application data for questions:', {
          questionsCount: questions.length,
          questionTypes: questions.map(q => ({ id: q.id, type: q.question_type, text: q.question_text })),
          existingKeys: Object.keys(prev || {}),
          email: application.email
        });
        
        questions.forEach((question: ApplicationQuestion) => {
          if (!(question.id in next)) {
            // Initialize checkbox questions with empty arrays to prevent .includes() errors
            if (question.question_type === 'checkboxes') {
              next[question.id] = [];
              console.log('DesignApplication: Initialized checkbox question with empty array:', question.id);
            } else {
              next[question.id] = '';
              console.log('DesignApplication: Initialized non-checkbox question with empty string:', question.id);
            }
          } else {
            console.log('DesignApplication: Question already has value:', {
              questionId: question.id,
              questionType: question.question_type,
              existingValue: next[question.id],
              isArray: Array.isArray(next[question.id])
            });
          }
        });
        // Initialize the global howDidYouHear as an empty array if not present
        if (!('howDidYouHear' in next)) {
          (next as any).howDidYouHear = [];
        }
        // Ensure howDidYouHear is always an array to prevent .includes() errors
        if (!Array.isArray((next as any).howDidYouHear)) {
          console.warn('DesignApplication: howDidYouHear was not an array during initialization, fixing:', (next as any).howDidYouHear);
          (next as any).howDidYouHear = [];
        }
        
        console.log('DesignApplication: Final application data state:', {
          keys: Object.keys(next),
          checkboxValues: questions.filter(q => q.question_type === 'checkboxes').map(q => ({
            questionId: q.id,
            value: next[q.id],
            isArray: Array.isArray(next[q.id])
          }))
        });
        
        return next;
      });
    }, [questions, application.email]);

    // Additional safety check to ensure howDidYouHear is always an array
    useEffect(() => {
      setApplicationData((prev) => {
        if (!Array.isArray((prev as any).howDidYouHear)) {
          console.warn('DesignApplication: howDidYouHear was not an array in safety check, fixing:', (prev as any).howDidYouHear);
          return { ...prev, howDidYouHear: [] } as ApplicationData;
        }
        return prev;
      });
    }, []);

    // Safety check to ensure applicationData is properly initialized
    useEffect(() => {
      if (!applicationData || typeof applicationData !== 'object') {
        console.error('DesignApplication: applicationData is invalid:', applicationData);
        return;
      }
      
      // Ensure all checkbox questions have array values
      questions.forEach((question: ApplicationQuestion) => {
        if (question.question_type === 'checkboxes') {
          const value = (applicationData as any)[question.id];
          if (!Array.isArray(value)) {
            console.warn('DesignApplication: Checkbox question missing array value, fixing:', {
              questionId: question.id,
              value: value
            });
            setApplicationData(prev => ({
              ...prev,
              [question.id]: []
            } as ApplicationData));
          }
        }
      });
    }, [applicationData, questions]);

    // Debounced autosave of partial answers to localStorage
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const t = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(applicationData));
        } catch (e) {
          // ignore quota or serialization errors
        }
      }, 400);
      return () => clearTimeout(t);
    }, [applicationData, storageKey]);

    const updateApplicationData = (field: string, value: string | File | string[]) => {
      setApplicationData(prev => {
        const next = {
          ...prev,
          [field]: value
        };
        
        // Special handling for howDidYouHear to ensure it's always an array
        if (field === 'howDidYouHear') {
          if (!Array.isArray(value)) {
            console.warn('DesignApplication: Attempted to set howDidYouHear to non-array value, fixing:', value);
            (next as any).howDidYouHear = [];
          } else {
            (next as any).howDidYouHear = value;
          }
        }
        
        // Special handling for checkbox questions to ensure they're always arrays
        const question = questions.find(q => q.id === field);
        if (question && question.question_type === 'checkboxes') {
          if (!Array.isArray(value)) {
            console.warn('DesignApplication: Attempted to set checkbox question to non-array value, fixing:', value);
            next[field] = [];
          }
        }
        
        // Additional safety check to ensure howDidYouHear is never undefined
        if (!Array.isArray((next as any).howDidYouHear)) {
          console.warn('DesignApplication: howDidYouHear became undefined/null, fixing:', (next as any).howDidYouHear);
          (next as any).howDidYouHear = [];
        }
        
        return next;
      });
    };

    const saveProgress = async () => {
      setIsSaving(true);
      try {
        const answers: { [key: string]: any } = {};

        // Build answers object from all applicationData entries.
        // This ensures namespaced keys produced by custom flows (e.g. `${question.id}:${templateId}`)
        // are included so independent custom templates do not collide when saved.
        Object.entries(applicationData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            answers[key] = value;
          }
        });
        // Include the global HowDidYouHear answer under a stable key
        if (Array.isArray(applicationData.howDidYouHear) && applicationData.howDidYouHear.length > 0) {
          answers['how_did_you_hear'] = applicationData.howDidYouHear;
        } else if (!Array.isArray(applicationData.howDidYouHear)) {
          console.warn('DesignApplication: howDidYouHear not an array in saveProgress, fixing:', applicationData.howDidYouHear);
          // Fix the data structure before saving
          setApplicationData(prev => ({ ...prev, howDidYouHear: [] } as ApplicationData));
          // Don't include in answers since it's empty
        }

        // Special handling for email questions - ensure email is always sent
        let emailToSend = applicationData.email;
        
        // If we have answers and one of them is an email question, extract the email
        if (Object.keys(answers).length > 0) {
          // Find the email question ID from the questions array
          const emailQuestion = questions.find(q => q.question_type === 'email');
          if (emailQuestion && answers[emailQuestion.id]) {
            emailToSend = answers[emailQuestion.id];
            console.log('📧 Found email in answers:', emailToSend);
            
            // Update the frontend state with the email so validation works
            if (emailToSend !== applicationData.email) {
              setApplicationData(prev => ({ ...prev, email: emailToSend }));
              console.log('📧 Updated applicationData.email to:', emailToSend);
            }
          }
        }

        const response = await fetch('/api/design-requests', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId: application.id,
            answers,
            email: emailToSend
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to save progress:', errorData);
        }
        // capture a debug snapshot of what we attempted to save
        try {
          const snapshot = {
            requestId: application.id,
            timestamp: new Date().toISOString(),
            answers,
            email: emailToSend
          };
          // keep in-memory history since application started
          setSaveSnapshots(prev => [...prev, snapshot]);
          // also POST to debug endpoint so server logs contain the snapshot
          fetch('/api/debug/save-snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(snapshot)
          }).catch((e) => console.warn('Failed to send debug snapshot', e));
          // client debug log
          console.debug('Saved progress snapshot', snapshot);
        } catch (e) {
          console.warn('Failed to capture save snapshot', e);
        }
      } catch (error) {
        console.error('Error saving progress:', error);
      } finally {
        setIsSaving(false);
      }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, questionId: string): Promise<string | undefined> => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      // Only handle a single file even if multiple are somehow provided
      const file = files[0];

      // Validate file size (configurable client-side limit)
      if (file.size > CLIENT_MAX_UPLOAD_SIZE) {
        alert(`File ${file.name} is too large. File size must be less than ${CLIENT_MAX_UPLOAD_SIZE_MB}MB`);
        return;
      }

      // Validate file type
      // Accept common web image types plus iPhone HEIC/HEIF variants. Some iPhones produce HEIC/HEIF images
      // which have MIME types like image/heic or image/heif; reject only clearly non-image files here.
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/heic',
        'image/heif',
        'image/heif-sequence',
        'image/heic-sequence',
      ];

      // Some browsers may report no specific subtype; allow any image/* as a fallback.
      const isImageType = file.type.startsWith('image/');

      if (!isImageType || (!Array.isArray(allowedTypes) || !allowedTypes.includes(file.type)) && !file.type.startsWith('image/')) {
        alert(`File ${file.name} is not a valid image file. Please upload JPG, PNG, GIF, or HEIC/HEIF files.`);
        return;
      }

      // Set uploading state for this question
      setUploadingFiles(prev => ({ ...prev, [questionId]: true }));

      try {
        // Create a local preview immediately for better UX
        const localUrl = URL.createObjectURL(file);

        // Try server-side upload API first, fallback to client-side if it fails
        let fileUrl: string;
        
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('applicationId', application.id);
          formData.append('fileType', questionId);
          formData.append('questionId', questionId);

          const uploadResponse = await fetch('/api/upload-design-file', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            fileUrl = uploadResult.fileUrl;
            console.log('Server-side upload successful:', fileUrl);
          } else {
            // Server-side upload failed, try client-side as fallback
            console.warn('Server-side upload failed, trying client-side fallback...');
            throw new Error('Server-side upload failed');
          }
        } catch (error) {
          console.log('Falling back to client-side upload...');
          
          // Client-side upload fallback
          const fileExt = file.name.split('.').pop();
          const remotePath = `${application.id}/${questionId}/${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('design-files')
            .upload(remotePath, file, { cacheControl: '3600', upsert: false });

                 if (uploadError) {
           console.error('Client-side upload error:', uploadError);
           
           // Check if it's an RLS policy issue
           if (uploadError.message && typeof uploadError.message === 'string' && uploadError.message.includes('row-level security policy')) {
             alert(`Upload failed: Storage policies require authentication. Please contact support to configure anonymous uploads.`);
           } else {
             alert(`Failed to upload ${file.name}: ${uploadError.message || JSON.stringify(uploadError)}`);
           }
           return;
         }

        const { data: urlData } = supabase.storage.from('design-files').getPublicUrl(remotePath);
        fileUrl = urlData.publicUrl;
        console.log('Client-side upload successful:', fileUrl);
      }

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
      
      console.log(`Successfully uploaded ${file.name} to ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Fallback: Store file locally and show warning
      const localUrl = URL.createObjectURL(file);
      const warningMessage = `File upload failed, but ${file.name} has been stored locally for your design application. You can continue with your application, but the file will not be permanently stored.`;
      
      alert(warningMessage);
      console.warn(warningMessage);
      
      // Store the local URL in application data as a fallback
      if (questionId === 'styleReferenceImages') {
        const existingFiles = Array.isArray(applicationData[questionId]) ? applicationData[questionId] as string[] : [];
        updateApplicationData(questionId, [...existingFiles, localUrl]);
      } else {
        updateApplicationData(questionId, localUrl);
      }
      
      // Update previews UI
      setPreviews(prev => ({
        ...prev,
        [questionId]: questionId === 'styleReferenceImages' ? [...(prev[questionId] || []), localUrl] : [localUrl],
      }));
      
      return localUrl; // Return local URL as fallback
    } finally {
      // Clear uploading state by removing the key so the overlay can't linger.
      setUploadingFiles(prev => {
        const next = { ...prev } as Record<string, boolean>;
        try {
          delete next[questionId];
        } catch (e) {
          // ignore
        }
        return next;
      });
      // Clear the input
      try { event.target.value = ''; } catch (e) { /* ignore */ }
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
    
    if (!customData || typeof customData !== 'object') {
      console.warn('DesignApplication: Invalid customData in isCustomFlowCompleteSync:', customData);
      return false;
    }
    
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
        key && key.startsWith(templateId) && Array.isArray(previews[key]) && previews[key].length > 0
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
    const selectedForThis = value && typeof value === 'string' ? value : '';

      // Check if user has selected a predefined style or custom option
      if (selectedForThis || (typeof value === 'string' && value.trim() === 'custom')) {
              return false; // Allow next if a predefined style or custom option is selected
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

    // If we're on the extra 'how did you hear' step (placed after questions), require at least one selection
    if (currentStep === questions.length + 1) {
      const v = (applicationData as any).howDidYouHear;
      // Safety check to ensure howDidYouHear is an array before calling .length
      if (!Array.isArray(v)) {
        console.warn('DesignApplication: howDidYouHear is not an array in isNextButtonDisabled:', v);
        // Auto-fix and continue
        setApplicationData(prev => ({ ...prev, howDidYouHear: [] } as ApplicationData));
        return true; // Disable next if howDidYouHear is not an array
      }
      return v.length === 0;
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
        const q = questions[styleQuestionIndex];
        const selectedForThis = q ? applicationData[q.id] : '';
        if (!selectedForThis) {
          alert('Please select a design style');
          return;
        }
        // Persist via saveProgress (answers in applicationData) and advance
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
  // Final save before submission (selected style(s) are included in applicationData answers)
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
  setCurrentStep(questions.length + 3); // Move to payment step
  try { if (typeof window !== 'undefined') localStorage.removeItem(storageKey); } catch (e) { /* ignore */ }
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
  // After last question, next is the how-did-you-hear step at questions.length + 1; goToReview should move to review which is +2
  setCurrentStep(questions.length + 2);
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
        // if we're on the last question, pressing Enter should advance to how-did-you-hear
        if (typeof nextStep === 'function') nextStep();
      } else if (currentStep === questions.length + 1) {
        // On how-did-you-hear, Enter should go to review
        if (typeof goToReview === 'function') goToReview();
      } else if (currentStep === questions.length + 2) {
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
              value={(() => {
                // Ensure checkbox questions always have an array value to prevent .includes() errors
                const val = applicationData[question.id];
                
                // Add logging for debugging
                if (question.question_type === 'checkboxes') {
                  console.log('DesignApplication: Rendering checkbox question:', {
                    questionId: question.id,
                    questionText: question.question_text,
                    value: val,
                    isArray: Array.isArray(val),
                    applicationDataKeys: Object.keys(applicationData)
                  });
                  
                  if (!Array.isArray(val)) {
                    console.warn('DesignApplication: Checkbox question has non-array value, fixing:', val);
                  }
                  
                  return Array.isArray(val) ? val : [];
                }
                
                // For other question types, return the value as-is
                return val;
              })()}
              updateApplicationData={(field, val) => {
                // If this question's source is a design-style (or similar), we store selection in applicationData
                // prefer stable ids when available; QuestionRenderer already sends id when available
                updateApplicationData(field, val);
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
    // Insert HowDidYouHear step at index questions.length + 1 (after all questions)
    if (currentStep === questions.length + 1) {
      // Safety check to ensure howDidYouHear is always an array
      let howDidYouHearValue = (applicationData as any).howDidYouHear;
      
      // Multiple layers of safety
      if (!Array.isArray(howDidYouHearValue)) {
        console.warn('DesignApplication: howDidYouHear not an array in renderStep, fixing:', howDidYouHearValue);
        // Fix it immediately
        setApplicationData(prev => ({ ...prev, howDidYouHear: [] } as ApplicationData));
        howDidYouHearValue = [];
      }
      
      // Additional logging for debugging
      if (!Array.isArray(applicationData.howDidYouHear)) {
        console.warn('DesignApplication: howDidYouHear not an array in renderStep, fixing:', applicationData.howDidYouHear);
      }
      
      return (
        <HowDidYouHear
          value={howDidYouHearValue}
          onChange={(vals) => updateApplicationData('howDidYouHear', vals)}
        />
      );
    }

    if (currentStep === questions.length + 2) {
      return (
        <ReviewSummary
          questions={questions}
          getValue={(id) => applicationData[id]}
          getPreviewUrls={(qid) => previews[qid]}
          requestId={application.id}
          selectedStyleName={(() => {
            const q = styleQuestionIndex >= 0 ? questions[styleQuestionIndex] : undefined;
            const sel = q ? (applicationData[q.id] || '') : '';
            const it = q?.option_items?.find((i) => i.id === sel || i.name === sel);
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
    if (currentStep === questions.length + 3) {
      return (
        <PaymentStep
          applicationId={application.id}
          email={applicationData.email}
          amount={product.price || 2.0}
          isLoading={isLoading}
          onSuccess={() => {
            setPaymentStatus('success');
            // Advance to success step
            setCurrentStep(questions.length + 4);
          }}
          onError={(error) => {
            console.error('Payment error:', error);
            setPaymentStatus('failed');
            // Advance to error step
            setCurrentStep(questions.length + 5);
          }}
        />
      );
    }

    // Success step
    if (currentStep === questions.length + 4) {
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
    if (currentStep === questions.length + 5) {
      return <ErrorStep designCode={designCode} productTitle={product.title || ''} />;
    }

    return null;
  };

  // steps: 0=welcome, 1..questionsLength = questions, questions.length+1 = howDidYouHear, +2 = review, +3 payment, +4 success, +5 error
  const totalSteps = (questions.length + 4) + 1; // +4 for how-did-you-hear + review + payment + success/error, +1 welcome

  // Data validation function to help debug issues
  const validateDataStructure = () => {
    const issues: string[] = [];
    
    // Check questions array
    if (!Array.isArray(questions)) {
      issues.push(`Questions is not an array: ${typeof questions}`);
    }
    
    // Check applicationData structure
    if (!applicationData || typeof applicationData !== 'object') {
      issues.push(`ApplicationData is invalid: ${typeof applicationData}`);
    } else {
      // Check howDidYouHear specifically
      if (!Array.isArray((applicationData as any).howDidYouHear)) {
        issues.push(`howDidYouHear is not an array: ${typeof (applicationData as any).howDidYouHear}`);
        
        // Auto-fix the issue immediately
        console.warn('DesignApplication: Auto-fixing howDidYouHear from undefined to empty array');
        setApplicationData(prev => ({ ...prev, howDidYouHear: [] } as ApplicationData));
      }
      
      // Check other critical fields
      questions.forEach((q, index) => {
        const value = applicationData[q.id];
        if (q.question_type === 'checkboxes' && !Array.isArray(value) && value !== undefined && value !== null && value !== '') {
          issues.push(`Question ${index} (${q.id}) should be array but is: ${typeof value}`);
        }
      });
    }
    
    if (issues.length > 0) {
      console.warn('DesignApplication: Data structure validation issues:', issues);
    }
    
    return issues.length === 0;
  };

  // Run validation on mount and when data changes
  useEffect(() => {
    validateDataStructure();
  }, [questions, applicationData]);

  // Additional safety check that runs on every render
  useEffect(() => {
    // Ensure howDidYouHear is always an array on every render
    if (!Array.isArray((applicationData as any).howDidYouHear)) {
      console.warn('DesignApplication: howDidYouHear validation failed on render, fixing:', (applicationData as any).howDidYouHear);
      setApplicationData(prev => ({ ...prev, howDidYouHear: [] } as ApplicationData));
    }
  });

  // Comprehensive safety check and logging
  useEffect(() => {
    console.log('DesignApplication: Component state check:', {
      hasApplication: !!application,
      hasProduct: !!product,
      questionsCount: questions?.length || 0,
      applicationDataKeys: Object.keys(applicationData || {}),
      applicationDataTypes: Object.entries(applicationData || {}).map(([key, value]) => ({
        key,
        type: typeof value,
        isArray: Array.isArray(value),
        value: value
      }))
    });

    // Validate all data structures
    if (!application || !product) {
      console.error('DesignApplication: Critical props missing');
      return;
    }

    if (!Array.isArray(questions)) {
      console.error('DesignApplication: Questions not an array');
      return;
    }

    // Check each question
    questions.forEach((question, index) => {
      if (!question) {
        console.error('DesignApplication: Question is null/undefined at index:', index);
        return;
      }

      console.log('DesignApplication: Question validation:', {
        index,
        id: question.id,
        type: question.question_type,
        text: question.question_text,
        hasOptions: Array.isArray(question.option_items),
        optionsCount: question.option_items?.length || 0
      });

      // Validate checkbox questions specifically
      if (question.question_type === 'checkboxes') {
        const value = (applicationData as any)[question.id];
        console.log('DesignApplication: Checkbox question value:', {
          questionId: question.id,
          value: value,
          isArray: Array.isArray(value),
          type: typeof value
        });

        if (!Array.isArray(value)) {
          console.error('DesignApplication: Checkbox question has non-array value:', {
            questionId: question.id,
            value: value,
            type: typeof value
          });
        }
      }
    });
  }, [application, product, questions, applicationData]);

  // Global error handler to catch any remaining includes() errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.error && event.error.message && event.error.message.includes('Cannot read properties of null (reading \'includes\')')) {
        console.error('DesignApplication: Caught global includes() error:', event.error);
        handleError(event.error, {});
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && event.reason.message.includes('Cannot read properties of null (reading \'includes\')')) {
        console.error('DesignApplication: Caught unhandled promise rejection with includes() error:', event.reason);
        handleError(event.reason, {});
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
        <div className="step-navigation-container">
          <div className="step-navigation">
          <button
            onClick={prevStep}
            disabled={currentStep <= 1}
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
          {/* When on the last question, Next advances to how-did-you-hear */}
          {currentStep === questions.length && (
            <button
              onClick={nextStep}
              disabled={isNextButtonDisabled()}
              className="nav-button next"
            >
              Next
            </button>
          )}

          {/* On how-did-you-hear step, button goes to Review */}
          {currentStep === questions.length + 1 && (
            <button
              onClick={goToReview}
              disabled={isLoading || isNextButtonDisabled()}
              className="nav-button submit"
            >
              {isLoading ? 'Saving...' : 'Review & Continue'}
            </button>
          )}

          {/* On review step, continue to payment */}
          {currentStep === questions.length + 2 && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="nav-button submit"
            >
              {isLoading ? 'Preparing Payment...' : 'Continue to Payment'}
            </button>
          )}
          </div>
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