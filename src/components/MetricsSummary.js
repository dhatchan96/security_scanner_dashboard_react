import React, { useEffect, useState } from 'react';
import API from '../api';
import {
  Line, Doughnut, Bar, Radar
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import '../style.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend
);

const MetricsSummary = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await API.get('/api/metrics/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load summary', err);
    }
  };

  if (!summary) return <p className="text-center mt-5">Loading summary...</p>;

  const { trends, issues_by_severity, issues_by_type } = summary;

  const lineData = {
    labels: trends.issues_trend.map((t) => new Date(t.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Issues Found',
        data: trends.issues_trend.map((t) => t.value),
        fill: true,
        backgroundColor: 'rgba(255,99,132,0.1)',
        borderColor: 'rgba(255,99,132,1)'
      },
      {
        label: 'Security Rating Score (A=1)',
        data: trends.security_rating_trend.map((t) => t.value),
        fill: false,
        borderColor: 'rgba(54,162,235,1)',
        borderDash: [5, 5]
      }
    ]
  };

  const severityData = {
    labels: Object.keys(issues_by_severity),
    datasets: [
      {
        data: Object.values(issues_by_severity),
        backgroundColor: [
          '#dc3545', '#fd7e14', '#ffc107', '#0d6efd', '#6c757d'
        ],
      }
    ]
  };

  const ratingCounts = ['A', 'B', 'C', 'D', 'E'].map(r =>
    trends.security_rating_trend.filter(rt => String.fromCharCode(64 + rt.value) === r).length
  );

  const ratingBar = {
    labels: ['A', 'B', 'C', 'D', 'E'],
    datasets: [
      {
        label: 'Count',
        backgroundColor: ['#198754', '#ffc107', '#fd7e14', '#dc3545', '#6c757d'],
        data: ratingCounts
      }
    ]
  };

  const radarData = {
    labels: ['Security', 'Reliability', 'Maintainability', 'Coverage', 'Performance'],
    datasets: [
      {
        label: 'Frontend Team',
        data: [95, 90, 85, 92, 88],
        backgroundColor: 'rgba(13, 110, 253, 0.2)',
        borderColor: '#0d6efd'
      },
      {
        label: 'Backend Team',
        data: [90, 85, 88, 86, 84],
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        borderColor: '#dc3545'
      }
    ]
  };

  const vulnTypeData = {
    labels: Object.keys(issues_by_type),
    datasets: [
      {
        data: Object.values(issues_by_type),
        backgroundColor: [
          '#dc3545', '#fd7e14', '#ffc107', '#0d6efd', '#20c997'
        ]
      }
    ]
  };

  const resolutionTime = {
    labels: ['<1h', '1-4h', '4-12h', '>12h'],
    datasets: [
      {
        label: 'Count',
        data: [3, 5, 7, 10],
        backgroundColor: ['#20c997', '#ffc107', '#fd7e14', '#dc3545']
      }
    ]
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">📊 Security Analytics & Insights</h2>

      <div className="row g-4">
        <div className="col-md-6 col-lg-4">
          <div className="card p-3 h-100">
            <h6 className="text-center">Security Issues Trend</h6>
            <Line data={lineData} />
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card p-3 h-100">
            <h6 className="text-center">Issues by Severity</h6>
            <Doughnut data={severityData} />
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card p-3 h-100">
            <h6 className="text-center">Security Rating Distribution</h6>
            <Bar data={ratingBar} />
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card p-3 h-100">
            <h6 className="text-center">Team Performance</h6>
            <Radar data={radarData} />
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card p-3 h-100">
            <h6 className="text-center">Vulnerability Types</h6>
            <Doughnut data={vulnTypeData} />
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card p-3 h-100">
            <h6 className="text-center">Resolution Time</h6>
            <Bar data={resolutionTime} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsSummary;
