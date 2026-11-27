const layout=document.querySelector("#layout"),photo=document.querySelector("#photo"),hero=document.querySelector(".portal-hero"),download=document.querySelector("#download");
function render(){
  hero.dataset.layout=layout.value;
  const woodlandImages = ['moss-pocket', 'bluebell-bend', 'sugar-shack', 'snow-globe', 'alder-island', 'apple-rows', 'fern-fog', 'chestnut-wall', 'aspen-coins', 'rain-window', 'larch-lantern', 'woodland-quilt', 'dogwood', 'redwoods', 'moon-meadow', 'dune-pines', 'cedar-bridge', 'pink-grove', 'basalt-pocket', 'last-light'];
  const woodland = woodlandImages[Number(photo.value) - 6];
  const file=woodland ? "/nook-studies/woodlands/" + woodland + ".jpg" : photo.value==="1"?"/portal-photo.jpg?v=forest":"/nook-studies/"+photo.value+".jpg";
  hero.style.setProperty("--photo","url('"+file+"')");
  download.href=file;
  download.download=photo.selectedOptions[0].text.toLowerCase().replaceAll(" ","-")+".jpg";
  history.replaceState(null,"","#"+layout.value+"-"+photo.value);
}
const [preset,image]=location.hash.slice(1).split("-");
if([...layout.options].some(o=>o.value===preset))layout.value=preset;
if([...photo.options].some(o=>o.value===image))photo.value=image;
layout.onchange=photo.onchange=render;render();
