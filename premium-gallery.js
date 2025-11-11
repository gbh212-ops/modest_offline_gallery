(function(){
  'use strict';
  const features=window.__GALLERY_FEATURES__||{};
  const flags={search:!!features.FEATURE_SEARCH,categories:!!features.FEATURE_CATEGORIES,cart:!!features.FEATURE_CART,exports:!!features.FEATURE_EXPORTS};
  const els={
    status:document.getElementById('status'),gallery:document.getElementById('gallery'),summary:document.querySelector('.gallery-summary'),
    count:document.getElementById('count'),year:document.getElementById('year'),toolbar:document.getElementById('toolbar'),
    searchContainer:document.getElementById('searchContainer'),searchInput:document.getElementById('searchInput'),
    categoryContainer:document.getElementById('categoryContainer'),categoryChips:document.getElementById('categoryChips'),
    clearCategories:document.getElementById('clearCategories'),toolbarButtons:document.getElementById('toolbarButtons'),
    exportCsv:document.getElementById('exportCsv'),printBtn:document.getElementById('printGallery'),
    cartToggle:document.getElementById('cartToggle'),cartBadge:document.getElementById('cartBadge'),cartDrawer:document.getElementById('cartDrawer'),
    cartBackdrop:document.getElementById('cartBackdrop'),cartItems:document.getElementById('cartItems'),cartSubtotal:document.getElementById('cartSubtotal'),
    cartClear:document.getElementById('cartClear'),cartMailto:document.getElementById('cartMailto'),cartClose:document.getElementById('closeCart')
  };
  const state={items:[],filtered:[],categories:[],selected:new Set(),search:''};
  const categoryButtons=new Map();
  const cart=new Map();
  const formatter=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
  const CART_KEY='cart:v1';
  const PRINT_CLASS='print-mode';
  let statusTimer=null;

  const showStatus=(msg,type)=>{if(!els.status)return;els.status.textContent=msg;els.status.className=type==='error'?'status active error':'status active';els.status.hidden=false;};
  const hideStatus=()=>{if(!els.status)return;els.status.textContent='';els.status.className='status';els.status.hidden=true;};
  const flashStatus=(msg,type='info',timeout=2500)=>{showStatus(msg,type);if(statusTimer)clearTimeout(statusTimer);if(type!=='error'&&timeout>0){statusTimer=setTimeout(()=>{hideStatus();statusTimer=null;},timeout);}};
  const salvageJson=(text)=>{try{return JSON.parse(text);}catch(err){const s=text.indexOf('['),e=text.lastIndexOf(']');if(s!==-1&&e!==-1&&e>s)return JSON.parse(text.slice(s,e+1));throw err;}};
  const loadManifest=async(url)=>{const res=await fetch(url);if(!res.ok)throw new Error(`HTTP ${res.status}`);return salvageJson(await res.text());};
  const normalizeItem=(raw)=>{const src=raw.src||raw.image||raw.url||'';const priceNum=Number(raw.price);const price=Number.isFinite(priceNum)?priceNum:null;const tagsList=Array.isArray(raw.tags)?raw.tags:typeof raw.tags==='string'?raw.tags.split(/[,;]+/).map((t)=>t.trim()).filter(Boolean):[];const silhouette=raw.silhouette||'';const categoryName=raw.category||silhouette||'Uncategorized';return {...raw,src,price,tagsList,tagsText:tagsList.join(', '),categoryName,searchValues:[raw.title,raw.code,silhouette,tagsList.join(' ')].map((v)=>v==null?'':String(v).toLowerCase())};};
  const formatCurrency=(value)=>{if(typeof value==='number'&&Number.isFinite(value))return formatter.format(value);if(value==null)return '';const parsed=Number(value);return Number.isFinite(parsed)?formatter.format(parsed):String(value);};

  const buildCard=(item)=>{const figure=document.createElement('figure');figure.className='gallery-card';const img=document.createElement('img');img.src=item.src;img.alt=item.title||item.code||'Gallery image';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';figure.appendChild(img);const caption=document.createElement('figcaption');caption.className='gallery-card__caption';const code=document.createElement('div');code.className='gallery-card__code';code.textContent=item.code||'—';const title=document.createElement('div');title.className='gallery-card__title';title.textContent=item.title||'Untitled style';caption.append(code,title);const metaParts=[];if(item.silhouette)metaParts.push(item.silhouette);if(item.tagsText)metaParts.push(item.tagsText);if(metaParts.length){const meta=document.createElement('div');meta.className='gallery-card__meta';meta.textContent=metaParts.join(' • ');caption.appendChild(meta);}if(flags.cart){const actions=document.createElement('div');actions.className='gallery-card__actions';if(item.price!=null){const price=document.createElement('span');price.className='price-tag';price.textContent=formatCurrency(item.price);actions.appendChild(price);}const button=document.createElement('button');button.type='button';button.className='button';button.textContent='Add to cart';button.addEventListener('click',()=>addToCart(item));actions.appendChild(button);caption.appendChild(actions);}figure.appendChild(caption);return figure;};
  const renderGallery=(items)=>{if(!els.gallery)return;els.gallery.innerHTML='';const fragment=document.createDocumentFragment();items.forEach((item)=>fragment.appendChild(buildCard(item)));els.gallery.appendChild(fragment);if(els.summary){els.summary.hidden=false;els.summary.classList.add('active');}if(els.count){const label=items.length===1?'style':'styles';els.count.textContent=`${items.length} ${label}`;}};
  const collectCategories=(items)=>Array.from(new Set(items.map((item)=>item.categoryName).filter((value)=>value&&value.trim()))).sort((a,b)=>a.localeCompare(b));
  const renderCategoryChips=()=>{if(!flags.categories||!els.categoryChips)return;els.categoryChips.innerHTML='';categoryButtons.clear();state.categories.forEach((category)=>{const button=document.createElement('button');button.type='button';button.className='chip';button.textContent=category;button.addEventListener('click',()=>toggleCategory(category));categoryButtons.set(category,button);els.categoryChips.appendChild(button);});updateCategoryStyles();};
  const updateCategoryStyles=()=>{categoryButtons.forEach((button,category)=>{button.classList.toggle('is-active',state.selected.has(category));});if(els.clearCategories)els.clearCategories.disabled=state.selected.size===0;};
  const toggleCategory=(category)=>{if(state.selected.has(category))state.selected.delete(category);else state.selected.add(category);updateCategoryStyles();applyFilters();};
  const clearCategories=()=>{state.selected.clear();updateCategoryStyles();applyFilters();};
  const matchesFilters=(item)=>{const term=state.search.trim().toLowerCase();const bySearch=!term||item.searchValues.some((value)=>value.includes(term));const byCategory=!flags.categories||state.selected.size===0||state.selected.has(item.categoryName);return bySearch&&byCategory;};
  const applyFilters=()=>{state.filtered=state.items.filter(matchesFilters);renderGallery(state.filtered);updateExportAvailability();};
  const updateExportAvailability=()=>{const hasItems=state.filtered.length>0;if(flags.exports&&els.exportCsv){els.exportCsv.disabled=!hasItems;els.exportCsv.setAttribute('aria-disabled',String(!hasItems));}if(flags.exports&&els.printBtn){els.printBtn.disabled=!hasItems;els.printBtn.setAttribute('aria-disabled',String(!hasItems));}};
  const debounce=(fn,delay)=>{let timer=null;return function(...args){if(timer)clearTimeout(timer);timer=setTimeout(()=>fn.apply(this,args),delay);};};

  const setupSearch=()=>{if(!flags.search||!els.searchContainer||!els.searchInput)return;els.searchContainer.hidden=false;els.searchInput.addEventListener('input',debounce((event)=>{state.search=(event.target.value||'').trim();applyFilters();},200));};
  const setupCategories=()=>{if(!flags.categories||!els.categoryContainer)return;els.categoryContainer.hidden=false;if(els.clearCategories)els.clearCategories.addEventListener('click',clearCategories);};
  const triggerPrint=()=>{if(!state.filtered.length)return;document.body.classList.add(PRINT_CLASS);window.print();};
  const setupExports=()=>{if(!flags.exports||!els.toolbarButtons)return;els.toolbarButtons.hidden=false;if(els.exportCsv){els.exportCsv.hidden=false;els.exportCsv.addEventListener('click',()=>{if(!state.filtered.length)return;if(window.GalleryExporters&&typeof window.GalleryExporters.exportToCsv==='function')window.GalleryExporters.exportToCsv(state.filtered,'gallery-selection.csv');});}if(els.printBtn){els.printBtn.hidden=false;els.printBtn.addEventListener('click',triggerPrint);window.addEventListener('afterprint',()=>document.body.classList.remove(PRINT_CLASS));}};

  const getCartKey=(item)=>item.code?`code:${item.code}`:item.src?`src:${item.src}`:`title:${item.title||''}`;
  const loadCartFromStorage=()=>{if(!flags.cart)return;cart.clear();try{const stored=JSON.parse(localStorage.getItem(CART_KEY)||'[]');if(Array.isArray(stored))stored.forEach((entry)=>{if(entry&&entry.key&&entry.qty>0)cart.set(entry.key,{key:entry.key,qty:Number(entry.qty)||0,item:entry.item||{}});});}catch(err){console.warn('Unable to read cart from storage',err);}};
  const persistCart=()=>{if(!flags.cart)return;try{const payload=Array.from(cart.values()).filter((entry)=>entry.qty>0).map((entry)=>({key:entry.key,qty:entry.qty,item:{code:entry.item.code||'',title:entry.item.title||'',src:entry.item.src||'',price:entry.item.price,categoryName:entry.item.categoryName||'',silhouette:entry.item.silhouette||'',tagsList:entry.item.tagsList||[]}}));localStorage.setItem(CART_KEY,JSON.stringify(payload));}catch(err){console.warn('Unable to persist cart',err);}};
  const syncCartWithManifest=()=>{if(!flags.cart){renderCart();return;}if(!state.items.length){renderCart();return;}const lookup=new Map();state.items.forEach((item)=>lookup.set(getCartKey(item),item));cart.forEach((entry,key)=>{const updated=lookup.get(key);if(updated)entry.item=updated;});renderCart();persistCart();};
  const updateCartBadge=(qty)=>{if(!els.cartToggle||!els.cartBadge)return;if(qty>0){els.cartBadge.textContent=String(qty);els.cartBadge.hidden=false;els.cartToggle.setAttribute('aria-label',`Open cart (${qty} items)`);}else{els.cartBadge.textContent='0';els.cartBadge.hidden=true;els.cartToggle.setAttribute('aria-label','Open cart (empty)');}};
  const updateMailto=(entries)=>{if(!els.cartMailto)return;if(!entries.length){els.cartMailto.href='#';els.cartMailto.classList.add('is-disabled');els.cartMailto.setAttribute('aria-disabled','true');return;}const lines=entries.map((entry)=>{const code=entry.item.code||'—';const title=entry.item.title||'Untitled style';const src=entry.item.src||'';const base=`${code}, ${title}, ${src}`;return entry.qty>1?`${base} (qty: ${entry.qty})`:base;});if(window.GalleryExporters&&typeof window.GalleryExporters.buildMailto==='function')els.cartMailto.href=window.GalleryExporters.buildMailto('Gallery selection',lines);els.cartMailto.classList.remove('is-disabled');els.cartMailto.removeAttribute('aria-disabled');};
  const buildCartRow=(entry)=>{const row=document.createElement('div');row.className='cart-item';const info=document.createElement('div');info.className='cart-item__info';const title=document.createElement('div');title.className='cart-item__title';title.textContent=entry.item.title||'Untitled style';const code=document.createElement('div');code.className='cart-item__code';code.textContent=entry.item.code||'—';info.append(title,code);if(entry.item.price!=null){const price=document.createElement('span');price.className='price-tag';price.textContent=formatCurrency(entry.item.price);info.appendChild(price);}const controls=document.createElement('div');controls.className='cart-item__controls';const dec=document.createElement('button');dec.type='button';dec.textContent='−';dec.setAttribute('aria-label',`Remove one ${entry.item.title||'item'}`);dec.addEventListener('click',()=>adjustCartQuantity(entry.key,-1));const qty=document.createElement('span');qty.className='cart-item__qty';qty.textContent=String(entry.qty);const inc=document.createElement('button');inc.type='button';inc.textContent='+';inc.setAttribute('aria-label',`Add one ${entry.item.title||'item'}`);inc.addEventListener('click',()=>adjustCartQuantity(entry.key,1));const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`Remove ${entry.item.title||'item'} from cart`);remove.addEventListener('click',()=>removeCartItem(entry.key));controls.append(dec,qty,inc,remove);row.append(info,controls);return row;};
  const renderCart=()=>{if(!flags.cart||!els.cartItems||!els.cartSubtotal)return;els.cartItems.innerHTML='';const entries=Array.from(cart.values()).filter((entry)=>entry.qty>0);if(!entries.length){const empty=document.createElement('p');empty.className='cart-empty';empty.textContent='Your cart is empty.';els.cartItems.appendChild(empty);}else{entries.forEach((entry)=>els.cartItems.appendChild(buildCartRow(entry)));}const subtotal=entries.reduce((total,entry)=>{const price=typeof entry.item.price==='number'&&Number.isFinite(entry.item.price)?entry.item.price:0;return total+price*entry.qty;},0);els.cartSubtotal.textContent=formatCurrency(subtotal);updateCartBadge(entries.reduce((total,entry)=>total+entry.qty,0));updateMailto(entries);};
  const adjustCartQuantity=(key,delta)=>{const entry=cart.get(key);if(!entry)return;entry.qty+=delta;if(entry.qty<=0)cart.delete(key);renderCart();persistCart();};
  const removeCartItem=(key)=>{if(!cart.has(key))return;cart.delete(key);renderCart();persistCart();};
  const clearCart=()=>{cart.clear();renderCart();persistCart();};
  const addToCart=(item)=>{if(!flags.cart)return;const key=getCartKey(item);const existing=cart.get(key);if(existing){existing.qty+=1;existing.item=item;}else{cart.set(key,{key,qty:1,item});}renderCart();persistCart();flashStatus(`${item.code||item.title||'Style'} added to cart.`);};
  const openCart=()=>{if(!els.cartDrawer||!els.cartBackdrop)return;els.cartDrawer.hidden=false;els.cartBackdrop.hidden=false;requestAnimationFrame(()=>{els.cartDrawer.classList.add('is-open');els.cartBackdrop.classList.add('is-open');});};
  const closeCart=()=>{if(!els.cartDrawer||!els.cartBackdrop)return;els.cartDrawer.classList.remove('is-open');els.cartBackdrop.classList.remove('is-open');setTimeout(()=>{els.cartDrawer.hidden=true;els.cartBackdrop.hidden=true;},250);};
  const setupCart=()=>{if(!flags.cart||!els.cartToggle)return;els.cartToggle.hidden=false;loadCartFromStorage();renderCart();els.cartToggle.addEventListener('click',openCart);if(els.cartClose)els.cartClose.addEventListener('click',closeCart);if(els.cartBackdrop)els.cartBackdrop.addEventListener('click',closeCart);document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&els.cartDrawer&&!els.cartDrawer.hidden)closeCart();});if(els.cartClear)els.cartClear.addEventListener('click',clearCart);};

  const init=async()=>{
    if(els.year)els.year.textContent=String(new Date().getFullYear());
    const toolbarEnabled=(flags.search&&els.searchContainer)||(flags.categories&&els.categoryContainer)||(flags.exports&&els.toolbarButtons);
    if(toolbarEnabled&&els.toolbar)els.toolbar.hidden=false;
    setupSearch();
    setupCategories();
    setupExports();
    setupCart();
    showStatus('Loading gallery…');
    try{
      const manifest=await loadManifest('manifest.json');
      if(!Array.isArray(manifest)||!manifest.length){showStatus('The manifest does not contain any gallery items.','error');return;}
      state.items=manifest.map(normalizeItem);
      state.categories=collectCategories(state.items);
      renderCategoryChips();
      state.filtered=state.items.slice();
      renderGallery(state.filtered);
      updateExportAvailability();
      hideStatus();
      syncCartWithManifest();
    }catch(error){console.error('Failed to load manifest:',error);showStatus(`Unable to load manifest.json. ${error.message||error}`,'error');}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
