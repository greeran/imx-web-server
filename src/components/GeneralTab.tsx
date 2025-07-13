import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { TabConfig, SystemInfo } from '../types';
import { apiService } from '../services/apiService';

interface GeneralTabProps {
  config: TabConfig;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ config }) => {
  const [systemInfo, setSystemInfo] = useState<{ [key: string]: SystemInfo }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSystemInfo = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSystemInfo();
      setSystemInfo(data);
      setError(null);
    } catch (err) {
      setError('Failed to load system information');
      console.error('Error loading system info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemInfo();

    // Set up auto-refresh for data sources that have refresh intervals
    const intervals: NodeJS.Timeout[] = [];
    
    Object.entries(config.data_sources || {}).forEach(([key, dataSource]) => {
      if (dataSource.refresh_interval) {
        const interval = setInterval(loadSystemInfo, dataSource.refresh_interval);
        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [config]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && Object.keys(systemInfo).length === 0) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading system information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-5">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
        <button className="btn btn-primary" onClick={loadSystemInfo}>
          <i className="fas fa-sync-alt me-2"></i>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Card.Header>
          <h5>
            <i className="fas fa-info-circle me-2"></i>
            System Information
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            {Object.entries(systemInfo).map(([key, info]) => (
              <Col key={key} md={6} lg={4} className="mb-3">
                <div className="info-card p-3 border rounded">
                  <h6 className="text-muted mb-2">{info.description || key}</h6>
                  <div className="value h5 mb-2">{info.value}</div>
                  <div className="timestamp small text-muted">
                    {formatTimestamp(info.timestamp)}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default GeneralTab; 