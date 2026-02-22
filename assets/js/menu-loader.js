/* =========================================================
   MENU LOADER — shared overlay menu for all pages
   - partials/menu.html 을 불러와서 페이지에 삽입한다
   - 삽입 후 main.js(햄버거 열고 닫기)가 동작할 수 있게 한다

   ✅ 추가(2026-02-22):
   - `menu:close` 이벤트를 받으면 메뉴를 자동으로 닫는다.
   - main.js 구현 방식(checkbox / class toggle / aria-expanded 등)에 따라
     가능한 닫기 동작을 여러 방식으로 "안전하게" 시도한다.
========================================================= */

(async function(){
  const mount = document.getElementById('menuMount');
  if(!mount) return;

  // menu.html 불러오기
  const res = await fetch('partials/menu.html', { cache:'no-store' });
  const html = await res.text();

  // 페이지에 삽입
  mount.innerHTML = html;

  // =========================================================
  // MENU CLOSE HANDLER (for series-menu.js etc.)
  // =========================================================
  function closeMenuSafely(){
    // 1) checkbox 토글 기반일 때(가장 흔함)
    //   - menu.html 안에 input[type=checkbox]가 하나 있고 그걸로 열고닫는 경우가 많음
    const menuCheckbox =
      mount.querySelector('input[type="checkbox"][id*="menu" i], input[type="checkbox"][name*="menu" i]') ||
      document.querySelector('input[type="checkbox"][id*="menu" i], input[type="checkbox"][name*="menu" i]');
    if(menuCheckbox && menuCheckbox.checked){
      menuCheckbox.checked = false;
    }

    // 2) aria-expanded 기반 토글(버튼)
    const toggleBtn =
      mount.querySelector('[aria-expanded="true"]') ||
      document.querySelector('[aria-expanded="true"]');
    if(toggleBtn){
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    // 3) 흔한 open/active 클래스 제거 (menu / overlay / drawer 등)
    //    - 실제 클래스명은 프로젝트마다 다르니 "일반적인 후보"를 제거
    const candidates = [
      mount.querySelector('#menu'),
      mount.querySelector('.menu'),
      mount.querySelector('.overlay'),
      mount.querySelector('.drawer'),
      mount.querySelector('.nav'),
      document.getElementById('menu'),
      document.querySelector('.menu'),
      document.querySelector('.overlay'),
      document.querySelector('.drawer'),
      document.querySelector('.nav'),
    ].filter(Boolean);

    candidates.forEach(el=>{
      el.classList.remove('open','opened','is-open','active','is-active','show','is-show','visible','is-visible');
    });

    // 4) html/body에 menu-open 류 클래스가 붙는 방식 제거
    document.documentElement.classList.remove('menu-open','is-menu-open','nav-open','is-nav-open','open');
    document.body.classList.remove('menu-open','is-menu-open','nav-open','is-nav-open','open');

    // 5) 마지막 수단: "닫기 버튼"이 존재하면 클릭(구조에 따라 더 정확하게 닫힐 수 있음)
    const closeBtn =
      mount.querySelector('[data-menu-close], .menu-close, .close, button[aria-label*="close" i]') ||
      document.querySelector('[data-menu-close], .menu-close, .close, button[aria-label*="close" i]');
    if(closeBtn){
      // 이미 닫혔어도 클릭이 무해한 경우가 많음
      closeBtn.click();
    }
  }

  // series-menu.js 등에서 보내는 신호를 수신해서 메뉴 닫기
  document.addEventListener('menu:close', closeMenuSafely);

  // main.js가 "이미 DOM을 잡아버린 경우"를 대비해서
  // main.js가 동작하도록 커스텀 이벤트를 쏴줌
  document.dispatchEvent(new CustomEvent('menu:loaded'));
})();
