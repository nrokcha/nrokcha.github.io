
(async function(){
  const hero = document.getElementById('hero');
  const title = document.getElementById('workTitle');
  const medium = document.getElementById('workMedium');
  const size = document.getElementById('workSize');
  const strip = document.getElementById('thumbStrip');

  if(!hero || !title || !medium || !size || !strip) return;

  const res = await fetch('data/works.json', {cache:'no-store'});
  const works = await res.json();

  function setWork(w){
    hero.src = w.image;
    hero.alt = w.title;
    title.textContent = `${w.title}, ${w.year}`;
    medium.textContent = w.medium;
    size.textContent = w.size;

    [...strip.children].forEach(el=>{
      el.classList.toggle('active', el.dataset.id === w.id);
    });

    // update hash for shareable deep-link
    history.replaceState(null, '', `#${encodeURIComponent(w.id)}`);
  }

  // build thumbs
  works.forEach((w)=>{
    const b = document.createElement('button');
    b.className = 'thumb';
    b.type = 'button';
    b.dataset.id = w.id;
    b.innerHTML = `<img loading="lazy" src="${w.thumb}" alt="${w.title} thumbnail">`;
    b.addEventListener('click', ()=> setWork(w));
    strip.appendChild(b);
  });

  // init
  const fromHash = decodeURIComponent(location.hash.replace('#',''));
  const initial = works.find(w=>w.id===fromHash) || works[0];
  setWork(initial);

  // if user changes hash manually/back
  window.addEventListener('hashchange', ()=>{
    const id = decodeURIComponent(location.hash.replace('#',''));
    const w = works.find(x=>x.id===id);
    if(w) setWork(w);
  });
})();
