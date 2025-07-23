const { WeatherClient } = require('openepi-client');

async function testWeatherAPI() {
    console.log('🧪 Testing Weather API with Nairobi coordinates...\n');

    // Test coordinates (Nairobi, Kenya)
    const lat = -1.2921;
    const lon = 36.8219;

    console.log('📍 Test Location: Nairobi, Kenya');
    console.log('📊 Coordinates: Latitude', lat, 'Longitude', lon);
    console.log('');

    try {
        // Test Weather API
        console.log('🌤️  Testing Weather API...');
        const weatherClient = new WeatherClient();
        const weatherResult = await weatherClient.getLocationForecast({ lat, lon });
        
        console.log('📡 API Response received');
        console.log('📊 Response structure:', Object.keys(weatherResult));
        
        if (weatherResult.error) {
            console.log('❌ Weather API Error:', weatherResult.error);
        } else {
            console.log('✅ Weather API Success');
            console.log('   - Data received:', !!weatherResult.data);
            
            if (weatherResult.data) {
                console.log('   - Data type:', typeof weatherResult.data);
                console.log('   - Data keys:', Object.keys(weatherResult.data));
                
                if (weatherResult.data.properties) {
                    console.log('   - Properties keys:', Object.keys(weatherResult.data.properties));
                    
                    if (weatherResult.data.properties.timeseries) {
                        const timeseries = weatherResult.data.properties.timeseries;
                        console.log('   - Timeseries length:', timeseries.length);
                        
                        // Show first few entries
                        console.log('\n📅 Sample Timeseries Data:');
                        for (let i = 0; i < Math.min(3, timeseries.length); i++) {
                            const item = timeseries[i];
                            console.log(`   Entry ${i + 1}:`);
                            console.log(`     Time: ${item.time}`);
                            console.log(`     Temperature: ${item.data.instant.details.air_temperature}°C`);
                            console.log(`     Humidity: ${item.data.instant.details.relative_humidity}%`);
                            console.log(`     Wind Speed: ${item.data.instant.details.wind_speed} m/s`);
                            console.log(`     Pressure: ${item.data.instant.details.air_pressure_at_sea_level} hPa`);
                            console.log(`     Precipitation: ${item.data.instant.details.precipitation_amount || 0} mm`);
                        }
                        
                        // Test data processing
                        console.log('\n🔄 Testing Data Processing...');
                        const dailyData = {};
                        
                        timeseries.forEach((item, index) => {
                            if (index < 7 * 24) { // First 7 days
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
                        
                        console.log('📊 Daily Data Summary:');
                        Object.keys(dailyData).forEach(dateKey => {
                            const dayData = dailyData[dateKey];
                            console.log(`   ${dateKey}:`);
                            console.log(`     Temperature readings: ${dayData.temperatures.length}`);
                            console.log(`     Humidity readings: ${dayData.humidities.length}`);
                            console.log(`     Pressure readings: ${dayData.pressures.length}`);
                            console.log(`     Wind speed readings: ${dayData.windSpeeds.length}`);
                            console.log(`     Precipitation readings: ${dayData.precipitations.length}`);
                            
                            if (dayData.temperatures.length > 0) {
                                const avgTemp = (dayData.temperatures.reduce((a, b) => a + b, 0) / dayData.temperatures.length).toFixed(1);
                                console.log(`     Average Temperature: ${avgTemp}°C`);
                            }
                        });
                    }
                }
            }
        }
        
        console.log('\n🎉 Weather API Test Complete!');
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testWeatherAPI(); 