var angular = require('angular');
var qwery = require('qwery');
var xtend = require('xtend');
var insertcss = require('insert-css');

var css = require('fs').readFileSync(__dirname + '/baron.css', 'utf8');
insertcss(css, {prepend: true});

require('baron/baron.min.js');  // creates window.baron object

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
