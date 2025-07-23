import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './WeatherForecast.css';

function WeatherForecast() {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [coordinates, setCoordinates] = useState({ lat: -1.2921, lon: 36.8219 }); // Nairobi coordinates
    const [days, setDays] = useState(7); // New state for days

    const handleGetForecast = async () => {
        setLoading(true);
        setError(null);
        setWeatherData(null);

        try {
            // Use backend endpoint to avoid CORS
            const response = await fetch(`/api/weather?lat=${coordinates.lat}&lon=${coordinates.lon}`);
            const weatherResult = await response.json();
            console.log('📡 API Response received', weatherResult);
            if (weatherResult.error) {
                setError(`Weather API Error: ${weatherResult.error}`);
                return;
            }
            setWeatherData(weatherResult.data);
        } catch (error) {
            setError(`Failed to fetch weather data: ${error.message}`);
            console.error('💥 Error fetching weather data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatWeatherData = (data) => {
        if (!data || !data.properties || !data.properties.timeseries) {
            return [];
        }
        const timeseries = data.properties.timeseries;
        const dailyData = {};
        timeseries.forEach((item, index) => {
            // Only process up to the selected number of days
            if (index < days * 24) {
                const time = new Date(item.time);
                const dateKey = time.toLocaleDateString();
                const details = item.data.instant.details;
                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = {
                        temperatures: [],
                        humidities: [],
                        pressures: [],
                        windSpeeds: [],
                        precipitations: []
                    };
                }
                if (details.air_temperature !== undefined) {
                    dailyData[dateKey].temperatures.push(details.air_temperature);
                }
                if (details.relative_humidity !== undefined) {
                    dailyData[dateKey].humidities.push(details.relative_humidity);
                }
                if (details.air_pressure_at_sea_level !== undefined) {
                    dailyData[dateKey].pressures.push(details.air_pressure_at_sea_level);
                }
                if (details.wind_speed !== undefined) {
                    dailyData[dateKey].windSpeeds.push(details.wind_speed);
                }
                if (details.precipitation_amount !== undefined) {
                    dailyData[dateKey].precipitations.push(details.precipitation_amount);
                }
            }
        });
        const formattedData = [];
        Object.keys(dailyData).forEach(dateKey => {
            const dayData = dailyData[dateKey];
            if (dayData.temperatures.length > 0) {
                const avgTemp = (dayData.temperatures.reduce((a, b) => a + b, 0) / dayData.temperatures.length).toFixed(1);
                formattedData.push({
                    date: dateKey,
                    temperature: avgTemp,
                    humidity: dayData.humidities.length > 0 ? Math.round(dayData.humidities.reduce((a, b) => a + b, 0) / dayData.humidities.length) : 'N/A',
                    pressure: dayData.pressures.length > 0 ? Math.round(dayData.pressures.reduce((a, b) => a + b, 0) / dayData.pressures.length) : 'N/A',
                    windSpeed: dayData.windSpeeds.length > 0 ? (dayData.windSpeeds.reduce((a, b) => a + b, 0) / dayData.windSpeeds.length).toFixed(1) : 'N/A',
                    precipitation: dayData.precipitations.length > 0 ? (dayData.precipitations.reduce((a, b) => a + b, 0)).toFixed(1) : '0.0'
                });
            }
        });
        // Only return up to the selected number of days
        return formattedData.slice(0, days);
    };

    const getWeatherIcon = (temperature, precipitation) => {
        const temp = parseFloat(temperature);
        const precip = parseFloat(precipitation);
        if (precip > 0) return '🌧️';
        if (temp > 25) return '☀️';
        if (temp > 15) return '⛅';
        if (temp > 5) return '🌤️';
        return '❄️';
    };

    const getLocationName = (lat, lon) => {
        const locations = {
            '-1.2921,36.8219': 'Nairobi, Kenya',
            '13.404954,52.520008': 'Berlin, Germany',
            '51.5074,-0.1278': 'London, UK',
            '40.7128,-74.0060': 'New York, USA',
            '35.6762,139.6503': 'Tokyo, Japan'
        };
        const key = `${lat},${lon}`;
        return locations[key] || `${lat}, ${lon}`;
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

    // Ethiopia bounding box
    const ETHIOPIA_BOUNDS = [
        [3.3, 32.9],   // Southwest
        [14.9, 48.0]   // Northeast
    ];

    // Helper to check if lat/lon is within Ethiopia
    function isWithinEthiopia(lat, lon) {
        return lat >= 3.3 && lat <= 14.9 && lon >= 32.9 && lon <= 48.0;
    }

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

    return (
        <div className="content-container">
            <Card className="weather-card">
                <Card.Header className="weather-header">
                    <h3>🌤️ Weather Forecast</h3>
                    <p className="text-muted">Get detailed weather forecasts for any location using OpenEPI API</p>
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
                    {/* Hide manual input, but keep for fallback or advanced users */}
                    {/*
                    <Row className="mb-4">
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Latitude</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="any"
                                    value={coordinates.lat}
                                    onChange={(e) => setCoordinates(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                                    placeholder="Enter latitude (e.g., -1.2921)"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label>Longitude</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="any"
                                    value={coordinates.lon}
                                    onChange={(e) => setCoordinates(prev => ({ ...prev, lon: parseFloat(e.target.value) || 0 }))}
                                    placeholder="Enter longitude (e.g., 36.8219)"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                    */}
                    <Row className="mb-4">
                        <Col md={{ span: 4, offset: 8 }}>
                            <Form.Group className="mb-3">
                                <Form.Label>Days</Form.Label>
                                <Form.Select value={days} onChange={e => setDays(Number(e.target.value))}>
                                    <option value={7}>7 days</option>
                                    <option value={14}>14 days</option>
                                    <option value={30}>30 days</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-center mb-4">
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
                                'Get Weather Forecast'
                            )}
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="danger" className="mb-4">
                            <strong>Error:</strong> {error}
                        </Alert>
                    )}

                    {weatherData && (
                        <div className="weather-results">
                            <h4 className="mb-3">Weather Forecast for {getLocationName(coordinates.lat, coordinates.lon)}</h4>
                            <Row>
                                {formatWeatherData(weatherData).map((day, index) => (
                                    <Col key={index} md={6} lg={4} className="mb-3">
                                        <Card className="weather-day-card">
                                            <Card.Body className="text-center">
                                                <div className="weather-icon">
                                                    {getWeatherIcon(day.temperature, day.precipitation)}
                                                </div>
                                                <h6 className="weather-date">{day.date}</h6>
                                                <div className="weather-temp">
                                                    {day.temperature}°C
                                                </div>
                                                <div className="weather-details">
                                                    <small>
                                                        💧 Humidity: {day.humidity}%<br/>
                                                        💨 Wind: {day.windSpeed} m/s<br/>
                                                        🌧️ Precipitation: {day.precipitation} mm<br/>
                                                        📊 Pressure: {day.pressure} hPa
                                                    </small>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    )}

                    {loading && !weatherData && (
                        <div className="loading-spinner">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3">Fetching weather data from OpenEPI API...</p>
                        </div>
                    )}

                    {!weatherData && !loading && !error && (
                        <div className="text-center text-muted">
                            <p>Enter coordinates and click "Get Weather Forecast" to see weather data</p>
                            <small>Example coordinates: Latitude -1.2921, Longitude 36.8219 (Nairobi)</small>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

export default WeatherForecast; 