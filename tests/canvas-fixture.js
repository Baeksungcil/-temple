// Geometry tests only. Real canvas rendering is checked in the browser suite.
export function installCanvas(t) {
  const previous=globalThis.document;
  const gradient=()=>({addColorStop(){}});
  const context={createLinearGradient:gradient,createRadialGradient:gradient};
  for(const name of ['fillRect','beginPath','moveTo','quadraticCurveTo','fill','stroke','save','translate','rotate','ellipse','restore','arc'])context[name]=()=>{};
  globalThis.document={createElement(name){if(name!=='canvas')throw Error('Unexpected test element: '+name);return{width:0,height:0,getContext:()=>context};}};
  t.after(()=>{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;});
}
