
function toAdjacencyList (geo) {

  const features = Array.isArray(geo) ? geo : geo.features;

  const adjacency_list = {};
  const edge_hash = {};

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

    edge_hash[`${start_vertex}|${end_vertex}`] = feature;

  });

  return [adjacency_list, edge_hash];
}

exports.toAdjacencyList = toAdjacencyList;
module.exports  = toAdjacencyList;