import React, { useState } from 'react';
import { Navbar, Nav, Container, Row, Col } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import components
import FertilizerChat from './components/FertilizerChat';
import WeatherForecast from './components/WeatherForecast';
import DeforestationInfo from './components/DeforestationInfo';
import FloodForecast from './components/FloodForecast';
import SoilType from './components/SoilType';

function App() {
  const [activeTab, setActiveTab] = useState('fertilizer');

  const renderContent = () => {
    switch (activeTab) {
      case 'fertilizer':
        return <FertilizerChat />;
      case 'weather':
        return <WeatherForecast />;
      case 'deforestation':
        return <DeforestationInfo />;
      case 'flood':
        return <FloodForecast />;
      case 'soil':
        return <SoilType />;
      default:
        return <FertilizerChat />;
    }
  };

  return (
    <div className="App">
      <Navbar expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#home">
            🌱 AgriPulse Agriculture Advisory
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link 
                className={activeTab === 'fertilizer' ? 'active' : ''}
                onClick={() => setActiveTab('fertilizer')}
              >
                💬 Fertilizer Chat
              </Nav.Link>
              <Nav.Link 
                className={activeTab === 'weather' ? 'active' : ''}
                onClick={() => setActiveTab('weather')}
              >
                🌤️ Weather Forecast
              </Nav.Link>
              <Nav.Link 
                className={activeTab === 'deforestation' ? 'active' : ''}
                onClick={() => setActiveTab('deforestation')}
              >
                🌳 Deforestation Info
              </Nav.Link>
              <Nav.Link 
                className={activeTab === 'flood' ? 'active' : ''}
                onClick={() => setActiveTab('flood')}
              >
                🌊 Flood Forecast
              </Nav.Link>
              <Nav.Link 
                className={activeTab === 'soil' ? 'active' : ''}
                onClick={() => setActiveTab('soil')}
              >
                🌱 Soil Type
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Row>
          <Col>
            {renderContent()}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App; 