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
    const [coordinates, setCoordinates] = useState({ lat: 4.882569, lon: 22.260536 });

    const handleGetForecast = async () => {
        setLoading(true);
        setError(null);
        setFloodData(null);

        try {
            const response = await fetch(`/api/flood?lat=${coordinates.lat}&lon=${coordinates.lon}`);
            const result = await response.json();
            const { data, error: apiError } = result;
            if (apiError) {
                setError(`Error fetching flood data: ${apiError.message || 'Unknown error'}`);
            } else {
                setFloodData(data);
            }
        } catch (err) {
            setError(`Failed to fetch flood forecast: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getRiskLevel = (risk) => {
        if (risk >= 0.8) return { level: 'High', color: 'danger', icon: '🔴' };
        if (risk >= 0.5) return { level: 'Medium', color: 'warning', icon: '🟡' };
        if (risk >= 0.2) return { level: 'Low', color: 'info', icon: '🔵' };
        return { level: 'Very Low', color: 'success', icon: '🟢' };
    };

    const formatFloodData = (data) => {
        if (!data) return null;

        return {
            location: `${coordinates.lat}, ${coordinates.lon}`,
            riskLevel: getRiskLevel(data.risk_level || 0),
            forecast: data.forecast || [],
            warnings: data.warnings || [],
            recommendations: data.recommendations || []
        };
    };

    // Ethiopia bounding box
    const ETHIOPIA_BOUNDS = [
        [3.3, 32.9],   // Southwest
        [14.9, 48.0]   // Northeast
    ];

    // Helper to check if lat/lon is within Ethiopia
    function isWithinEthiopia(lat, lon) {
        return lat >= 3.3 && lat <= 14.9 && lon >= 32.9 && lon <= 48.0;
    }

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
                if (isWithinEthiopia(e.latlng.lat, e.latlng.lng)) {
                    setCoordinates({ lat: e.latlng.lat, lon: e.latlng.lng });
                }
            },
        });
        return coordinates && isWithinEthiopia(coordinates.lat, coordinates.lon) ? (
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
                        <p><strong>Click on the map of Ethiopia to select your location:</strong></p>
                        <MapContainer
                            center={[9.145, 40.4897]} // Center of Ethiopia
                            zoom={6}
                            style={{ height: '350px', width: '100%', borderRadius: '15px', marginBottom: '1rem' }}
                            maxBounds={ETHIOPIA_BOUNDS}
                            maxBoundsViscosity={1.0}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                            />
                            {/* Rectangle to show Ethiopia bounds */}
                            <Rectangle
                                bounds={ETHIOPIA_BOUNDS}
                                pathOptions={{ color: 'blue', weight: 2, fillOpacity: 0.05 }}
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
                            {error}
                        </Alert>
                    )}

                    {formattedData && (
                        <div className="flood-results">
                            <Row>
                                <Col md={6}>
                                    <Card className="risk-assessment-card">
                                        <Card.Header>
                                            <h5>📍 Location</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <p className="location-text">{formattedData.location}</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="risk-assessment-card">
                                        <Card.Header>
                                            <h5>⚠️ Risk Assessment</h5>
                                        </Card.Header>
                                        <Card.Body className="text-center">
                                            <div className="risk-icon">
                                                {formattedData.riskLevel.icon}
                                            </div>
                                            <Badge 
                                                bg={formattedData.riskLevel.color} 
                                                className="risk-badge"
                                            >
                                                {formattedData.riskLevel.level} Risk
                                            </Badge>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {formattedData.warnings.length > 0 && (
                                <Card className="warnings-card mt-4">
                                    <Card.Header>
                                        <h5>🚨 Active Warnings</h5>
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
                                        <h5>💡 Recommendations</h5>
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

                            {formattedData.forecast.length > 0 && (
                                <Card className="forecast-card mt-4">
                                    <Card.Header>
                                        <h5>📅 Forecast Timeline</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            {formattedData.forecast.map((item, index) => (
                                                <Col key={index} md={4} className="mb-3">
                                                    <div className="forecast-item">
                                                        <div className="forecast-date">
                                                            {new Date(item.date).toLocaleDateString()}
                                                        </div>
                                                        <div className="forecast-risk">
                                                            Risk: {getRiskLevel(item.risk).level}
                                                        </div>
                                                        <div className="forecast-description">
                                                            {item.description}
                                                        </div>
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
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