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
