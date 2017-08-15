(function () {
    'use strict';

    angular
        .module('admin.quotes.edit', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('admin.quotes.edit', {
                url: '/edit/:slug',
                data: {
                    is_granted: ['ROLE_ADMIN']
                },
                onEnter: [
                    'ngDialog',
                    'AdminQuotesService',
                    '$stateParams',
                    '$state',
                    '$log',
                    function (ngDialog, AdminQuotesService, $stateParams, $state, $log) {
                        getQuote($stateParams.slug);

                        function getQuote(slug) {
                            function success(response) {
                                openDialog(response.data.object);
                            }

                            function failed(response) {
                                $log.error(response);
                            }

                            AdminQuotesService
                                .getQuoteBySlug(slug)
                                .then(success, failed);
                        }

                        function openDialog(data) {

                            var options = {
                                templateUrl: '../views/admin/admin.quotes.edit.html',
                                data: data,
                                showClose: true,
                                controller: 'AdminQuotesEdit as vm'
                            };

                            ngDialog.open(options).closePromise.finally(function () {
                                $state.go('admin.quotes', {}, {reload: true});
                            });
                        }
                    }]
            });
    }
})();
 