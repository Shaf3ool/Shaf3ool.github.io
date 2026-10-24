(function(){
  var q=new URLSearchParams(location.search), root=document.documentElement;
  function setLang(l){root.lang=l;root.dir=(l==='ar')?'rtl':'ltr';try{localStorage.setItem('oralya_lang',l)}catch(e){}
    document.querySelectorAll('.langs button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.l===l?'true':'false')});
    var b=document.body.dataset;document.title=(l==='ar'?b.titleAr:l==='en'?b.titleEn:b.titleFr)}
  var l=q.get('lang');if(!l){try{l=localStorage.getItem('oralya_lang')}catch(e){}}
  setLang(l==='fr'||l==='en'?l:'ar');
  document.querySelectorAll('.langs button').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.l)})});
  var dlg=document.getElementById('demoDlg');
  function openDlg(e){if(e)e.preventDefault();if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','')}
  document.querySelectorAll('.act').forEach(function(b){b.addEventListener('click',openDlg)});
  var f=document.getElementById('reqForm');if(f)f.addEventListener('submit',openDlg);
  document.getElementById('dlgClose').addEventListener('click',function(){dlg.close?dlg.close():dlg.removeAttribute('open')});
  var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12}):null;
  document.querySelectorAll('.reveal').forEach(function(el){if(io)io.observe(el);else el.classList.add('in')});
  var nav=document.querySelector('.nav');function sc(){nav.classList.toggle('scrolled',scrollY>20)}addEventListener('scroll',sc,{passive:true});sc();
})();
