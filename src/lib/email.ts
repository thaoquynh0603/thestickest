import { Resend } from 'resend';

// @ts-ignore - process.env is available in Node.js environment (API routes)
const resend = new Resend(process.env.RESEND_API_KEY || '');

export interface EmailData {
  designCode: string;
  customerEmail: string;
  customerName?: string;
  productTitle: string;
  amount: number;
  discountCode?: string;
  discountAmount?: number;
  paymentMethod: string;
  requestId: string;
  applicationDetails?: Record<string, any>;
  questions?: Array<{
    id: string;
    question_text: string;
    question_type: string;
    option_items?: Array<{ id: string; name: string }>;
  }>;
}

export interface AdminEmailData {
  designCode: string;
  customerEmail: string;
  customerName?: string;
  productTitle: string;
  amount: number;
  discountCode?: string;
  discountAmount?: number;
  paymentMethod: string;
  requestId: string;
  customerAnswers?: Record<string, any>;
  applicationDetails?: Record<string, any>;
  questions?: Array<{
    id: string;
    question_text: string;
    question_type: string;
    option_items?: Array<{ id: string; name: string }>;
  }>;
}

// Helper functions for processing application details
const isUrl = (s: string) => /^https?:\/\//i.test(s);

// Helper to map UUID to human-readable name based on question type and option items
const mapAnswerToDisplayName = (answer: any, question: any): string => {
  if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
    return 'Not provided';
  }

  // Handle file uploads
  if (question.question_type === 'file_upload') {
    if (typeof answer === 'string' && isUrl(answer)) {
      return `Image uploaded: ${answer}`;
    }
    if (answer && typeof answer === 'object' && answer.answer_file_url) {
      return `Image uploaded: ${answer.answer_file_url}`;
    }
    if (answer && typeof answer === 'object' && answer.answer_text && isUrl(answer.answer_text)) {
      return `Image uploaded: ${answer.answer_text}`;
    }
    return 'No file uploaded';
  }

  // Handle multiple choice questions with option mapping
  if (question.question_type === 'multiple_choice' && question.option_items && question.option_items.length > 0) {
    if (typeof answer === 'string') {
      const match = question.option_items.find((item: any) => item.id === answer);
      if (match?.name) {
        console.log(`✅ Mapped UUID ${answer} to "${match.name}" for question "${question.question_text}"`);
        return match.name;
      } else {
        console.log(`❌ No match found for UUID ${answer} in question "${question.question_text}". Available options:`, question.option_items);
      }
    }
  }

  // Handle custom template questions (JSON responses)
  if (typeof answer === 'string') {
    try {
      const parsed = JSON.parse(answer);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Extract meaningful values from custom JSON
        const lines: string[] = [];
        Object.entries(parsed).forEach(([key, val]) => {
          if (key === 'option') return; // Skip internal markers
          if (typeof val === 'string' && val.trim()) {
            if (isUrl(val)) {
              // Show image URLs with a friendly label
              const label = key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              lines.push(`${label}: Image uploaded - ${val}`);
            } else if (val.toLowerCase() !== 'uploaded' && val.toLowerCase() !== 'custom') {
              // Show non-URL text values
              const label = key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              lines.push(`${label}: ${val}`);
            }
          }
        });
        if (lines.length > 0) {
          return lines.join('\n');
        }
      }
    } catch {
      // Not JSON, continue with normal processing
    }
  }

  // Handle arrays
  if (Array.isArray(answer)) {
    if (answer.every((v) => typeof v === 'string' && isUrl(v))) {
      return `${answer.length} image${answer.length > 1 ? 's' : ''} uploaded`;
    }
    return answer.join(', ');
  }

  // Return the answer as-is if no special processing needed
  return String(answer);
};

// Generate application details HTML with proper question handling
const generateApplicationDetailsHTML = (questions: any[], applicationDetails: Record<string, any>): string => {
  if (!questions || !applicationDetails) return '';

  console.log('📧 Email system received questions:', questions.map(q => ({
    id: q.id,
    question_text: q.question_text,
    question_type: q.question_type,
    option_items_count: q.option_items?.length || 0,
    option_items: q.option_items
  })));

  // Track processed questions to avoid duplicates
  const processedQuestions = new Set<string>();

  try {
    const details = questions.map(question => {
      // Skip if we've already processed this question
      if (processedQuestions.has(question.id)) {
        console.log(`⚠️ Skipping duplicate question: ${question.question_text} (ID: ${question.id})`);
        return '';
      }
      processedQuestions.add(question.id);

      const answer = applicationDetails[question.id];
      if (!answer && question.question_type !== 'file_upload') return '';

      let displayAnswer = '';
      
      if (question.question_type === 'file_upload') {
        // Handle file upload questions specifically
        if (answer && typeof answer === 'string' && isUrl(answer)) {
          displayAnswer = `Image uploaded: ${answer}`;
        } else if (answer && typeof answer === 'object' && answer.answer_file_url) {
          displayAnswer = `Image uploaded: ${answer.answer_file_url}`;
        } else if (answer && typeof answer === 'object' && answer.answer_text && isUrl(answer.answer_text)) {
          displayAnswer = `Image uploaded: ${answer.answer_text}`;
        } else {
          displayAnswer = 'No file uploaded';
        }
      } else if (question.question_type === 'multiple_choice' && question.option_items && question.option_items.length > 0) {
        // Handle multiple choice questions with UUID mapping
        if (typeof answer === 'string') {
          const match = question.option_items.find((item: any) => item.id === answer);
          if (match?.name) {
            displayAnswer = match.name;
          } else {
            displayAnswer = answer;
          }
        } else {
          displayAnswer = String(answer);
        }
      } else if (typeof answer === 'string') {
        // Handle custom template JSON responses
        try {
          const parsed = JSON.parse(answer);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const lines: string[] = [];
            Object.entries(parsed).forEach(([key, val]) => {
              if (key === 'option') return; // Skip internal markers
              if (typeof val === 'string' && val.trim()) {
                if (isUrl(val)) {
                  // Show image URLs with a friendly label
                  const label = key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                  lines.push(`${label}: Image uploaded - ${val}`);
                } else if (val.toLowerCase() !== 'uploaded' && val.toLowerCase() !== 'custom') {
                  // Show non-URL text values
                  const label = key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                  lines.push(`${label}: ${val}`);
                }
              }
            });
            if (lines.length > 0) {
              displayAnswer = lines.join('<br>');
            } else {
              displayAnswer = answer;
            }
          } else {
            displayAnswer = answer;
          }
        } catch {
          displayAnswer = answer;
        }
      } else {
        displayAnswer = mapAnswerToDisplayName(answer, question);
      }

      // Skip empty answers
      if (!displayAnswer || displayAnswer === 'Not provided') return '';

      return `<p><strong>${question.question_text}:</strong><br>${displayAnswer}</p>`;
    }).filter(Boolean);

    if (details.length > 0) {
      return `
        <div class="application-details" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Application Details</h3>
          ${details.join('')}
        </div>
      `;
    }
  } catch (error) {
    console.warn('Error generating application details HTML:', error);
    return '<p><em>Application details could not be displayed due to formatting error</em></p>';
  }

  return '';
};

// Generate application details text with proper question handling
const generateApplicationDetailsText = (questions: any[], applicationDetails: Record<string, any>): string => {
  if (!questions || !applicationDetails) return '';

  // Track processed questions to avoid duplicates
  const processedQuestions = new Set<string>();

  try {
    const details = questions.map(question => {
      // Skip if we've already processed this question
      if (processedQuestions.has(question.id)) {
        console.log(`⚠️ Skipping duplicate question (text): ${question.question_text} (ID: ${question.id})`);
        return '';
      }
      processedQuestions.add(question.id);

      const answer = applicationDetails[question.id];
      if (!answer && question.question_type !== 'file_upload') return '';

      let displayAnswer = '';
      
      if (question.question_type === 'file_upload') {
        // Handle file upload questions specifically
        if (answer && typeof answer === 'string' && isUrl(answer)) {
          displayAnswer = `Image uploaded: ${answer}`;
        } else if (answer && typeof answer === 'object' && answer.answer_file_url) {
          displayAnswer = `Image uploaded: ${answer.answer_file_url}`;
        } else if (answer && typeof answer === 'object' && answer.answer_text && isUrl(answer.answer_text)) {
          displayAnswer = `Image uploaded: ${answer.answer_text}`;
        } else {
          displayAnswer = 'No file uploaded';
        }
      } else if (question.question_type === 'multiple_choice' && question.option_items && question.option_items.length > 0) {
        // Handle multiple choice questions with UUID mapping
        if (typeof answer === 'string') {
          const match = question.option_items.find((item: any) => item.id === answer);
          if (match?.name) {
            displayAnswer = match.name;
          } else {
            displayAnswer = answer;
          }
        } else {
          displayAnswer = String(answer);
        }
      } else if (typeof answer === 'string') {
        // Handle custom template JSON responses
        try {
          const parsed = JSON.parse(answer);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const lines: string[] = [];
            Object.entries(parsed).forEach(([key, val]) => {
              if (key === 'option') return; // Skip internal markers
              if (typeof val === 'string' && val.trim()) {
                if (isUrl(val)) {
                  // Show image URLs with a friendly label
                  const label = key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                  lines.push(`${label}: Image uploaded - ${val}`);
                } else if (val.toLowerCase() !== 'uploaded' && val.toLowerCase() !== 'custom') {
                  // Show non-URL text values
                  const label = key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                  lines.push(`${label}: ${val}`);
                }
              }
            });
            if (lines.length > 0) {
              displayAnswer = lines.join('\n');
            } else {
              displayAnswer = answer;
            }
          } else {
            displayAnswer = answer;
          }
        } catch {
          displayAnswer = answer;
        }
      } else {
        displayAnswer = mapAnswerToDisplayName(answer, question);
      }

      // Skip empty answers
      if (!displayAnswer || displayAnswer === 'Not provided') return '';

      return `${question.question_text}: ${displayAnswer}`;
    }).filter(Boolean);

    if (details.length > 0) {
      return `
APPLICATION DETAILS:
${details.join('\n')}
`;
    }
  } catch (error) {
    console.warn('Error generating application details text:', error);
    return 'Application details could not be displayed due to formatting error';
  }

  return '';
};

export async function sendCustomerConfirmationEmail(emailData: EmailData) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'TheStickest <noreply@thestickest.com>',
      to: [emailData.customerEmail],
      subject: `Your Design Request Confirmation - ${emailData.designCode}`,
      html: generateCustomerEmailHTML(emailData),
      text: generateCustomerEmailText(emailData),
    });

    if (error) {
      console.error('Failed to send customer confirmation email:', error);
      return { success: false, error };
    }

    console.log('Customer confirmation email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendAdminNotificationEmail(emailData: AdminEmailData) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'TheStickest <noreply@thestickest.com>',
      to: ['quynh.datame@gmail.com'],
      subject: `New Design Request - ${emailData.designCode}`,
      html: generateAdminEmailHTML(emailData),
      text: generateAdminEmailText(emailData),
    });

    if (error) {
      console.error('Failed to send admin notification email:', error);
      return { success: false, error };
    }

    console.log('Admin notification email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return { success: false, error };
  }
}

function generateCustomerEmailHTML(emailData: EmailData): string {
  const discountInfo = emailData.discountCode 
    ? `<p><strong>Discount Applied:</strong> ${emailData.discountCode} (-$${emailData.discountAmount})</p>`
    : '';

  // Generate application details HTML
  const applicationDetailsHTML = generateApplicationDetailsHTML(emailData.questions || [], emailData.applicationDetails || {});

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Design Request Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { max-width: 200px; height: auto; }
        .design-code { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .design-code strong { color: #4F46E5; font-size: 18px; }
        .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .next-steps { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .next-steps h3 { color: #1d4ed8; margin-top: 0; }
        .next-steps ul { padding-left: 20px; }
        .important { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #4F46E5; margin: 0;">Design Request Confirmed!</h1>
      </div>

      <p>Hi there!</p>
      
      <p>Great news! Your design request has been successfully submitted and confirmed. We're excited to start working on your custom stickers!</p>

      <div class="design-code">
        <p><strong>Your Design Code:</strong></p>
        <h2 style="color: #4F46E5; margin: 10px 0; font-size: 24px;">${emailData.designCode}</h2>
        <p style="margin: 0; font-size: 14px;">Save this code to track your application</p>
      </div>

      <div class="details">
        <h3 style="margin-top: 0;">Request Details</h3>
        <p><strong>Product:</strong> ${emailData.productTitle}</p>
        <p><strong>Amount Paid:</strong> $${emailData.amount}</p>
        <p><strong>Payment Method:</strong> ${emailData.paymentMethod}</p>
        ${discountInfo}
      </div>

      ${applicationDetailsHTML}

      <div class="next-steps">
        <h3>What Happens Next?</h3>
        <ul>
          <li>We'll review your request within 24 hours</li>
          <li>Our design team will start working on your concept</li>
          <li>You'll receive design updates via email</li>
          <li>You can track progress using your design code</li>
        </ul>
      </div>

      <div class="important">
        <p><strong>Important:</strong> Please save your design code <strong>${emailData.designCode}</strong> for easy reference and tracking.</p>
      </div>

      <p>If you have any questions, feel free to reply to this email or contact us directly.</p>

      <p>Thank you for choosing TheStickest!</p>

      <div class="footer">
        <p>TheStickest Team<br>
        Making your sticker dreams come true!</p>
      </div>
    </body>
    </html>
  `;
}

function generateCustomerEmailText(emailData: EmailData): string {
  const discountInfo = emailData.discountCode 
    ? `Discount Applied: ${emailData.discountCode} (-$${emailData.discountAmount})`
    : '';

  // Generate application details text
  const applicationDetailsText = generateApplicationDetailsText(emailData.questions || [], emailData.applicationDetails || {});

  return `
DESIGN REQUEST CONFIRMED!

Hi there!

Great news! Your design request has been successfully submitted and confirmed. We're excited to start working on your custom stickers!

YOUR DESIGN CODE: ${emailData.designCode}
Save this code to track your application

REQUEST DETAILS:
- Product: ${emailData.productTitle}
- Amount Paid: $${emailData.amount}
- Payment Method: ${emailData.paymentMethod}
${discountInfo ? `- ${discountInfo}` : ''}

${applicationDetailsText}

WHAT HAPPENS NEXT?
1. We'll review your request within 24 hours
2. Our design team will start working on your concept
3. You'll receive design updates via email
4. You can track progress using your design code

IMPORTANT: Please save your design code ${emailData.designCode} for easy reference and tracking.

If you have any questions, feel free to reply to this email or contact us directly.

Thank you for choosing TheStickest!

---
TheStickest Team
Making your sticker dreams come true!
  `;
}

function generateAdminEmailHTML(emailData: AdminEmailData): string {
  const discountInfo = emailData.discountCode 
    ? `<p><strong>Discount Applied:</strong> ${emailData.discountCode} (-$${emailData.discountAmount})</p>`
    : '';

  // Generate application details HTML
  const applicationDetailsHTML = generateApplicationDetailsHTML(emailData.questions || [], emailData.applicationDetails || {});

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Design Request Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
        .design-code { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .design-code strong { color: #4F46E5; font-size: 18px; }
        .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .customer-info { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .customer-info h3 { color: #1d4ed8; margin-top: 0; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #4F46E5; margin: 0;">New Design Request</h1>
      </div>

      <p>A new design request has been successfully submitted and paid for!</p>

      <div class="design-code">
        <p><strong>Design Code:</strong></p>
        <h2 style="color: #4F46E5; margin: 10px 0; font-size: 24px;">${emailData.designCode}</h2>
      </div>

      <div class="details">
        <h3 style="margin-top: 0;">Request Details</h3>
        <p><strong>Product:</strong> ${emailData.productTitle}</p>
        <p><strong>Amount Paid:</strong> $${emailData.amount}</p>
        <p><strong>Payment Method:</strong> ${emailData.paymentMethod}</p>
        <p><strong>Request ID:</strong> ${emailData.requestId}</p>
        ${discountInfo}
      </div>

      <div class="customer-info">
        <h3>Customer Information</h3>
        <p><strong>Email:</strong> ${emailData.customerEmail}</p>
        ${emailData.customerName ? `<p><strong>Name:</strong> ${emailData.customerName}</p>` : ''}
      </div>

      ${applicationDetailsHTML}

      <p><strong>Action Required:</strong> Please review this request and begin the design process within 24 hours.</p>

      <div class="footer">
        <p>TheStickest Admin Notification<br>
        Design Code: ${emailData.designCode}</p>
      </div>
    </body>
    </html>
  `;
}

function generateAdminEmailText(emailData: AdminEmailData): string {
  const discountInfo = emailData.discountCode 
    ? `Discount Applied: ${emailData.discountCode} (-$${emailData.discountAmount})`
    : '';

  // Generate application details text
  const applicationDetailsText = generateApplicationDetailsText(emailData.questions || [], emailData.applicationDetails || {});

  return `
NEW DESIGN REQUEST NOTIFICATION

A new design request has been successfully submitted and paid for!

DESIGN CODE: ${emailData.designCode}

REQUEST DETAILS:
- Product: ${emailData.productTitle}
- Amount Paid: $${emailData.amount}
- Payment Method: ${emailData.paymentMethod}
- Request ID: ${emailData.requestId}
${discountInfo ? `- ${discountInfo}` : ''}

CUSTOMER INFORMATION:
- Email: ${emailData.customerEmail}
${emailData.customerName ? `- Name: ${emailData.customerName}` : ''}

${applicationDetailsText}

ACTION REQUIRED: Please review this request and begin the design process within 24 hours.

---
TheStickest Admin Notification
Design Code: ${emailData.designCode}
  `;
}
