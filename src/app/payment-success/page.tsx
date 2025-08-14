import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PaymentSuccessClient } from '@/components/PaymentSuccessClient';

interface PaymentSuccessPageProps {
  searchParams: {
    code?: string;
  };
}

export default async function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const designCode = searchParams.code;

  if (!designCode) {
    notFound();
  }

  const supabase = createClient();
  
  // Get application details
  const { data: application, error } = await supabase
    .from('design_request_states')
    .select(`
      *,
      products (*)
    `)
    .eq('design_code', designCode)
    .single();

  if (error || !application) {
    notFound();
  }

  // Pass the data to the client component
  return <PaymentSuccessClient application={application} designCode={designCode} />;
}
