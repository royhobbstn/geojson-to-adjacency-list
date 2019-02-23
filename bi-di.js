
const fs = require('fs').promises;
const BinaryHeap = require('./bh.js').BinaryHeap;

exports.toEdgeHash = toEdgeHash;
exports.toAdjacencyList = toAdjacencyList;
exports.connectedComponents = connectedComponents;
exports.runBiDijkstra = runBiDijkstra;

function toAdjacencyList (geo) {

  const features = Array.isArray(geo) ? geo : geo.features;

  const adjacency_list = {};

  features.forEach(feature => {
    const coordinates = feature.geometry.coordinates;
    if(!coordinates) {
      return;
    }
    const start_vertex = coordinates[0].join(',');
    const end_vertex = coordinates[coordinates.length - 1].join(',');

    if(!adjacency_list[start_vertex]) {
      adjacency_list[start_vertex] = [end_vertex];
    } else {
      adjacency_list[start_vertex].push(end_vertex);
    }

    if(!adjacency_list[end_vertex]) {
      adjacency_list[end_vertex] = [start_vertex];
    } else {
      adjacency_list[end_vertex].push(start_vertex);
    }

  });

  return adjacency_list;
}

function toEdgeHash(geo) {

  const features = Array.isArray(geo) ? geo : geo.features;

  const edge_hash = {};

  features.forEach(feature => {
    const coordinates = feature.geometry.coordinates;
    if(!coordinates) {
      return;
    }
    const start_vertex = coordinates[0].join(',');
    const end_vertex = coordinates[coordinates.length - 1].join(',');

    edge_hash[`${start_vertex}|${end_vertex}`] = feature;
    edge_hash[`${end_vertex}|${start_vertex}`] = feature;
  });

  return edge_hash;
}


function connectedComponents(geo) {

  const features = Array.isArray(geo) ? geo : geo.features;

  // create an adjacency list from GeoJSON data
  const adjacencyList = toAdjacencyList(features);

  // get a list of all nodes
  const nodeList = Object.keys(adjacencyList);

  // initialize explored list to 0 for all nodes
  // will keep track of connected component
  const explored = nodeList.reduce((acc, value) => {
    acc[value] = 0;
    return acc;
  }, {});

  let connected_component = 0;
  let component_count = 0;
  const cc_results = [];

  // loop through node list, making sure they are all explored.
  // Depth first search
  nodeList.forEach(node => {
    if(!explored[node]) {

      connected_component++;

      explore(node);

      // reset connected component
      cc_results.push({cc: connected_component, count: component_count});
      component_count = 0;
    }
  });

  // recursively search all nodes
  function explore(vertex) {
    component_count++;
    explored[vertex] = connected_component;
    adjacencyList[vertex].forEach(v => {
      if(!explored[v]) {
        explore(v);
      }
    });
  }

  // return lookup of connected component to size rank
  const ranked_lookup = rankResults(cc_results);

  // create copy of geo data with connected component rank
  return features.map(feature => {
    const start_pt = feature.geometry.coordinates[0];
    const properties = {...feature.properties, __groupId: ranked_lookup[explored[start_pt]] };
    return Object.assign({}, feature, {properties});
  });

}

function rankResults(results) {
  const sorted = [...results].sort((a, b) => {
    return b.count - a.count;
  });

  return sorted.reduce((acc, value, index) => {
    acc[value.cc] = index + 1;
    return acc;
  }, {});
}

//


function runBiDijkstra(adj_list, edge_hash, start, end) {

  const forward = {};
  const backward = {};

  const searchForward = doDijkstra(adj_list, edge_hash, forward, start);
  const searchBackward = doDijkstra(adj_list, edge_hash, backward, end); //temp

  let latest;
  do {
    searchForward.next();
    latest = searchBackward.next().value;
  } while (!forward.visited[latest]);

  // const geojson_forward = toBestRoute(latest, forward.prev, edge_hash);
  // const geojson_backward = toBestRoute(latest, backward.prev, edge_hash);
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
          bh.remove(node)
        }
        ref.dist[node] = proposed_distance;
        bh.push({key: node, dist: proposed_distance});
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

function toBestRoute(end_pt, prev, edge_hash) {

  const features = [];

  while(prev[end_pt]) {
    features.push(edge_hash[`${end_pt}|${prev[end_pt]}`]);
    end_pt = prev[end_pt];
  }

  return {
    "type": "FeatureCollection",
    "features": features
  };

}

// return a GeoJSON Collection of Points with distance from origin.
function toPointLayer(dist) {

  const features = Object.keys(dist).map(key=> {
    return {
      "type": "Feature",
      "properties": {
        "distance": dist[key],
        "coords": key,
      },
      "geometry": {
        "type": "Point",
        "coordinates": key.split(',').map(k => Number(k))
      }
    }
  });

  return {
    "type": "FeatureCollection",
    "features": features
  };
}