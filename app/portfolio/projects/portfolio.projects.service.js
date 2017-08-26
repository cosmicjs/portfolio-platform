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