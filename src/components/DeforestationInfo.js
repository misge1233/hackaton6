import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import './DeforestationInfo.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function DeforestationInfo() {
    const [deforestationData, setDeforestationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [coordinates, setCoordinates] = useState({ lat: 7.3000, lon: 35.4000 });

    const handleGetData = async () => {
        setLoading(true);
        setError(null);
        setDeforestationData(null);

        try {
            const response = await fetch(`/api/deforestation?lat=${coordinates.lat}&lon=${coordinates.lon}`);
            const result = await response.json();
            const { data, error: apiError } = result;
            if (apiError) {
                setError(`Error fetching deforestation data: ${apiError.message || 'Unknown error'}`);
            } else {
                setDeforestationData(data);
            }
        } catch (err) {
            setError(`Failed to fetch deforestation data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getDeforestationLevel = (percentage) => {
        if (percentage >= 80) return { level: 'Critical', color: 'danger', icon: '🔴' };
        if (percentage >= 60) return { level: 'High', color: 'warning', icon: '🟡' };
        if (percentage >= 40) return { level: 'Moderate', color: 'info', icon: '🔵' };
        if (percentage >= 20) return { level: 'Low', color: 'success', icon: '🟢' };
        return { level: 'Very Low', color: 'success', icon: '🟢' };
    };

    const formatDeforestationData = (data) => {
        if (!data) return null;

        // Extract first feature if present (GeoJSON)
        let feature = null;
        if (data.type === 'FeatureCollection' && Array.isArray(data.features) && data.features.length > 0) {
            feature = data.features[0];
        }

        return {
            location: `${coordinates.lat}, ${coordinates.lon}`,
            basinInfo: feature && feature.properties ? feature.properties : {},
            geometryType: feature && feature.geometry ? feature.geometry.type : null,
            geometrySample: feature && feature.geometry && Array.isArray(feature.geometry.coordinates[0]) ? feature.geometry.coordinates[0].slice(0, 3) : null,
            // fallback for old API shape
            forestCover: data.forest_cover || {},
            deforestationRate: data.deforestation_rate || 0,
            trends: data.trends || [],
            recommendations: data.recommendations || [],
            fullProperties: feature && feature.properties ? feature.properties : null
        };
    };

    // Chart data preparation
    const prepareChartData = (properties) => {
        if (!properties || !properties.treeloss_per_year) return null;

        const years = properties.treeloss_per_year.map(item => item.year);
        const areas = properties.treeloss_per_year.map(item => item.area);
        const relativeAreas = properties.treeloss_per_year.map(item => item.relative_area * 100); // Convert to percentage

        return {
            years,
            areas,
            relativeAreas,
            totalArea: properties.basin_area,
            totalTreeLoss: properties.daterange_tot_treeloss,
            relativeTreeLoss: properties.daterange_rel_treeloss * 100
        };
    };

    // Line chart for tree loss over time
    const createTreeLossChart = (chartData) => {
        if (!chartData) return null;

        return {
            labels: chartData.years,
            datasets: [
                {
                    label: 'Tree Loss Area (km²)',
                    data: chartData.areas,
                    borderColor: 'rgb(220, 53, 69)',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(220, 53, 69)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }
            ]
        };
    };

    // Bar chart for relative tree loss
    const createRelativeLossChart = (chartData) => {
        if (!chartData) return null;

        return {
            labels: chartData.years,
            datasets: [
                {
                    label: 'Relative Tree Loss (%)',
                    data: chartData.relativeAreas,
                    backgroundColor: chartData.relativeAreas.map(value => 
                        value > 0.2 ? 'rgba(220, 53, 69, 0.8)' : 
                        value > 0.1 ? 'rgba(255, 193, 7, 0.8)' : 
                        'rgba(40, 167, 69, 0.8)'
                    ),
                    borderColor: chartData.relativeAreas.map(value => 
                        value > 0.2 ? 'rgb(220, 53, 69)' : 
                        value > 0.1 ? 'rgb(255, 193, 7)' : 
                        'rgb(40, 167, 69)'
                    ),
                    borderWidth: 1
                }
            ]
        };
    };

    // Doughnut chart for basin statistics
    const createBasinStatsChart = (chartData) => {
        if (!chartData) return null;

        const remainingArea = chartData.totalArea - chartData.totalTreeLoss;
        
        return {
            labels: ['Remaining Forest', 'Tree Loss'],
            datasets: [
                {
                    data: [remainingArea, chartData.totalTreeLoss],
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(220, 53, 69, 0.8)'
                    ],
                    borderColor: [
                        'rgb(40, 167, 69)',
                        'rgb(220, 53, 69)'
                    ],
                    borderWidth: 2
                }
            ]
        };
    };

    useEffect(() => {
        handleGetData();
    }, []);

    const formattedData = formatDeforestationData(deforestationData);
    const chartData = formattedData?.fullProperties ? prepareChartData(formattedData.fullProperties) : null;

    return (
        <div className="content-container">
            <Card className="deforestation-card">
                <Card.Header className="deforestation-header">
                    <h3>🌳 Deforestation Information</h3>
                    <p className="text-muted">Monitor forest cover and deforestation trends</p>
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
                                'Get Deforestation Data'
                            )}
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mb-4">
                            {error}
                        </Alert>
                    )}

                    {formattedData && (
                        <div className="deforestation-results">
                            {/* Basin Overview Cards */}
                            <Row className="mb-4">
                                <Col md={3}>
                                    <Card className="stat-card text-center">
                                        <Card.Body>
                                            <div className="stat-icon">🌊</div>
                                            <h4>{chartData?.totalArea?.toFixed(1) || 'N/A'} km²</h4>
                                            <p className="text-muted">Basin Area</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="stat-card text-center">
                                        <Card.Body>
                                            <div className="stat-icon">🌳</div>
                                            <h4>{chartData?.totalTreeLoss?.toFixed(1) || 'N/A'} km²</h4>
                                            <p className="text-muted">Total Tree Loss</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="stat-card text-center">
                                        <Card.Body>
                                            <div className="stat-icon">📊</div>
                                            <h4>{(chartData?.relativeTreeLoss || 0).toFixed(2)}%</h4>
                                            <p className="text-muted">Relative Loss</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="stat-card text-center">
                                        <Card.Body>
                                            <div className="stat-icon">📅</div>
                                            <h4>{formattedData.fullProperties?.start_year || 'N/A'} - {formattedData.fullProperties?.end_year || 'N/A'}</h4>
                                            <p className="text-muted">Analysis Period</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Charts Section */}
                            {chartData && (
                                <Row className="mb-4">
                                    <Col lg={8}>
                                        <Card className="chart-card">
                                            <Card.Header>
                                                <h5>📈 Tree Loss Trend Over Time</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Line 
                                                    data={createTreeLossChart(chartData)}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: {
                                                                position: 'top',
                                                            },
                                                            title: {
                                                                display: true,
                                                                text: 'Annual Tree Loss Area (km²)'
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                title: {
                                                                    display: true,
                                                                    text: 'Area (km²)'
                                                                }
                                                            },
                                                            x: {
                                                                title: {
                                                                    display: true,
                                                                    text: 'Year'
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col lg={4}>
                                        <Card className="chart-card">
                                            <Card.Header>
                                                <h5>🍃 Basin Forest Status</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Doughnut 
                                                    data={createBasinStatsChart(chartData)}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: {
                                                                position: 'bottom',
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            )}

                            {/* Relative Loss Chart */}
                            {chartData && (
                                <Row className="mb-4">
                                    <Col lg={12}>
                                        <Card className="chart-card">
                                            <Card.Header>
                                                <h5>📊 Relative Tree Loss by Year</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <Bar 
                                                    data={createRelativeLossChart(chartData)}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: {
                                                                position: 'top',
                                                            },
                                                            title: {
                                                                display: true,
                                                                text: 'Relative Tree Loss (% of Basin Area)'
                                                            }
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                title: {
                                                                    display: true,
                                                                    text: 'Relative Loss (%)'
                                                                }
                                                            },
                                                            x: {
                                                                title: {
                                                                    display: true,
                                                                    text: 'Year'
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            )}

                            {/* Location and Basin Info */}
                            <Row className="mb-4">
                                <Col md={6}>
                                    <Card className="location-card">
                                        <Card.Header>
                                            <h5>📍 Location & Basin Info</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            <p className="location-text">
                                                <strong>Coordinates:</strong> {formattedData.location}
                                            </p>
                                            {formattedData.basinInfo.name && (
                                                <p className="basin-text">
                                                    <strong>Basin ID:</strong> {formattedData.basinInfo.downstream_id}
                                                </p>
                                            )}
                                            {formattedData.geometryType && (
                                                <p className="basin-text">
                                                    <strong>Geometry Type:</strong> {formattedData.geometryType}
                                                </p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="deforestation-level-card">
                                        <Card.Header>
                                            <h5>⚠️ Deforestation Assessment</h5>
                                        </Card.Header>
                                        <Card.Body className="text-center">
                                            <div className="deforestation-icon">
                                                {getDeforestationLevel(chartData?.relativeTreeLoss || 0).icon}
                                            </div>
                                            <div className="deforestation-percentage">
                                                {(chartData?.relativeTreeLoss || 0).toFixed(2)}%
                                            </div>
                                            <div className="deforestation-level">
                                                {getDeforestationLevel(chartData?.relativeTreeLoss || 0).level}
                                            </div>
                                            <Badge 
                                                bg={getDeforestationLevel(chartData?.relativeTreeLoss || 0).color} 
                                                className="mt-2"
                                            >
                                                {getDeforestationLevel(chartData?.relativeTreeLoss || 0).level} Risk
                                            </Badge>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Forest Cover Analysis */}
                            {formattedData.forestCover && (
                                <Card className="forest-cover-card mt-4">
                                    <Card.Header>
                                        <h5>🌿 Forest Cover Analysis</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={6}>
                                                <div className="cover-stat">
                                                    <h6>Current Forest Cover</h6>
                                                    <div className="stat-value">
                                                        {formattedData.forestCover.current || 0}%
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="cover-stat">
                                                    <h6>Historical Forest Cover</h6>
                                                    <div className="stat-value">
                                                        {formattedData.forestCover.historical || 0}%
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <div className="progress-container mt-3">
                                            <label>Forest Cover Trend</label>
                                            <ProgressBar 
                                                now={formattedData.forestCover.current || 0} 
                                                max={100}
                                                variant={formattedData.forestCover.current < 50 ? 'danger' : 'success'}
                                            />
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Historical Trends */}
                            {formattedData.trends.length > 0 && (
                                <Card className="trends-card mt-4">
                                    <Card.Header>
                                        <h5>📈 Historical Trends</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            {formattedData.trends.map((trend, index) => (
                                                <Col key={index} md={4} className="mb-3">
                                                    <div className="trend-item">
                                                        <div className="trend-year">{trend.year}</div>
                                                        <div className="trend-coverage">{trend.forest_coverage}%</div>
                                                        <div className="trend-change">
                                                            {trend.change > 0 ? '+' : ''}{trend.change}%
                                                        </div>
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Recommendations */}
                            {formattedData.recommendations.length > 0 && (
                                <Card className="recommendations-card mt-4">
                                    <Card.Header>
                                        <h5>💡 Conservation Recommendations</h5>
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

                    {loading && !deforestationData && (
                        <div className="loading-spinner">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Fetching deforestation data...</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

export default DeforestationInfo; 