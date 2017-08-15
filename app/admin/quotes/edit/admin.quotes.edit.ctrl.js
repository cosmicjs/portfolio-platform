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
