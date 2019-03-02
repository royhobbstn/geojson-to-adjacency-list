const fs = require('fs').promises;
const { runBiDijkstra, toIdList } = require('./bi-di-ch.js');
const biDiPlain = require('./bi-di.js').runBiDijkstra;

const { toAdjacencyList, toEdgeHash, runDijkstra } = require('./index.js');
const { contractGraph } = require('./contraction_hierarchy.js');

main();

async function main() {

  const geojson_raw = await fs.readFile('./sample.geojson'); // full_network

  const geojson = JSON.parse(geojson_raw);

  console.time('contracted');
  const [new_adj, new_edge, node_rank] = contractGraph(geojson, {cost_field: 'MILES'});
  console.timeEnd('contracted');

  const adjacency = toAdjacencyList(geojson);
  const edge_list = toEdgeHash(geojson);
  const id_list = toIdList(geojson);

  console.time('runBiDijkstra');
  const sample1 = runBiDijkstra(new_adj, new_edge,  '-122.247284,37.809112', '-121.974367,37.323066', 'MILES', node_rank, id_list);
  // const small1 = runBiDijkstra(new_adj, new_edge,  '-122.026583,37.334387', '-121.993577,37.289151', 'MILES', node_rank, id_list);
  console.timeEnd('runBiDijkstra');

  console.time('runPlain');
  const sample2 = biDiPlain(adjacency, edge_list,  '-122.247284,37.809112', '-121.974367,37.323066', 'MILES');
  // const small2 = biDiPlain(adjacency, edge_list,  '-122.026583,37.334387', '-121.993577,37.289151', 'MILES');
  console.timeEnd('runPlain');

  // console.time('runDijkstra');
  // // const dijkstra = runDijkstra(adjacency, edge_list,  '-122.026583,37.334387', '-121.959595,37.294017', 'MILES'); // issues
  // const dijkstra2 = runDijkstra(adjacency, edge_list,  '-152.07283,65.171303', '-111.099365,32.162209', 'MILES');
  // console.timeEnd('runDijkstra');
}