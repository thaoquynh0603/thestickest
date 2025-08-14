'use client';

import { useState, useEffect } from 'react';

interface PaymentAnalyticsData {
  analytics: Array<{
    date: string;
    total_applications: number;
    successful_payments: number;
    failed_payments: number;
    total_revenue: number;
    total_fees: number;
    net_revenue: number;
    success_rate_percentage: number;
  }>;
  recentEvents: Array<{
    id: string;
    event_type: string;
    amount: number;
    currency: string;
    status: string;
    error_message?: string;
    created_at: string;
            design_requests: {
      design_code: string;
      email: string;
      products: {
        title: string;
      };
    };
  }>;
  paymentSummary: Array<{
    application_id: string;
    design_code: string;
    email: string;
    application_status: string;
    payment_status: string;
    total_amount: number;
    payment_fee_amount: number;
    payment_net_amount: number;
    payment_currency: string;
    payment_attempts: number;
    payment_confirmed_at: string;
    product_title: string;
    application_created_at: string;
  }>;
  statistics: {
    totalApplications: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    totalRevenue: number;
    totalFees: number;
    netRevenue: number;
    successRate: number;
  };
}

export default function PaymentAnalytics() {
  const [data, setData] = useState<PaymentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payment-analytics?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment analytics');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-100';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="payment-analytics">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading payment analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-analytics">
        <div className="container">
          <div className="error-container">
            <h2>Error Loading Analytics</h2>
            <p>{error}</p>
            <button onClick={fetchAnalytics} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="payment-analytics">
      <div className="container">
        <div className="analytics-header">
          <h1>Payment Analytics</h1>
          <div className="period-selector">
            <label htmlFor="period">Time Period:</label>
            <select
              id="period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="period-select"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="statistics-grid">
          <div className="stat-card">
            <h3>Total Applications</h3>
            <p className="stat-number">{data.statistics.totalApplications}</p>
          </div>
          <div className="stat-card">
            <h3>Successful Payments</h3>
            <p className="stat-number success">{data.statistics.successfulPayments}</p>
          </div>
          <div className="stat-card">
            <h3>Failed Payments</h3>
            <p className="stat-number error">{data.statistics.failedPayments}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Payments</h3>
            <p className="stat-number pending">{data.statistics.pendingPayments}</p>
          </div>
          <div className="stat-card">
            <h3>Success Rate</h3>
            <p className="stat-number">{data.statistics.successRate}%</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-number">{formatCurrency(data.statistics.totalRevenue)}</p>
          </div>
          <div className="stat-card">
            <h3>Total Fees</h3>
            <p className="stat-number">{formatCurrency(data.statistics.totalFees)}</p>
          </div>
          <div className="stat-card">
            <h3>Net Revenue</h3>
            <p className="stat-number">{formatCurrency(data.statistics.netRevenue)}</p>
          </div>
        </div>

        {/* Recent Payment Events */}
        <div className="analytics-section">
          <h2>Recent Payment Events</h2>
          <div className="events-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Design Code</th>
                  <th>Product</th>
                  <th>Event Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDate(event.created_at)}</td>
                                    <td>{event.design_requests.design_code}</td>
                <td>{event.design_requests.products.title}</td>
                    <td>{event.event_type.replace('_', ' ').toUpperCase()}</td>
                    <td>{formatCurrency(event.amount, event.currency)}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>{event.error_message || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="analytics-section">
          <h2>Payment Summary</h2>
          <div className="summary-table">
            <table>
              <thead>
                <tr>
                  <th>Design Code</th>
                  <th>Email</th>
                  <th>Product</th>
                  <th>Payment Status</th>
                  <th>Amount</th>
                  <th>Fees</th>
                  <th>Net Amount</th>
                  <th>Attempts</th>
                  <th>Confirmed At</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentSummary.map((payment) => (
                  <tr key={payment.application_id}>
                    <td>{payment.design_code}</td>
                    <td>{payment.email}</td>
                    <td>{payment.product_title}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(payment.payment_status)}`}>
                        {payment.payment_status}
                      </span>
                    </td>
                    <td>{formatCurrency(payment.total_amount, payment.payment_currency)}</td>
                    <td>{formatCurrency(payment.payment_fee_amount, payment.payment_currency)}</td>
                    <td>{formatCurrency(payment.payment_net_amount, payment.payment_currency)}</td>
                    <td>{payment.payment_attempts}</td>
                    <td>
                      {payment.payment_confirmed_at 
                        ? formatDate(payment.payment_confirmed_at)
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Analytics Chart */}
        <div className="analytics-section">
          <h2>Daily Analytics</h2>
          <div className="daily-chart">
            {data.analytics.map((day) => (
              <div key={day.date} className="day-bar">
                <div className="day-label">{new Date(day.date).toLocaleDateString()}</div>
                <div className="bar-container">
                  <div 
                    className="success-bar" 
                    style={{ height: `${(day.successful_payments / Math.max(day.total_applications, 1)) * 100}%` }}
                    title={`${day.successful_payments} successful`}
                  ></div>
                  <div 
                    className="failed-bar" 
                    style={{ height: `${(day.failed_payments / Math.max(day.total_applications, 1)) * 100}%` }}
                    title={`${day.failed_payments} failed`}
                  ></div>
                </div>
                <div className="day-stats">
                  <div>Total: {day.total_applications}</div>
                  <div>Revenue: {formatCurrency(day.total_revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
