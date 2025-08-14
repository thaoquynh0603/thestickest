import { Product } from '@/types/database';

interface ProcessSectionProps {
  product: Product;
}

export function ProcessSection({ product }: ProcessSectionProps) {
  return (
    <section className="design-process-section">
      <div className="container">
        <h2 className="process-title">Our Design Process</h2>
        <div className="process-steps">
          <div className="process-step">
            <div className="process-step-number">1</div>
            <div className="process-step-content">
              <h3 className="process-step-title">Share Your Vision</h3>
              <p className="process-step-description">
                Tell us about your idea, share inspiration, or upload existing artwork. 
                Our team is here to bring your vision to life.
              </p>
            </div>
          </div>

          <div className="process-step">
            <div className="process-step-number">2</div>
            <div className="process-step-content">
              <h3 className="process-step-title">Design Creation</h3>
              <p className="process-step-description">
                Our expert designers create your custom stickers within {product.design_time}. 
                We focus on quality and attention to detail.
              </p>
            </div>
          </div>

          <div className="process-step">
            <div className="process-step-number">3</div>
            <div className="process-step-content">
              <h3 className="process-step-title">Review & Revise</h3>
              <p className="process-step-description">
                Review your design and request unlimited revisions until it's perfect. 
                Your satisfaction is our priority.
              </p>
            </div>
          </div>

          <div className="process-step">
            <div className="process-step-number">4</div>
            <div className="process-step-content">
              <h3 className="process-step-title">Print & Ship</h3>
              <p className="process-step-description">
                Once approved, we print your stickers with premium materials and ship 
                them directly to your door.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
