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
        backgroundColor: 'rgba(170, 18, 41,0.1)',
        borderColor: 'rgba(170,18,41,1)'
      },
      {
        label: 'Security Rating Score (A=1)',
        data: trends.security_rating_trend.map((t) => t.value),
        fill: false,
        borderColor: 'rgba(0,81,194,1)',
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
          '#012069', '#003091', '#AA1229', '#0051C2', '#6c757d'
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
        backgroundColor: ['#012069', '#003091', '#fd7e14', '#AA1229', '#0051C2'],
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
        backgroundColor: 'rgba(1, 32, 105, 0.2)',
        borderColor: '#0d6efd'
      },
      {
        label: 'Backend Team',
        data: [90, 85, 88, 86, 84],
        backgroundColor: 'rgba(170, 18, 41, 0.2)',
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
          '#012069', '#003091', '#fd7e14', '#AA1229', '#0051C2'
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
        backgroundColor: ['#AA1229', '#0051C2', '#003091', '#012069']
      }
    ]
  };

  return (
    <div className="container-fluid mt-4 px-5">
      <h2 className="mb-4">Security Analytics & Insights</h2>

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
