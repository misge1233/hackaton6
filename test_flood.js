import { FloodClient } from 'openepi-client';

const client = new FloodClient();

// Test with coordinates that might have flood data (near rivers/flood-prone areas)
client.getSummaryForecast({ lon: 22.260536, lat: 4.882569 }).then((result) => {
  const { data, error } = result;
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}); 