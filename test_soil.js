const { SoilClient } = require('openepi-client');

async function testSoilAPI() {
    console.log('🧪 Testing Soil API with provided coordinates...\n');

    // Test coordinates (from the example)
    const lat = 60.1;
    const lon = 9.58;

    console.log('📍 Test Location: Norway (based on coordinates)');
    console.log('📊 Coordinates: Latitude', lat, 'Longitude', lon);
    console.log('');

    try {
        // Test Soil API
        console.log('🌱 Testing Soil API...');
        const soilClient = new SoilClient();
        const soilResult = await soilClient.getSoilType({ lat, lon });
        
        console.log('📡 API Response received');
        console.log('📊 Response structure:', Object.keys(soilResult));
        
        if (soilResult.error) {
            console.log('❌ Soil API Error:', soilResult.error);
        } else {
            console.log('✅ Soil API Success');
            console.log('   - Data received:', !!soilResult.data);
            
            if (soilResult.data) {
                console.log('   - Data type:', typeof soilResult.data);
                console.log('   - Data keys:', Object.keys(soilResult.data));
                
                // Display the full soil data structure
                console.log('\n🌍 Complete Soil Data:');
                console.log(JSON.stringify(soilResult.data, null, 2));
                
                // Try to extract specific soil information if available
                if (soilResult.data.properties) {
                    console.log('\n📋 Soil Properties:');
                    console.log('   - Properties keys:', Object.keys(soilResult.data.properties));
                    
                    const properties = soilResult.data.properties;
                    Object.keys(properties).forEach(key => {
                        console.log(`   - ${key}:`, properties[key]);
                    });
                }
                
                // Check for specific soil type information
                if (soilResult.data.features) {
                    console.log('\n🏞️ Soil Features:');
                    console.log('   - Number of features:', soilResult.data.features.length);
                    
                    soilResult.data.features.forEach((feature, index) => {
                        console.log(`   Feature ${index + 1}:`);
                        console.log(`     Type: ${feature.type}`);
                        console.log(`     Properties:`, feature.properties);
                        if (feature.geometry) {
                            console.log(`     Geometry type: ${feature.geometry.type}`);
                        }
                    });
                }
                
                // Check for soil classification data
                if (soilResult.data.classification) {
                    console.log('\n🏷️ Soil Classification:');
                    console.log('   - Classification data:', soilResult.data.classification);
                }
                
                // Check for soil parameters
                if (soilResult.data.parameters) {
                    console.log('\n📊 Soil Parameters:');
                    Object.keys(soilResult.data.parameters).forEach(param => {
                        console.log(`   - ${param}:`, soilResult.data.parameters[param]);
                    });
                }
            }
        }
        
        console.log('\n🎉 Soil API Test Complete!');
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testSoilAPI(); 