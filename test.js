const fs = require('fs').promises;
const { connectedComponents } = require('./index.js');

main();

async function main() {

  const geojson_raw = await fs.readFile('./sample.geojson');

  const geojson = JSON.parse(geojson_raw);

  console.time('runningTime');
  connectedComponents(geojson);
  console.timeEnd('runningTime');

}