# 🌱 OpenEPI Agriculture Advisory Platform

## 📝 Problem Statement

Smallholder farmers and agricultural stakeholders often lack timely, location-specific, and actionable information for making decisions about fertilizer use, weather risks, flood threats, deforestation, and soil health. This platform provides a unified, user-friendly web application that delivers real-time, data-driven agricultural advisory services to empower better decision-making and improve sustainability.

## 🛠️ Technology Stack

- **Frontend:** React 18, Bootstrap 5
- **Styling:** Custom CSS (modern gradients, card layouts, responsive design)
- **Mapping:** Leaflet.js for interactive maps
- **APIs:** OpenEPI Client, Groq API, NextGen AgroAdvisory
- **AI:** Groq API for chatbot
- **Backend:** Node.js (for API proxy/server)
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
4. **Start the development server:**
   ```bash
   npm start
   ```
5. **Open the app:**
   - Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
```

## 🌍 APIs & Datasets Used

- **OpenEPI Client**: Provides weather, flood, deforestation, and soil data (public APIs, no key required)
- **Groq API**: AI-powered chatbot for fertilizer and general advisory (API key required)
- **fertilizer recommendation**: Fertilizer recommendation engine (API key may be required)

## ✨ Features

- **Fertilizer Advisory Chatbot:** AI-powered, location-aware, crop-specific recommendations
- **Weather Forecast:** Real-time, 7-day forecasts with detailed metrics
- **Flood Forecast:** Risk assessment, early warnings, and historical analysis
- **Deforestation Info:** Forest cover monitoring and conservation insights
- **Soil Type Analysis:** Soil property analysis and crop suitability
- **Interactive Maps:** Select locations for personalized data
- **Modern UI:** Responsive, card-based, with smooth gradients and animations

## 📚 Example API Usage

```js
import { WeatherClient, FloodClient, DeforestationClient, SoilClient } from 'openepi-client';

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