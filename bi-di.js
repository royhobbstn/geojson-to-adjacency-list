
const fs = require('fs').promises;
const BinaryHeap = require('./bh.js').BinaryHeap;
const toBestRoute = require('./index.js').toBestRoute;


exports.runBiDijkstra = runBiDijkstra;


function runBiDijkstra(adj_list, edge_hash, start, end) {

  // TODO this is not guaranteed to be an optimal solution (yet)

  const forward = {};
  const backward = {};

  const searchForward = doDijkstra(adj_list, edge_hash, forward, start);
  const searchBackward = doDijkstra(adj_list, edge_hash, backward, end); // TODO will be different in the case of a directed graph

  let latest;
  do {
    searchForward.next();
    latest = searchBackward.next().value;
  } while (!forward.visited[latest]);

  const geojson_forward = toBestRoute(latest, forward.prev, edge_hash);
  const geojson_backward = toBestRoute(latest, backward.prev, edge_hash);
  //
  // const path1 = fs.writeFile('./path1.geojson', JSON.stringify(geojson_forward), 'utf8');
  // const path2 = fs.writeFile('./path2.geojson', JSON.stringify(geojson_backward), 'utf8');
  //
  // Promise.all([path1, path2])
  //   .then(()=> {
  //     console.log('done');
  //   })
  //   .catch(err=> {
  //     console.log(err);
  //   });

}

function* doDijkstra(graph, edge_hash, ref, current) {

  const bh = new BinaryHeap();

  ref.dist = {};  // distances to each node
  ref.prev = {}; // node to parent_node lookup

  ref.visited = {}; // node has been fully explored

  Object.keys(graph).forEach(key=> {
    ref.dist[key] = Infinity;
  });

  ref.dist[current] = 0;

  do {
    graph[current].forEach(node => {
      const segment_distance = edge_hash[`${current}|${node}`].properties.MILES;
      const proposed_distance = ref.dist[current] + segment_distance;
      if (proposed_distance < ref.dist[node]) {
        if(ref.dist[node] !== Infinity) {
          bh.decrease_key(node, proposed_distance)
        } else {
          bh.push({key: node, dist: proposed_distance});
        }
        ref.dist[node] = proposed_distance;
        ref.prev[node] = current;
      }
    });
    ref.visited[current] = true;
    bh.remove(current);

    // get lowest value from heap
    current = bh.pop().key;

    yield current

  } while (true)
}
