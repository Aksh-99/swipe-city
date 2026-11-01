
// Bright screens with restrained chroma; neutral light keeps artwork readable.
// Keep black pixels black and roll the gain off toward white to retain detail.
export const BILLBOARD_MIDTONE_LIFT=0;
export const BILLBOARD_SATURATION=1;
export const BILLBOARD_SPILL_GAIN=.12;
export const BILLBOARD_SPILL_DISTANCE=36;
export const BILLBOARD_GLOW={strength:.52,thresholdLow:.28,thresholdHigh:.78,sigma:4.0};
export const BILLBOARD_TYPES=new Set([
 'Hyatt49RoundedGreenCampaign','FiveTimesNeighborPosters','Doughnut48ContinuousPanoramicAd',
 'South42TransitPosters','South42TransitWideAds','Seventh49PhotographicCampaigns',
 'AttractionsPortraitAds','AttractionsLandscapeAds','Barclays49BlueWrap','DisneyBuildingLedWall',
 'CinemaBlockMoviePosters','CinemaBlockBillboards','NasdaqWrappedTower','NasdaqNeighborAds','NasdaqBlackFascia',
 'MarriottInsetVideo','MarriottModernWrapScreens','MarriottSideProductCampaign','MarriottModernScreenRibbons',
 'W46ExactCornerBillboards','HersheysReferenceArt','Two47ReferenceCampaignArtwork','Two47CampaignsV2',
 'TouroContinuousMovieBillboard','East42CampaignPosters','DistrictPosterCollages',
 'East46ExpressCampaigns','East46ExpressProjectPanel','MmsReferenceCharacterAd','MmsCornerCandySigns',
 'West46TheatrePosterArt','McDonaldsDeCeccoLED','Renaissance48MormonAnniversaryBillboard',
 'OneTimesIconicCampaigns','OneTimesCokeWrap','Tsx47PanoramicCampaigns','Tsx47SecondaryCampaigns',
 'Morgan48ribbonNewsDisplay','Morgan48portraitNewsDisplay','Superdry49WhiteFoxPanel',
 'North42BillboardPosters','North42BlueWrap','Corner47BlueCampaigns','AvenueFashionCollage',
 'Hyatt49ChicagoPavementPoster','TimesSquareStudiosReferenceSigns','Biltmore47VerticalTheatreSigns','LyricOfficialMarquee','HardRockCurvedMarquee'
]);
export function isBillboardMaterial(material){
 const type=material.type??'';
 return BILLBOARD_TYPES.has(type)||/^(?:Five48Red(?:avenue|street)|BroadwayReferenceAd(?:portrait|landscape)|ParamountNeighborAd(?:portrait|landscape)|Cvs49PaintCampaign(?:brand|room|portrait)|Voco48\w+Sign)$/.test(type)
  ||Object.values(material.uniforms??{}).some(image=>typeof image==='string'&&image.startsWith('/billboards/'));
}
// Original artwork colors pass through exactly, without grading or a light lift.
export function liftBillboardColor(color){return [...color];}
export const billboardLiftGLSL=`
vec3 swipeBillboardLight(vec3 color){return color;}
`;
const adjusted=new WeakSet();
// Material.shaderSource is the public Fabric shader string. Apply once before
// adding its primitive; artwork, UVs, alpha, discard masks and type cache stay intact.
export function applyBillboardLight(material){
 if(adjusted.has(material)||!isBillboardMaterial(material))return material;
 const source=material.shaderSource;
 if(!/\bczm_getMaterial\s*\(/.test(source))return material;
 // Fabric defaults to the transparent pass even for constant alpha=1 shaders.
 // Rectangular LED artwork must write opaque depth; retain authored cutout masks.
 if(/\b\w+\.alpha\s*=\s*1(?:\.0*)?\s*;/.test(source))material.translucent=false;
 material.shaderSource=billboardLiftGLSL+'\n'+source.replace(/\bczm_getMaterial\b/g,'swipeOriginalBillboardMaterial')+`
czm_material czm_getMaterial(czm_materialInput inputValue){
 czm_material result=swipeOriginalBillboardMaterial(inputValue);
 result.emission=swipeBillboardLight(result.emission);
 return result;
}`;
 adjusted.add(material);return material;
}
