import React, { useState } from 'react';
import { Container, Nav, Navbar, Badge, Card, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import configData from './config/config.json';

function App() {
  const [activeTab, setActiveTab] = useState('general');

  // Get enabled tabs from config
  const enabledTabs = Object.entries(configData.tabs).filter(([_, tabConfig]) => tabConfig.enabled);

  const handleButtonClick = (action: string) => {
    console.log(`Button clicked: ${action}`);
    // Here you would implement the actual button actions
    switch (action) {
      case 'refresh_all_sensors':
        console.log('Refreshing sensors...');
        break;
      case 'clear_sensor_history':
        console.log('Clearing sensor history...');
        break;
      case 'upload_file':
        console.log('Opening file upload...');
        break;
      case 'list_available_files':
        console.log('Listing files...');
        break;
      default:
        console.log(`Action not implemented: ${action}`);
    }
  };

  return (
    <div className="App">
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-3">
        <Container fluid>
          <Navbar.Brand>
            <i className="fas fa-server me-2"></i>
            {configData.application.name}
          </Navbar.Brand>
          <Navbar.Text className="ms-auto">
            <Badge bg="success" className="me-2">
              <i className="fas fa-wifi"></i> MQTT
            </Badge>
            <Badge bg="success">
              <i className="fas fa-cog"></i> System
            </Badge>
          </Navbar.Text>
        </Container>
      </Navbar>

      <Container fluid>
        <Nav variant="tabs" className="mb-3">
          {enabledTabs.map(([tabId, tabConfig]) => (
            <Nav.Item key={tabId}>
              <Nav.Link
                active={activeTab === tabId}
                onClick={() => setActiveTab(tabId)}
                className="d-flex align-items-center"
              >
                <i className={`fas fa-${
                  tabId === 'general' ? 'info-circle' :
                  tabId === 'sensors' ? 'thermometer-half' :
                  tabId === 'video' ? 'video' : 'folder'
                } me-2`}></i>
                {tabConfig.title}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        <div className="tab-content">
          {activeTab === 'general' && (
            <Card>
              <Card.Header>
                <h5>
                  <i className="fas fa-info-circle me-2"></i>
                  {configData.tabs.general.title}
                </h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted">{configData.tabs.general.description}</p>
                <Row>
                  <Col md={6} lg={4} className="mb-3">
                    <div className="info-card p-3 border rounded">
                      <h6 className="text-muted mb-2">Machine Version</h6>
                      <div className="value h5 mb-2">Linux 6.8.0-60-generic</div>
                      <div className="timestamp small text-muted">Just now</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4} className="mb-3">
                    <div className="info-card p-3 border rounded">
                      <h6 className="text-muted mb-2">Application Version</h6>
                      <div className="value h5 mb-2">{configData.application.version}</div>
                      <div className="timestamp small text-muted">Just now</div>
                    </div>
                  </Col>
                  <Col md={6} lg={4} className="mb-3">
                    <div className="info-card p-3 border rounded">
                      <h6 className="text-muted mb-2">CPU Usage</h6>
                      <div className="value h5 mb-2">15.2%</div>
                      <div className="timestamp small text-muted">Just now</div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'sensors' && (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>
                  <i className="fas fa-thermometer-half me-2"></i>
                  {configData.tabs.sensors.title}
                </h5>
                <div>
                  {configData.tabs.sensors.buttons && Object.entries(configData.tabs.sensors.buttons).map(([key, button]) => (
                    <Button
                      key={key}
                      variant="primary"
                      size="sm"
                      onClick={() => handleButtonClick(button.action)}
                      className="me-2"
                      title={button.description}
                    >
                      {button.text}
                    </Button>
                  ))}
                </div>
              </Card.Header>
              <Card.Body>
                <p className="text-muted">{configData.tabs.sensors.description}</p>
                <Row>
                  {configData.tabs.sensors.broker_config && Object.entries(configData.tabs.sensors.broker_config.topics).map(([sensorKey, topicConfig]) => (
                    <Col key={sensorKey} md={6} lg={4} className="mb-3">
                      <div className={`sensor-card ${sensorKey} p-3 border rounded`}>
                        <h6 className="text-muted mb-2">{topicConfig.description}</h6>
                        <div className="value h5 mb-2">-- {topicConfig.unit}</div>
                        <div className="timestamp small text-muted">Waiting for data...</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'files' && (
            <Card>
              <Card.Header>
                <h5>
                  <i className="fas fa-folder me-2"></i>
                  {configData.tabs.files.title}
                </h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted">{configData.tabs.files.description}</p>
                <Row className="mb-4">
                  <Col md={6}>
                    <h6>File Operations</h6>
                    <div className="d-grid gap-2">
                      {configData.tabs.files.buttons && Object.entries(configData.tabs.files.buttons).map(([key, button]) => (
                        <Button
                          key={key}
                          variant="primary"
                          onClick={() => handleButtonClick(button.action)}
                          title={button.description}
                        >
                          <i className={`fas fa-${
                            button.action.includes('upload') ? 'upload' :
                            button.action.includes('download') ? 'download' :
                            button.action.includes('list') ? 'list' :
                            button.action.includes('delete') ? 'trash' : 'file'
                          } me-2`}></i>
                          {button.text}
                        </Button>
                      ))}
                    </div>
                  </Col>
                  <Col md={6}>
                    <h6>Configuration</h6>
                    <div className="small text-muted">
                      <p><strong>Max Upload Size:</strong> {configData.tabs.files.upload_config.max_file_size}</p>
                      <p><strong>Allowed Extensions:</strong> {configData.tabs.files.upload_config.allowed_extensions.join(', ')}</p>
                      <p><strong>Upload Directory:</strong> {configData.tabs.files.upload_config.upload_directory}</p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
}

export default App; 