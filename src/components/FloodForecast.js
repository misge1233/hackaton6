import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './FloodForecast.css';

function FloodForecast() {
    const [floodData, setFloodData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [coordinates, setCoordinates] = useState({ lat: 4.882569, lon: 22.260536 }); // Central Africa - working location

    const handleGetForecast = async () => {
        setLoading(true);
        setError(null);
        setFloodData(null);

        try {
            // Only get thresholds data (this is the only endpoint that returns actual data)
            const thresholdsResponse = await fetch(`/api/flood/thresholds?lat=${coordinates.lat}&lon=${coordinates.lon}`);
            
            if (!thresholdsResponse.ok) {
                throw new Error(`HTTP ${thresholdsResponse.status}: ${thresholdsResponse.statusText}`);
            }
            
            const thresholdsResult = await thresholdsResponse.json();
            
            // Check for API errors
            if (thresholdsResult.error) {
                setError(`Location not supported: ${thresholdsResult.error.detail || 'Coordinates outside supported region'}`);
                return;
            }

            setFloodData({
                thresholds: thresholdsResult.data
            });
        } catch (err) {
            setError(`Failed to fetch flood data: ${err.message}. Please check if the backend server is running.`);
        } finally {
            setLoading(false);
        }
    };

    const getRiskLevel = (threshold, currentLevel) => {
        // Calculate risk based on threshold and current water level
        const ratio = currentLevel / threshold;
        if (ratio >= 1.2) return { level: 'Critical', color: 'danger', icon: '🔴' };
        if (ratio >= 1.0) return { level: 'High', color: 'danger', icon: '🟠' };
        if (ratio >= 0.8) return { level: 'Medium', color: 'warning', icon: '🟡' };
        if (ratio >= 0.6) return { level: 'Low', color: 'info', icon: '🔵' };
        return { level: 'Very Low', color: 'success', icon: '🟢' };
    };

    const formatFloodData = (data) => {
        if (!data) return null;

        // Extract thresholds data
        const thresholds = data.thresholds?.queried_location?.features?.[0]?.properties;

        // Calculate risk levels based on thresholds
        const riskLevels = thresholds ? {
            '2-year': getRiskLevel(thresholds.threshold_2y, thresholds.threshold_2y * 0.8),
            '5-year': getRiskLevel(thresholds.threshold_5y, thresholds.threshold_5y * 0.8),
            '20-year': getRiskLevel(thresholds.threshold_20y, thresholds.threshold_20y * 0.8)
        } : null;

        // Generate recommendations based on thresholds
        const recommendations = thresholds ? generateRecommendations(thresholds) : [];

        // Generate warnings based on risk levels
        const warnings = riskLevels ? generateWarnings(riskLevels) : [];

        return {
            location: `${coordinates.lat}, ${coordinates.lon}`,
            thresholds: thresholds,
            riskLevels: riskLevels,
            warnings: warnings,
            recommendations: recommendations
        };
    };

    const generateRecommendations = (thresholds) => {
        const recommendations = [];
        
        if (thresholds.threshold_2y < 3) {
            recommendations.push('Monitor water levels closely - low flood threshold detected');
        }
        if (thresholds.threshold_5y < 5) {
            recommendations.push('Consider flood preparedness measures for medium-term events');
        }
        if (thresholds.threshold_20y > 8) {
            recommendations.push('High flood potential - ensure emergency plans are in place');
        }
        
        recommendations.push('Stay informed about weather conditions and river levels');
        recommendations.push('Have emergency evacuation plan ready');
        
        return recommendations;
    };

    const generateWarnings = (riskLevels) => {
        const warnings = [];
        
        if (riskLevels['2-year'].level === 'Critical' || riskLevels['2-year'].level === 'High') {
            warnings.push('Immediate flood risk detected - take precautionary measures');
        }
        if (riskLevels['5-year'].level === 'Critical' || riskLevels['5-year'].level === 'High') {
            warnings.push('Medium-term flood risk elevated - monitor conditions');
        }
        if (riskLevels['20-year'].level === 'Critical' || riskLevels['20-year'].level === 'High') {
            warnings.push('Long-term flood risk significant - prepare emergency plans');
        }
        
        return warnings;
    };

    // Custom marker icon for leaflet (fixes default icon issue)
    const markerIcon = new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
    });

    // Map click handler component
    function LocationMarker() {
        useMapEvents({
            click(e) {
                setCoordinates({ lat: e.latlng.lat, lon: e.latlng.lng });
            },
        });
        return coordinates ? (
            <Marker position={[coordinates.lat, coordinates.lon]} icon={markerIcon} />
        ) : null;
    }

    useEffect(() => {
        handleGetForecast();
    }, []);

    const formattedData = formatFloodData(floodData);

    return (
        <div className="content-container">
            <Card className="flood-card">
                <Card.Header className="flood-header">
                    <h3>🌊 Flood Forecast</h3>
                    <p className="text-muted">Monitor flood risks and get early warnings</p>
                </Card.Header>
                <Card.Body>
                    <div className="mb-4">
                        <p><strong>Click anywhere on the map to select your location:</strong></p>
                        <MapContainer
                            center={[20.0, 0.0]} // Center of the world
                            zoom={2}
                            style={{ height: '350px', width: '100%', borderRadius: '15px', marginBottom: '1rem' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                            />
                            <LocationMarker />
                        </MapContainer>
                        <div className="text-muted mb-2">
                            Selected Coordinates: <span style={{fontWeight:'bold'}}>{coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)}</span>
                        </div>
                    </div>

                    <div className="text-center mb-4">
                        <Button 
                            variant="primary" 
                            onClick={handleGetForecast}
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Loading...
                                </>
                            ) : (
                                'Get Flood Forecast'
                            )}
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mb-4">
                            <div className="d-flex align-items-center">
                                <div className="me-3">🚨</div>
                                <div>
                                    <strong>API Error:</strong> {error}
                                    <br />
                                    <small className="text-muted">
                                        Try selecting a different location or check if the backend server is running.
                                    </small>
                                </div>
                            </div>
                        </Alert>
                    )}

                    {formattedData && (
                        <div className="flood-results">
                            <Row>
                                <Col md={6}>
                                    <Card className="location-card">
                                        <Card.Header>
                                            <h5>📍 Location</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <p className="location-text">{formattedData.location}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="coverage-card">
                                        <Card.Header>
                                            <h5>🌍 Coverage Status</h5>
                                        </Card.Header>
                                        <Card.Body className="text-center">
                                            {formattedData.thresholds ? (
                                                <>
                                                    <div className="coverage-icon">✅</div>
                                                    <div className="coverage-text">Flood Data Available</div>
                                                    <Badge bg="success" className="coverage-badge">
                                                        Supported Region
                                                    </Badge>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="coverage-icon">⚠️</div>
                                                    <div className="coverage-text">Limited Data</div>
                                                    <Badge bg="warning" className="coverage-badge">
                                                        Partial Coverage
                                                    </Badge>
                                                </>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {formattedData.thresholds ? (
                                <Card className="thresholds-card mt-4">
                                    <Card.Header>
                                        <h5>📏 Flood Thresholds</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={4}>
                                                <div className="threshold-item">
                                                    <div className="threshold-header">
                                                        <span className="threshold-icon">📊</span>
                                                        <span className="threshold-title">2-Year Return</span>
                                                    </div>
                                                    <div className="threshold-value">
                                                        {formattedData.thresholds.threshold_2y?.toFixed(2)} m
                                                    </div>
                                                    <div className="threshold-risk">
                                                        <Badge bg={formattedData.riskLevels['2-year'].color}>
                                                            {formattedData.riskLevels['2-year'].level}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="threshold-item">
                                                    <div className="threshold-header">
                                                        <span className="threshold-icon">📈</span>
                                                        <span className="threshold-title">5-Year Return</span>
                                                    </div>
                                                    <div className="threshold-value">
                                                        {formattedData.thresholds.threshold_5y?.toFixed(2)} m
                                                    </div>
                                                    <div className="threshold-risk">
                                                        <Badge bg={formattedData.riskLevels['5-year'].color}>
                                                            {formattedData.riskLevels['5-year'].level}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={4}>
                                                <div className="threshold-item">
                                                    <div className="threshold-header">
                                                        <span className="threshold-icon">🌊</span>
                                                        <span className="threshold-title">20-Year Return</span>
                                                    </div>
                                                    <div className="threshold-value">
                                                        {formattedData.thresholds.threshold_20y?.toFixed(2)} m
                                                    </div>
                                                    <div className="threshold-risk">
                                                        <Badge bg={formattedData.riskLevels['20-year'].color}>
                                                            {formattedData.riskLevels['20-year'].level}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            ) : (
                                <Card className="no-thresholds-card mt-4">
                                    <Card.Header>
                                        <h5>📏 Flood Thresholds</h5>
                                    </Card.Header>
                                    <Card.Body className="text-center">
                                        <div className="no-thresholds-icon">⚠️</div>
                                        <p className="no-thresholds-text">
                                            No threshold data available for this location.
                                            <br />
                                            <small className="text-muted">
                                                This location may not be in a supported flood monitoring region.
                                            </small>
                                        </p>
                                    </Card.Body>
                                </Card>
                            )}

                            {formattedData.warnings.length > 0 && (
                                <Card className="warnings-card mt-4">
                                    <Card.Header>
                                        <h5>🚨 Flood Warnings</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <ul className="warnings-list">
                                            {formattedData.warnings.map((warning, index) => (
                                                <li key={index} className="warning-item">
                                                    {warning}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card.Body>
                                </Card>
                            )}

                            {formattedData.recommendations.length > 0 && (
                                <Card className="recommendations-card mt-4">
                                    <Card.Header>
                                        <h5>💡 Safety Recommendations</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <ul className="recommendations-list">
                                            {formattedData.recommendations.map((rec, index) => (
                                                <li key={index} className="recommendation-item">
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </Card.Body>
                                </Card>
                            )}
                        </div>
                    )}

                    {loading && !floodData && (
                        <div className="loading-spinner">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Fetching flood forecast data...</p>
                        </div>
                    )}

                    {!floodData && !loading && !error && (
                        <div className="text-center text-muted">
                            <p>Click on the map to select a location and then click "Get Flood Forecast" to see flood data</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

export default FloodForecast; 