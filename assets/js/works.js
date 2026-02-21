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
   - (호환) 작품만:   #Parade_01
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
   + 안정성: trim + 빈값 제외
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

  const seriesTitle = document.getElementById('seriesTitle');
  const seriesMenu  = document.getElementById('seriesMenu');

  if(!hero || !titleEl || !mediumEl || !sizeEl || !strip || !heroWrap) return;


  /* ---------- LOAD DATA ---------- */
  const res = await fetch('data/works.json', { cache:'no-store' });
  const works = await res.json();

  // 혹시 works.json이 비어 있으면 안전 종료
  if(!Array.isArray(works) || works.length === 0) return;


  /* ======================================================
     RENDER — 작품 교체(핵심)
     ====================================================== */
  function setWork(w, { series=null } = {}){
    if(!w) return;

    // 1) IMAGE
    hero.src = w.image;
    hero.alt = w.title || '';

    // 2) CAPTION (연도는 유지)
    const yy = (w.year != null) ? String(w.year) : '';
    titleEl.textContent  = yy ? `${w.title}, ${yy}` : `${w.title}`;
    mediumEl.textContent = w.medium || '';
    sizeEl.textContent   = w.size || '';

    // 3) SCALE (cm 기반 존재감)
    heroWrap.classList.remove('s-xl','s-l','s-m','s-s','s-xs');
    heroWrap.classList.add(getScaleClassFromCm(w.size));

    // 4) SERIES LABEL (썸네일 위)
    if(seriesTitle){
      const shownSeries = (series || w.series || '').trim();
      seriesTitle.textContent = shownSeries ? shownSeries.toUpperCase() : '';
    }

    // 5) ACTIVE THUMB
    [...strip.children].forEach(el=>{
      el.classList.toggle('active', el.dataset.id === w.id);
    });

    // 6) HASH 저장(공유/새로고침/뒤로가기 안정)
    const keepSeries = (series || w.series || '').trim() || null;
    history.replaceState(null,'', buildHash({ series: keepSeries, workId: w.id }));
  }


  /* ======================================================
     THUMBS — (필터된) 썸네일 렌더
     ====================================================== */
  function renderThumbs(list, { series=null } = {}){
    strip.innerHTML = '';
    list.forEach(w=>{
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
     MENU — 오버레이 시리즈 메뉴 자동 생성
     - ⚠️ 메뉴 링크는 항상 #s=Series 로 통일 (연도 해시 완전 제거)
     ====================================================== */
  function buildSeriesMenu(){
    if(!seriesMenu) return;

    const seriesList = uniqSeries(works);
    seriesMenu.innerHTML = '';

    // ALL (전체)
    const all = document.createElement('a');
    all.href = 'works.html';
    all.textContent = 'ALL';
    seriesMenu.appendChild(all);

    // series links
    seriesList.forEach(s=>{
      const a = document.createElement('a');
      a.href = `works.html#s=${encodeURIComponent(s)}`;
      a.textContent = s.toUpperCase();
      seriesMenu.appendChild(a);
    });
  }


  /* ======================================================
     (4) 시리즈 해시 기준으로 "초기 작품" 고르기
     - #s=Series     → 해당 시리즈의 첫 작품
     - #s=Series&w=  → 해당 시리즈 안에서 그 작품 (없으면 첫 작품)
     - #WorkId       → 그 작품 (없으면 첫 작품)
     ====================================================== */
  function pickStateFromHash(){
    const { series, workId } = parseHash();

    // A) 기본값
    let list = works;

    // B) 시리즈가 있으면 필터 리스트 생성(시리즈가 존재할 때만 적용)
    if(series){
      const filtered = works.filter(w => (w.series || '').trim() === series);
      if(filtered.length) list = filtered;
    }

    // C) 작품 선택: workId가 있으면 우선
    let selected = null;
    if(workId){
      // 1) 필터된 list 안에서 먼저 찾고
      selected = list.find(w => w.id === workId) || null;

      // 2) 거기 없으면 전체 works에서라도 찾기(예전 링크 호환)
      if(!selected) selected = works.find(w => w.id === workId) || null;
    }

    // D) 못 찾으면 list의 첫 작품
    if(!selected) selected = list[0] || works[0];

    // E) 표시할 시리즈명: 해시 series가 있으면 그걸 우선
    const shownSeries = (series || selected?.series || '').trim() || null;

    return { list, selected, shownSeries, seriesFromHash: series || null };
  }


  /* ======================================================
     APPLY — 해시 상태를 화면에 적용 (초기/해시변경 공용)
     ====================================================== */
  function applyFromHash(){
    const state = pickStateFromHash();

    renderThumbs(state.list, { series: state.shownSeries });
    setWork(state.selected, { series: state.shownSeries });

    // 메뉴 active 표시(선택)
    if(seriesMenu){
      const activeSeries = state.seriesFromHash; // 해시로 들어온 시리즈만 '활성' 취급
      [...seriesMenu.querySelectorAll('a')].forEach(a=>{
        const href = a.getAttribute('href') || '';
        const isAll = a.textContent === 'ALL';
        const isActive = activeSeries
          ? href === `works.html#s=${encodeURIComponent(activeSeries)}`
          : isAll;
        a.classList.toggle('active', isActive);
      });
    }
  }


  /* ---------- RUN ---------- */
  buildSeriesMenu();
  applyFromHash();

  /* ======================================================
     (5) 해시 변경 시에도 시리즈 해시를 완전 지원
     - 메뉴 클릭 / 뒤로가기 / 주소 직접 수정 모두 OK
     ====================================================== */
  window.addEventListener('hashchange', applyFromHash);

})();
