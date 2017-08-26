(function () {
    'use strict';

    angular
        .module('portfolio', [
            'portfolio.intro',
            'portfolio.projects',
            'portfolio.about',
            'portfolio.contact',
            'portfolio.settings'
        ])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('portfolio', {
                url: '/:slug/',
                abstract: true,
                templateUrl: '../views/portfolio/portfolio.html',
                controller: 'PortfolioCtrl as vm',
                data: {
                    is_granted: ['ROLE_USER', 'ROLE_GUEST']
                }
            });
    }

})();
 