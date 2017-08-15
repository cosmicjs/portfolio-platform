(function () {
    'use strict';
    
    angular
        .module('admin.quotes', [
            'admin.quotes.edit',
            'admin.quotes.add'
        ])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {
 
        $stateProvider
            .state('admin.quotes', {
                url: 'quotes',
                templateUrl: '../views/admin/admin.quotes.html',
                controller: 'AdminQuotesCtrl as vm',
                data: {
                    is_granted: ['ROLE_ADMIN']
                }
            });
    }
    
})();
 