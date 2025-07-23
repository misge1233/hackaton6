// Simple browser test for Weather API
// This can be run in the browser console to test the API

async function testBrowserWeatherAPI() {
    console.log('🧪 Testing Weather API in browser environment...\n');

    // Test coordinates (Nairobi, Kenya)
    const lat = -1.2921;
    const lon = 36.8219;

    console.log('📍 Test Location: Nairobi, Kenya');
    console.log('📊 Coordinates: Latitude', lat, 'Longitude', lon);
    console.log('');

    try {
        // Test basic network connectivity first
        console.log('🌐 Testing network connectivity...');
        const testResponse = await fetch('https://httpbin.org/get');
        console.log('✅ Network connectivity test passed');
        
        // Test Weather API
        console.log('🌤️  Testing Weather API...');
        
        // Check if openepi-client is available
        if (typeof WeatherClient === 'undefined') {
            console.error('❌ WeatherClient not available in browser');
            return;
        }
        
        const weatherClient = new WeatherClient();
        console.log('✅ WeatherClient created successfully');
        
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
                    }
                }
            }
        }
        
        console.log('\n🎉 Browser Weather API Test Complete!');
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.testBrowserWeatherAPI = testBrowserWeatherAPI;
    console.log('🌐 Browser test function available as: testBrowserWeatherAPI()');
} 