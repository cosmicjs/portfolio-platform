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
                                objects: [],
                                object_type: "projects",
                                value: "59a41db710d640f7530004b2"
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