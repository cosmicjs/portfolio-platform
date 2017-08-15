(function () {
    'use strict';
    
    angular
        .module('admin.authors.edit', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('admin.authors.edit', {
                url: '/edit/:slug',
                data: {
                    is_granted: ['ROLE_ADMIN']
                },
                onEnter: [
                    'ngDialog',
                    'AdminAuthorsService',
                    '$stateParams',
                    '$state',
                    '$log',
                    function (ngDialog, AdminAuthorsService, $stateParams, $state, $log) {
                        getAuthor($stateParams.slug);

                        function getAuthor(slug) {
                            function success(response) {
                                response.data.object.metafields[2].value = new Date(response.data.object.metafields[2].value);
                                response.data.object.metafields[3].value = new Date(response.data.object.metafields[3].value);

                                openDialog(response.data.object);
                            }

                            function failed(response) {
                                $log.error(response);
                            }

                            AdminAuthorsService
                                .getAuthorBySlug(slug)
                                .then(success, failed);
                        }

                        function openDialog(data) {

                            var options = {
                                templateUrl: '../views/admin/admin.authors.edit.html',
                                data: data,
                                showClose: true,
                                controller: 'AdminAuthorsEdit as vm'
                            };

                            ngDialog.open(options).closePromise.finally(function () {
                                $state.go('admin.authors', {}, {reload: true});
                            });
                        }
                    }]
            });
    }
})();
 