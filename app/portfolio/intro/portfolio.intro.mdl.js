(function () {
    'use strict';

    angular
        .module('portfolio.intro', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('portfolio.intro', {
                url: '',
                templateUrl: '../views/portfolio/portfolio.intro.html',
                data: {
                    is_granted: ['ROLE_USER', 'ROLE_GUEST']
                }
            });
    }

})();
 