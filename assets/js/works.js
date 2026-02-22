/* =========================================================
   WORKS SCRIPT — FINAL STABLE VERSION
========================================================= */

/* =========================================================
   (A) CONFIG — 작품 스케일 기준
========================================================= */
const SCALE_RULE = {
  xl: { long:300, area:85000 },
  l : { long:200, area:42000 },
  m : { long:150, area:26000 },
  s : { long:100, area:15000 }
};


/* =========================================================
   UTIL — size(cm) 파싱 / 스케일 클래스 계산
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

  return { a, b, longSide: Math.max(a,b), area: a*b };
}

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
   UTIL — 해시 처리
========================================================= */
function parseHash(){
  const raw = decodeURIComponent(location.hash.replace('#','')).trim();
  if(!raw) return { seriesSlug:null, workId:null };

  if(!raw.includes('=')) return { seriesSlug:null, workId:raw };

  const out = { seriesSlug:null, workId:null };
  raw.split('&').forEach(part=>{
    const [k,v] = part.split('=');
    if(!k || v == null) return;
    if(k === 's') out.seriesSlug = v.trim();
    if(k === 'w') out.workId = v.trim();
  });
  return out;
}

function buildHash({ seriesSlug, workId }){
  const params = [];
  if(seriesSlug) params.push(`s=${encodeURIComponent(seriesSlug)}`);
  if(workId) params.push(`w=${encodeURIComponent(workId)}`);
  return params.length ? `#${params.join('&')}` : '';
}


/* =========================================================
   MAIN
========================================================= */
(async function(){

  const hero        = document.getElementById('hero');
  const titleEl     = document.getElementById('workTitle');
  const mediumEl    = document.getElementById('workMedium');
  const sizeEl      = document.getElementById('workSize');
  const strip       = document.getElementById('thumbStrip');
  const heroWrap    = document.querySelector('.hero-wrap');

  const seriesTitle = document.getElementById('seriesTitle');
  const seriesMenu  = document.getElementById('seriesMenu');
  const seriesTextEl= document.getElementById('seriesText');

  if(!hero || !titleEl || !mediumEl || !sizeEl || !strip || !heroWrap) return;

  const res = await fetch('data/works.json', { cache:'no-store' });
  const works = await res.json();
  if(!Array.isArray(works) || works.length === 0) return;


  /* ===================== SERIES TEXT ===================== */

  function setSeriesText(seriesSlug){
    if(!seriesTextEl) return;

    // ✅ ALL 상태(= 해시에 s가 없거나, 빈 값)에서는 텍스트를 절대 보여주지 않음
    const slug = String(seriesSlug || '').trim();
    if(!slug){
      seriesTextEl.innerHTML = '';
      seriesTextEl.style.display = 'none';
      return;
    }

    const w = works.find(x =>
      String(x.seriesSlug||'').trim() === slug
      && x.seriesText
    );

    if(!w){
      seriesTextEl.innerHTML = '';
      seriesTextEl.style.display = 'none';
      return;
    }

    seriesTextEl.style.display = '';
    seriesTextEl.innerHTML = w.seriesText;
  }


  /* ===================== WORK RENDER ===================== */
  function setWork(w, { seriesSlug=null } = {}){
    if(!w) return;

    hero.src = w.image;
    hero.alt = w.title || '';

    const yy = (w.year != null) ? String(w.year) : '';
    titleEl.textContent  = yy ? `${w.title}, ${yy}` : `${w.title}`;
    mediumEl.textContent = w.medium || '';
    sizeEl.textContent   = w.size || '';

    heroWrap.classList.remove('s-xl','s-l','s-m','s-s','s-xs');
    heroWrap.classList.add(getScaleClassFromCm(w.size));

    if(seriesTitle){
      const shownName = (w.seriesName || '').trim();
      seriesTitle.textContent = shownName || '';
    }

    [...strip.children].forEach(el=>{
      el.classList.toggle('active', el.dataset.id === w.id);
    });

    // ✅ 해시에 s가 있었으면 그걸 유지, 없었으면 ALL을 유지(= s를 추가하지 않음)
    const keepSlug = (seriesSlug || '').trim() || null;
    history.replaceState(null,'', buildHash({ seriesSlug: keepSlug, workId: w.id }));
  }

  function renderThumbs(list, { seriesSlug=null } = {}){
    strip.innerHTML = '';
    list.forEach(w=>{
      const b = document.createElement('button');
      b.className = 'thumb';
      b.type = 'button';
      b.dataset.id = w.id;
      b.innerHTML = `<img loading="lazy" src="${w.thumb}" alt="${w.title} thumbnail">`;
      b.addEventListener('click', ()=> setWork(w, { seriesSlug }));
      strip.appendChild(b);
    });
  }


  function pickStateFromHash(){
    const { seriesSlug, workId } = parseHash();

    let list = works;

    // 해시에 s가 있는 경우에만 시리즈 필터링
    if(seriesSlug){
      const filtered = works.filter(w =>
        String(w.seriesSlug || '').trim() === seriesSlug
      );
      if(filtered.length) list = filtered;
    }

    let selected = null;
    if(workId){
      selected = list.find(w => w.id === workId) || null;
      if(!selected) selected = works.find(w => w.id === workId) || null;
    }
    if(!selected) selected = list[0] || works[0];

    // ✅ 핵심: "현재 모드"는 해시에 s가 있을 때만 series 모드.
    //    ALL(해시에 s 없음)에서는 selected의 seriesSlug를 따라가면 안 됨.
    const modeSlug = (seriesSlug || '').trim() || null;

    return { list, selected, modeSlug, seriesSlugFromHash: modeSlug };
  }


  function applyFromHash(){
    const state = pickStateFromHash();

    // ✅ ALL이면 숨기고, 시리즈 선택 상태에서만 표시
    setSeriesText(state.modeSlug);

    renderThumbs(state.list, { seriesSlug: state.modeSlug });
    setWork(state.selected, { seriesSlug: state.modeSlug });

    if(seriesMenu){
      const activeSlug = state.seriesSlugFromHash;
      [...seriesMenu.querySelectorAll('a')].forEach(a=>{
        const href = a.getAttribute('href') || '';
        const isAll = a.textContent === 'ALL';
        const isActive = activeSlug
          ? href === `works.html#s=${encodeURIComponent(activeSlug)}`
          : isAll;
        a.classList.toggle('active', isActive);
      });
    }
  }

  applyFromHash();
  window.addEventListener('hashchange', applyFromHash);

})();
