const fs = require('fs').promises;
const toAdjacencyList = require('./index.js');

main();

async function main() {

  const geojson_raw = await fs.readFile('./sample.geojson');

  const geojson = JSON.parse(geojson_raw);

  console.time('runningTime');
  const [adjacency_list, edge_hash] = toAdjacencyList(geojson);
  console.timeEnd('runningTime');

  const adjPr = fs.writeFile('./adjacency_list.json', JSON.stringify(adjacency_list), 'utf8');
  const edgePr = fs.writeFile('./edge_hash.json', JSON.stringify(edge_hash), 'utf8');

  await Promise.all([adjPr, edgePr]);

}