const { FloodClient } = require('openepi-client');

async function testFloodAPI() {
    console.log('🧪 Testing Flood API with multiple locations...\n');

    // Test coordinates - trying multiple locations for flood data
    const testLocations = [
        { name: 'Central Africa', lat: 4.882569, lon: 22.260536 },
        { name: 'New Orleans (Mississippi River)', lat: 29.9511, lon: -90.0715 },
        { name: 'Varanasi (Ganges River)', lat: 25.2048, lon: 82.5654 },
        { name: 'Duisburg (Rhine River)', lat: 51.3397, lon: 6.5853 },
        { name: 'Bangkok (Chao Phraya River)', lat: 13.7563, lon: 100.5018 },
        { name: 'Amsterdam (North Sea)', lat: 52.3676, lon: 4.9041 }
    ];

    for (let i = 0; i < testLocations.length; i++) {
        const location = testLocations[i];
        console.log(`\n📍 Test ${i + 1}: ${location.name}`);
        console.log(`📊 Coordinates: Latitude ${location.lat}, Longitude ${location.lon}`);
        console.log('');
        
        await testSingleLocation(location);
        
        if (i < testLocations.length - 1) {
            console.log('\n' + '='.repeat(60));
        }
    }
}

async function testSingleLocation(location) {
    try {
        const floodClient = new FloodClient();
        
        // Test 1: Get Summary Forecast
        console.log('🌊 Testing Flood API - Summary Forecast...');
        const summaryResult = await floodClient.getSummaryForecast({ 
            lat: location.lat, 
            lon: location.lon 
        });
        
        console.log('📡 Summary Forecast Response:');
        console.log('📊 Response structure:', Object.keys(summaryResult));
        
        if (summaryResult.error) {
            console.log('❌ Summary Forecast Error:', summaryResult.error);
        } else {
            console.log('✅ Summary Forecast Success');
            console.log('   - Data received:', !!summaryResult.data);
            
            if (summaryResult.data) {
                console.log('   - Data type:', typeof summaryResult.data);
                console.log('   - Data keys:', Object.keys(summaryResult.data));
                
                // Display the summary forecast data
                console.log('\n🌊 Summary Forecast Data:');
                console.log(JSON.stringify(summaryResult.data, null, 2));
                
                // Analyze summary forecast data
                analyzeFloodData(summaryResult.data, 'Summary Forecast');
            }
        }
        
        console.log('\n' + '-'.repeat(40));
        
        // Test 2: Get Detailed Forecast
        console.log('🌊 Testing Flood API - Detailed Forecast...');
        const detailedResult = await floodClient.getDetailedForecast({ 
            lat: location.lat, 
            lon: location.lon 
        });
        
        console.log('📡 Detailed Forecast Response:');
        console.log('📊 Response structure:', Object.keys(detailedResult));
        
        if (detailedResult.error) {
            console.log('❌ Detailed Forecast Error:', detailedResult.error);
        } else {
            console.log('✅ Detailed Forecast Success');
            console.log('   - Data received:', !!detailedResult.data);
            
            if (detailedResult.data) {
                console.log('   - Data type:', typeof detailedResult.data);
                console.log('   - Data keys:', Object.keys(detailedResult.data));
                
                // Display the detailed forecast data
                console.log('\n🌊 Detailed Forecast Data:');
                console.log(JSON.stringify(detailedResult.data, null, 2));
                
                // Analyze detailed forecast data
                analyzeFloodData(detailedResult.data, 'Detailed Forecast');
            }
        }
        
        console.log('\n' + '-'.repeat(40));
        
        // Test 3: Get Thresholds
        console.log('🌊 Testing Flood API - Thresholds...');
        const thresholdsResult = await floodClient.getThresholds({ 
            lat: location.lat, 
            lon: location.lon 
        });
        
        console.log('📡 Thresholds Response:');
        console.log('📊 Response structure:', Object.keys(thresholdsResult));
        
        if (thresholdsResult.error) {
            console.log('❌ Thresholds Error:', thresholdsResult.error);
        } else {
            console.log('✅ Thresholds Success');
            console.log('   - Data received:', !!thresholdsResult.data);
            
            if (thresholdsResult.data) {
                console.log('   - Data type:', typeof thresholdsResult.data);
                console.log('   - Data keys:', Object.keys(thresholdsResult.data));
                
                // Display the thresholds data
                console.log('\n🌊 Thresholds Data:');
                console.log(JSON.stringify(thresholdsResult.data, null, 2));
                
                // Analyze thresholds data
                analyzeFloodData(thresholdsResult.data, 'Thresholds');
            }
        }
        
        console.log('\n✅ Location test complete!');
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

function analyzeFloodData(data, dataType) {
    console.log(`\n📊 ${dataType} Analysis:`);
    
    // Try to extract specific flood information if available
    if (data.properties) {
        console.log('\n📋 Flood Properties:');
        console.log('   - Properties keys:', Object.keys(data.properties));
        
        const properties = data.properties;
        Object.keys(properties).forEach(key => {
            console.log(`   - ${key}:`, properties[key]);
        });
    }
    
    // Check for flood forecast information
    if (data.forecast) {
        console.log('\n📅 Flood Forecast:');
        console.log('   - Forecast data:', data.forecast);
    }
    
    // Check for flood risk levels
    if (data.risk_level) {
        console.log('\n⚠️ Flood Risk Level:');
        console.log('   - Risk level:', data.risk_level);
    }
    
    // Check for flood warnings
    if (data.warnings) {
        console.log('\n🚨 Flood Warnings:');
        console.log('   - Warnings:', data.warnings);
    }
    
    // Check for flood probability
    if (data.probability) {
        console.log('\n📊 Flood Probability:');
        console.log('   - Probability:', data.probability);
    }
    
    // Check for water level data
    if (data.water_level) {
        console.log('\n💧 Water Level Data:');
        console.log('   - Water level:', data.water_level);
    }
    
    // Check for flood extent
    if (data.extent) {
        console.log('\n🗺️ Flood Extent:');
        console.log('   - Extent data:', data.extent);
    }
    
    // Check for time series data
    if (data.timeseries) {
        console.log('\n⏰ Time Series Data:');
        console.log('   - Time series length:', data.timeseries.length);
        
        // Show first few entries
        console.log('\n📅 Sample Time Series Data:');
        for (let i = 0; i < Math.min(3, data.timeseries.length); i++) {
            const item = data.timeseries[i];
            console.log(`   Entry ${i + 1}:`);
            console.log(`     Time: ${item.time}`);
            console.log(`     Data:`, item.data);
        }
    }
    
    // Check for geometry data (flood area)
    if (data.geometry) {
        console.log('\n🗺️ Geometry Data:');
        console.log('   - Geometry type:', data.geometry.type);
        console.log('   - Coordinates available:', !!data.geometry.coordinates);
    }
    
    // Check for queried location data
    if (data.queried_location) {
        console.log('\n📍 Queried Location Data:');
        console.log('   - Type:', data.queried_location.type);
        if (data.queried_location.features) {
            console.log('   - Features count:', data.queried_location.features.length);
        }
    }
    
    // Check for neighboring location data
    if (data.neighboring_location) {
        console.log('\n🌍 Neighboring Location Data:');
        console.log('   - Neighboring data:', data.neighboring_location);
    }
    
    // Check for thresholds data
    if (data.thresholds) {
        console.log('\n📏 Thresholds Data:');
        console.log('   - Thresholds:', data.thresholds);
    }
    
    // Check for return periods
    if (data.return_periods) {
        console.log('\n📈 Return Periods:');
        console.log('   - Return periods:', data.return_periods);
    }
}

// Run the test
testFloodAPI(); 