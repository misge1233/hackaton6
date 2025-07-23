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

        // Extract soil type from the actual API response structure
        const soilType = data.properties?.most_probable_soil_type || 'Unknown';
        
        // Generate soil properties based on the soil type
        const soilProperties = generateSoilProperties(soilType);
        
        // Generate fertility data based on soil type
        const fertility = generateFertilityData(soilType);
        
        // Generate crop suitability based on soil type
        const suitability = generateCropSuitability(soilType);
        
        // Generate recommendations based on soil type
        const recommendations = generateRecommendations(soilType);

        return {
            location: `${coordinates.lat}, ${coordinates.lon}`,
            soilType: soilType,
            soilProperties: soilProperties,
            fertility: fertility,
            recommendations: recommendations,
            suitability: suitability
        };
    };

    const generateSoilProperties = (soilType) => {
        const properties = {
            'Podzols': {
                'pH Level': '4.0-5.5 (Acidic)',
                'Organic Matter': 'Low to Moderate',
                'Drainage': 'Well-drained',
                'Texture': 'Sandy to Loamy',
                'Mineral Content': 'Low in nutrients'
            },
            'Luvisols': {
                'pH Level': '5.5-7.0 (Slightly Acidic to Neutral)',
                'Organic Matter': 'Moderate',
                'Drainage': 'Good',
                'Texture': 'Clay-rich',
                'Mineral Content': 'Rich in clay minerals'
            },
            'Cambisols': {
                'pH Level': '5.0-7.5 (Variable)',
                'Organic Matter': 'Moderate to High',
                'Drainage': 'Good to Excellent',
                'Texture': 'Variable',
                'Mineral Content': 'Well-developed'
            },
            'Ferralsols': {
                'pH Level': '4.5-6.0 (Acidic)',
                'Organic Matter': 'Low',
                'Drainage': 'Good',
                'Texture': 'Clay-rich',
                'Mineral Content': 'High in iron oxides'
            }
        };
        
        return properties[soilType] || {
            'pH Level': 'Unknown',
            'Organic Matter': 'Unknown',
            'Drainage': 'Unknown',
            'Texture': 'Unknown',
            'Mineral Content': 'Unknown'
        };
    };

    const generateFertilityData = (soilType) => {
        const fertility = {
            'Podzols': {
                'Nitrogen': 3,
                'Phosphorus': 2,
                'Potassium': 4,
                'Organic Matter': 3,
                'Water Retention': 5
            },
            'Luvisols': {
                'Nitrogen': 6,
                'Phosphorus': 7,
                'Potassium': 6,
                'Organic Matter': 5,
                'Water Retention': 7
            },
            'Cambisols': {
                'Nitrogen': 7,
                'Phosphorus': 6,
                'Potassium': 7,
                'Organic Matter': 6,
                'Water Retention': 8
            },
            'Ferralsols': {
                'Nitrogen': 4,
                'Phosphorus': 3,
                'Potassium': 5,
                'Organic Matter': 2,
                'Water Retention': 6
            }
        };
        
        return fertility[soilType] || {
            'Nitrogen': 5,
            'Phosphorus': 5,
            'Potassium': 5,
            'Organic Matter': 5,
            'Water Retention': 5
        };
    };

    const generateCropSuitability = (soilType) => {
        const crops = {
            'Podzols': [
                { name: 'Potatoes', suitable: true, reason: 'Acidic soil preference' },
                { name: 'Blueberries', suitable: true, reason: 'Thrives in acidic conditions' },
                { name: 'Raspberries', suitable: true, reason: 'Acid-loving plant' },
                { name: 'Wheat', suitable: false, reason: 'Requires neutral pH' },
                { name: 'Corn', suitable: false, reason: 'Needs higher nutrient levels' }
            ],
            'Luvisols': [
                { name: 'Wheat', suitable: true, reason: 'Good for cereal crops' },
                { name: 'Corn', suitable: true, reason: 'Rich in nutrients' },
                { name: 'Soybeans', suitable: true, reason: 'Well-drained soil' },
                { name: 'Potatoes', suitable: true, reason: 'Good drainage' },
                { name: 'Vegetables', suitable: true, reason: 'Balanced nutrients' }
            ],
            'Cambisols': [
                { name: 'Most Crops', suitable: true, reason: 'Versatile soil type' },
                { name: 'Wheat', suitable: true, reason: 'Good nutrient balance' },
                { name: 'Corn', suitable: true, reason: 'Well-drained and fertile' },
                { name: 'Vegetables', suitable: true, reason: 'Excellent growing conditions' },
                { name: 'Fruit Trees', suitable: true, reason: 'Deep root penetration' }
            ],
            'Ferralsols': [
                { name: 'Coffee', suitable: true, reason: 'Tropical crop preference' },
                { name: 'Tea', suitable: true, reason: 'Acidic soil tolerance' },
                { name: 'Cassava', suitable: true, reason: 'Drought tolerant' },
                { name: 'Wheat', suitable: false, reason: 'Too acidic' },
                { name: 'Corn', suitable: false, reason: 'Requires more nutrients' }
            ]
        };
        
        return crops[soilType] || [
            { name: 'Unknown Crops', suitable: false, reason: 'Soil type not recognized' }
        ];
    };

    const generateRecommendations = (soilType) => {
        const recommendations = {
            'Podzols': [
                'Apply lime to raise pH levels for better crop growth',
                'Use acid-loving fertilizers and organic matter',
                'Consider growing acid-tolerant crops like potatoes and berries',
                'Implement crop rotation to improve soil health',
                'Add organic matter to improve nutrient retention'
            ],
            'Luvisols': [
                'Maintain good drainage to prevent waterlogging',
                'Use balanced fertilizers for optimal crop growth',
                'Implement crop rotation to maintain soil fertility',
                'Consider cover crops to improve organic matter',
                'Monitor pH levels and adjust as needed'
            ],
            'Cambisols': [
                'This versatile soil type supports most crops',
                'Maintain organic matter levels for optimal fertility',
                'Implement sustainable farming practices',
                'Consider precision agriculture techniques',
                'Monitor soil health regularly'
            ],
            'Ferralsols': [
                'Focus on tropical and acid-tolerant crops',
                'Use fertilizers rich in phosphorus and nitrogen',
                'Implement agroforestry practices',
                'Consider soil conservation techniques',
                'Monitor for iron toxicity in sensitive crops'
            ]
        };
        
        return recommendations[soilType] || [
            'Conduct soil testing for specific recommendations',
            'Consult with local agricultural experts',
            'Consider soil improvement techniques'
        ];
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