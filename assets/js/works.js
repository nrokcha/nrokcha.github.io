/* =========================================================
   WORKS SCRIPT (최종 안정 버전: 시리즈 기준) — 복붙 교체용
   ---------------------------------------------------------
   ✅ 하는 일
   1) works.json에서 작품 불러오기
   2) 시리즈 메뉴 자동 생성(오버레이 WORKS 아래)
   3) 시리즈 선택 시 해당 시리즈만 썸네일로 필터
   4) 썸네일 클릭으로 작품/캡션 변경
   5) URL 해시로 상태 저장 → 공유/새로고침/뒤로가기 안정

   ✅ URL(해시) 규칙 (핵심)
   - 시리즈만:        #s=Parade
   - 시리즈+작품:     #s=Parade&w=Parade_01
   - (호환) 작품만:   #Parade_01

   ✅ HTML에서 필요한 요소(id/class)
   #hero, #workTitle, #workMedium, #workSize, #thumbStrip
   #seriesTitle (썸네일 위 시리즈명)
   #seriesMenu  (오버레이 메뉴 안 시리즈 목록)
   .hero-wrap   (스케일 클래스 적용용)

   ✅ 나중에 자주 수정할 곳
   (A) SCALE_RULE : 작품 실제 사이즈(cm) 기준 등급
   (B) works.json : 작품 추가/수정 (id/series/year/이미지 경로)
========================================================= */


/* =========================================================
   (A) CONFIG — 작품 스케일 기준(원하면 여기 숫자만 조정)
========================================================= */
const SCALE_RULE = {
  xl: { long:300, area:85000 },  // 초대형
  l : { long:200, area:42000 },  // 대형
  m : { long:150, area:26000 },  // 중형(기본)
  s : { long:100, area:15000 }   // 소형
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
   UTIL — 해시(주소) 규칙
   - 시리즈만:        #s=Parade
   - 시리즈+작품:     #s=Parade&w=Parade_01
   - (호환) 작품만:   #Parade_01
========================================================= */
function parseHash(){
  const raw = decodeURIComponent(location.hash.replace('#','')).trim();
  if(!raw) return { seriesSlug:null, workId:null };

  // "="이 없으면 작품 id로 취급 (예전 링크 호환)
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

/* ===================== UTIL: series 목록 ===================== */
function uniqSeriesBySlug(works){
  // slug 기준으로 unique, 표시명(seriesName)은 첫 등장값 사용
  const seen = new Set();
  const list = [];
  works.forEach(w=>{
    const slug = String(w.seriesSlug || '').trim();
    const name = String(w.seriesName || '').trim();
    if(!slug) return;            // slug 없으면 메뉴에 못 넣음(규칙상 필수)
    if(seen.has(slug)) return;
    seen.add(slug);
    list.push({ slug, name: name || slug });
  });
  return list;
}


/* ===================== MAIN ===================== */
(async function(){

  const hero        = document.getElementById('hero');
  const titleEl     = document.getElementById('workTitle');
  const mediumEl    = document.getElementById('workMedium');
  const sizeEl      = document.getElementById('workSize');
  const strip       = document.getElementById('thumbStrip');
  const heroWrap    = document.querySelector('.hero-wrap');

 const seriesTitle = document.getElementById('seriesTitle');
 const seriesMenu  = document.getElementById('seriesMenu');
 const seriesTextEl = document.getElementById('seriesText'); // ← 이것도 같이

 /* ===================== SERIES TEXT ===================== */
 function setSeriesText(seriesSlug){
  if(!seriesTextEl) return;

  const w = works.find(x =>
    String(x.seriesSlug||'').trim() === String(seriesSlug||'').trim()
    && x.seriesText
  );

  seriesTextEl.innerHTML = w ? w.seriesText : '';
}

  if(!hero || !titleEl || !mediumEl || !sizeEl || !strip || !heroWrap) return;

  const res = await fetch('data/works.json', { cache:'no-store' });
  const works = await res.json();
  if(!Array.isArray(works) || works.length === 0) return;

  // 안전장치: slug 없는 작품이 있으면 필터/메뉴가 꼬일 수 있음
  // (그래도 작품 id 직접 링크는 되게끔 동작 유지)

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

    // 썸네일 위 시리즈명 표기: seriesName 사용(한글/특수문자 OK)
    if(seriesTitle){
      const shownName = (w.seriesName || '').trim();
      seriesTitle.textContent = shownName || '';
    }

    [...strip.children].forEach(el=>{
      el.classList.toggle('active', el.dataset.id === w.id);
    });

    const keepSlug = (seriesSlug || w.seriesSlug || '').trim() || null;
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

    // 1) 기본 list
    let list = works;

    // 2) seriesSlug가 있으면 slug 기준 필터
    if(seriesSlug){
      const filtered = works.filter(w => String(w.seriesSlug || '').trim() === seriesSlug);
      if(filtered.length) list = filtered;
    }

    // 3) 작품 선택: workId가 있으면 우선
    let selected = null;
    if(workId){
      selected = list.find(w => w.id === workId) || null;
      if(!selected) selected = works.find(w => w.id === workId) || null;
    }
    if(!selected) selected = list[0] || works[0];

    // 4) 표시용 slug는 해시 우선, 없으면 선택 작품의 slug
    const shownSlug = (seriesSlug || selected?.seriesSlug || '').trim() || null;

    return { list, selected, shownSlug, seriesSlugFromHash: seriesSlug || null };
  }

  function applyFromHash(){
    const state = pickStateFromHash();

    setSeriesText(state.shownSlug);
     
    renderThumbs(state.list, { seriesSlug: state.shownSlug });
    setWork(state.selected, { seriesSlug: state.shownSlug });

    // 메뉴 active 표시(선택)
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
