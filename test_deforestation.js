import { DeforestationClient } from 'openepi-client';

const client = new DeforestationClient();

client.getBasin({ lon: 30.0619, lat: -1.9441 }).then((result) => {
  const { data, error } = result;
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}); 