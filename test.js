const fs = require('fs').promises;
const {runBiDijkstra, toIdList} = require('./bi-di-ch.js');
const biDiPlain = require('./bi-di.js').runBiDijkstra;
const new_adj = require('./ch.json');
const new_edge = require('./ne.json');
const node_rank = require('./nr.json');

const {toAdjacencyList, toEdgeHash, runDijkstra} = require('./index.js');
// const {contractGraph} = require('./contraction_hierarchy.js');

main();

async function main() {

  const geojson_raw = await fs.readFile('./full_network.geojson'); // full_network

  const geojson = JSON.parse(geojson_raw);

  geojson.features = geojson.features.filter(feat => {
    if (feat.properties.STFIPS === 6 || feat.properties.STFIPS === 41 || feat.properties.STFIPS === 53) {
      return true;
    }
  });


  const adjacency = toAdjacencyList(geojson);
  const edge_list = toEdgeHash(geojson);
  const id_list = toIdList(geojson);

  setTimeout(function () {

    // performance test
    const adj_keys = Object.keys(adjacency);
    const adj_length = adj_keys.length;

    // console.time('Dijkstra');
    // for (let i = 0; i < 1000; i++) {
    //   let rnd1 = Math.floor(Math.random() * adj_length);
    //   let rnd2 = Math.floor(Math.random() * adj_length);
    //   console.time('test: ' + i);
    //   console.log(adj_keys[rnd1], adj_keys[rnd2]);
    //   const test = runDijkstra(adjacency, edge_list, adj_keys[rnd1], adj_keys[rnd2], 'MILES');
    //   console.timeEnd('test: ' + i);
    // }
    // console.timeEnd('Dijkstra');

    console.time('BiDijkstra');
    for (let i = 0; i < 1000; i++) {
      let rnd1 = Math.floor(Math.random() * adj_length);
      let rnd2 = Math.floor(Math.random() * adj_length);
      console.time('test: ' + i);
      console.log(adj_keys[rnd1], adj_keys[rnd2]);
      const test = biDiPlain(adjacency, edge_list, adj_keys[rnd1], adj_keys[rnd2], 'MILES');
      console.timeEnd('test: ' + i);
    }
    console.timeEnd('BiDijkstra');

    // console.time('ContractionHierarchy');
    // for (let i = 0; i < 1000; i++) {
    //   let rnd1 = Math.floor(Math.random() * adj_length);
    //   let rnd2 = Math.floor(Math.random() * adj_length);
    //   console.time('test: ' + i);
    //   console.log(adj_keys[rnd1], adj_keys[rnd2]);
    //   const test = runBiDijkstra(new_adj, new_edge, adj_keys[rnd1], adj_keys[rnd2], 'MILES', node_rank, id_list);
    //   console.timeEnd('test: ' + i);
    // }
    // console.timeEnd('ContractionHierarchy');

  }, 3000);
}