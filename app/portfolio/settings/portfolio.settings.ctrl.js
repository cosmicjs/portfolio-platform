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
