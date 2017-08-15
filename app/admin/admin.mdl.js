(function () {
    'use strict';

    angular
        .module('admin', [
            'admin.quotes',
            'admin.authors'
        ])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('admin', {
                url: '/admin/',
                abstract: true,
                templateUrl: '../views/admin/admin.html',
                controller: 'AdminCtrl',
                data: {
                    is_granted: ['ROLE_ADMIN']
                }
            });
    }

})();
 