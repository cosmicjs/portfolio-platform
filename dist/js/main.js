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
 
(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('AuthCtrl', AuthCtrl);

    function AuthCtrl(crAcl, $state, AuthService, Flash, $log) {
        var vm = this;              

        vm.login = login;
        vm.register = register;
        
        vm.loginForm = null;
        
        vm.credentials = {};
        vm.user = {};

        function login(credentials) {
            function success(response) {
                function success(response) {
                    if (response.data.status !== 'empty') {
                        var currentUser = response.data.objects[0];
                        
                        crAcl.setRole(currentUser.metadata.role);
                        AuthService.setCredentials({
                            slug: currentUser.slug,
                            first_name: currentUser.metadata.first_name,
                            last_name: currentUser.metadata.last_name,
                            email: currentUser.metadata.email,
                            role: currentUser.metadata.role
                        });
                        $state.go('portfolio.intro', {slug: currentUser.slug});
                    }
                    else
                        Flash.create('danger', 'Incorrect username or password');
                }

                function failed(response) {
                    $log.error(response);
                }

                if (response.data.status !== 'empty')
                    AuthService
                        .checkPassword(credentials)
                        .then(success, failed);
                else
                    Flash.create('danger', 'Incorrect username or password');

                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }

            if (vm.loginForm.$valid)
                AuthService
                    .checkUsername(credentials)
                    .then(success, failed);
        }

        function register(credentials) {
            function success(response) {
                login(credentials);
               
                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }

            if (vm.loginForm.$valid)
                AuthService
                    .register(credentials)
                    .then(success, failed);
        }

    }
})();

(function () {
    'use strict';

    angular
        .module('main')
        .service('AuthService', function ($http, 
                                          $cookieStore, 
                                          $q, 
                                          $rootScope, 
                                          URL, BUCKET_SLUG, READ_KEY, WRITE_KEY) {
            var authService = this;
            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

            authService.checkUsername = function (credentials) {
                return $http.get(URL + BUCKET_SLUG + '/object-type/users/search', {
                    params: {
                        metafield_key: 'email',
                        metafield_value_has: credentials.email,
                        limit: 1,
                        read_key: READ_KEY
                    }
                });
            };
            authService.checkPassword = function (credentials) {
                return $http.get(URL + BUCKET_SLUG + '/object-type/users/search', {
                    ignoreLoadingBar: true,
                    params: {
                        metafield_key: 'password',
                        metafield_value: credentials.password,
                        limit: 1,
                        read_key: READ_KEY
                    }
                });
            };
            this.register = function (user) {
                return $http.post(URL + BUCKET_SLUG + '/add-object', {
                        title: user.first_name + ' ' + user.last_name,
                        type_slug: 'users',
                        slug: user.username,
                        metafields: [
                            {
                                key: "first_name",
                                type: "text",
                                value: user.first_name
                            },
                            {
                                key: "last_name",
                                type: "text",
                                value: user.last_name
                            },
                            {
                                key: "email",
                                type: "text",
                                value: user.email
                            },
                            {
                                key: "password",
                                type: "text",
                                value: user.password
                            },
                            {
                                key: "intro",
                                type: "html-textarea",
                                value: null
                            },
                            {
                                key: "about",
                                type: "html-textarea",
                                value: null
                            },
                            {
                                key: "contact",
                                type: "html-textarea",
                                value: null
                            },
                            {
                                key: "projects",
                                type: "objects",
                                object_type: "projects",
                                value: "59a5d47df2f43ca279000031"
                            },
                            {
                                key: "about_image",
                                type: "file",
                                value: "da3fca30-8c52-11e7-b7b2-8747dfd2b196-pic05.jpg"
                            },
                            {
                                key: "intro_image",
                                type: "file",
                                value: null
                            },
                            {
                                key: "project_text",
                                type: "html-textarea",
                                value: null
                            },
                            {
                                key: "role",
                                type: "text",
                                value: "ROLE_USER"
                            }
                        ],

                        write_key: WRITE_KEY
                    }, { ignoreLoadingBar: false });
            };
            authService.setCredentials = function (user) { 
                $rootScope.globals = {
                    currentUser: user
                };
                
                $cookieStore.put('globals', $rootScope.globals);
            };
            authService.clearCredentials = function () {
                var deferred = $q.defer();
                $cookieStore.remove('globals');

                if (!$cookieStore.get('globals')) {
                    $rootScope.globals = {};
                    deferred.resolve('Credentials clear success');
                } else {
                    deferred.reject('Can\'t clear credentials');
                }

                return deferred.promise;
            };
        });  
})();  
angular.module("config", [])
.constant("BUCKET_SLUG", "portfolio-platform")
.constant("MEDIA_URL", "https://api.cosmicjs.com/v1/portfolio-platform/media")
.constant("URL", "https://api.cosmicjs.com/v1/")
.constant("READ_KEY", "")
.constant("WRITE_KEY", "")
.constant("DEFAULT_IMAGE", "");

(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('PortfolioCtrl', PortfolioCtrl);

    function PortfolioCtrl($rootScope,
                           $stateParams,
                           $sce,
                           $scope,
                           $state,
                           ngDialog,
                           AuthService,
                           UserService,
                           PortfolioService,
                           Notification,
                           PortfolioProjectsService,
                           $log,
                           MEDIA_URL) {
        var vm = this;

        getPortfolio();
        getHomePage();

        vm.currentUser = $rootScope.globals.currentUser ? $rootScope.globals.currentUser : getUser();
        
        vm.logout = logout;
        vm.updatePortfolio = updatePortfolio;
        vm.openAddProjectDialog = openAddProjectDialog;
        vm.openEditProjectDialog = openEditProjectDialog;
        vm.uploadIntroImage = uploadIntroImage;
        vm.uploadAboutImage = uploadAboutImage;
        vm.uploadHomePageImage = uploadHomePageImage;
        vm.updateHomePage = updateHomePage;

        vm.portfolio = {};

        vm.toolbarEditor = [
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'bold', 'italics', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight']
        ];

        vm.uploadProgress = 0;
        vm.flowIntro = {};
        vm.flowAbout = {};
        vm.flowHomePage = {};
        vm.flowConfig = {
            target: MEDIA_URL,
            singleFile: true
        };

        function uploadHomePageImage() {
            PortfolioProjectsService
                .upload(vm.flowHomePage.files[0].file)
                .then(function(response){

                    vm.homePage.metafields[1].value = response.media.name;
                    vm.uploadProgress = 0;
                    updateHomePage();

                }, function(){
                    console.log('failed :(');
                }, function(progress){
                    vm.uploadProgress = progress;
                });
        }

        function uploadIntroImage() {
            PortfolioProjectsService
                .upload(vm.flowIntro.files[0].file)
                .then(function(response){

                    vm.portfolio.metafields[9].value = response.media.name;
                    vm.uploadProgress = 0;
                    updatePortfolio();

                }, function(){
                    console.log('failed :(');
                }, function(progress){
                    vm.uploadProgress = progress;
                });
        }

        function uploadAboutImage() {
            PortfolioProjectsService
                .upload(vm.flowAbout.files[0].file)
                .then(function(response){

                    vm.portfolio.metafields[8].value = response.media.name;
                    vm.uploadProgress = 0;
                    updatePortfolio();

                }, function(){
                    console.log('failed :(');
                }, function(progress){
                    vm.uploadProgress = progress;
                });
        }

        function chunk(arr, size) {
            var newArr = [];
            for (var i = 0; i < arr.length; i += size) {
                newArr.push(arr.slice(i, i + size));
            }
            return newArr;
        }

        function getUser() {
            function success(response) {
                var currentUser = response.data.object;

                vm.currentUser = {
                    slug: currentUser.slug,
                    first_name: currentUser.metadata.first_name,
                    last_name: currentUser.metadata.last_name,
                    email: currentUser.metadata.email
                };
            }

            function failed(response) {
                $log.error(response);
            }

            UserService
                .getUser($stateParams.slug, true)
                .then(success, failed);
        }
        
        function getPortfolio() {
            function success(response) {
                vm.portfolio = response.data.object;

                if (Array.isArray(vm.portfolio.metadata.projects))
                    vm.projectsChunk = chunk(vm.portfolio.metadata.projects, 2);
                else
                    vm.projectsChunk = [];

                vm.contact = $sce.trustAsResourceUrl('mailto:' + vm.currentUser.email);

                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }

            PortfolioService
                .getPortfolioBySlug($stateParams.slug)
                .then(success, failed);
        }

        function updatePortfolio() {
            function success(response) {
                getPortfolio();

                Notification.primary(
                    {
                        message: 'Saved',
                        delay: 800,
                        replaceMessage: true
                    }
                );

                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }

            PortfolioService
                .updatePortfolio(vm.portfolio)
                .then(success, failed);
        }

        function updateHomePage() {
            function success(response) {
                getHomePage();

                Notification.primary(
                    {
                        message: 'Saved',
                        delay: 800,
                        replaceMessage: true
                    }
                );

                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }

            PortfolioService
                .updatePortfolio(vm.homePage)
                .then(success, failed);
        }

        function getHomePage() {
            function success(response) {
                vm.homePage = response.data.object;
                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }

            PortfolioService
                .getHomePage()
                .then(success, failed);
        }
        
        function openAddProjectDialog(slug) {

            var options = {
                templateUrl: '../views/portfolio/portfolio.project.edit.html',
                showClose: true,
                controller: 'PortfolioProjectsAddCtrl as vm'
            };

            ngDialog.open(options).closePromise.finally(function () {
                getPortfolio();
            });
        }

        function openEditProjectDialog(slug) {

            var options = {
                templateUrl: '../views/portfolio/portfolio.project.edit.html',
                showClose: true,
                controller: 'PortfolioProjectsEditCtrl as vm',
                data: {
                    slug: slug
                }
            };

            ngDialog.open(options).closePromise.finally(function () {
                getPortfolio();
            });
        }

        function logout() {
            function success(response) {
                $state.go('auth');

                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }

            AuthService
                .clearCredentials()
                .then(success, failed);
        }

        $scope.state = $state;

    }
})();

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

    config.$inject = ['$stateProvider'];
    function config($stateProvider) {

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
 
(function () {
    'use strict';

    angular
        .module('main')
        .service('PortfolioService', function ($http,
                                          $cookieStore, 
                                          $q, 
                                          $rootScope,
                                          URL, BUCKET_SLUG, READ_KEY, WRITE_KEY, MEDIA_URL) {
            
            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
            
            this.getPortfolioBySlug = function (slug) {
                return $http.get(URL + BUCKET_SLUG + '/object/' + slug, {
                    params: {
                        read_key: READ_KEY
                    }
                });
            };

            this.getHomePage = function () {
                return $http.get(URL + BUCKET_SLUG + '/object/home', {
                    params: {
                        read_key: READ_KEY
                    }
                });
            };

            this.updatePortfolio = function (portfolio) {
                portfolio.write_key = WRITE_KEY;

                return $http.put(URL + BUCKET_SLUG + '/edit-object', portfolio);
            };
            
            this.upload = function (file) {
                var fd = new FormData(); 
                fd.append('media', file);
                fd.append('write_key', WRITE_KEY);

                var defer = $q.defer();

                var xhttp = new XMLHttpRequest();

                xhttp.upload.addEventListener("progress",function (e) {
                    defer.notify(parseInt(e.loaded * 100 / e.total));
                });
                xhttp.upload.addEventListener("error",function (e) {
                    defer.reject(e);
                });

                xhttp.onreadystatechange = function() {
                    if (xhttp.readyState === 4) {
                        defer.resolve(JSON.parse(xhttp.response)); //Outputs a DOMString by default
                    }
                };

                xhttp.open("post", MEDIA_URL, true);

                xhttp.send(fd);
                
                return defer.promise;
            }
        });
})();  
(function () {
    'use strict';

    angular
        .module('main')
        .service('UserService', function ($http, 
                                          $cookieStore, 
                                          $q, 
                                          $rootScope, 
                                          URL, BUCKET_SLUG, READ_KEY, WRITE_KEY) {
            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

            this.getCurrentUser = function (ignoreLoadingBar) {
                return $http.get(URL + BUCKET_SLUG + '/object/' + $rootScope.globals.currentUser.slug, {
                    ignoreLoadingBar: ignoreLoadingBar,
                    params: {
                        read_key: READ_KEY
                    }
                });
            };
            this.getUser = function (slug, ignoreLoadingBar) {
                return $http.get(URL + BUCKET_SLUG + '/object/' + slug, {
                    ignoreLoadingBar: ignoreLoadingBar,
                    params: {
                        read_key: READ_KEY
                    }
                });
            };
            this.updateUser = function (user) {
                user.write_key = WRITE_KEY;

                return $http.put(URL + BUCKET_SLUG + '/edit-object', user, {
                    ignoreLoadingBar: false
                });
            };

        });  
})();  
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
                    is_granted: ['ROLE_USER', 'ROLE_GUEST']
                }
            });
    }

})();
 
(function () {
    'use strict';

    angular
        .module('main')
        .service('PortfolioProjectsService', function ($http,
                                          $cookieStore, 
                                          $q, 
                                          $rootScope,
                                          URL, BUCKET_SLUG, READ_KEY, WRITE_KEY, MEDIA_URL) {
            
            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

            this.project = {
                content: null,
                type_slug: "projects",
                title: null,
                bucket_slug: BUCKET_SLUG,
                metafields: [
                    {
                        key: "name",
                        title: "Name",
                        type: "text",
                        value: null
                    },
                    {
                        key: "image",
                        title: "Image",
                        type: "file",
                        value: null
                    }
                ]
            };

            this.getAuthors = function () {
                return $http.get(URL + BUCKET_SLUG + '/object-type/authors', {
                    params: {
                        limit: 100,
                        read_key: READ_KEY
                    }
                });
            };

            this.getProjectBySlug = function (slug) {
                return $http.get(URL + BUCKET_SLUG + '/object/' + slug, {
                    params: {
                        read_key: READ_KEY
                    }
                });
            };

            this.updateProject = function (project) {
                project.write_key = WRITE_KEY;

                return $http.put(URL + BUCKET_SLUG + '/edit-object', project);
            };
            
            this.removeProject = function (slug) {
                return $http.delete(URL + BUCKET_SLUG + '/' + slug, {
                    ignoreLoadingBar: true,
                    headers:{
                        'Content-Type': 'application/json'
                    },
                    data: {
                        write_key: WRITE_KEY
                    }
                });
            };
            this.createProject = function (project) {
                project.write_key = WRITE_KEY;
                project.title = project.metafields[0].value;

                return $http.post(URL + BUCKET_SLUG + '/add-object', project);
            };
            this.upload = function (file) {
                var fd = new FormData(); 
                fd.append('media', file);
                fd.append('write_key', WRITE_KEY);

                var defer = $q.defer();

                var xhttp = new XMLHttpRequest();

                xhttp.upload.addEventListener("progress",function (e) {
                    defer.notify(parseInt(e.loaded * 100 / e.total));
                });
                xhttp.upload.addEventListener("error",function (e) {
                    defer.reject(e);
                });

                xhttp.onreadystatechange = function() {
                    if (xhttp.readyState === 4) {
                        defer.resolve(JSON.parse(xhttp.response)); //Outputs a DOMString by default
                    }
                };

                xhttp.open("post", MEDIA_URL, true);

                xhttp.send(fd);
                
                return defer.promise;
            }
        });
})();  
(function () {
    'use strict';

    angular
        .module('main')
        .controller('PortfolioSettingsCtrl', PortfolioSettingsCtrl);

    function PortfolioSettingsCtrl($rootScope, $scope, $state, PortfolioService, Flash, $log) {
        var vm = this;

        function getPortfolio() {
            function success(response) {
                vm.portfolio = response.data.object;

                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }

            PortfolioService
                .getPortfolioBySlug($rootScope.globals.currentUser.slug)
                .then(success, failed);
        }

        $scope.state = $state;

    }
})();

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
 
(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('PortfolioProjectsAddCtrl', PortfolioProjectsAddCtrl);

    function PortfolioProjectsAddCtrl(UserService, PortfolioProjectsService, Notification, $log, $scope, DEFAULT_IMAGE, MEDIA_URL, ngDialog) {
        var vm = this;

        vm.cancelUpload = cancelUpload;
        vm.save = save;

        vm.uploadProgress = 0;
        vm.showContent = false;

        vm.DEFAULT_IMAGE = DEFAULT_IMAGE;

        vm.project = PortfolioProjectsService.project;
        vm.flow = {};
        vm.projectEditForm = null;

        vm.flowConfig = {
            target: MEDIA_URL,
            singleFile: true
        };

        vm.user = {};

        function updateUser(user) {
            function success(response) {
                Notification.primary(
                    {
                        message: 'Saved',
                        delay: 800,
                        replaceMessage: true
                    }
                );

                ngDialog.close();
            }

            function failed(response) {
                $log.error(response);
            }


            UserService
                .updateUser(user, true)
                .then(success, failed);
        }

        function getCurrentUser(project) {
            function success(response) {
                var projects = [];

                vm.user = response.data.object;

                if (!vm.user.metafields[7])
                    vm.user.metafields[7] = {
                        key: "projects",
                        type: "objects",
                        object_type: "projects",
                        objects: [],
                        value: null
                    };

                vm.user.metafields[7].objects.push(project);

                vm.user.metafields[7].objects.forEach(function (item) {
                    projects.push(item._id);
                });

                vm.user.metafields[7].value = projects.join();

                updateUser(vm.user);
            }

            function failed(response) {
                $log.error(response);
            }


            UserService
                .getCurrentUser(vm.project, true)
                .then(success, failed);
        }
        
        function createProject() {
            function success(response) {
                $log.info(response);

                getCurrentUser(response.data.object);
            }

            function failed(response) {
                $log.error(response);
            }
            
            PortfolioProjectsService
                .createProject(vm.project)
                .then(success, failed);
        }

        function cancelUpload() {
            vm.flow.cancel();
            vm.background = {
                'background-image': 'url(' + (vm.event.metafields[0].value ? vm.event.metafields[0].url : DEFAULT_IMAGE) + ')'
            };
        }

        function upload() {
            PortfolioProjectsService
                .upload(vm.flow.files[0].file)
                .then(function(response){

                    vm.project.metafields[1].value = response.media.name;
                    createProject();

                }, function(){
                    console.log('failed :(');
                }, function(progress){
                    vm.uploadProgress = progress;
                });
        }

        function save() {
            if (vm.flow.files.length && 
                vm.projectEditForm.$valid) 
                upload();
        }

    }
})();

(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('PortfolioProjectsEditCtrl', PortfolioProjectsEditCtrl);

    function PortfolioProjectsEditCtrl($state, PortfolioProjectsService, Notification, $log, $scope, DEFAULT_IMAGE, MEDIA_URL, ngDialog) {
        var vm = this;

        vm.cancelUpload = cancelUpload;
        vm.getProject = getProject;
        vm.save = save;

        vm.uploadProgress = 0;
        vm.showContent = false;

        vm.DEFAULT_IMAGE = DEFAULT_IMAGE;

        vm.project = {};
        vm.flow = {};
        vm.projectEditForm = null;

        vm.flowConfig = {
            target: MEDIA_URL,
            singleFile: true
        };

        function getProject() {
            function success(response) {
                vm.project = response.data.object;
                
                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }
           
            PortfolioProjectsService
                .getProjectBySlug($scope.ngDialogData.slug)
                .then(success, failed);
        }

        function updateProject() {
            function success(response) {
                $log.info(response);

                Notification.primary(
                    {
                        message: 'Saved',
                        delay: 800,
                        replaceMessage: true
                    }
                );

                ngDialog.close();
            }

            function failed(response) {
                $log.error(response);
            }


            if (vm.projectEditForm.$valid)
                PortfolioProjectsService
                    .updateProject(vm.project)
                    .then(success, failed);
        }

        function cancelUpload() {
            vm.flow.cancel();
            vm.background = {
                'background-image': 'url(' + (vm.event.metafields[0].value ? vm.event.metafields[0].url : DEFAULT_IMAGE) + ')'
            };
        }

        function upload() {
            PortfolioProjectsService
                .upload(vm.flow.files[0].file)
                .then(function(response){

                    vm.project.metafields[1].value = response.media.name;
                    updateProject();

                }, function(){
                    console.log('failed :(');
                }, function(progress){
                    vm.uploadProgress = progress;
                });
        }
        
        function save() {
            if (vm.flow.files.length) 
                upload();
            else
                updateProject();
        }

    }
})();
