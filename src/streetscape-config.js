import data from '../public/data/streetscape.json' with {type:'json'};
export const SUBWAY_ENTRANCES=data.entrances;
export const SCAFFOLDS=data.scaffolds;
export const STREET_LAMPS=data.lamps;
export const FEATURED_SUBWAY=SUBWAY_ENTRANCES.find(e=>e.covered)||SUBWAY_ENTRANCES.find(e=>e.station==='Times Sq-42 St');
