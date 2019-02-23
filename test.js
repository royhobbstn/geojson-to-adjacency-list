const fs = require('fs').promises;
const { toAdjacencyList, toEdgeHash, runBiDijkstra } = require('./bi-di.js');
const { runDijkstra } = require('./index.js');

main();

async function main() {

  const geojson_raw = await fs.readFile('./full_network.geojson');

  const geojson = JSON.parse(geojson_raw);

  const adjacency = toAdjacencyList(geojson);
  const edge_list = toEdgeHash(geojson);

  console.time('runBiDijkstra');
  // const dijkstra = runBiDijkstra(adjacency, edge_list,  '-122.026583,37.334387', '-121.959595,37.294017'); // issues
  const dijkstra = runBiDijkstra(adjacency, edge_list,  '-152.07283,65.171303', '-111.099365,32.162209');
  console.timeEnd('runBiDijkstra');
  //
  console.time('runDijkstra');
  // const dijkstra = runDijkstra(adjacency, edge_list,  '-122.026583,37.334387', '-121.959595,37.294017'); // issues
  const dijkstra2 = runDijkstra(adjacency, edge_list,  '-152.07283,65.171303', '-111.099365,32.162209');
  console.timeEnd('runDijkstra');
}