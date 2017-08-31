(function () {
    'use strict';
    
    angular
        .module('main', [
            'ui.router', 
            'ui.bootstrap',
            'ngMask', 
            'ngCookies',
            'ngRoute',
            'ngDialog',
            'cr.acl',
            'ui-notification',
            'ngFlash',
            'ngAnimate',
            'textAngular',
            'flow',
            'angular-loading-bar',
            'ngDragDrop',
            'ngSanitize',
            'ngTouch',

            'portfolio',
            
            'config'
        ])
        .config(config)
        .run(run);

    config.$inject = ['$stateProvider', '$urlRouterProvider', 'cfpLoadingBarProvider', 'NotificationProvider', '$locationProvider'];
    function config($stateProvider, $urlRouterProvider, cfpLoadingBarProvider, NotificationProvider, $locationProvider) {
        cfpLoadingBarProvider.includeSpinner = false;

        NotificationProvider.setOptions({
            startTop: 25,
            startRight: 25,
            verticalSpacing: 20,
            horizontalSpacing: 20,
            positionX: 'right',
            positionY: 'bottom'
        });

        $urlRouterProvider.otherwise(function ($injector) {
            var $state = $injector.get("$state");
            $state.go('main');
        });
 
        $stateProvider
            .state('main', {
                url: '/',
                templateUrl: '../views/main.html',
                controller: function ($scope, $log, PortfolioService) {
                    $scope.innerHeight = window.innerHeight;

                    getHomePage();
                    
                    function getHomePage() {
                        function success(response) {
                            $scope.homePage = response.data.object;
                            $log.info(response);
                        }

                        function failed(response) {
                            $log.error(response);
                        }

                        PortfolioService
                            .getHomePage()
                            .then(success, failed);
                    }
                }
            })
            .state('blog', {
                url: '/blog',
                templateUrl: '../blog.html'
            })
            .state('login', {
                url: '/login',
                templateUrl: '../views/auth/login.html',
                controller: 'AuthCtrl as auth',
                onEnter: ['AuthService', 'crAcl', function(AuthService, crAcl) {
                    AuthService.clearCredentials();
                    crAcl.setRole();
                }],
                data: {
                    is_granted: ['ROLE_GUEST']
                }
            })
            .state('register', {
                url: '/register',
                templateUrl: '../views/auth/register.html',
                controller: 'AuthCtrl as auth',
                onEnter: ['AuthService', 'crAcl', function(AuthService, crAcl) {
                    AuthService.clearCredentials();
                    crAcl.setRole();
                }],
                data: {
                    is_granted: ['ROLE_GUEST']
                }
            });

    } 

    run.$inject = ['$rootScope', '$cookieStore', '$state', 'crAcl'];
    function run($rootScope, $cookieStore, $state, crAcl) {

        $rootScope.globals = $cookieStore.get('globals') || {};

        crAcl
            .setInheritanceRoles({
                'ROLE_ADMIN': ['ROLE_ADMIN', 'ROLE_USER', 'ROLE_GUEST'],
                'ROLE_USER': ['ROLE_USER', 'ROLE_GUEST'],
                'ROLE_GUEST': ['ROLE_GUEST']
            });

        crAcl
            .setRedirect('main');
 
        if ($rootScope.globals.currentUser) {
            crAcl.setRole($rootScope.globals.currentUser.role);
            $state.go('portfolio.intro');
        }
        else {
            crAcl.setRole();
        }

    }
    
})();
 