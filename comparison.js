const fs = require('fs').promises;
const dj3rd = require('dijkstrajs');

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

  const alt_graph = createDijkstraJsGraph(geojson, 'MILES');

  // only pacific states
  geojson.features = geojson.features.filter(feat => {
    if (feat.properties.STFIPS === 6 || feat.properties.STFIPS === 41 || feat.properties.STFIPS === 53) {
      return true;
    }
  });

  const adjacency = toAdjacencyList(geojson);
  const edge_list = toEdgeHash(geojson);
  const id_list = toIdList(geojson);


  const coords = [
    ['-122.271317,37.775193', '-118.045746,33.902286'],
    ['-119.223149,46.232946', '-122.333841,47.601601'],
    ['-119.002189,35.208551', '-118.29097,33.892299'],
    ['-121.483001,38.570358', '-121.13968,45.598816'],
    ['-117.692679,33.466645', '-121.76513,38.64104'],
    ['-117.370566,33.988929', '-118.290177,33.74858'],
    ['-122.537194,47.21352', '-119.210114,34.252525'],
    ['-122.338221,47.6185', '-122.030907,37.259262'],
    ['-118.369301,33.945243', '-117.997239,33.846656'],
    ['-117.045083,32.774173', '-117.711731,34.075878']
  ];

  const dijkstra = [];
  const bidirectional = [];
  const ch = [];
  const correct = [];

  coords.forEach((pair, index) => {
    dijkstra[index] = runDijkstra(adjacency, edge_list, pair[0], pair[1], 'MILES');
    bidirectional[index] = biDiPlain(adjacency, edge_list, pair[0], pair[1], 'MILES');
    ch[index] = runBiDijkstra(new_adj, new_edge, pair[0], pair[1], 'MILES', node_rank, id_list);
    correct[index] = toCorrectPath(alt_graph, edge_list, pair[0], pair[1], 'MILES');
  });

  console.log(`index`,`Dijkstra`,`BiDirectional`,`ContractionHierarchy`);
  for(let i=0; i<coords.length; i++) {
    console.log(i,dijkstra[i].segments.length,dijkstra[i].distance.toFixed(5),bidirectional[i].segments.length,bidirectional[i].distance.toFixed(5),ch[i].segments.length,ch[i].distance.toFixed(5),correct[i].segments.length,correct[i].distance.toFixed(5));
  }

  // fs.writeFile('./comparison_dijkstra.geojson', JSON.stringify(dijkstra[0].route));
  // fs.writeFile('./comparison_bidirectional.geojson', JSON.stringify(bidirectional[0].route));
  // fs.writeFile('./comparison_ch.geojson', JSON.stringify(ch[0].route));
  // fs.writeFile('./comparison_correct.geojson', JSON.stringify(correct[0].route));
}


function createDijkstraJsGraph(geojson, cost_field) {
  const graph = {};
  geojson.features.forEach((f, i) => {
    if(!geojson.features[i+1]){
      return;
    }
    const start = f.geometry.coordinates[0].join(',');
    const end = f.geometry.coordinates[f.geometry.coordinates.length -1].join(',');
    const cost = f.properties[cost_field];
    if(!graph[start]) {
      graph[start] = {};
    }
    if(!graph[end]) {
      graph[end] = {};
    }
    graph[start][end] = cost;
    graph[end][start] = cost;
  });
  return graph;
}

function toCorrectPath(graph, edge_list, start, end, cost_field) {
  const path = dj3rd.find_path(graph, start, end);

  const geojson_features = [];
  let distance = 0;
  const segments = [];
  path.forEach((node, i) => {
      if(!path[i+1]) {
        return;
      }
      const feature = edge_list[`${node}|${path[i+1]}`];
      geojson_features.push(feature);
      distance += feature.properties[cost_field];
      segments.push(feature.properties.ID);
  });

  const route = {
    "type": "FeatureCollection",
    "features": geojson_features
  };

  return {distance, segments, route};
}







