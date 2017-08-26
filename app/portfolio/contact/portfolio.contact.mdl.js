(function () {
    'use strict';

    angular
        .module('portfolio.contact', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('portfolio.contact', {
                url: 'contact',
                templateUrl: '../views/portfolio/portfolio.contact.html',
                data: {
                    is_granted: ['ROLE_USER', 'ROLE_GUEST']
                }
            });
    }

})();
 