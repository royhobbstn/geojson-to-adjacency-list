const fs = require('fs').promises;
const { runBiDijkstra } = require('./bi-di.js');
const { toAdjacencyList, toEdgeHash, runDijkstra } = require('./index.js');
const { contractGraph } = require('./contraction_hierarchy.js');

main();

async function main() {

  const geojson_raw = await fs.readFile('./sample.geojson'); // full_network

  const geojson = JSON.parse(geojson_raw);

  console.time('contracted');
  const contracted = contractGraph(geojson);
  console.timeEnd('contracted');
  //
  // const adjacency = toAdjacencyList(geojson);
  // const edge_list = toEdgeHash(geojson);
  //
  // console.time('runBiDijkstra');
  // // const dijkstra = runBiDijkstra(adjacency, edge_list,  '-122.026583,37.334387', '-121.959595,37.294017'); // issues
  // const dijkstra = runBiDijkstra(adjacency, edge_list,  '-152.07283,65.171303', '-111.099365,32.162209');
  // console.timeEnd('runBiDijkstra');
  // //
  // console.time('runDijkstra');
  // // const dijkstra = runDijkstra(adjacency, edge_list,  '-122.026583,37.334387', '-121.959595,37.294017'); // issues
  // const dijkstra2 = runDijkstra(adjacency, edge_list,  '-152.07283,65.171303', '-111.099365,32.162209');
  // console.timeEnd('runDijkstra');
}