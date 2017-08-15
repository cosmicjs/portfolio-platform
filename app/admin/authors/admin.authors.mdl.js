(function () {
    'use strict';
    
    angular
        .module('admin.authors', [
            'admin.authors.edit',
            'admin.authors.add'
        ]) 
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {
 
        $stateProvider
            .state('admin.authors', {
                url: 'authors',
                templateUrl: '../views/admin/admin.authors.html',
                controller: 'AdminAuthorsCtrl as vm',
                data: {
                    is_granted: ['ROLE_ADMIN']
                }
            });
        
        
    }
    
})();
 