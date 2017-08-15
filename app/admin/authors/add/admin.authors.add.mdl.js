(function () {
    'use strict';
    
    angular
        .module('admin.authors.add', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('admin.authors.add', {
                url: '/add',
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
                        openDialog(AdminAuthorsService.author);

                        function openDialog(data) {

                            var options = {
                                templateUrl: '../views/admin/admin.authors.edit.html',
                                data: data,
                                showClose: true,
                                controller: 'AdminAuthorsAdd as vm'
                            };

                            ngDialog.open(options).closePromise.finally(function () {
                                $state.go('admin.authors', {}, {reload: true});
                            });
                        }
                    }]
            });
    }
})();
 