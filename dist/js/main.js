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
            'ngEmoticons',
            'ngSanitize',
            'ngTouch',

            'admin',
            
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
            // var $location = $injector.get("$location");
            // var crAcl = $injector.get("crAcl");
            //
            // var state = "";
            //
            // switch (crAcl.getRole()) {
            //     case 'ROLE_ADMIN':
            //         state = 'admin.authors';
            //         break;
            //     default : state = 'main.emoji'; 
            // }
            //
            // if (state) $state.go(state);
            // else $location.path('/');

            $state.go('auth');
        });
 
        $stateProvider
            .state('main', {
                url: '/',
                abstract: true,
                templateUrl: '../views/main.html',
                // controller: 'CartCtrl as cart',
                data: {
                    is_granted: ['ROLE_GUEST']
                }
            })
            .state('blog', {
                url: '/blog',
                templateUrl: '../blog.html'
            })
            .state('auth', {
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
            });

    } 

    run.$inject = ['$rootScope', '$cookieStore', '$state', 'crAcl'];
    function run($rootScope, $cookieStore, $state, crAcl) {
        // keep user logged in after page refresh
        $rootScope.globals = $cookieStore.get('globals') || {};

        crAcl
            .setInheritanceRoles({
                'ROLE_ADMIN': ['ROLE_ADMIN', 'ROLE_GUEST'],
                'ROLE_USER': ['ROLE_USER', 'ROLE_GUEST'],
                'ROLE_GUEST': ['ROLE_GUEST']
            });

        crAcl
            .setRedirect('auth');
 
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
        .controller('AdminCtrl', UserCtrl);

    function UserCtrl($rootScope, $scope, $state, AuthService, Flash, $log) {
        var vm = this;
        
        vm.currentUser = $rootScope.globals.currentUser.metadata;
        
        vm.logout = logout;

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
        .module('admin', [
            'admin.quotes',
            'admin.authors'
        ])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('admin', {
                url: '/admin/',
                abstract: true,
                templateUrl: '../views/admin/admin.html',
                controller: 'AdminCtrl',
                data: {
                    is_granted: ['ROLE_ADMIN']
                }
            });
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
        
        vm.loginForm = null;
        
        vm.credentials = {};
        vm.user = {};

        function login(credentials) {
            function success(response) {
                function success(response) {
                    if (response.data.status !== 'empty') {
                        var currentUser = response.data.objects[0];
                        
                        crAcl.setRole('ROLE_USER');
                        AuthService.setCredentials({
                            slug: currentUser.slug,
                            first_name: currentUser.metadata.first_name,
                            last_name: currentUser.metadata.last_name,
                            email: currentUser.metadata.email,
                            role: 'ROLE_USER'
                        });
                        $state.go('portfolio.intro');
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
.constant("BUCKET_SLUG", "photography-portfolio")
.constant("URL", "https://api.cosmicjs.com/v1/")
.constant("MEDIA_URL", "https://api.cosmicjs.com/v1/photography-portfolio/media")
.constant("READ_KEY", "BnYF1ENerFAclDGKtsIffF3PtaYqQyvuyqTTHpFVzsHSKPMt58")
.constant("DEFAULT_IMAGE", "https://cosmicjs.com/uploads/cbb8e880-60f0-11e7-bc4a-a399e42d4caf-1499215291_user.png")
.constant("WRITE_KEY", "n20lcTUP5shFNaIYe2H369K9T9PVyywhysOBh9o9xpy2VTYMhB");

 
(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('PortfolioCtrl', PortfolioCtrl);

    function PortfolioCtrl($rootScope, $sce, $scope, $state, AuthService, PortfolioService, $log) {
        var vm = this;

        getPortfolio();

        vm.currentUser = $rootScope.globals.currentUser;
        
        vm.logout = logout;
        vm.updatePortfolio = updatePortfolio;

        vm.portfolio = {};

        vm.toolbarEditor = [
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'bold', 'italics', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight']
        ];
        
        function getPortfolio() {
            function success(response) {
                vm.portfolio = response.data.object;

                vm.contact = $sce.trustAsResourceUrl('mailto:' + vm.currentUser.email);

                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }

            PortfolioService
                .getPortfolioBySlug($rootScope.globals.currentUser.slug)
                .then(success, failed);
        }

        function updatePortfolio() {
            function success(response) {
                getPortfolio();

                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }

            PortfolioService
                .updatePortfolio(vm.portfolio)
                .then(success, failed);
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

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('portfolio', {
                url: '/',
                abstract: true,
                templateUrl: '../views/portfolio/portfolio.html',
                controller: 'PortfolioCtrl as vm',
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
        .service('PortfolioService', function ($http,
                                          $cookieStore, 
                                          $q, 
                                          $rootScope,
                                          URL, BUCKET_SLUG, READ_KEY, WRITE_KEY, MEDIA_URL) {
            
            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

            this.author = {
                content: null,
                type_slug: "authors",
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
                        key: "photo",
                        title: "Photo",
                        type: "file",
                        value: null
                    },
                    {
                        key: "born",
                        title: "Born",
                        type: "date",
                        value: null
                    },
                    {
                        key: "died",
                        title: "Died",
                        type: "date",
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
            this.getPortfolioBySlug = function (slug) {
                return $http.get(URL + BUCKET_SLUG + '/object/' + slug, {
                    params: {
                        read_key: READ_KEY
                    }
                });
            };

            this.updatePortfolio = function (portfolio) {
                portfolio.write_key = WRITE_KEY;

                return $http.put(URL + BUCKET_SLUG + '/edit-object', portfolio);
            };
            this.removeAuthor = function (slug) {
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
            this.addAuthor = function (author) {
                author.write_key = WRITE_KEY;
                author.title = author.metafields[0].value;

                return $http.post(URL + BUCKET_SLUG + '/add-object', author);
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
        .module('main')
        .controller('AdminAuthorsCtrl', AdminAuthorsCtrl);

    function AdminAuthorsCtrl($rootScope, DEFAULT_IMAGE, Notification, AdminAuthorsService, Flash, $log) {
        var vm = this;

        vm.getAuthors = getAuthors; 
        vm.removeAuthor = removeAuthor;
        
        vm.DEFAULT_IMAGE = DEFAULT_IMAGE;

        vm.authors = [];

        function getAuthors() {
            function success(response) {
                vm.authors = response.data.objects;

            }

            function failed(response) {
                $log.error(response);
            }

            AdminAuthorsService
                .getAuthors()
                .then(success, failed);
        }

        function removeAuthor(slug) {
            function success(response) {
                getAuthors();
                Notification.success(response.data.message);
            }

            function failed(response) {
                Notification.error(response.data.message);
            }

            AdminAuthorsService
                .removeAuthor(slug)
                .then(success, failed);
        }
    }
})();

(function () {
    'use strict';
    
    angular
        .module('admin.authors', [
            'admin.authors.edit',
            'admin.authors.add'
        ]) 
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {
 
        $stateProvider
            .state('admin.authors', {
                url: 'authors',
                templateUrl: '../views/admin/admin.authors.html',
                controller: 'AdminAuthorsCtrl as vm',
                data: {
                    is_granted: ['ROLE_ADMIN']
                }
            });
        
        
    }
    
})();
 
(function () {
    'use strict';

    angular
        .module('main')
        .service('AdminAuthorsService', function ($http,
                                          $cookieStore, 
                                          $q, 
                                          $rootScope,
                                          URL, BUCKET_SLUG, READ_KEY, WRITE_KEY, MEDIA_URL) {
            
            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

            this.author = {
                content: null,
                type_slug: "authors",
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
                        key: "photo",
                        title: "Photo",
                        type: "file",
                        value: null
                    },
                    {
                        key: "born",
                        title: "Born",
                        type: "date",
                        value: null
                    },
                    {
                        key: "died",
                        title: "Died",
                        type: "date",
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
            this.getAuthorBySlug = function (slug) {
                return $http.get(URL + BUCKET_SLUG + '/object/' + slug, {
                    params: {
                        read_key: READ_KEY
                    }
                });
            };

            this.updateAuthor = function (author) {
                author.write_key = WRITE_KEY;

                return $http.put(URL + BUCKET_SLUG + '/edit-object', author);
            };
            this.removeAuthor = function (slug) {
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
            this.addAuthor = function (author) {
                author.write_key = WRITE_KEY;
                author.title = author.metafields[0].value;

                return $http.post(URL + BUCKET_SLUG + '/add-object', author);
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
        .controller('AdminQuotesCtrl', AdminQuotesCtrl);

    function AdminQuotesCtrl($rootScope, $scope, Notification, AdminQuotesService, Flash, $log) {
        var vm = this;

        vm.getQuotes = getQuotes; 
        vm.removeQuote = removeQuote;

        vm.quotes = [];

        function getQuotes() {
            function success(response) {
                vm.quotes = response.data.objects;
            }

            function failed(response) {
                $log.error(response);
            }

            AdminQuotesService
                .getQuotes()
                .then(success, failed);
        }
        function removeQuote(slug) {
            function success(response) {
                getQuotes();
                Notification.success(response.data.message);
            }

            function failed(response) {
                Notification.error(response.data.message);
            }

            AdminQuotesService
                .removeQuote(slug)
                .then(success, failed);
        }
    }
})();

(function () {
    'use strict';
    
    angular
        .module('admin.quotes', [
            'admin.quotes.edit',
            'admin.quotes.add'
        ])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {
 
        $stateProvider
            .state('admin.quotes', {
                url: 'quotes',
                templateUrl: '../views/admin/admin.quotes.html',
                controller: 'AdminQuotesCtrl as vm',
                data: {
                    is_granted: ['ROLE_ADMIN']
                }
            });
    }
    
})();
 
(function () {
    'use strict';

    angular
        .module('main')
        .service('AdminQuotesService', function ($http,
                                          $cookieStore, 
                                          $q, 
                                          $rootScope,
                                          URL, BUCKET_SLUG, READ_KEY, WRITE_KEY, MEDIA_URL) {
            
            $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

            this.quote = {
                content: null,
                type_slug: "quotes",
                title: null,
                bucket_slug: BUCKET_SLUG,
                metafields: [
                    {
                        "value": null,
                        "key": "text",
                        "title": "Text",
                        "type": "text",
                    },
                    {
                        "object_type": "authors",
                        "value": null,
                        "key": "author",
                        "type": "object",
                        "object": {}
                    }
                ]
            };

            this.getQuotes = function () {
                return $http.get(URL + BUCKET_SLUG + '/object-type/quotes', {
                    params: {
                        limit: 100,
                        read_key: READ_KEY
                    }
                });
            };
            this.getQuoteBySlug = function (slug) {
                return $http.get(URL + BUCKET_SLUG + '/object/' + slug, {
                    params: {
                        read_key: READ_KEY
                    }
                });
            };

            this.updateQuote = function (quote) {
                quote.write_key = WRITE_KEY;

                return $http.put(URL + BUCKET_SLUG + '/edit-object', quote);
            };
            this.removeQuote = function (slug) {
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
            this.addQuote = function (quote) {
                quote.write_key = WRITE_KEY;
                quote.title = quote.metafields[0].value;

                return $http.post(URL + BUCKET_SLUG + '/add-object', quote);
            };
        });
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
                    is_granted: ['ROLE_USER']
                }
            });
    }

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
                    is_granted: ['ROLE_USER']
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
                    is_granted: ['ROLE_USER']
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
                    is_granted: ['ROLE_USER']
                }
            });
    }

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
        .controller('AdminAuthorsAdd', AdminAuthorsAdd);

    function AdminAuthorsAdd($state, AdminAuthorsService, Notification, $log, $scope, MEDIA_URL, DEFAULT_IMAGE, ngDialog) {
        var vm = this;

        vm.cancelUpload = cancelUpload;
        vm.save = save;

        vm.DEFAULT_IMAGE = DEFAULT_IMAGE;

        vm.uploadProgress = 0;
        vm.showContent = false;

        vm.author = {};
        vm.flow = {};
        vm.authorEditForm = null;

        vm.flowConfig = {
            target: MEDIA_URL,
            singleFile: true
        };

        function addAuthor() {
            function success(response) {
                $log.info(response);

                Notification.primary(
                    {
                        message: 'Saved',
                        delay: 800,
                        replaceMessage: true
                    }
                );

                $state.go('admin.authors', null, {reload: true});
                ngDialog.close();
            }

            function failed(response) {
                $log.error(response);
            }


            if (vm.authorEditForm.$valid)
                AdminAuthorsService
                    .addAuthor($scope.ngDialogData)
                    .then(success, failed);
        }

        function cancelUpload() {
            vm.flow.cancel();
            vm.background = {
                'background-image': 'url(' + (vm.event.metafields[0].value ? vm.event.metafields[0].url : DEFAULT_EVENT_IMAGE) + ')'
            };
        }

        function upload() {
            AdminAuthorsService
                .upload(vm.flow.files[0].file)
                .then(function(response){
                     
                    $scope.ngDialogData.metafields[1].value = response.media.name;
                    addAuthor();

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
                addAuthor();
        }

    }
})();

(function () {
    'use strict';
    
    angular
        .module('admin.authors.add', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('admin.authors.add', {
                url: '/add',
                data: {
                    is_granted: ['ROLE_ADMIN']
                },
                onEnter: [
                    'ngDialog',
                    'AdminAuthorsService',
                    '$stateParams',
                    '$state',
                    '$log',
                    function (ngDialog, AdminAuthorsService, $stateParams, $state, $log) {
                        openDialog(AdminAuthorsService.author);

                        function openDialog(data) {

                            var options = {
                                templateUrl: '../views/admin/admin.authors.edit.html',
                                data: data,
                                showClose: true,
                                controller: 'AdminAuthorsAdd as vm'
                            };

                            ngDialog.open(options).closePromise.finally(function () {
                                $state.go('admin.authors', {}, {reload: true});
                            });
                        }
                    }]
            });
    }
})();
 
(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('AdminAuthorsEdit', AdminAuthorsEdit);

    function AdminAuthorsEdit($state, AdminAuthorsService, Notification, $log, $scope, DEFAULT_IMAGE, MEDIA_URL, ngDialog) {
        var vm = this;

        vm.cancelUpload = cancelUpload;
        vm.save = save;

        vm.uploadProgress = 0;
        vm.showContent = false;

        vm.DEFAULT_IMAGE = DEFAULT_IMAGE;

        vm.author = {};
        vm.flow = {};
        vm.authorEditForm = null;

        vm.flowConfig = {
            target: MEDIA_URL,
            singleFile: true
        };

        function updateAuthor() {
            function success(response) {
                $log.info(response);

                Notification.primary(
                    {
                        message: 'Saved',
                        delay: 800,
                        replaceMessage: true
                    }
                );

                $state.go('admin.authors', null, {reload: true});
                ngDialog.close();
            }

            function failed(response) {
                $log.error(response);
            }


            if (vm.authorEditForm.$valid)
                AdminAuthorsService
                    .updateAuthor($scope.ngDialogData)
                    .then(success, failed);
        }

        function cancelUpload() {
            vm.flow.cancel();
            vm.background = {
                'background-image': 'url(' + (vm.event.metafields[0].value ? vm.event.metafields[0].url : DEFAULT_EVENT_IMAGE) + ')'
            };
        }

        function upload() {
            AdminAuthorsService
                .upload(vm.flow.files[0].file)
                .then(function(response){
                    
                    $scope.ngDialogData.metafields[1].value = response.media.name;
                    updateAuthor();

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
                updateAuthor();
        }

    }
})();

(function () {
    'use strict';
    
    angular
        .module('admin.authors.edit', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('admin.authors.edit', {
                url: '/edit/:slug',
                data: {
                    is_granted: ['ROLE_ADMIN']
                },
                onEnter: [
                    'ngDialog',
                    'AdminAuthorsService',
                    '$stateParams',
                    '$state',
                    '$log',
                    function (ngDialog, AdminAuthorsService, $stateParams, $state, $log) {
                        getAuthor($stateParams.slug);

                        function getAuthor(slug) {
                            function success(response) {
                                response.data.object.metafields[2].value = new Date(response.data.object.metafields[2].value);
                                response.data.object.metafields[3].value = new Date(response.data.object.metafields[3].value);

                                openDialog(response.data.object);
                            }

                            function failed(response) {
                                $log.error(response);
                            }

                            AdminAuthorsService
                                .getAuthorBySlug(slug)
                                .then(success, failed);
                        }

                        function openDialog(data) {

                            var options = {
                                templateUrl: '../views/admin/admin.authors.edit.html',
                                data: data,
                                showClose: true,
                                controller: 'AdminAuthorsEdit as vm'
                            };

                            ngDialog.open(options).closePromise.finally(function () {
                                $state.go('admin.authors', {}, {reload: true});
                            });
                        }
                    }]
            });
    }
})();
 
(function () {
    'use strict';

    angular
        .module('main')
        .controller('AdminQuotesAdd', AdminQuotesAdd);

    function AdminQuotesAdd($state, AdminQuotesService, AdminAuthorsService, Notification, $log, $scope, MEDIA_URL, ngDialog) {
        var vm = this;

        vm.save = save;
        vm.getAuthors = getAuthors;

        vm.authors = [];
        vm.quotesForm = null;

        function addQuote() {
            function success(response) {
                $log.info(response);

                Notification.primary(
                    {
                        message: 'Saved',
                        delay: 800,
                        replaceMessage: true
                    }
                );

                $state.go('admin.quotes', null, {reload: true});
                ngDialog.close();
            }

            function failed(response) {
                $log.error(response);
            }

            if (vm.quotesForm.$valid) {
                AdminQuotesService
                    .addQuote($scope.ngDialogData)
                    .then(success, failed);
            }
        }

        function getAuthors() {
            function success(response) {
                vm.authors = response.data.objects;

            }

            function failed(response) {
                $log.error(response);
            }

            AdminAuthorsService
                .getAuthors()
                .then(success, failed);
        }

        function save() {
            addQuote();
        }

    }
})();

(function () {
    'use strict';
    
    angular
        .module('admin.quotes.add', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {
 
        $stateProvider
            .state('admin.quotes.add', {
                url: '/add',
                onEnter: [
                'ngDialog',
                'AdminQuotesService',
                '$stateParams',
                '$state',
                '$log',
                function (ngDialog, AdminQuotesService, $stateParams, $state, $log) {
                    openDialog(AdminQuotesService.quote);
                        
                    function openDialog(data) {
    
                        var options = {
                            templateUrl: '../views/admin/admin.quotes.edit.html',
                            data: data,
                            controller: 'AdminQuotesAdd as vm',
                            showClose: true
                        };
    
                        ngDialog.open(options).closePromise.finally(function () {
                            $state.go('admin.quotes', {}, {reload: true});
                        });
                    }
                }],
                data: {
                    is_granted: ['ROLE_ADMIN']
                }
            });
    }
    
})();
 
(function () {
    'use strict';

    angular
        .module('main')
        .controller('AdminQuotesEdit', AdminQuotesEdit);

    function AdminQuotesEdit($state, AdminQuotesService, AdminAuthorsService, Notification, $log, $scope, MEDIA_URL, ngDialog) {
        var vm = this;

        vm.save = save;
        vm.getAuthors = getAuthors;

        vm.authors = [];
        vm.quotesForm = null;

        function addQuote() {
            function success(response) {
                $log.info(response);

                Notification.primary(
                    {
                        message: 'Saved',
                        delay: 800,
                        replaceMessage: true
                    }
                );

                $state.go('admin.quotes', null, {reload: true});
                ngDialog.close();
            }

            function failed(response) {
                $log.error(response);
            }

            if (vm.quotesForm.$valid) {
                AdminQuotesService
                    .updateQuote($scope.ngDialogData)
                    .then(success, failed);
            }
        }

        function getAuthors() {
            function success(response) {
                vm.authors = response.data.objects;
            }

            function failed(response) {
                $log.error(response);
            }

            AdminAuthorsService
                .getAuthors()
                .then(success, failed);
        }

        function save() {
            addQuote();
        }

    }
})();

(function () {
    'use strict';

    angular
        .module('admin.quotes.edit', [])
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];
    function config($stateProvider, $urlRouterProvider) {

        $stateProvider
            .state('admin.quotes.edit', {
                url: '/edit/:slug',
                data: {
                    is_granted: ['ROLE_ADMIN']
                },
                onEnter: [
                    'ngDialog',
                    'AdminQuotesService',
                    '$stateParams',
                    '$state',
                    '$log',
                    function (ngDialog, AdminQuotesService, $stateParams, $state, $log) {
                        getQuote($stateParams.slug);

                        function getQuote(slug) {
                            function success(response) {
                                openDialog(response.data.object);
                            }

                            function failed(response) {
                                $log.error(response);
                            }

                            AdminQuotesService
                                .getQuoteBySlug(slug)
                                .then(success, failed);
                        }

                        function openDialog(data) {

                            var options = {
                                templateUrl: '../views/admin/admin.quotes.edit.html',
                                data: data,
                                showClose: true,
                                controller: 'AdminQuotesEdit as vm'
                            };

                            ngDialog.open(options).closePromise.finally(function () {
                                $state.go('admin.quotes', {}, {reload: true});
                            });
                        }
                    }]
            });
    }
})();
 