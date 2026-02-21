
(function(){
  const btn = document.querySelector('[data-menu-open]');
  const overlay = document.getElementById('menuOverlay');
  const close = overlay?.querySelector('[data-menu-close]');
  if(!btn || !overlay || !close) return;

  const open = ()=> overlay.classList.add('open');
  const shut = ()=> overlay.classList.remove('open');

  btn.addEventListener('click', open);
  close.addEventListener('click', shut);

  overlay.addEventListener('click', (e)=>{
    if(e.target === overlay) shut();
  });

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') shut();
  });
  
  overlay.classList.add("open");
  document.body.classList.add("menu-open");   // ⭐️ 메뉴 열기
  overlay.classList.remove("open");
  document.body.classList.remove("menu-open"); // ⭐️ 메뉴 닫기
  
})();
