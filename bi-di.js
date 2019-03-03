
const fs = require('fs').promises;
const BinaryHeap = require('./bh.js').BinaryHeap;
const toBestRoute = require('./index.js').toBestRoute;

const debug = false;

exports.runBiDijkstra = runBiDijkstra;


function runBiDijkstra(adj_list, edge_hash, start, end, cost_field) {

  // TODO this is not guaranteed to be an optimal solution (yet)

  const forward = {};
  const backward = {};

  const searchForward = doDijkstra(adj_list, edge_hash, forward, start, cost_field, 'forward');
  const searchBackward = doDijkstra(adj_list, edge_hash, backward, end, cost_field, 'backward');

  let latest;
  do {
    searchForward.next();
    latest = searchBackward.next().value;
  } while (!forward.visited[latest]);

  const geojson_forward = toBestRoute(latest, forward.prev, edge_hash);
  const geojson_backward = toBestRoute(latest, backward.prev, edge_hash);

  // console.log('forward');
  // geojson_forward.features.forEach(g=> {
  //   console.log(g.properties.ID, g.properties[cost_field]);
  // });
  // console.log('backward');
  // geojson_backward.features.forEach(g=> {
  //   console.log(g.properties.ID, g.properties[cost_field]);
  // });
  //
  // fs.writeFile('./orig_path1.geojson', JSON.stringify(geojson_forward), 'utf8');
  // fs.writeFile('./orig_path2.geojson', JSON.stringify(geojson_backward), 'utf8');

}

function* doDijkstra(graph, edge_hash, ref, current, cost_field, direction) {

  const bh = new BinaryHeap();

  ref.dist = {};  // distances to each node
  ref.prev = {}; // node to parent_node lookup

  ref.visited = {}; // node has been fully explored

  Object.keys(graph).forEach(key=> {
    ref.dist[key] = Infinity;
  });

  ref.dist[current] = 0;

  let explored = 0;

  do {
    explored++;

    if(debug) {
      console.log(direction);
      console.log({current, explored});
      console.time('bi-di');
    }

    graph[current].forEach(node => {
      const segment_distance = edge_hash[`${current}|${node}`].properties[cost_field];
      const proposed_distance = ref.dist[current] + segment_distance;
      if (proposed_distance < ref.dist[node]) {
        if(ref.dist[node] !== Infinity) {
          bh.decrease_key(node, proposed_distance)
        } else {
          bh.push({key: node, value: proposed_distance});
        }
        ref.dist[node] = proposed_distance;
        ref.prev[node] = current;
      }
    });
    ref.visited[current] = true;
    bh.remove(current);

    // get lowest value from heap
    current = bh.pop().key;

    if(debug){
      console.log('bh length', bh.length());
      console.log('edges', graph[current].length);
      console.timeEnd('bi-di');
      console.log('=======');
    } else {
      // bh.elapsed();
    }

    yield current

  } while (true)
}
