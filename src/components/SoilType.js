import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import './SoilType.css';

function SoilType() {
    const [soilData, setSoilData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [coordinates, setCoordinates] = useState({ lat: 60.1, lon: 9.58 });

    const handleGetData = async () => {
        setLoading(true);
        setError(null);
        setSoilData(null);

        try {
            const response = await fetch(`/api/soil?lat=${coordinates.lat}&lon=${coordinates.lon}`);
            const result = await response.json();
            const { data, error: apiError } = result;
            if (apiError) {
                setError(`Error fetching soil data: ${apiError.message || 'Unknown error'}`);
            } else {
                setSoilData(data);
            }
        } catch (err) {
            setError(`Failed to fetch soil data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getSoilQualityColor = (quality) => {
        if (quality >= 8) return { color: 'success', icon: '🟢' };
        if (quality >= 6) return { color: 'info', icon: '🔵' };
        if (quality >= 4) return { color: 'warning', icon: '🟡' };
        return { color: 'danger', icon: '🔴' };
    };

    const formatSoilData = (data) => {
        if (!data) return null;

        return {
            location: `${coordinates.lat}, ${coordinates.lon}`,
            soilType: data.soil_type || 'Unknown',
            soilProperties: data.soil_properties || {},
            fertility: data.fertility || {},
            recommendations: data.recommendations || [],
            suitability: data.crop_suitability || []
        };
    };

    useEffect(() => {
        handleGetData();
    }, []);

    const formattedData = formatSoilData(soilData);

    return (
        <div className="content-container">
            <Card className="soil-card">
                <Card.Header className="soil-header">
                    <h3>🌱 Soil Type Analysis</h3>
                    <p className="text-muted">Analyze soil properties and get farming recommendations</p>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-4">
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Latitude</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="any"
                                    value={coordinates.lat}
                                    onChange={(e) => setCoordinates(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                                    placeholder="Enter latitude"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Longitude</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="any"
                                    value={coordinates.lon}
                                    onChange={(e) => setCoordinates(prev => ({ ...prev, lon: parseFloat(e.target.value) }))}
                                    placeholder="Enter longitude"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="text-center mb-4">
                        <Button 
                            variant="primary" 
                            onClick={handleGetData}
                            disabled={loading}
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Loading...
                                </>
                            ) : (
                                'Analyze Soil'
                            )}
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mb-4">
                            {error}
                        </Alert>
                    )}

                    {formattedData && (
                        <div className="soil-results">
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
                                    <Card className="soil-type-card">
                                        <Card.Header>
                                            <h5>🌱 Soil Type</h5>
                                        </Card.Header>
                                        <Card.Body className="text-center">
                                            <div className="soil-icon">🌱</div>
                                            <div className="soil-type-name">
                                                {formattedData.soilType}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {formattedData.soilProperties && Object.keys(formattedData.soilProperties).length > 0 && (
                                <Card className="properties-card mt-4">
                                    <Card.Header>
                                        <h5>🔬 Soil Properties</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            {Object.entries(formattedData.soilProperties).map(([key, value]) => (
                                                <Col key={key} md={4} className="mb-3">
                                                    <div className="property-item">
                                                        <div className="property-label">{key.replace(/_/g, ' ').toUpperCase()}</div>
                                                        <div className="property-value">{value}</div>
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            {formattedData.fertility && Object.keys(formattedData.fertility).length > 0 && (
                                <Card className="fertility-card mt-4">
                                    <Card.Header>
                                        <h5>💪 Soil Fertility</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            {Object.entries(formattedData.fertility).map(([key, value]) => {
                                                const quality = getSoilQualityColor(value);
                                                return (
                                                    <Col key={key} md={4} className="mb-3">
                                                        <div className="fertility-item">
                                                            <div className="fertility-icon">{quality.icon}</div>
                                                            <div className="fertility-label">{key.replace(/_/g, ' ').toUpperCase()}</div>
                                                            <div className="fertility-value">
                                                                <Badge bg={quality.color}>{value}/10</Badge>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            {formattedData.suitability.length > 0 && (
                                <Card className="suitability-card mt-4">
                                    <Card.Header>
                                        <h5>🌾 Crop Suitability</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            {formattedData.suitability.map((crop, index) => (
                                                <Col key={index} md={4} className="mb-3">
                                                    <div className="crop-item">
                                                        <div className="crop-name">{crop.name}</div>
                                                        <div className="crop-suitability">
                                                            <Badge bg={crop.suitable ? 'success' : 'secondary'}>
                                                                {crop.suitable ? 'Suitable' : 'Not Suitable'}
                                                            </Badge>
                                                        </div>
                                                        {crop.reason && (
                                                            <div className="crop-reason">{crop.reason}</div>
                                                        )}
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            {formattedData.recommendations.length > 0 && (
                                <Card className="recommendations-card mt-4">
                                    <Card.Header>
                                        <h5>💡 Farming Recommendations</h5>
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

                    {loading && !soilData && (
                        <div className="loading-spinner">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Analyzing soil data...</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

export default SoilType; 