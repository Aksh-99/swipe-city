import data from '../public/data/west45.json' with {type:'json'};
export const WEST45=data;
export function west45Local(p){const x=p[0]-data.origin[0],y=p[1]-data.origin[1];return {t:x*data.east[0]+y*data.east[1],d:x*data.north[0]+y*data.north[1]};}
export function west45CoversPoint(p){const {t,d}=west45Local(p);return t>=-12&&t<=260&&Math.abs(d)>=6.2&&Math.abs(d)<=74&&(d>0||t<209)&&p[2]>=.18;}
export function west45ReplacesFacade(f){if(west45CornerKind(f.center))return true;const {t,d}=west45Local(f.center);return t>-12&&t<260&&Math.abs(d)<30&&(d>0||t<209)&&(f.street==='West 45th Street'||f.street==='Eighth Avenue'||f.street==='8th Avenue');}
export function west45ReplacesScreen(f){return west45CoversPoint(f.center)&&f.center[2]-f.height/2<32;}

export function west45CornerKind(p){const {t,d}=west45Local(p);if(t>=13&&t<=36&&d>=8&&d<=38)return 'construction';if(t>=13&&t<=47&&d<=-8&&d>=-74)return 'row';return null;}
