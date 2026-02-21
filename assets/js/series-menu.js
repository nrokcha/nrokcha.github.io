/* =========================================================
   SERIES MENU (global) — series 기준
   - data/works.json을 읽어서 WORKS 아래 시리즈 목록 자동 생성
   - works.html#<series-slug> 로 이동 (예: #Diving)
========================================================= */

(function(){

  function slugify(str){
    return String(str || '')
      .trim()
      .toLowerCase()
      .replace(/&/g,'and')
      .replace(/[\s\/]+/g,'-')
      .replace(/[^\w\-가-힣]/g,'')   // 영문/숫자/_/-/한글만 남김
      .replace(/\-+/g,'-');
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

    // series 목록 추출 (없으면 Unsorted)
    const seriesList = works
      .map(w => (w.series && String(w.series).trim()) ? String(w.series).trim() : 'Unsorted');

    const unique = [...new Set(seriesList)];

    // 정렬: Unsorted는 맨 아래, 나머지는 가나다/알파벳
    unique.sort((a,b)=>{
      if(a === 'Unsorted') return 1;
      if(b === 'Unsorted') return -1;
      return a.localeCompare(b, 'ko');
    });

    holder.innerHTML = unique.map(name=>{
      const slug = slugify(name);
      return `<a href="works.html#${encodeURIComponent(slug)}">${name}</a>`;
    }).join('');
  }

  // menu-loader가 메뉴 삽입한 뒤 실행
  document.addEventListener('menu:loaded', buildSeriesMenu);

  // 혹시를 대비해 한 번 더
  window.addEventListener('DOMContentLoaded', buildSeriesMenu);

})();
