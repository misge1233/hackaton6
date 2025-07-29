# 🌱 AgriPulse Agriculture Advisory Platform

## 📝 Problem Statement

Smallholder farmers and agricultural stakeholders often lack timely, location-specific, and actionable information for making decisions about fertilizer use, weather risks, flood threats, deforestation, and soil health. AgriPulse provides a unified, user-friendly web application that delivers real-time, data-driven agricultural advisory services to empower better decision-making and improve sustainability.

## 🛠️ Technology Stack

- **Frontend:** React 18, Bootstrap 5
- **Styling:** Custom CSS (modern gradients, card layouts, responsive design)
- **APIs:** OpenEPI Client, Groq API (for AI chatbot)
- **Backend:** Node.js (API proxy/server)
- **Build Tool:** Create React App

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd openepi_hackaton
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Create a `.env` file in the root directory (if required)
   - Add your Groq API key:
     ```env
     GROQ_API_KEY=your_groq_api_key_here
     ```
4. **Start the backend server:**
   ```bash
   cd backend
   node server.js
   ```
5. **Start the development server:**
   ```bash
   npm start
   ```
6. **Open the app:**
   - Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
```

## 🌍 APIs & Datasets Used

- **OpenEPI Client:**
  - **Geocoding API:** Converts location names to coordinates for all features.
  - **Weather API:** Provides real-time and forecasted weather data.
  - **Flood API:** Delivers flood risk assessment and historical analysis.
  - **Deforestation API:** Monitors forest cover and trends.
  - **Soil API:** Analyzes soil properties and suitability.
  - **Crop Health API:** Enables crop image health analysis.
- **Fertilizer endpoint API (CIAT-CGIAR):** Provides fertilizer recommendations based on crop and location.
- **Groq API:** AI-powered chatbot for fertilizer and general advisory (API key required)

## ✨ Features

- **Location Search via Geocoding:** Enter a location name (city, town, etc.) to get all data—no need for manual coordinates.
- **Fertilizer Advisory Chatbot:** AI-powered, location-aware, crop-specific recommendations
- **Weather Forecast:** Real-time, 7/14/30-day forecasts with detailed metrics
- **Flood Forecast:** Risk assessment, early warnings, and historical analysis
- **Deforestation Info:** Forest cover monitoring and conservation insights
- **Soil Type Analysis:** Soil property analysis and crop suitability
- **Crop Health:** Upload crop images for health analysis
- **Modern UI:** Responsive, card-based, with smooth gradients and animations

## 📚 Example API Usage

```js
import { WeatherClient, FloodClient, DeforestationClient, SoilClient, GeocoderClient } from 'openepi-client';

// Weather Forecast
const weatherClient = new WeatherClient();
const weather = await weatherClient.getLocationForecast({ lon: 52.52, lat: 13.40 });

// Flood Forecast
const floodClient = new FloodClient();
const flood = await floodClient.getSummaryForecast({ lon: 22.26, lat: 4.88 });

// Deforestation Info
const deforestationClient = new DeforestationClient();
const forest = await deforestationClient.getBasin({ lon: 30.06, lat: -1.94 });

// Soil Type
const soilClient = new SoilClient();
const soil = await soilClient.getSoilType({ lon: 9.58, lat: 60.1 });

// Geocoding
const geocoderClient = new GeocoderClient();
const geo = await geocoderClient.getGeocoding({ q: 'Addis Ababa' });
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is created for the OpenEPI hackathon and is licensed under the ISC License.

---

**Built with ❤️ for the OpenEPI Hackathon** 