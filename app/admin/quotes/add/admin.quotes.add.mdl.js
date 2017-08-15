(function () {
    'use strict';
    
    angular
        .module('admin.quotes.add', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {
 
        $stateProvider
            .state('admin.quotes.add', {
                url: '/add',
                onEnter: [
                'ngDialog',
                'AdminQuotesService',
                '$stateParams',
                '$state',
                '$log',
                function (ngDialog, AdminQuotesService, $stateParams, $state, $log) {
                    openDialog(AdminQuotesService.quote);
                        
                    function openDialog(data) {
    
                        var options = {
                            templateUrl: '../views/admin/admin.quotes.edit.html',
                            data: data,
                            controller: 'AdminQuotesAdd as vm',
                            showClose: true
                        };
    
                        ngDialog.open(options).closePromise.finally(function () {
                            $state.go('admin.quotes', {}, {reload: true});
                        });
                    }
                }],
                data: {
                    is_granted: ['ROLE_ADMIN']
                }
            });
    }
    
})();
 