import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table } from 'react-bootstrap';
import { TabConfig, SensorData, SensorHistoryEntry } from '../types';
import { mqttService } from '../services/mqttService';

interface SensorsTabProps {
  config: TabConfig;
}

const SensorsTab: React.FC<SensorsTabProps> = ({ config }) => {
  const [sensorData, setSensorData] = useState<{ [key: string]: SensorData }>({});
  const [sensorHistory, setSensorHistory] = useState<SensorHistoryEntry[]>([]);

  useEffect(() => {
    // Subscribe to sensor data updates
    const handleSensorUpdate = (data: { [key: string]: SensorData }) => {
      setSensorData(data);
      
      // Add to history
      Object.entries(data).forEach(([sensorName, sensorInfo]) => {
        const historyEntry: SensorHistoryEntry = {
          sensor: sensorName,
          value: sensorInfo.value,
          unit: sensorInfo.unit,
          timestamp: sensorInfo.timestamp,
        };
        
        setSensorHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
      });
    };

    mqttService.onSensorDataUpdate(handleSensorUpdate);

    // Load initial sensor data
    setSensorData(mqttService.getSensorData());

    return () => {
      // Cleanup would be handled by the service
    };
  }, []);

  const refreshSensors = () => {
    // This would trigger a manual refresh if needed
    console.log('Manual sensor refresh requested');
  };

  const clearSensorLog = () => {
    setSensorHistory([]);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>
            <i className="fas fa-thermometer-half me-2"></i>
            Sensor Data
          </h5>
          <div>
            <Button variant="primary" size="sm" onClick={refreshSensors} className="me-2">
              <i className="fas fa-sync-alt me-1"></i>
              Refresh
            </Button>
            <Button variant="warning" size="sm" onClick={clearSensorLog}>
              <i className="fas fa-trash me-1"></i>
              Clear Log
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            {Object.entries(sensorData).map(([sensorName, sensorInfo]) => (
              <Col key={sensorName} md={6} lg={4} className="mb-3">
                <div className={`sensor-card p-3 border rounded ${sensorName}`}>
                  <h6 className="text-muted mb-2">{sensorInfo.description || sensorName}</h6>
                  <div className="value h5 mb-2">
                    {sensorInfo.value} {sensorInfo.unit}
                  </div>
                  <div className="timestamp small text-muted">
                    {formatTimestamp(sensorInfo.timestamp)}
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <div className="mt-4">
            <h6>Sensor History</h6>
            <Table responsive size="sm">
              <thead>
                <tr>
                  <th>Sensor</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {sensorHistory.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.sensor}</td>
                    <td>{entry.value}</td>
                    <td>{entry.unit}</td>
                    <td>{formatTimestamp(entry.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SensorsTab; 