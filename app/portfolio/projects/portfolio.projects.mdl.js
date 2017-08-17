(function () {
    'use strict';

    angular
        .module('portfolio.projects', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('portfolio.projects', {
                url: 'projects',
                templateUrl: '../views/portfolio/portfolio.projects.html',
                data: {
                    is_granted: ['ROLE_USER']
                }
            });
    }

})();
 