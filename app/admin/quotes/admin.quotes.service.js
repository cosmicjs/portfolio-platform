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