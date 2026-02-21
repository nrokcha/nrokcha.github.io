/* =========================================================
   MENU LOADER — shared overlay menu for all pages
   - partials/menu.html 을 불러와서 페이지에 삽입한다
   - 삽입 후 main.js(햄버거 열고 닫기)가 동작할 수 있게 한다
========================================================= */

(async function(){
  const mount = document.getElementById('menuMount');
  if(!mount) return;

  // menu.html 불러오기
  const res = await fetch('partials/menu.html', { cache:'no-store' });
  const html = await res.text();

  // 페이지에 삽입
  mount.innerHTML = html;

  // main.js가 "이미 DOM을 잡아버린 경우"를 대비해서
  // main.js가 동작하도록 커스텀 이벤트를 쏴줌
  document.dispatchEvent(new CustomEvent('menu:loaded'));
})();
