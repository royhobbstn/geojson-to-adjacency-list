
const fs = require('fs').promises;
const BinaryHeap = require('./bh.js').BinaryHeap;
const toBestRoute = require('./index.js').toBestRoute;


exports.runBiDijkstra = runBiDijkstra;
exports.toIdList = toIdList;

function toIdList(geojson) {
  const obj = {};

  geojson.features.forEach(feature=> {
    obj[feature.properties.ID] = feature;
  });

  return obj;
}

function runBiDijkstra(adj_list, edge_hash, start, end, cost_field, node_rank, id_list) {

  // TODO this is not guaranteed to be an optimal solution (yet)

  const forward = {};
  const backward = {};

  const searchForward = doDijkstra(adj_list, edge_hash, forward, start, cost_field, node_rank, 'forward');
  const searchBackward = doDijkstra(adj_list, edge_hash, backward, end, cost_field, node_rank, 'backward');

  let latest;
  do {
    searchForward.next();
    const nextVal = searchBackward.next();
    if(nextVal) {
      latest = nextVal.value;
    }
  } while (!forward.visited[latest]);

  const geojson_forward = toBestRoute(latest, forward.prev, edge_hash);
  const geojson_backward = toBestRoute(latest, backward.prev, edge_hash);

  console.log('forward');
  const ff = geojson_forward.features.reduce((acc, g) => {
    const id = g.properties.ID;
    if(typeof id === "string") {
      const nums = id.split(',');
      acc = [...acc, ...nums];
    } else if(typeof id === "number") {
      acc.push(String(id));
    }
    return acc;
  }, []);

  console.log('backward');
  const bb = geojson_backward.features.reduce((acc, g) => {
    const id = g.properties.ID;
    if(typeof id === "string") {
      const nums = id.split(',');
      acc = [...acc, ...nums];
    } else if(typeof id === "number") {
      acc.push(String(id));
    }
    return acc;
  }, []);

  const fc = {
    "type": "FeatureCollection",
    "features": ff.map(d=>id_list[d])
  };

  const bc = {
    "type": "FeatureCollection",
    "features": bb.map(d=>id_list[d])
  };

  // fs.writeFile('./path1.geojson', JSON.stringify(fc), 'utf8');
  // fs.writeFile('./path2.geojson', JSON.stringify(bc), 'utf8');
}

function* doDijkstra(graph, edge_hash, ref, current, cost_field, node_rank, direction) {

  const bh = new BinaryHeap();

  ref.dist = {};  // distances to each node
  ref.prev = {}; // node to parent_node lookup

  ref.visited = {}; // node has been fully explored

  Object.keys(graph).forEach(key=> {
    ref.dist[key] = Infinity;
  });

  ref.dist[current] = 0;

  const current_rank = node_rank[current];

  let inProgress = true;

  do {
    graph[current].forEach(node => {
      if(node_rank[node] < current_rank) {
        return;
      }
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
    const elem = bh.pop();
    // console.log(direction, elem);
    if(elem) {
      current = elem.key;
    } else {
      current = '';
      inProgress = false;
    }

    yield current

  } while (inProgress);

  yield(false);
}
