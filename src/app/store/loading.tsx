import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <section className="app-loading">
      <div className="card loading-card">
        <LoadingSpinner />
      </div>
    </section>
  );
}

