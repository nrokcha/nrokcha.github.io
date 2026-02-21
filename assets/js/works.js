/* =========================================================
   WORKS SCRIPT (시리즈 필터 버전) — 복붙 교체용
   ---------------------------------------------------------
   ✅ 하는 일 (너가 자주 쓰는 기능 위주)
   1) works.json에서 작품을 불러온다
   2) 시리즈 메뉴를 자동으로 만든다 (오버레이 메뉴 안)
   3) 시리즈를 선택하면 그 시리즈 작품만 썸네일에 남긴다 (필터)
   4) 썸네일을 누르면 작품/캡션이 바뀐다
   5) 주소(URL 해시)에 선택 상태를 저장한다 → 공유/새로고침 유지

   ✅ HTML에서 필요한 요소(id/class)
   #hero          = 메인 작품 이미지
   #workTitle     = 캡션(제목 + 연도)
   #workMedium    = 캡션(재료)
   #workSize      = 캡션(사이즈)
   #thumbStrip    = 썸네일 줄
   #seriesTitle   = 썸네일 위에 뜨는 시리즈명
   #seriesMenu    = 오버레이 메뉴의 시리즈 목록(자동 생성)
   .hero-wrap     = 작품 영역 wrapper (스케일 조절용)

   ✅ 너가 나중에 자주 수정할 곳
   - (A) SCALE_RULE : 작품 실제 사이즈(cm)에 따른 화면 '존재감' 기준
   - (B) works.json : 작품 추가/수정(가장 많이 만짐)
========================================================= */


/* =========================================================
   (A) CONFIG — 작품 스케일 기준(필요하면 여기 숫자만 조정)
========================================================= */
const SCALE_RULE = {
  xl: { long:300, area:65000 },  // 초대형
  l : { long:240, area:42000 },  // 대형
  m : { long:180, area:26000 },  // 중형(기본)
  s : { long:130, area:15000 }   // 소형
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
   - 작품만(호환용):  #Parade_01
========================================================= */
function parseHash(){
  const raw = decodeURIComponent(location.hash.replace('#','')).trim();
  if(!raw) return { series:null, workId:null };

  // "="이 없으면 작품 id로 취급 (예전 링크 호환)
  if(!raw.includes('=')) return { series:null, workId:raw };

  const out = { series:null, workId:null };
  raw.split('&').forEach(part=>{
    const [k,v] = part.split('=');
    if(!k || v == null) return;
    if(k === 's') out.series = v.trim();
    if(k === 'w') out.workId = v.trim();
  });
  return out;
}

function buildHash({ series, workId }){
  const params = [];
  if(series) params.push(`s=${encodeURIComponent(series)}`);
  if(workId) params.push(`w=${encodeURIComponent(workId)}`);
  return params.length ? `#${params.join('&')}` : '';
}


/* =========================================================
   UTIL — 시리즈 목록 만들기(works.json에서 자동 추출)
========================================================= */
function uniqSeries(works){
  const seen = new Set();
  const list = [];
  works.forEach(w=>{
    const s = (w.series || '').trim();
    if(!s || seen.has(s)) return;
    seen.add(s);
    list.push(s);
  });
  return list;
}


/* =========================================================
   MAIN
========================================================= */
(async function(){

  /* ---------- ELEMENTS ---------- */
  const hero        = document.getElementById('hero');
  const titleEl     = document.getElementById('workTitle');
  const mediumEl    = document.getElementById('workMedium');
  const sizeEl      = document.getElementById('workSize');
  const strip       = document.getElementById('thumbStrip');
  const heroWrap    = document.querySelector('.hero-wrap');

  // ✅ 시리즈 표시/메뉴(없으면 그냥 기능이 꺼지게 했음)
  const seriesTitle = document.getElementById('seriesTitle');
  const seriesMenu  = document.getElementById('seriesMenu');

  if(!hero || !titleEl || !mediumEl || !sizeEl || !strip || !heroWrap) return;


  /* ---------- LOAD DATA ---------- */
  const res = await fetch('data/works.json', { cache:'no-store' });
  const works = await res.json();


  /* ======================================================
     RENDER — 작품 교체(여기가 핵심)
     ====================================================== */
  function setWork(w, { series=null } = {}){

    /* --- IMAGE --- */
    hero.src = w.image;
    hero.alt = w.title;

    /* --- CAPTION (연도는 유지) --- */
    titleEl.textContent  = `${w.title}, ${w.year}`;
    mediumEl.textContent = w.medium || '';
    sizeEl.textContent   = w.size || '';

    /* --- SCALE (cm 기반 존재감 조절) --- */
    heroWrap.classList.remove('s-xl','s-l','s-m','s-s','s-xs');
    heroWrap.classList.add(getScaleClassFromCm(w.size));

    /* --- SERIES LABEL (썸네일 위) --- */
    if(seriesTitle){
      const shownSeries = series || w.series || '';
      seriesTitle.textContent = shownSeries ? shownSeries.toUpperCase() : '';
    }

    /* --- ACTIVE THUMB --- */
    [...strip.children].forEach(el=>{
      el.classList.toggle('active', el.dataset.id === w.id);
    });

    /* --- HASH (공유/새로고침 유지) --- */
    const keepSeries = series || w.series || null;
    history.replaceState(null,'', buildHash({ series: keepSeries, workId: w.id }));
  }


  /* ======================================================
     THUMBS — 썸네일 목록을 "필터된 리스트"로 다시 그리기
     ====================================================== */
  function renderThumbs(list, { series=null } = {}){
    strip.innerHTML = '';
    list.forEach((w)=>{
      const b = document.createElement('button');
      b.className = 'thumb';
      b.type = 'button';
      b.dataset.id = w.id;
      b.innerHTML = `<img loading="lazy" src="${w.thumb}" alt="${w.title} thumbnail">`;
      b.addEventListener('click', ()=> setWork(w, { series }));
      strip.appendChild(b);
    });
  }


  /* ======================================================
     MENU — 오버레이 시리즈 메뉴 자동 생성 (선택 기능)
     - works.html에서 <div class="sub" id="seriesMenu"></div> 가 있으면 작동
     ====================================================== */
  function buildSeriesMenu(){
    if(!seriesMenu) return;

    const seriesList = uniqSeries(works);
    seriesMenu.innerHTML = '';

    // ALL
    const all = document.createElement('a');
    all.href = 'works.html';
    all.textContent = 'ALL';
    seriesMenu.appendChild(all);

    seriesList.forEach(s=>{
      const a = document.createElement('a');
      a.href = `works.html#s=${encodeURIComponent(s)}`;
      a.textContent = s.toUpperCase();
      seriesMenu.appendChild(a);
    });
  }


  /* ======================================================
     INIT / HASH APPLY
     - 해시를 읽고 → 시리즈 필터 적용 → 썸네일 재생성 → 첫 작품 표시
     ====================================================== */
  function applyFromHash(){
    const { series, workId } = parseHash();

    // 1) series가 있으면 필터
    let list = works;
    if(series){
      const filtered = works.filter(w => (w.series || '').trim() === series);
      if(filtered.length) list = filtered;
    }

    // 2) workId가 있으면 그 작품을 우선 선택
    let initial = null;
    if(workId){
      initial = list.find(w => w.id === workId) || works.find(w => w.id === workId) || null;
    }

    // 3) 없으면 필터의 첫 작품(없으면 전체 첫 작품)
    if(!initial) initial = list[0] || works[0];

    // 4) 썸네일 렌더 + 작품 표시
    const shownSeries = series || (initial?.series || null);
    renderThumbs(list, { series: shownSeries });
    setWork(initial, { series: shownSeries });

    // 5) (선택) 메뉴에서 active 표시
    if(seriesMenu){
      [...seriesMenu.querySelectorAll('a')].forEach(a=>{
        const href = a.getAttribute('href') || '';
        const isAll = a.textContent === 'ALL';
        const isActive = series ? href.includes(`#s=${encodeURIComponent(series)}`) : isAll;
        a.classList.toggle('active', isActive);
      });
    }
  }


  /* ---------- RUN ---------- */
  buildSeriesMenu();
  applyFromHash();

  window.addEventListener('hashchange', applyFromHash);

})();
