
//

// TODO ArcFlags?

const fs = require('fs').promises;
const BinaryHeap = require('./bh.js').BinaryHeap;
const { toAdjacencyList, toEdgeHash, runDijkstra } = require('./index.js');

exports.contractGraph = contractGraph;

function contractGraph(geojson) {

  const contracted_nodes = {};

  const adjacency_list = toAdjacencyList(geojson);
  const edge_hash = toEdgeHash(geojson);

  const vertex_set = Object.keys(adjacency_list); // todo order vertex set

  const bh = new BinaryHeap();

  vertex_set.forEach(vertex => {
    const score = getVertexScore(vertex);
    bh.push({key: vertex, dist: score});
  });

  function getVertexScore(v) {
    const shortcut_count = contract(v, true);
    const edge_count = adjacency_list[v].length;
    const edge_difference = shortcut_count - edge_count;
    const contracted_neighbors = getContractedNeighborCount(v);
    console.log(edge_difference, contracted_neighbors);
    return edge_difference + contracted_neighbors;
  }

  function getContractedNeighborCount(v) {
    return adjacency_list[v].reduce((acc, node) => {
      const is_contracted = contracted_nodes[node] ? 1 : 0;
      return acc + is_contracted;
    }, 0);
  }

  let contraction_level = 1;

  console.log(bh.length());

  while(bh.length() > 1) {

    let found_lowest = false;
    do {
      const node_obj = bh.peek(); // todo peek duplicated kinda
      const first_vertex = node_obj.key;
      const score = getVertexScore(first_vertex);
      bh.decrease_key(first_vertex, score);
      const check_node = bh.peek();
      if(check_node.key === first_vertex) {
        console.log('hit');
        found_lowest = true;
      } else {
        console.log('miss');
      }
    } while(found_lowest === false);

    const v = bh.pop();
    // console.log(v);
    contract(v.key);

    contracted_nodes[v.key] = contraction_level;
    contraction_level++;
  }

  fs.writeFile('./shortcuts.geojson', JSON.stringify(geojson), 'utf8');

  function contract(v, get_count_only) {

    const connections = adjacency_list[v];
    // if(!get_count_only){
    //   console.log(connections);
    // }
    let shortcut_count = 0;

    // Get all pairs of edges
    const combinations = [];
    connections.forEach(u => {
      connections.forEach(w => {
        // ignore point to itself, and reverse path
        if(u === w || combinations.includes(`${w}|${u}`)) {
          return;
        }
        combinations.push(`${u}|${w}`);
      });
    });

    // shortcut distance for each path
    combinations.forEach(c=> {
      const [u, w] = c.split('|');
      // dist u to v
      const dist1 = edge_hash[`${u}|${v}`].properties.MILES;
      // dist v to w
      const dist2 = edge_hash[`${v}|${w}`].properties.MILES;
      const total = dist1 + dist2;

      // get dijkstra shortest path distance for u to w
      const path = runDijkstra(adjacency_list, edge_hash, u, w);
      const dijkstra = path.features.reduce((acc, feature) => {
        return acc + feature.properties.MILES;
      }, 0);

      // todo: many times, dijkstra finds the path through v
      // does that mean I need to delete v before running dijkstra?
      // or can i do what i just did below?
      // TODO hint:  Then remove v and its adjacent arcs from the graph
      if(total <= dijkstra) {
        shortcut_count++;

        if(!get_count_only) {
          // adjacency_list[u].push(w);
          // adjacency_list[w].push(u);

          // temporary - in order to visualize
          const shortcut = {
            type: 'Feature',
            properties:
              {
                ID: 99999,
                MILES: total
              },
            geometry:
              {
                type: 'LineString',
                coordinates:
                  [u.split(',').map(d => Number(d)),
                    w.split(',').map(d => Number(d))]
              }
          };

          // todo visualize contraction order (point layer)

          geojson.features.push(shortcut);
          // edge_hash[`${u}|${w}`] = {properties: {MILES: total}};
          // edge_hash[`${w}|${u}`] = {properties: {MILES: total}};
        }
      }

    });

    return shortcut_count;
  }


}

//
// Node Order
//
// edge difference #shortcuts – #edges incident to v
// uniformity e.g. #deleted neighbors
//
// integrated construction and ordering:
// 1 remove node v on top of the priority queue
// 2 contract node v
// 3 update weights of remaining nodes

// – Let G = G'0 be the initial graph
// – Let Gi be the graph obtained from Gi-1 by contracting
// ui
// that is, without
// ui and adjacent arcs and with shortcuts
// in particular therefore,
//   Gi has n – i nodes
// – In the end, let G* = the original graph with all nodes and
// arcs and all shortcuts from any of the
// G
// 1, G
// 2, ...
// – In the implementation, we can work on one and the same
// graph data structure throughout the algorithm
