
const fs = require('fs').promises;
const {contractGraph} = require('./contraction_hierarchy.js');


main();

async function main() {

  const geojson_raw = await fs.readFile('./full_network.geojson'); // full_network

  const geojson = JSON.parse(geojson_raw);

  geojson.features = geojson.features.filter(feat => {
      if(feat.properties.MILES && feat.geometry.coordinates && feat.properties.STFIPS === 53) {
        if(feat.properties.ID !== 477) {
          // TODO deal with this in network cleanup
          return true;
        }
      }
  });

  console.time('contractTime');
  const contracted_graph = contractGraph(geojson, {cost_field: 'MILES'});
  console.timeEnd('contractTime');

  await fs.writeFile('./ch.json', JSON.stringify(contracted_graph[0]), 'utf8');
  await fs.writeFile('./ne.json', JSON.stringify(contracted_graph[1]), 'utf8');
  await fs.writeFile('./nr.json', JSON.stringify(contracted_graph[2]), 'utf8');

}