(function(){

  function initMenu(){
    const btn = document.querySelector('[data-menu-open]');
    const overlay = document.getElementById('menuOverlay');
    if(!btn || !overlay) return;

    // 중복 이벤트 방지
    if(btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    // 햄버거 클릭
    btn.addEventListener('click', ()=>{
      const isOpen = overlay.classList.toggle('open');
      document.body.classList.toggle('menu-open', isOpen);
      overlay.setAttribute('aria-hidden', String(!isOpen));
    });

    // 배경 클릭 시 닫기
    overlay.addEventListener('click', (e)=>{
      if(e.target === overlay){
        overlay.classList.remove('open');
        document.body.classList.remove('menu-open');
        overlay.setAttribute('aria-hidden', 'true');
      }
    });

    // ESC 키 닫기
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape'){
        overlay.classList.remove('open');
        document.body.classList.remove('menu-open');
        overlay.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // 1️⃣ 일반 페이지 로드 시
  initMenu();

  // 2️⃣ menu-loader가 메뉴를 삽입한 후에도 실행
  document.addEventListener('menu:loaded', initMenu);

})();
