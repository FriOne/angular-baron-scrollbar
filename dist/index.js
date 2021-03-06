(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.angularBaronScrollbar = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global){
var angular = (typeof window !== "undefined" ? window['angular'] : typeof global !== "undefined" ? global['angular'] : null);
var qwery = _dereq_('qwery');
var xtend = _dereq_('xtend');
var insertcss = _dereq_('insert-css');

var css = ".scroller_wrapper {\n\tposition: relative;\n\toverflow: hidden;\n}\n.scroller {\n\theight: 100%;\n\toverflow: auto;\n\t/*-webkit-overflow-scrolling: touch;*/\n\t/* uncomment to accelerate scrolling on iOs */\n}\n[class^=\"baron\"] .scroller::-webkit-scrollbar {\n\twidth: 0;\n}\n.scroller__track_v {\n\tdisplay: none;\n\tposition: absolute;\n\tz-index: 3;\n\ttop: 20px;\n\tbottom: 20px;\n\tright: 5px;\n\twidth: 8px;\n\tborder-radius: 5px;\n\tbackground: #ddf;\n\tbackground: rgba(0, 0, 255, .1);\n\tpointer-events: none;\n}\n.scroller__track_h {\n\tdisplay: none;\n\tposition: absolute;\n\tz-index: 3;\n\tleft: 20px;\n\tright: 20px;\n\tbottom: 5px;\n\theight: 8px;\n\tborder-radius: 5px;\n\tbackground: #ddf;\n\tbackground: rgba(0, 0, 255, .1);\n\tpointer-events: none;\n}\n.baron .scroller__track_v {\n\tdisplay: block;\n}\n\n.baron_h .scroller__track_h {\n\tdisplay: block;\n}\n\n.scroller__bar_v {\n\tposition: absolute;\n\tz-index: 1;\n\twidth: 8px;\n\tborder-radius: 3px;\n\tbackground: #987; \n\topacity: 0.5;\n\t-webkit-transition: opacity .2s linear;\n\ttransition: opacity .2s linear;\n\tpointer-events: auto;\n}\n\n.scroller__bar_h {\n\tposition: absolute;\n\tz-index: 1;\n\theight: 8px;\n\tborder-radius: 3px;\n\tbackground: #987; \n\topacity: 0.5;\n\t-webkit-transition: opacity .2s linear;\n\ttransition: opacity .2s linear;\n\tpointer-events: auto;\n}\n\n.baron .scroller__bar {\n\topacity: .5;\n}\n.baron_h .scroller__bar_h {\n\topacity: .6;\n}\n[class^=\"scroller__bar\"]:hover {\n\topacity: 0.8;\n}\n";
insertcss(css, {prepend: true});

_dereq_('baron/baron.min.js');  // creates window.baron object

module.exports = 'angular-baron-scrollbar';

var template =
  ' <div class="scroller_wrapper"> ' +
  '   <div class="scroller" in-view-container ng-transclude></div>' +
  '   <div class="scroller__track_v">                             ' +
  '     <div class="scroller__bar_v"></div>                       ' +
  '   </div>                                                      ' +
  '   <div class="scroller__track_h">                             ' +
  '     <div class="scroller__bar_h"></div>                       ' +
  '   </div>                                                      ' +
  ' </div>                                                        ' ;

var defaultOpts = {
  scroller: '.scroller',
  bar: '.scroller__bar_v',
  barOnCls: 'baron',

  // Local copy of jQuery-like utility
  // Default: window.jQuery
  $: window.jQuery || function(selector, context) {
    return angular.element(qwery(selector, context));
  }
};

angular
  .module(module.exports, [])
  .directive('baronScrollbar', ['$parse', controller]);

function controller($parse) {
  return {
    restrict: 'EA',
    transclude: true,
    scope: {
      update: '=?',
      moveToBottom: '=?',
      topIndent: '<?',
      bottomIndent: '<?',
      toBottomOnInit: '<?',
      onTop: '=?',
      onBottom: '=?',
      onScroll: '&?',
      onScrollToTop: '&?',
      onScrollToBottom: '&?',
      direction: '@?'
    },
    template: template,
    replace: true,
    link: link
  };

  function link($scope, $element, attr) {
    var hscroll, vscroll;
    var moveToBottomInterval;
    var opts = $parse(attr['opts'])($scope) || {};
    var hopts = $parse(attr['hopts'])($scope) || {};
    var direction = attr['direction'] || 'y';
    opts = xtend(defaultOpts, {root: $element}, opts);

    var $scroller = opts.$('.scroller', $element);
    $scope.onTop = $scope.onTop || true;
    $scope.onBottom = $scope.onBottom || false;
    $scope.topIndent = $scope.topIndent || 100;
    $scope.bottomIndent = $scope.bottomIndent || 0;
    $scroller.on('scroll', onScroll);

    if (direction.indexOf('x') !== -1) {
      hscroll = baron(
        xtend(opts, {
          barOnCls: 'baron_h',
          bar: '.scroller__bar_h',
          direction: 'h'
        }, hopts)
      );
    }
    if (direction.indexOf('y') !== -1) {
      vscroll = baron(opts);
    }

    if ($scope.toBottomOnInit) {
      // Little hack to scroll to bottom on init immediately after full render.
      moveToBottomInterval = setInterval(function() {
        if (!isOnBottom()) {
          moveToBottom();
          clearInterval(moveToBottomInterval);
        }
      }, 60);
    }

    $scope.$watch('update', onUpdate);
    $scope.$watch('moveToBottom', onMoveToBottom);
    $scope.$on('$destroy', onDestroy);

    function onDestroy() {
      clearInterval(moveToBottomInterval);
      $scroller.off('scroll');
      hscroll && hscroll.dispose();
      vscroll && vscroll.dispose();
    }

    function onUpdate(n, o) {
      if (n) {
        var prevOnBottom = $scope.onBottom;
        hscroll && hscroll.update();
        vscroll && vscroll.update();
        $scope.update = false;

        if ($scope.toBottomOnInit && prevOnBottom) {
          moveToBottom();
        }
      }
    }

    function onMoveToBottom(n, o) {
      if (n) {
        $scope.moveToBottom = false;
        moveToBottom();
      }
    }

    function onScroll() {
      var prevOnBottom = $scope.onBottom;
      var prevOnTop = $scope.onTop;
      $scope.onTop = ($scroller[0].scrollTop <= $scope.topIndent);
      $scope.onBottom = isOnBottom();

      $scope.onScroll && $scope.onScroll();
      if ($scope.onBottom && prevOnBottom !== $scope.onBottom && $scope.onScrollToBottom) {
        $scope.onScrollToBottom();
      }
      if ($scope.onTop && prevOnTop !== $scope.onTop && $scope.onScrollToTop) {
        $scope.onScrollToTop();
      }
    }

    function isOnBottom() {
      return (($scroller[0].scrollHeight - $scroller[0].scrollTop - $scope.bottomIndent) <= $scroller[0].clientHeight);
    }

    function moveToBottom() {
      $scroller[0].scrollTop = $scroller[0].scrollHeight;
      self.onBottom = true;
    }
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"baron/baron.min.js":2,"insert-css":3,"qwery":4,"xtend":5}],2:[function(_dereq_,module,exports){
!function(t,i,s){"use strict";function e(i,e){var r=0;for((i.length===s||i===t)&&(i=[i]);i[r];)e.call(this,i[r],r),r++}function r(i){var s,e,o;i=i||{},o=i.$||o||t.jQuery,s=this instanceof o,s?i.root=e=this:e=o(i.root||i.scroller);var n=new r.fn.constructor(e,i,o);return n.autoUpdate&&n.autoUpdate(),n}function o(){return(new Date).getTime()}function n(s,r,o){s._eventHandlers=s._eventHandlers||[{element:s.scroller,handler:function(t){s.scroll(t)},type:"scroll"},{element:s.root,handler:function(){s.update()},type:"transitionend animationend"},{element:s.scroller,handler:function(){s.update()},type:"keyup"},{element:s.bar,handler:function(t){t.preventDefault(),s.selection(),s.drag.now=1,s.draggingCls&&i(s.bar).addClass(s.draggingCls)},type:"touchstart mousedown"},{element:document,handler:function(){s.selection(1),s.drag.now=0,s.draggingCls&&i(s.bar).removeClass(s.draggingCls)},type:"mouseup blur touchend"},{element:document,handler:function(t){2!=t.button&&s._pos0(t)},type:"touchstart mousedown"},{element:document,handler:function(t){s.drag.now&&s.drag(t)},type:"mousemove touchmove"},{element:t,handler:function(){s.update()},type:"resize"},{element:s.root,handler:function(){s.update()},type:"sizeChange"}],e(s._eventHandlers,function(t){t.element&&r(t.element,t.type,t.handler,o)})}function l(t,i,s,e){var r="data-baron-"+i+"-id";if("on"==s)t.setAttribute(r,e);else{if("off"!=s)return t.getAttribute(r);t.removeAttribute(r)}}function a(t){l(t.root,t.direction)&&console.log("Error! Baron for this node already initialized",t.root);var i=new g.prototype.constructor(t);return n(i,t.event,"on"),l(i.root,t.direction,"on",d.length),d.push(i),i.update(),i}function c(t){var i={};t=t||{};for(var s in t)t.hasOwnProperty(s)&&(i[s]=t[s]);return i}function h(t){var i=c(t);i.direction=i.direction||"v";var s=t.event||function(t,s,e,r){i.$(t)[r||"on"](s,e)};return i.event=function(t,i,r,o){e(t,function(t){s(t,i,r,o)})},i}function u(t){if(this.events&&this.events[t])for(var i=0;i<this.events[t].length;i++){var s=Array.prototype.slice.call(arguments,1);this.events[t][i].apply(this,s)}}if(t){var f=r,p=["left","top","right","bottom","width","height"],d=[],v={v:{x:"Y",pos:p[1],oppos:p[3],crossPos:p[0],crossOpPos:p[2],size:p[5],crossSize:p[4],crossMinSize:"min-"+p[4],crossMaxSize:"max-"+p[4],client:"clientHeight",crossClient:"clientWidth",crossScroll:"scrollWidth",offset:"offsetHeight",crossOffset:"offsetWidth",offsetPos:"offsetTop",scroll:"scrollTop",scrollSize:"scrollHeight"},h:{x:"X",pos:p[0],oppos:p[2],crossPos:p[1],crossOpPos:p[3],size:p[4],crossSize:p[5],crossMinSize:"min-"+p[5],crossMaxSize:"max-"+p[5],client:"clientWidth",crossClient:"clientHeight",crossScroll:"scrollHeight",offset:"offsetWidth",crossOffset:"offsetHeight",offsetPos:"offsetLeft",scroll:"scrollLeft",scrollSize:"scrollWidth"}};r._instances=d,r.fn={constructor:function(t,i,r){var o=h(i);o.$=r,this.length=0,e.call(this,t,function(t,e){var r=l(t,o.direction),n=+r;if(n==n&&r!=s&&d[n]&&!i)this[e]=d[n];else{var h=c(o);o.root&&o.scroller?(h.scroller=o.$(o.scroller,t),h.scroller.length||(h.scroller=t)):h.scroller=t,h.root=t,this[e]=a(h)}this.length=e+1}),this.params=o},dispose:function(){var t=this.params;e(this,function(i){i.dispose(t)}),this.params=null},update:function(){for(var t=0;this[t];)this[t].update.apply(this[t],arguments),t++},baron:function(t){return t.root=[],t.scroller=this.params.scroller,e.call(this,this,function(i){t.root.push(i.root)}),t.direction="v"==this.params.direction?"h":"v",t._chain=!0,r(t)}};var g={};g.prototype={_debounce:function(t,i){var e,r,n=this,l=function(){if(n._disposed)return clearTimeout(e),e=n=null,s;var a=o()-r;i>a&&a>=0?e=setTimeout(l,i-a):(e=null,t())};return function(){r=o(),e||(e=setTimeout(l,i))}},constructor:function(t){function i(t,i){return h(t,i)[0]}function e(t){var i=this.barMinSize||20;t>0&&i>t&&(t=i),this.bar&&h(this.bar).css(this.origin.size,parseInt(t,10)+"px")}function r(t){if(this.bar){var i=h(this.bar).css(this.origin.pos),s=+t+"px";s&&s!=i&&h(this.bar).css(this.origin.pos,s)}}function n(){return d[this.origin.client]-this.barTopLimit-this.bar[this.origin.offset]}function l(t){return t*n.call(this)+this.barTopLimit}function a(t){return(t-this.barTopLimit)/n.call(this)}function c(){return!1}var h,f,p,d,g,m,b,C,y,w,z;return w=y=o(),h=this.$=t.$,this.event=t.event,this.events={},this.root=t.root,this.scroller=i(t.scroller),this.bar=i(t.bar,this.root),d=this.track=i(t.track,this.root),!this.track&&this.bar&&(d=this.bar.parentNode),this.clipper=this.scroller.parentNode,this.direction=t.direction,this.origin=v[this.direction],this.barOnCls=t.barOnCls||"_baron",this.scrollingCls=t.scrollingCls,this.draggingCls=t.draggingCls,this.barTopLimit=0,C=1e3*t.pause||0,t.pause&&console.warn('Baronjs: "pause" param will be removed in 0.8+ version'),this.cursor=function(t){return t["client"+this.origin.x]||(((t.originalEvent||t).touches||{})[0]||{})["page"+this.origin.x]},this.pos=function(t){var i="page"+this.origin.x+"Offset",e=this.scroller[i]?i:this.origin.scroll;return t!==s&&(this.scroller[e]=t),this.scroller[e]},this.rpos=function(t){var i,s=this.scroller[this.origin.scrollSize]-this.scroller[this.origin.client];return i=t?this.pos(t*s):this.pos(),i/(s||1)},this.barOn=function(t){this.barOnCls&&(t||this.scroller[this.origin.client]>=this.scroller[this.origin.scrollSize]?h(this.root).hasClass(this.barOnCls)&&h(this.root).removeClass(this.barOnCls):h(this.root).hasClass(this.barOnCls)||h(this.root).addClass(this.barOnCls))},this._pos0=function(t){p=this.cursor(t)-f},this.drag=function(t){var i=a.call(this,this.cursor(t)-p),s=this.scroller[this.origin.scrollSize]-this.scroller[this.origin.client];this.scroller[this.origin.scroll]=i*s},this.selection=function(t){this.event(document,"selectpos selectstart",c,t?"off":"on")},this.resize=function(){function t(){var t,s,e=i.scroller[i.origin.crossOffset],r=i.scroller[i.origin.crossClient];if(r>0&&0===e&&(e=r+17),e)if(i.barOn(),r=i.scroller[i.origin.crossClient],"v"==i.direction){var n=e-r;t=h(i.clipper).css(i.origin.crossSize),s=i.clipper[i.origin.crossClient]+n+"px",t!=s&&i._setCrossSizes(i.scroller,s)}else t=h(i.clipper).css(i.origin.crossSize),s=r+"px",t!=s&&i._setCrossSizes(i.clipper,s);Array.prototype.unshift.call(arguments,"resize"),u.apply(i,arguments),w=o()}var i=this,s=0;o()-w<C&&(clearTimeout(g),s=C),s?g=setTimeout(t,s):t()},this.updatePositions=function(){var t,i=this;i.bar&&(t=(d[i.origin.client]-i.barTopLimit)*i.scroller[i.origin.client]/i.scroller[i.origin.scrollSize],parseInt(z,10)!=parseInt(t,10)&&(e.call(i,t),z=t),f=l.call(i,i.rpos()),r.call(i,f)),Array.prototype.unshift.call(arguments,"scroll"),u.apply(i,arguments),y=o()},this.scroll=function(){var t=0,i=this;o()-y<C&&(clearTimeout(m),t=C),t?m=setTimeout(function(){i.updatePositions()},t):i.updatePositions(),i.scrollingCls&&(b||this.$(this.scroller).addClass(this.scrollingCls),clearTimeout(b),b=setTimeout(function(){i.$(i.scroller).removeClass(i.scrollingCls),b=s},300))},this._setCrossSizes=function(t,i){var s={};s[this.origin.crossSize]=i,s[this.origin.crossMinSize]=i,s[this.origin.crossMaxSize]=i,this.$(t).css(s)},this},update:function(t){return u.call(this,"upd",t),this.resize(1),this.updatePositions(),this},dispose:function(t){n(this,this.event,"off"),l(this.root,t.direction,"off"),"v"==t.direction?this._setCrossSizes(this.scroller,""):this._setCrossSizes(this.clipper,""),this.barOn(!0),u.call(this,"dispose"),this._disposed=!0},on:function(t,i,s){for(var e=t.split(" "),r=0;r<e.length;r++)"init"==e[r]?i.call(this,s):(this.events[e[r]]=this.events[e[r]]||[],this.events[e[r]].push(function(t){i.call(this,t||s)}))}},r.fn.constructor.prototype=r.fn,g.prototype.constructor.prototype=g.prototype,r.noConflict=function(){return t.baron=f,r},r.version="0.7.16",i&&i.fn&&(i.fn.baron=r),t.baron=r,"undefined"!=typeof module&&(module.exports=r.noConflict())}}(window,window.$),function(t,s){var e=function(t){function e(t,i,e){var r=1==e?"pos":"oppos";l<(a.minView||0)&&(i=s),this.$(n[t]).css(this.origin.pos,"").css(this.origin.oppos,"").removeClass(a.outside),i!==s&&(i+="px",this.$(n[t]).css(this.origin[r],i).addClass(a.outside))}function r(t){try{i=document.createEvent("WheelEvent"),i.initWebKitWheelEvent(t.originalEvent.wheelDeltaX,t.originalEvent.wheelDeltaY),f.dispatchEvent(i),t.preventDefault()}catch(t){}}function o(t){var i;for(var s in t)a[s]=t[s];if(n=this.$(a.elements,this.scroller)){l=this.scroller[this.origin.client];for(var e=0;e<n.length;e++)i={},i[this.origin.size]=n[e][this.origin.offset],n[e].parentNode!==this.scroller&&this.$(n[e].parentNode).css(i),i={},i[this.origin.crossSize]=n[e].parentNode[this.origin.crossClient],this.$(n[e]).css(i),l-=n[e][this.origin.offset],u[e]=n[e].parentNode[this.origin.offsetPos],c[e]=c[e-1]||0,h[e]=h[e-1]||Math.min(u[e],0),n[e-1]&&(c[e]+=n[e-1][this.origin.offset],h[e]+=n[e-1][this.origin.offset]),(0!=e||0!=u[e])&&(this.event(n[e],"mousewheel",r,"off"),this.event(n[e],"mousewheel",r));a.limiter&&n[0]&&(this.track&&this.track!=this.scroller?(i={},i[this.origin.pos]=n[0].parentNode[this.origin.offset],this.$(this.track).css(i)):this.barTopLimit=n[0].parentNode[this.origin.offset],this.scroll()),a.limiter===!1&&(this.barTopLimit=0)}var o={element:n,handler:function(){for(var t,i=d(this)[0].parentNode,s=i.offsetTop,e=0;e<n.length;e++)n[e]===this&&(t=e);var r=s-c[t];a.scroll?a.scroll({x1:v.scroller.scrollTop,x2:r}):v.scroller.scrollTop=r},type:"click"};a.clickable&&(this._eventHandlers.push(o),p(o.element,o.type,o.handler,"on"))}var n,l,a={outside:"",inside:"",before:"",after:"",past:"",future:"",radius:0,minView:0},c=[],h=[],u=[],f=this.scroller,p=this.event,d=this.$,v=this;this.on("init",o,t);var g=[],m=[];this.on("init scroll",function(){var t,i,r;if(n){for(var o,f=0;f<n.length;f++)t=0,u[f]-this.pos()<h[f]+a.radius?(t=1,i=c[f]):u[f]-this.pos()>h[f]+l-a.radius?(t=2,i=this.scroller[this.origin.client]-n[f][this.origin.offset]-c[f]-l):(t=3,i=s),r=!1,(u[f]-this.pos()<h[f]||u[f]-this.pos()>h[f]+l)&&(r=!0),(t!=g[f]||r!=m[f])&&(e.call(this,f,i,t),g[f]=t,m[f]=r,o=!0);if(o)for(f=0;f<n.length;f++)1==g[f]&&a.past&&this.$(n[f]).addClass(a.past).removeClass(a.future),2==g[f]&&a.future&&this.$(n[f]).addClass(a.future).removeClass(a.past),3==g[f]?((a.future||a.past)&&this.$(n[f]).removeClass(a.past).removeClass(a.future),a.inside&&this.$(n[f]).addClass(a.inside)):a.inside&&this.$(n[f]).removeClass(a.inside),g[f]!=g[f+1]&&1==g[f]&&a.before?this.$(n[f]).addClass(a.before).removeClass(a.after):g[f]!=g[f-1]&&2==g[f]&&a.after?this.$(n[f]).addClass(a.after).removeClass(a.before):this.$(n[f]).removeClass(a.before).removeClass(a.after),a.grad&&(m[f]?this.$(n[f]).addClass(a.grad):this.$(n[f]).removeClass(a.grad))}}),this.on("resize upd",function(t){o.call(this,t&&t.fix)})};baron.fn.fix=function(t){for(var i=0;this[i];)e.call(this[i],t),i++;return this}}(window),function(t){var i=t.MutationObserver||t.WebKitMutationObserver||t.MozMutationObserver||null,s=function(){function t(){o.root[o.origin.offset]?e():s()}function s(){r||(r=setInterval(function(){o.root[o.origin.offset]&&(e(),o.update())},300))}function e(){clearInterval(r),r=null}var r,o=this,n=o._debounce(function(){o.update()},300);this._observer=new i(function(){t(),o.update(),n()}),this.on("init",function(){o._observer.observe(o.root,{childList:!0,subtree:!0,characterData:!0}),t()}),this.on("dispose",function(){o._observer.disconnect(),e(),delete o._observer})};baron.fn.autoUpdate=function(t){if(!i)return this;for(var e=0;this[e];)s.call(this[e],t),e++;return this}}(window),function(t,i){var s=function(t){var i,s,e,r,o,n=this;r=t.screen||.9,t.forward&&(i=this.$(t.forward,this.clipper),o={element:i,handler:function(){var i=n.pos()-t.delta||30;n.pos(i)},type:"click"},this._eventHandlers.push(o),this.event(o.element,o.type,o.handler,"on")),t.backward&&(s=this.$(t.backward,this.clipper),o={element:s,handler:function(){var i=n.pos()+t.delta||30;n.pos(i)},type:"click"},this._eventHandlers.push(o),this.event(o.element,o.type,o.handler,"on")),t.track&&(e=t.track===!0?this.track:this.$(t.track,this.clipper)[0],e&&(o={element:e,handler:function(t){var i=t["offset"+n.origin.x],s=n.bar[n.origin.offsetPos],e=0;s>i?e=-1:i>s+n.bar[n.origin.offset]&&(e=1);var o=n.pos()+e*r*n.scroller[n.origin.client];n.pos(o)},type:"mousedown"},this._eventHandlers.push(o),this.event(o.element,o.type,o.handler,"on")))};baron.fn.controls=function(t){for(var i=0;this[i];)s.call(this[i],t),i++;return this}}(window),function(t,i){var s=function(t){function i(){return m.scroller[m.origin.scroll]+m.scroller[m.origin.offset]}function s(){return m.scroller[m.origin.scrollSize]}function e(){return m.scroller[m.origin.client]}function r(t,i){var s=5e-4*t;return Math.floor(i-s*(t+550))}function o(t){h=t,t?(n(),l=setInterval(n,200)):clearInterval(l)}function n(){var n,l,h={},z=i(),$=s(),S=1==b;if(l=0,b>0&&(l=40),n=r(y,l),z>=$-y&&b>-1?S&&(y+=n):y=0,0>y&&(y=0),h[f]=y+"px",e()<=s()){m.$(u).css(h);for(var _=0;_<v.length;_++)m.$(v[_].self).css(v[_].property,Math.min(y/p*100,100)+"%")}g&&y&&m.$(m.root).addClass(g),0==y&&t.onCollapse&&t.onCollapse(),b=0,a=setTimeout(function(){b=-1},w),d&&y>p&&!c&&(d(),c=!0),0==y?C++:C=0,C>1&&(o(!1),c=!1,g&&m.$(m.root).removeClass(g))}var l,a,c,h,u=this.$(t.block),f=t.size||this.origin.size,p=t.limit||80,d=t.onExpand,v=t.elements||[],g=t.inProgress||"",m=this,b=0,C=0,y=0,w=t.waiting||500;this.on("init",function(){o(!0)}),this.on("dispose",function(){o(!1)}),this.event(this.scroller,"mousewheel DOMMouseScroll",function(t){var e=t.wheelDelta<0||t.originalEvent&&t.originalEvent.wheelDelta<0||t.detail>0;e&&(b=1,clearTimeout(a),!h&&i()>=s()&&o(!0))})};baron.fn.pull=function(t){for(var i=0;this[i];)s.call(this[i],t),i++;return this}}(window);
},{}],3:[function(_dereq_,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],4:[function(_dereq_,module,exports){
/*!
  * @preserve Qwery - A selector engine
  * https://github.com/ded/qwery
  * (c) Dustin Diaz 2014 | License MIT
  */

(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else context[name] = definition()
})('qwery', this, function () {

  var classOnly = /^\.([\w\-]+)$/
    , doc = document
    , win = window
    , html = doc.documentElement
    , nodeType = 'nodeType'
  var isAncestor = 'compareDocumentPosition' in html ?
    function (element, container) {
      return (container.compareDocumentPosition(element) & 16) == 16
    } :
    function (element, container) {
      container = container == doc || container == window ? html : container
      return container !== element && container.contains(element)
    }

  function toArray(ar) {
    return [].slice.call(ar, 0)
  }

  function isNode(el) {
    var t
    return el && typeof el === 'object' && (t = el.nodeType) && (t == 1 || t == 9)
  }

  function arrayLike(o) {
    return (typeof o === 'object' && isFinite(o.length))
  }

  function flatten(ar) {
    for (var r = [], i = 0, l = ar.length; i < l; ++i) arrayLike(ar[i]) ? (r = r.concat(ar[i])) : (r[r.length] = ar[i])
    return r
  }

  function uniq(ar) {
    var a = [], i, j
    label:
    for (i = 0; i < ar.length; i++) {
      for (j = 0; j < a.length; j++) {
        if (a[j] == ar[i]) {
          continue label
        }
      }
      a[a.length] = ar[i]
    }
    return a
  }


  function normalizeRoot(root) {
    if (!root) return doc
    if (typeof root == 'string') return qwery(root)[0]
    if (!root[nodeType] && arrayLike(root)) return root[0]
    return root
  }

  /**
   * @param {string|Array.<Element>|Element|Node} selector
   * @param {string|Array.<Element>|Element|Node=} opt_root
   * @return {Array.<Element>}
   */
  function qwery(selector, opt_root) {
    var m, root = normalizeRoot(opt_root)
    if (!root || !selector) return []
    if (selector === win || isNode(selector)) {
      return !opt_root || (selector !== win && isNode(root) && isAncestor(selector, root)) ? [selector] : []
    }
    if (selector && arrayLike(selector)) return flatten(selector)


    if (doc.getElementsByClassName && selector == 'string' && (m = selector.match(classOnly))) {
      return toArray((root).getElementsByClassName(m[1]))
    }
    // using duck typing for 'a' window or 'a' document (not 'the' window || document)
    if (selector && (selector.document || (selector.nodeType && selector.nodeType == 9))) {
      return !opt_root ? [selector] : []
    }
    return toArray((root).querySelectorAll(selector))
  }

  qwery.uniq = uniq

  return qwery
}, this);

},{}],5:[function(_dereq_,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[1])(1)
});