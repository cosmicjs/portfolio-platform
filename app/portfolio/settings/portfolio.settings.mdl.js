(function () {
    'use strict';

    angular
        .module('portfolio.settings', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('portfolio.settings', {
                url: 'settings',
                templateUrl: '../views/portfolio/portfolio.settings.html',
                // controller: 'PortfolioSettingsCtrl as vm',
                data: {
                    is_granted: ['ROLE_USER']
                }
            });
    }

})();
 