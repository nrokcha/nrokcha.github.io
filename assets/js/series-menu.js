/* =========================================================
   SERIES MENU (global) — seriesName/seriesSlug 기준 (최종)
   - 모든 페이지에서 WORKS 아래 시리즈 목록을 자동 생성
   - works.json: seriesName(표기용), seriesSlug(링크용) 필수
   - 링크: works.html#s=<seriesSlug>
========================================================= */

(function(){

  function uniqSeriesBySlug(works){
    const seen = new Set();
    const list = [];

    works.forEach(w=>{
      const slug = String(w.seriesSlug || '').trim();
      const name = String(w.seriesName || '').trim();

      if(!slug) return;                 // slug 없으면 메뉴에 못 넣음
      if(seen.has(slug)) return;

      seen.add(slug);
      list.push({ slug, name: name || slug });
    });

    return list;
  }

  async function buildSeriesMenu(){
    const holder = document.getElementById('seriesMenu');
    if(!holder) return;

    let works = [];
    try{
      const res = await fetch('data/works.json', { cache:'no-store' });
      works = await res.json();
    }catch(e){
      holder.innerHTML = '';
      return;
    }

    if(!Array.isArray(works) || works.length === 0){
      holder.innerHTML = '';
      return;
    }

    const seriesList = uniqSeriesBySlug(works);

    holder.innerHTML = '';

    // ALL
    const all = document.createElement('a');
    all.href = 'works.html';
    all.textContent = 'ALL';
    holder.appendChild(all);

    // series
    seriesList.forEach(({slug, name})=>{
      const a = document.createElement('a');
      a.href = `works.html#s=${encodeURIComponent(slug)}`;
      a.textContent = name;   // ✅ 화면에는 seriesName 그대로(한글/특수문자 OK)
      holder.appendChild(a);
    });
  }

  document.addEventListener('menu:loaded', buildSeriesMenu);
  window.addEventListener('DOMContentLoaded', buildSeriesMenu);

})();
