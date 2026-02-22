/* =========================================================
   SERIES MENU (global) — seriesName/seriesSlug 기준 (FINAL)
   - WORKS 아래 시리즈 목록 자동 생성
   - ALL 제거: WORKS가 곧 전체 보기 역할
   - 링크: works.html#s=<seriesSlug>
========================================================= */

(function(){

  function uniqSeriesBySlug(works){
    const seen = new Set();
    const list = [];

    works.forEach(w=>{
      const slug = String(w.seriesSlug || '').trim();
      const name = String(w.seriesName || '').trim();

      if(!slug) return;
      if(seen.has(slug)) return;

      seen.add(slug);
      list.push({ slug, name: name || slug });
    });

    return list;
  }

  function requestCloseMenu(){
    try{
      document.dispatchEvent(new CustomEvent('menu:close'));
    }catch(e){
      const evt = document.createEvent('Event');
      evt.initEvent('menu:close', true, true);
      document.dispatchEvent(evt);
    }
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

    // ✅ ALL 제거 — 이제 WORKS가 전체 보기 역할

    seriesList.forEach(({slug, name})=>{
      const a = document.createElement('a');
      a.href = `works.html#s=${encodeURIComponent(slug)}`;
      a.textContent = name;

      a.addEventListener('click', requestCloseMenu);

      holder.appendChild(a);
    });
  }

  document.addEventListener('menu:loaded', buildSeriesMenu);
  window.addEventListener('DOMContentLoaded', buildSeriesMenu);

})();
