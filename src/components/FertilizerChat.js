import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './FertilizerChat.css';
import { MapContainer, TileLayer, Marker, Rectangle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Use environment variable for Groq API keys
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API; // Set this in your .env file

function FertilizerChat() {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [availableLayers, setAvailableLayers] = useState([]);
    const [currentStep, setCurrentStep] = useState('initial');
    const [selectedLayer, setSelectedLayer] = useState('');
    const [coordinates, setCoordinates] = useState({ lat: null, lon: null });
    const [showMap, setShowMap] = useState(false);
    const [collectedData, setCollectedData] = useState({ crop: null, fertilizer: null, coordinates: null });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        setMessages([{
            id: Date.now(),
            type: 'bot',
            content: "Hello! I'm your fertilizer advisory assistant. I can help you get fertilizer recommendations for your location. What would you like to know about fertilizers?"
        }]);
        loadAvailableLayers();
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages]);

    const ETHIOPIA_BOUNDS = [ [3.4, 33.0], [14.9, 48.0] ];
    function isWithinEthiopia(lat, lon) {
        return lat >= 3.4 && lat <= 14.9 && lon >= 33.0 && lon <= 48.0;
    }
    const markerIcon = new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
    });
    function LocationMarker() {
        useMapEvents({
            click(e) {
                if (isWithinEthiopia(e.latlng.lat, e.latlng.lng)) {
                    setCoordinates({ lat: Number(e.latlng.lat.toFixed(3)), lon: Number(e.latlng.lng.toFixed(3)) });
                }
            },
        });
        return coordinates.lat && coordinates.lon && isWithinEthiopia(coordinates.lat, coordinates.lon) ? (
            <Marker position={[coordinates.lat, coordinates.lon]} icon={markerIcon} />
        ) : null;
    }
    const loadAvailableLayers = async () => {
        try {
            const response = await axios.get('https://webapi.nextgenagroadvisory.com/layers_fertilizer');
            if (response.data && response.data.layers) {
                setAvailableLayers(response.data.layers.map(layer => layer.name));
            }
        } catch (error) {
            console.error('Error loading layers:', error);
        }
    };
    const parseLayerName = (layerName) => {
        const parts = layerName.split('_');
        if (parts.length >= 4) {
            const crop = parts[1];
            let fertilizer = parts[2];
            // Handle optimal_nutrients_n and optimal_nutrients_p as special cases
            if (fertilizer === 'optimal' && parts[3] === 'nutrients') {
                if (parts[4] === 'n') {
                    fertilizer = 'n'; // nitrogen
                } else if (parts[4] === 'p') {
                    fertilizer = 'p'; // phosphorus
                } else {
                    fertilizer = parts.slice(2, 5).join('_');
                }
            }
            // Handle yieldtypes_optimal as a special case for yield layers
            else if (fertilizer === 'yieldtypes' && parts[3] === 'optimal') {
                fertilizer = 'yieldtypes_optimal';
            }
            const scenario = parts[parts.length - 1];
            return { crop, fertilizer, scenario };
        }
        return null;
    };
    const getAvailableCropsAndFertilizers = () => {
        const crops = new Set();
        const fertilizers = new Set();
        availableLayers.forEach(layer => {
            const parsed = parseLayerName(layer);
            if (parsed) {
                crops.add(parsed.crop);
                // Map 'n' to 'nitrogen' and 'p' to 'phosphorus' for display
                if (parsed.fertilizer === 'n') {
                    fertilizers.add('nitrogen');
                } else if (parsed.fertilizer === 'p') {
                    fertilizers.add('phosphorus');
                } else {
                    fertilizers.add(parsed.fertilizer);
                }
            }
        });
        return {
            crops: Array.from(crops).sort(),
            fertilizers: Array.from(fertilizers).sort()
        };
    };
    const findMatchingLayer = (cropInput, fertilizerInput) => {
        const cropLower = cropInput.toLowerCase();
        let fertilizerLower = fertilizerInput.toLowerCase();

        // Map user input 'nitrogen' to 'n' and 'phosphorus' to 'p' for matching
        if (fertilizerLower === 'nitrogen') {
            fertilizerLower = 'n';
        } else if (fertilizerLower === 'phosphorus') {
            fertilizerLower = 'p';
        }

        // Map user input 'yield' or 'yieldtypes' to 'yieldtypes_optimal'
        if (fertilizerLower === 'yield' || fertilizerLower === 'yieldtypes') {
            fertilizerLower = 'yieldtypes_optimal';
        }

        // First try to find dominant scenario
        let matchingLayer = availableLayers.find(layer => {
            const parsed = parseLayerName(layer);
            return parsed && 
                   parsed.crop.toLowerCase() === cropLower && 
                   parsed.fertilizer.toLowerCase() === fertilizerLower &&
                   parsed.scenario === 'dominant';
        });
        
        // If no dominant found, try normal
        if (!matchingLayer) {
            matchingLayer = availableLayers.find(layer => {
                const parsed = parseLayerName(layer);
                return parsed && 
                       parsed.crop.toLowerCase() === cropLower && 
                       parsed.fertilizer.toLowerCase() === fertilizerLower &&
                       parsed.scenario === 'normal';
            });
        }
        
        return matchingLayer;
    };
    const sendMessageToGroq = async (userMessage, conversationContext = '') => {
        try {
            const { crops, fertilizers } = getAvailableCropsAndFertilizers();
            
            const systemPrompt = `You are an expert in site specific Fertilizer recommendation. Your goal is to help users get fertilizer recommendations by collecting 3 pieces of information:
1. Crop type
2. Fertilizer type  
3. Location coordinates

CRITICAL WARNING: You MUST NEVER generate or make up your own fertilizer recommendations or yield values. You are strictly forbidden from providing any numerical values, calculations, or recommendations that you generate yourself.

ALL fertilizer recommendation values and yield values MUST come exclusively from the following endpoint (handled by the system): https://webapi.nextgenagroadvisory.com/coordinates/{layer}/{coorStr}/{date}

You are only allowed to present values that are returned by this specific API endpoint. If no data is available from the endpoint, you must clearly state that no data was found for that location/combination.

All fertilizer recommendations are given in kg/ha (kilograms per hectare), EXCEPT for compost and vcompost, which are given in ton/ha (tons per hectare). Please always include the correct unit in your responses when providing a recommendation.

IMPORTANT: When presenting a fertilizer recommendation or yield value, you must always round off the value to the nearest integer according to mathematical rules. Present both the original value and the rounded value in your response. For example: "Your recommendation value is 42.7 kg/ha. After round off, the final recommendation is 43 kg/ha."

Available crops: ${crops.join(', ')}
Available fertilizers: ${fertilizers.join(', ')}

IMPORTANT: The fertilizer type 'n' or 'nitrogen' corresponds to 'optimal_nutrients_n' in the data, and 'p' or 'phosphorus' corresponds to 'optimal_nutrients_p'. Users may refer to these as 'n', 'nitrogen', 'p', or 'phosphorus'. Please map user requests for 'n' or 'nitrogen' to 'optimal_nutrients_n', and 'p' or 'phosphorus' to 'optimal_nutrients_p' when matching layers.

IMPORTANT: For compost and vcompost, the recommendation unit is ton/ha (tons per hectare). Always mention this unit in your response when providing compost or vcompost recommendations.

IMPORTANT: For yield value requests, users may refer to 'yieldtypes_optimal' using phrases such as 'yield', 'yield value', 'optimal yield', 'best yield', or similar wording. You must intelligently identify these intents and map them to 'yieldtypes_optimal' when matching layers. When providing a recommendation for this, clearly state it as the optimal yield (not a fertilizer recommendation) and specify the unit as kg/ha.

REMEMBER: You are a data presenter, not a calculator. You can only present values that come from the API endpoint. Never invent, estimate, or calculate values yourself, except for rounding off the value to the nearest integer as instructed above.

Current collected data: ${JSON.stringify(collectedData)}

CRITICAL: You must respond with ONLY ONE valid JSON object. No text before or after. No multiple JSON objects. Only return this single JSON object:

{"response":"Your conversational response to the user","extracted_data":{"crop":"extracted crop or null","fertilizer":"extracted fertilizer or null","coordinates":"extracted coordinates or null"},"missing_data":["list of missing data points"],"next_action":"what to do next (collect_data, get_recommendation, show_map, etc)"}

IMPORTANT: Before providing a fertilizer recommendation, always analyze the user's latest message for intent and clarity.
- If the message is unclear, off-topic, or not a valid fertilizer request (e.g., random words, greetings, or unrelated questions), do NOT provide a recommendation.
- Instead, respond conversationally and ask the user to clarify their request or redirect them back to fertilizer advice.
- Only provide a fertilizer recommendation or yield values if the user's intent is clear and relevant. Both fertilizer recommendation values and yield values are always retrieved from the following endpoint (handled by the system): https://webapi.nextgenagroadvisory.com/coordinates/{layer}/{coorStr}/{date}. You do not need to perform any calculations yourself; simply present the value as returned by the system, with the correct context and units.

SPECIAL INSTRUCTIONS FOR COORDINATES:
- When asking for coordinates, always offer the map option naturally in your response
- Include phrases like "Don't you know your exact coordinates? I can help you with a map!" or "Would you like me to show you a map to help you find your location?"
- If the user responds positively (yes, sure, okay, etc.), set next_action to "show_map"
- When showing map, include helpful instructions like "Feel free to click on your location on the map"

If the user asks for explainability—such as "Why did you recommend this?" or any similar questions about the reasoning behind the recommendation—respond with an intelligent explanation like the following:

"The recommended fertilizer value is derived from your location's specific soil properties, climate conditions, and topographic features, along with the crop's nutrient requirements. These recommendations are generated by a machine learning model that analyzes multiple environmental and agronomic factors.

At the moment, I don't have access to the full dataset needed to provide a more detailed breakdown. Once my developer grants access to the complete data, I'll be able to offer a more in-depth explanation."

Then, continue the conversation in a helpful and engaging manner with statements such as:

"If you have any more questions or need assistance, I'm here to help"

If user provides coordinates, extract them in format "lat,lon". Valid Ethiopia coordinates: latitude 3.4-14.9, longitude 33.0-48.0.

If user asks about other topics, provide general responses and redirect to fertilizer recommendations.`;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "meta-llama/llama-4-scout-17b-16e-instruct",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: conversationContext + "\n\nUser: " + userMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });
            const data = await response.json();
            const content = data.choices[0].message.content;
            
            console.log('Raw Groq response:', content);
            
            try {
                let cleanContent = content.trim();
                const jsonStart = cleanContent.indexOf('{');
                const jsonEnd = cleanContent.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                    cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
                }
                const parsed = JSON.parse(cleanContent);
                console.log('Parsed JSON response:', parsed);
                return parsed;
            } catch (parseError) {
                console.error('Failed to parse Groq response as JSON:', content);
                console.error('Parse error:', parseError);
                
                const responseMatch = content.match(/"response":"([^"]+)"/);
                if (responseMatch) {
                    return {
                        response: responseMatch[1],
                        extracted_data: {},
                        missing_data: [],
                        next_action: "collect_data"
                    };
                }
                return {
                    response: content,
                    extracted_data: {},
                    missing_data: [],
                    next_action: "collect_data"
                };
            }
        } catch (error) {
            console.error('Error calling Groq API:', error);
            return {
                response: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
                extracted_data: {},
                missing_data: [],
                next_action: "collect_data"
            };
        }
    };
    const getFertilizerRecommendation = async (layer, lat, lon) => {
        try {
            const coorData = [{ lat: parseFloat(lat), lon: parseFloat(lon) }];
            const coorStr = JSON.stringify(coorData);
            const date = "2024-07";
            const response = await axios.post(
                `https://webapi.nextgenagroadvisory.com/coordinates/${layer}/${coorStr}/${date}`
            );
            return response.data;
        } catch (error) {
            console.error('Error getting fertilizer recommendation:', error);
            throw error;
        }
    };
    const handleMapLocationSelect = async () => {
        if (!coordinates.lat || !coordinates.lon) {
            const mapErrorPrompt = `The user tried to use the selected location but no location was selected on the map. 

Please provide a helpful, conversational response that explains they need to click on the map first to select a location within Ethiopia. Do not use any markdown formatting like ** or * - just plain text.`;
            
            const errorResponse = await sendMessageToGroq(mapErrorPrompt);
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: errorResponse.response || errorResponse }]);
            return;
        }
        const updatedData = { ...collectedData, coordinates: `${coordinates.lat},${coordinates.lon}` };
        setCollectedData(updatedData);
        const missingData = [];
        if (!updatedData.crop) missingData.push('crop');
        if (!updatedData.fertilizer) missingData.push('fertilizer');
        if (missingData.length === 0) {
            await getRecommendationWithData(updatedData);
        } else {
            const { crops, fertilizers } = getAvailableCropsAndFertilizers();
            let missingDataPrompt = '';
            if (missingData.length === 2) {
                missingDataPrompt = `The user selected their location (${coordinates.lat}, ${coordinates.lon}) but hasn't provided their crop and fertilizer type yet.

Available crops: ${crops.join(', ')}
Available fertilizers: ${fertilizers.join(', ')}

Please provide a helpful, conversational response that acknowledges their location selection and asks them to provide both their crop and fertilizer type. Give examples of how they can phrase their request.`;
            } else if (missingData.includes('crop')) {
                missingDataPrompt = `The user selected their location (${coordinates.lat}, ${coordinates.lon}) and provided fertilizer type "${updatedData.fertilizer}" but hasn't specified their crop yet.

Available crops: ${crops.join(', ')}

Please provide a helpful, conversational response that acknowledges their location and fertilizer selection, and asks them to specify which crop they want fertilizer recommendations for.`;
            } else if (missingData.includes('fertilizer')) {
                missingDataPrompt = `The user selected their location (${coordinates.lat}, ${coordinates.lon}) and provided crop "${updatedData.crop}" but hasn't specified their fertilizer type yet.

Available fertilizers: ${fertilizers.join(', ')}

Please provide a helpful, conversational response that acknowledges their location and crop selection, and asks them to specify which fertilizer type they want recommendations for.`;
            }
            const botResponse = await sendMessageToGroq(missingDataPrompt);
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: botResponse.response || botResponse }]);
            setShowMap(false);
            setCurrentStep('collecting_data');
        }
    };
    const getRecommendationWithData = async (data) => {
        const matchingLayer = findMatchingLayer(data.crop, data.fertilizer);
        if (!matchingLayer) {
            const availableCombinations = availableLayers.map(layer => {
                const parsed = parseLayerName(layer);
                return parsed ? `${parsed.crop} + ${parsed.fertilizer}` : layer;
            }).filter((item, index, arr) => arr.indexOf(item) === index);
            const errorPrompt = `The user requested ${data.crop} with ${data.fertilizer} fertilizer, but this combination is not available. 

Available combinations are:
${availableCombinations.join('\n')}

Please provide a helpful, conversational response that explains this combination isn't available and suggests alternative crops or fertilizers they could try. Do not use any markdown formatting like ** or * - just plain text.`;
            
            const errorResponse = await sendMessageToGroq(errorPrompt);
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: errorResponse.response || errorResponse }]);
            setCurrentStep('initial');
            setCollectedData({ crop: null, fertilizer: null, coordinates: null });
            return;
        }
        setSelectedLayer(matchingLayer);
        const parsed = parseLayerName(matchingLayer);
        
        // Generate getting recommendation message
        const gettingRecommendationPrompt = `The user is getting a ${parsed.fertilizer === 'yieldtypes_optimal' ? 'yield value' : 'fertilizer recommendation'} for:
Crop: ${parsed.crop}
${parsed.fertilizer === 'yieldtypes_optimal' ? '' : `Fertilizer: ${parsed.fertilizer}`}
Location: ${data.coordinates}

Please provide a simple, conversational response that acknowledges we're getting their ${parsed.fertilizer === 'yieldtypes_optimal' ? 'yield value' : 'fertilizer recommendation'} and asks them to wait. Include the crop${parsed.fertilizer === 'yieldtypes_optimal' ? '' : ', fertilizer,'} and location information naturally in the response. Do not use any markdown formatting like ** or * - just plain text.`;
        
        const botResponse = await sendMessageToGroq(gettingRecommendationPrompt);
        setMessages(prev => [...prev, { id: Date.now(), type: 'bot', content: botResponse.response || botResponse }]);
        setShowMap(false);
        setIsLoading(true);
        try {
            const [lat, lon] = data.coordinates.split(',');
            const recommendation = await getFertilizerRecommendation(matchingLayer, lat, lon);
            let resultMessage = '';
            if (recommendation && recommendation.length > 0 && recommendation[0].value) {
                if (parsed.fertilizer === 'yieldtypes_optimal') {
                    // Yield value response
                    const successPrompt = `The user received a successful yield value:
Crop: ${parsed.crop}
Location: ${data.coordinates}
Yield Value: ${recommendation[0].value}

Please provide a conversational response that celebrates their successful yield result and includes all the above information naturally. Make sure to clearly state this is a yield value (not a fertilizer recommendation) and specify the unit as kg/ha. Also ask if there's anything else they'd like to know about yield or fertilizers. Do not use any markdown formatting like ** or * - just plain text.`;
                    resultMessage = await sendMessageToGroq(successPrompt);
                } else {
                    // Fertilizer recommendation response
                    const successPrompt = `The user received a successful fertilizer recommendation:
Crop: ${parsed.crop}
Fertilizer: ${parsed.fertilizer}
Location: ${data.coordinates}
Recommendation Value: ${recommendation[0].value}

Please provide a conversational response that celebrates their successful recommendation and includes all the above information naturally. Also ask if there's anything else they'd like to know about fertilizers. Do not use any markdown formatting like ** or * - just plain text.`;
                    resultMessage = await sendMessageToGroq(successPrompt);
                }
            } else {
                const noDataPrompt = `The user requested fertilizer data for location ${data.coordinates} but no data was found for this location. 

Please provide a helpful, conversational response that acknowledges no data was found and suggests trying with a different location. Do not use any markdown formatting like ** or * - just plain text.`;
                resultMessage = await sendMessageToGroq(noDataPrompt);
            }
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: resultMessage.response || resultMessage }]);
        } catch (error) {
            const apiErrorPrompt = `There was an error retrieving the fertilizer recommendation for location ${data.coordinates}. 

Please provide a helpful, conversational response that acknowledges the error and suggests checking coordinates or trying again. Do not use any markdown formatting like ** or * - just plain text.`;
            
            const errorResponse = await sendMessageToGroq(apiErrorPrompt);
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: errorResponse.response || errorResponse }]);
        } finally {
            setIsLoading(false);
            setCurrentStep('initial');
            setCollectedData({ crop: null, fertilizer: null, coordinates: null });
        }
    };
    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;
        const userMessage = { id: Date.now(), type: 'user', content: inputMessage };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        try {
            const conversationContext = messages.map(msg => 
                `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n');
            const groqResponse = await sendMessageToGroq(inputMessage, conversationContext);
            const newCollectedData = { ...collectedData };
            if (groqResponse.extracted_data.crop) newCollectedData.crop = groqResponse.extracted_data.crop;
            if (groqResponse.extracted_data.fertilizer) newCollectedData.fertilizer = groqResponse.extracted_data.fertilizer;
            if (groqResponse.extracted_data.coordinates) newCollectedData.coordinates = groqResponse.extracted_data.coordinates;
            setCollectedData(newCollectedData);
            let botResponse = groqResponse.response;
            if (groqResponse.next_action === 'get_recommendation') {
                await getRecommendationWithData(newCollectedData);
                return;
            } else if (groqResponse.next_action === 'show_map') {
                botResponse += '\n\n🗺️ Click here to open map and find your Location\n\n💡 Feel free to click on your location on the map within Ethiopia to select it.';
                setCurrentStep('coordinates');
            } else if (groqResponse.next_action === 'collect_data') {
                setCurrentStep('collecting_data');
            }
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: botResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: "I'm sorry, I encountered an error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    return (
        <div className="fertilizer-chatbot-container">
            <div className="fertilizer-chatbot-header">
                <h2>Fertilizer Advisory Chatbot</h2>
                <p>Get personalized fertilizer recommendations for your crops</p>
            </div>
            <div className="fertilizer-chatbot-body">
                <div className="fertilizer-messages-container">
                    {messages.map((message) => (
                        <div key={message.id} className={`fertilizer-message ${message.type}`}>
                            <div className="fertilizer-message-content">
                                {message.content.split('\n').map((line, index) => {
                                    if (line.includes('🗺️ Click here to open map and find your Location')) {
                                        return (
                                            <div key={index}>
                                                <button className="fertilizer-map-btn" onClick={() => setShowMap(true)}>
                                                    🗺️ Click here to open map and find your Location
                                                </button>
                                            </div>
                                        );
                                    }
                                    return <div key={index}>{line}</div>;
                                })}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="fertilizer-message bot">
                            <div className="fertilizer-message-content">
                                <div className="fertilizer-typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                {showMap && (
                    <div className="fertilizer-map-container">
                        <div className="fertilizer-map-instructions">
                            <p>💡 Click anywhere on the map within Ethiopia to select your location</p>
                        </div>
                        <MapContainer
                            center={[9.0, 38.7]}
                            zoom={6}
                            style={{ height: '300px', width: '100%' }}
                            maxBounds={ETHIOPIA_BOUNDS}
                            maxBoundsViscosity={1.0}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="© OpenStreetMap contributors"
                            />
                            <Rectangle
                                bounds={ETHIOPIA_BOUNDS}
                                pathOptions={{ color: '#3388ff', weight: 2, fillOpacity: 0.1 }}
                            />
                            <LocationMarker />
                        </MapContainer>
                        <div className="fertilizer-map-controls">
                            <div className="fertilizer-coordinates-display">
                                {coordinates.lat && coordinates.lon ? (
                                    isWithinEthiopia(coordinates.lat, coordinates.lon)
                                        ? `Selected: ${coordinates.lat}, ${coordinates.lon}`
                                        : `Selected: ${coordinates.lat}, ${coordinates.lon} (out of bounds)`
                                ) : 'No location selected'}
                            </div>
                            <button
                                className="fertilizer-btn-primary"
                                onClick={handleMapLocationSelect}
                                disabled={!(coordinates.lat && coordinates.lon && isWithinEthiopia(coordinates.lat, coordinates.lon))}
                            >
                                Use Selected Location
                            </button>
                            <button
                                className="fertilizer-btn-secondary"
                                onClick={() => setShowMap(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                <div className="fertilizer-input-container">
                    <textarea
                        className="fertilizer-input-textarea"
                        rows={3}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={currentStep === 'coordinates' ? "Enter coordinates (lat,lon) or click on map above..." : "Type your message here..."}
                        disabled={isLoading}
                    />
                    <button
                        className="fertilizer-btn-primary"
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputMessage.trim()}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FertilizerChat; 