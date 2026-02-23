const axios = require('axios');

async function inspectData() {
  const response = await axios.get(
    'https://data.sfgov.org/resource/yhqp-riqs.geojson',
    { params: { $limit: 1 } }
  );

  const feature = response.data.features[0];
  // console.log('Properties:', Object.keys(feature.properties));
  // console.log('\nSample data:', JSON.stringify(feature.properties, null, 2));
  // console.log('\ngeometry:', feature.geometry)
  console.log(JSON.stringify(feature))
}

inspectData();