/* =========================================================
   WORKS SCRIPT — clean structure
   ---------------------------------------------------------
   HTML에서 사용하는 요소:
   #hero          = 메인 작품 이미지
   #workTitle     = 작품 제목
   #workMedium    = 재료
   #workSize      = 사이즈
   #thumbStrip    = 썸네일 줄
   .hero-wrap     = 작품 영역 wrapper (스케일 조절용)
========================================================= */


/* =========================================================
   1) CONFIG — 나중에 여기만 바꾸면 됨
========================================================= */
const SCALE_RULE = {
  xl: { long:300, area:65000 },
  l : { long:240, area:42000 },
  m : { long:180, area:26000 },
  s : { long:130, area:15000 }
};


/* =========================================================
   2) UTIL — size(cm) 파싱
========================================================= */
function parseCmSize(sizeStr){
  if(!sizeStr || typeof sizeStr !== 'string') return null;

  const cleaned = sizeStr
    .toLowerCase()
    .replace(/cm/g,'')
    .replace(/[×]/g,'x')
    .replace(/,/g,'')
    .trim();

  const m = cleaned.match(/(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)/);
  if(!m) return null;

  const a = parseFloat(m[1]);
  const b = parseFloat(m[3]);

  if(!Number.isFinite(a) || !Number.isFinite(b)) return null;

  return {
    a,
    b,
    longSide: Math.max(a,b),
    area: a*b
  };
}


/* =========================================================
   3) UTIL — 작품 스케일 클래스 계산
========================================================= */
function getScaleClassFromCm(sizeStr){
  const s = parseCmSize(sizeStr);
  if(!s) return 's-m';

  if(s.longSide >= SCALE_RULE.xl.long || s.area >= SCALE_RULE.xl.area) return 's-xl';
  if(s.longSide >= SCALE_RULE.l.long  || s.area >= SCALE_RULE.l.area ) return 's-l';
  if(s.longSide >= SCALE_RULE.m.long  || s.area >= SCALE_RULE.m.area ) return 's-m';
  if(s.longSide >= SCALE_RULE.s.long  || s.area >= SCALE_RULE.s.area ) return 's-s';

  return 's-xs';
}


/* =========================================================
   4) MAIN
========================================================= */
(async function(){

  /* ---------- ELEMENTS ---------- */
  const hero      = document.getElementById('hero');
  const title     = document.getElementById('workTitle');
  const medium    = document.getElementById('workMedium');
  const size      = document.getElementById('workSize');
  const strip     = document.getElementById('thumbStrip');
  const heroWrap  = document.querySelector('.hero-wrap');

  if(!hero || !title || !medium || !size || !strip || !heroWrap) return;


  /* ---------- LOAD DATA ---------- */
  const res = await fetch('data/works.json', {cache:'no-store'});
  const works = await res.json();


  /* ======================================================
     5) RENDER — 작품 교체 (여기가 핵심)
     ====================================================== */
  function setWork(w){

    /* --- IMAGE --- */
    hero.src = w.image;
    hero.alt = w.title;

    // 세로작품이면 CSS 제한 적용
    hero.classList.toggle("is-tall", !!w.tall);

    /* --- TEXT --- */
    title.textContent  = `${w.title}, ${w.year}`;
    medium.textContent = w.medium;
    size.textContent   = w.size;

    /* --- SCALE (cm 기반 존재감 조절) --- */
    heroWrap.classList.remove('s-xl','s-l','s-m','s-s','s-xs');
    heroWrap.classList.add(getScaleClassFromCm(w.size));

    /* --- ACTIVE THUMB --- */
    [...strip.children].forEach(el=>{
      el.classList.toggle('active', el.dataset.id === w.id);
    });

    /* --- HASH (공유용 URL) --- */
    history.replaceState(null,'',`#${encodeURIComponent(w.id)}`);
  }


  /* ======================================================
     6) BUILD THUMBS
     ====================================================== */
  works.forEach((w)=>{
    const b = document.createElement('button');
    b.className = 'thumb';
    b.type = 'button';
    b.dataset.id = w.id;

    b.innerHTML =
      `<img loading="lazy" src="${w.thumb}" alt="${w.title} thumbnail">`;

    b.addEventListener('click', ()=> setWork(w));

    strip.appendChild(b);
  });


  /* ======================================================
     7) INIT
     ====================================================== */
  const fromHash = decodeURIComponent(location.hash.replace('#',''));
  const initial = works.find(w=>w.id===fromHash) || works[0];
  setWork(initial);


  /* ======================================================
     8) HASH CHANGE
     ====================================================== */
  window.addEventListener('hashchange', ()=>{
    const id = decodeURIComponent(location.hash.replace('#',''));
    const w = works.find(x=>x.id===id);
    if(w) setWork(w);
  });

})();
