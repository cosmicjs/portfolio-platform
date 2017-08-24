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
