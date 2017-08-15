(function () {
    'use strict';

    angular
        .module('portfolio', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('portfolio', {
                url: '/',
                templateUrl: '../views/portfolio/portfolio.html',
                controller: 'PortfolioCtrl',
                data: {
                    is_granted: ['ROLE_USER']
                }
            });
    }

})();
 