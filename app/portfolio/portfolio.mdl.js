(function () {
    'use strict';

    angular
        .module('portfolio', [
            'portfolio.intro',
            'portfolio.projects',
            'portfolio.about',
            'portfolio.contact'
        ])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('portfolio', {
                url: '/',
                abstract: true,
                templateUrl: '../views/portfolio/portfolio.html',
                controller: 'PortfolioCtrl',
                data: {
                    is_granted: ['ROLE_USER']
                }
            });
    }

})();
 