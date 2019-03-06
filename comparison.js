const fs = require('fs').promises;

// load traditional dijkstra and utilities
const {toAdjacencyList, toEdgeHash, runDijkstra} = require('./index.js');

// load standard bidirectional dijkstra
const biDiPlain = require('./bi-di.js').runBiDijkstra;

// load contraction hierarchy version bidirectional dijkstra
const {runBiDijkstra, toIdList} = require('./bi-di-ch.js');

// load contraction hierarchy output
const new_adj = require('./ch.json');
const new_edge = require('./ne.json');
const node_rank = require('./nr.json');


main();

async function main() {

  const geojson_raw = await fs.readFile('./full_network.geojson'); // full_network
  const geojson = JSON.parse(geojson_raw);

  // only pacific states
  geojson.features = geojson.features.filter(feat => {
    if (feat.properties.STFIPS === 6 || feat.properties.STFIPS === 41 || feat.properties.STFIPS === 53) {
      return true;
    }
  });

  const adjacency = toAdjacencyList(geojson);
  const edge_list = toEdgeHash(geojson);

  const id_list = toIdList(geojson);


  const dijkstra1 = runDijkstra(adjacency, edge_list, '-122.271317,37.775193', '-118.045746,33.902286', 'MILES');
  const dijkstra2 = runDijkstra(adjacency, edge_list, '-119.223149,46.232946', '-122.333841,47.601601', 'MILES');
  const dijkstra3 = runDijkstra(adjacency, edge_list, '-119.002189,35.208551', '-118.29097,33.892299', 'MILES');
  const dijkstra4 = runDijkstra(adjacency, edge_list, '-121.483001,38.570358', '-121.13968,45.598816', 'MILES');
  const dijkstra5 = runDijkstra(adjacency, edge_list, '-117.692679,33.466645', '-121.76513,38.64104', 'MILES');
  const dijkstra6 = runDijkstra(adjacency, edge_list, '-117.370566,33.988929', '-118.290177,33.74858', 'MILES');
  const dijkstra7 = runDijkstra(adjacency, edge_list, '-122.537194,47.21352', '-119.210114,34.252525', 'MILES');
  const dijkstra8 = runDijkstra(adjacency, edge_list, '-122.338221,47.6185', '-122.030907,37.259262', 'MILES');
  const dijkstra9 = runDijkstra(adjacency, edge_list, '-118.369301,33.945243', '-117.997239,33.846656', 'MILES');
  const dijkstra10 = runDijkstra(adjacency, edge_list, '-117.045083,32.774173', '-117.711731,34.075878', 'MILES');

  const bidirectional1 = biDiPlain(adjacency, edge_list,  '-122.271317,37.775193', '-118.045746,33.902286', 'MILES');
  const bidirectional2 = biDiPlain(adjacency, edge_list,  '-119.223149,46.232946', '-122.333841,47.601601', 'MILES');
  const bidirectional3 = biDiPlain(adjacency, edge_list,  '-119.002189,35.208551', '-118.29097,33.892299', 'MILES');
  const bidirectional4 = biDiPlain(adjacency, edge_list,  '-121.483001,38.570358', '-121.13968,45.598816', 'MILES');
  const bidirectional5 = biDiPlain(adjacency, edge_list,  '-117.692679,33.466645', '-121.76513,38.64104', 'MILES');
  const bidirectional6 = biDiPlain(adjacency, edge_list,  '-117.370566,33.988929', '-118.290177,33.74858', 'MILES');
  const bidirectional7 = biDiPlain(adjacency, edge_list,  '-122.537194,47.21352', '-119.210114,34.252525', 'MILES');
  const bidirectional8 = biDiPlain(adjacency, edge_list, '-122.338221,47.6185', '-122.030907,37.259262', 'MILES');
  const bidirectional9 = biDiPlain(adjacency, edge_list,  '-118.369301,33.945243', '-117.997239,33.846656', 'MILES');
  const bidirectional10 = biDiPlain(adjacency, edge_list,  '-117.045083,32.774173', '-117.711731,34.075878', 'MILES');

  const ch1 = runBiDijkstra(new_adj, new_edge, '-122.271317,37.775193', '-118.045746,33.902286', 'MILES', node_rank, id_list);
  const ch2 = runBiDijkstra(new_adj, new_edge, '-119.223149,46.232946', '-122.333841,47.601601', 'MILES', node_rank, id_list);
  const ch3 = runBiDijkstra(new_adj, new_edge, '-119.002189,35.208551', '-118.29097,33.892299', 'MILES', node_rank, id_list);
  const ch4 = runBiDijkstra(new_adj, new_edge, '-121.483001,38.570358', '-121.13968,45.598816', 'MILES', node_rank, id_list);
  const ch5 = runBiDijkstra(new_adj, new_edge, '-117.692679,33.466645', '-121.76513,38.64104', 'MILES', node_rank, id_list);
  const ch6 = runBiDijkstra(new_adj, new_edge, '-117.370566,33.988929', '-118.290177,33.74858', 'MILES', node_rank, id_list);
  const ch7 = runBiDijkstra(new_adj, new_edge, '-122.537194,47.21352', '-119.210114,34.252525', 'MILES', node_rank, id_list);
  const ch8 = runBiDijkstra(new_adj, new_edge, '-122.338221,47.6185', '-122.030907,37.259262', 'MILES', node_rank, id_list);
  const ch9 = runBiDijkstra(new_adj, new_edge, '-118.369301,33.945243', '-117.997239,33.846656', 'MILES', node_rank, id_list);
  const ch10 = runBiDijkstra(new_adj, new_edge, '-117.045083,32.774173', '-117.711731,34.075878', 'MILES', node_rank, id_list);
}











