(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('PortfolioCtrl', PortfolioCtrl);

    function PortfolioCtrl($rootScope, $sce, $scope, $state, ngDialog, AuthService, PortfolioService, $log) {
        var vm = this;

        getPortfolio();

        vm.currentUser = $rootScope.globals.currentUser;
        
        vm.logout = logout;
        vm.updatePortfolio = updatePortfolio;
        vm.openAddProjectDialog = openAddProjectDialog;
        vm.openEditProjectDialog = openEditProjectDialog;

        vm.portfolio = {};

        vm.toolbarEditor = [
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'bold', 'italics', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight']
        ];

        function chunk(arr, size) {
            var newArr = [];
            for (var i = 0; i < arr.length; i += size) {
                newArr.push(arr.slice(i, i + size));
            }
            return newArr;
        }
        
        function getPortfolio() {
            function success(response) {
                vm.portfolio = response.data.object;

                vm.projectsChunk = chunk(vm.portfolio.metadata.projects, 2);

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
        
        function openAddProjectDialog(slug) {

            var options = {
                templateUrl: '../views/portfolio/portfolio.project.edit.html',
                showClose: true,
                // controller: 'PortfolioProjectsEdit as vm'
            };

            ngDialog.open(options).closePromise.finally(function () {
                getPortfolio();
            });
        }

        function openEditProjectDialog(slug) {

            var options = {
                templateUrl: '../views/portfolio/portfolio.project.edit.html',
                showClose: true,
                controller: 'PortfolioProjectsEdit as vm',
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
