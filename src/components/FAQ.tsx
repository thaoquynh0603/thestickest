'use client';

import { useState } from 'react';

interface FAQQuestion {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  questions: FAQQuestion[];
}

interface FAQData {
  title: string;
  subtitle: string;
  sections: FAQSection[];
  contact: {
    title: string;
    subtitle: string;
    email: string;
    response_time: string;
    cta_text: string;
  };
}

interface FAQProps {
  data: FAQData;
}

export default function FAQ({ data }: FAQProps) {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const toggleSection = (sectionIndex: number) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionIndex)) {
      newOpenSections.delete(sectionIndex);
    } else {
      newOpenSections.add(sectionIndex);
    }
    setOpenSections(newOpenSections);
  };

  const toggleQuestion = (questionKey: string) => {
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(questionKey)) {
      newOpenQuestions.delete(questionKey);
    } else {
      newOpenQuestions.add(questionKey);
    }
    setOpenQuestions(newOpenQuestions);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/faq-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: result.message
        });
        // Reset form on success
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to submit your message. Please try again.'
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="faq" className="faq">
      <div className="container">
        <div className="faq-header">
          <h2 className="faq-title">{data.title}</h2>
          <p className="faq-subtitle">{data.subtitle}</p>
        </div>

        <div className="faq-content">
          <div className="faq-main">
            <div className="faq-qa-section">
              {data.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="faq-section">
                  <button
                    className={`faq-section-header ${openSections.has(sectionIndex) ? 'open' : ''}`}
                    onClick={() => toggleSection(sectionIndex)}
                    aria-expanded={openSections.has(sectionIndex)}
                  >
                    <h3 className="faq-section-title">{section.title}</h3>
                    <span className="faq-section-icon" aria-hidden="true">
                      {openSections.has(sectionIndex) ? '−' : '+'}
                    </span>
                  </button>
                  
                  <div className={`faq-section-content ${openSections.has(sectionIndex) ? 'open' : ''}`}>
                      {section.questions.map((question, questionIndex) => {
                        const questionKey = `${sectionIndex}-${questionIndex}`;
                        return (
                          <div key={questionIndex} className="faq-item">
                            <button
                              className={`faq-question ${openQuestions.has(questionKey) ? 'open' : ''}`}
                              onClick={() => toggleQuestion(questionKey)}
                              aria-expanded={openQuestions.has(questionKey)}
                            >
                              <span className="faq-question-text">{question.question}</span>
                              <span className="faq-question-icon" aria-hidden="true">
                                {openQuestions.has(questionKey) ? '−' : '+'}
                              </span>
                            </button>
                            
                                                    <div className={`faq-answer ${openQuestions.has(questionKey) ? 'open' : ''}`}>
                          <p>{question.answer}</p>
                        </div>
                                                  </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="faq-contact">
          <div className="faq-contact-content">
            <h3 className="faq-contact-title">{data.contact.title}</h3>
            <p className="faq-contact-subtitle">{data.contact.subtitle}</p>
            <p className="faq-contact-email">
              Email us at: <a href={`mailto:${data.contact.email}`}>{data.contact.email}</a>
            </p>
            <p className="faq-contact-response">{data.contact.response_time}</p>
            
            <form onSubmit={handleContactSubmit} className="faq-contact-form">
              {/* Status message */}
              {submitStatus.type && (
                <div className={`form-status ${submitStatus.type}`}>
                  {submitStatus.message}
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact-name">Name</label>
                  <input
                    type="text"
                    id="contact-name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contact-email">Email</label>
                  <input
                    type="email"
                    id="contact-email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="contact-subject">Subject</label>
                <input
                  type="text"
                  id="contact-subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <button 
                type="submit" 
                className="faq-contact-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : data.contact.cta_text}
              </button>
            </form>
          </div>
        </div>
          </div>
        </div>
      </div>
    </section>
  );
}
