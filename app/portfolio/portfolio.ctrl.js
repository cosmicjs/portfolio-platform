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
