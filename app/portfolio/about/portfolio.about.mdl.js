(function () {
    'use strict';

    angular
        .module('portfolio.about', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('portfolio.about', {
                url: 'about',
                templateUrl: '../views/portfolio/portfolio.about.html',
                data: {
                    is_granted: ['ROLE_USER', 'ROLE_GUEST']
                }
            });
    }

})();
 