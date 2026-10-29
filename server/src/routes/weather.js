const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  // Agricultural weather intelligence (realistic seasonal telemetry)
  const weatherData = {
    current: {
      location: 'Central Iowa Agricultural Station (Story County)',
      tempF: 68,
      condition: 'Partly Cloudy',
      humidityPct: 54,
      windSpeedMph: 6.5,
      windDirection: 'SSE',
      soilTemp4inF: 57.2,
      soilMoisturePct: 22.4,
      precipitationTodayInches: 0.0,
      fieldConditions: {
        sprayabilityIndex: 'Optimal',
        sprayAdvice: 'Ideal wind conditions (6.5 mph) and humidity for droplet retention. Minimal drift risk.',
        plantingSuitability: 'Prime',
        plantingAdvice: 'Soil temperature at 4 inches is 57.2°F (>50°F threshold). Ground firm and trafficable.'
      }
    },
    forecast: [
      { day: 'Today', highF: 72, lowF: 51, condition: 'Partly Cloudy', rainProbPct: 10, windMph: 7, suitability: 'Optimal' },
      { day: 'Tomorrow', highF: 75, lowF: 54, condition: 'Sunny & Warm', rainProbPct: 5, windMph: 8, suitability: 'Optimal' },
      { day: 'Friday', highF: 69, lowF: 48, condition: 'Scattered Showers', rainProbPct: 65, windMph: 14, suitability: 'Poor (Rain Delay)' },
      { day: 'Saturday', highF: 64, lowF: 45, condition: 'Cloudy & Cool', rainProbPct: 20, windMph: 10, suitability: 'Drying Out' },
      { day: 'Sunday', highF: 70, lowF: 50, condition: 'Sunny', rainProbPct: 0, windMph: 6, suitability: 'Optimal' }
    ]
  };

  res.json({ success: true, data: weatherData });
});

module.exports = router;
