define([
  'angular',
  'text!./cam-tasklist-sorting-choices.html'
], function(
  angular,
  template
) {
  'use strict';

  function addCSSRule(sheet, selector, rules, index) {
    if('insertRule' in sheet) {
      sheet.insertRule(selector + '{' + rules + '}', index);
    }
    else if('addRule' in sheet) {
      sheet.addRule(selector, rules, index);
    }
  }

  function stringifySortings(sortingQuery) {
    return JSON.stringify(sortingQuery.map(function (sorting) {
      var obj = {
        sortBy: sorting.by,
        sortOrder: sorting.order
      };

      if (sorting.by.indexOf('Variable') > -1) {
        if (!sorting.parameters) {
          throw new Error('Variable sorting needs parameters');
        }
        obj.parameters = sorting.parameters;
      }

      return obj;
    }));
  }

  return [
    'search',
    '$translate',
    '$location',
    '$document',
  function(
    search,
    $translate,
    $location,
    $document
  ) {
    return {

      restrict: 'A',

      scope: {
        tasklistData: '='
      },

      template: template,

      controller: [function () {}],

      link: function(scope, element) {
        var $body = angular.element('body');

        var sorting = {
          order:    'desc',
          by:       'created'
        };

        scope.sortings = [angular.copy(sorting)];

        scope.openDropdowns = [];

        scope.sortedOn = [];

        // var sheets = document.styleSheets;
        // var sheet = sheets[sheets.length - 1];
        // var num = sheet.rules.length;
        // addCSSRule(sheet, '', '', 1);

        // console.info('sheets', sheets, $document, document.styleSheets);

        function updateBodyClass(plus) {
          // if (scope.sortings.length > 1) {
          // }
          // console.info('element', element[0], element.height());
          $body
            .removeClass('sort-choices-' + scope.sortings.length)
            .addClass('sort-choices-' + (scope.sortings.length + plus))
          ;
        }

        scope.uniqueProps = {
          priority:               $translate.instant('PRIORITY'),
          created:                $translate.instant('CREATION_DATE'),
          dueDate:                $translate.instant('DUE_DATE'),
          followUpDate:           $translate.instant('FOLLOW_UP_DATE'),
          nameCaseInsensitive:    $translate.instant('TASK_NAME'),
          assignee:               $translate.instant('ASSIGNEE')
        };

        scope.byLabel = function (index) {
          if (!scope.sortings[index]) {
            return '';
          }

          var by = scope.sortings[index].by;

          if (scope.uniqueProps[by]) {
            return scope.uniqueProps[by].toLowerCase();
          }

          if (!scope.sortings[index] || !scope.sortings[index].parameters) {
            return '';
          }

          return scope.sortings[index].parameters.variable;
        };

        scope.sortLimit = Object.keys(scope.uniqueProps).length;

        /**
         * observe the task list query
         */
        var tasklistData = scope.tasklistData.newChild(scope);

        tasklistData.observe('taskListQuery', function(taskListQuery) {
          if (taskListQuery) {
            var urlSortings = JSON.parse(($location.search() || {}).sorting || '[]');

            scope.sortedOn = [];
            scope.openDropdowns = [];

            scope.sortings = urlSortings.map(function (sorting) {
              scope.sortedOn.push(sorting.sortBy);
              scope.openDropdowns.push(false);

              var returned = {
                order:      sorting.sortOrder,
                by:         sorting.sortBy
              };

              if (sorting.parameters) {
                returned.parameters = sorting.parameters;
              }

              return returned;
            });

            updateBodyClass(0);

            if (!scope.sortings.length) {
              scope.addSorting('created');
            }
          }
        });


        scope.$watch('sortings.length', function (now, before) {
          if (now !== before) { updateSortings(); }
        });


        // should NOT manipulate the `scope.sortings`!
        function updateSortings(dontApply) {
          scope.openDropdowns = [];
          scope.sortedOn = scope.sortings.map(function (sorting) {
            scope.openDropdowns.push(false);
            return sorting.by;
          });

          if (!dontApply) {
            search.updateSilently({
              sorting: stringifySortings(scope.sortings)
            });

            tasklistData.changed('taskListQuery');
          }
        }

        /**
         * Invoked when adding a sorting object
         */
        scope.addSorting = function (by, order) {
          updateBodyClass(1);
          order = order || 'desc';

          var newSorting = angular.copy(sorting);
          newSorting.by = by;
          scope.sortings.push(newSorting);

          updateSortings();
        };

        /**
         * Invoked when removing a sorting object
         */
        scope.removeSorting = function (index) {
          updateBodyClass(-1);

          var newSortings = [];
          scope.sortings.forEach(function (sorting, i) {
            if (i != index) {
              newSortings.push(sorting);
            }
          });
          scope.sortings = newSortings;

          updateSortings();
        };

        /**
         * invoked when the sort order is changed
         */
        scope.changeOrder = function(index) {
          scope.sortings[index].order = scope.sortings[index].order === 'asc' ? 'desc' : 'asc';

          updateSortings();
        };

        /**
         * invoked when the sort property is changed
         */
        scope.changeBy = function(index, by) {
          scope.sortings[index].by = by;

          updateSortings();
        };
      }
    };
  }];
});
