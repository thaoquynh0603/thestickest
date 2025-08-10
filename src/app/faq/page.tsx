import FAQ from '@/components/FAQ';
import faqData from '../../../faq-data.json';

export default function FAQPage() {
  return <FAQ data={faqData.faq} />;
}
