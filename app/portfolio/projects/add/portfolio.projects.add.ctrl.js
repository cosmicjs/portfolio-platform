(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('PortfolioProjectsAddCtrl', PortfolioProjectsAddCtrl);

    function PortfolioProjectsAddCtrl(UserService, PortfolioProjectsService, Notification, $log, $scope, DEFAULT_IMAGE, MEDIA_URL, ngDialog) {
        var vm = this;

        vm.cancelUpload = cancelUpload;
        vm.save = save;

        vm.uploadProgress = 0;
        vm.showContent = false;

        vm.DEFAULT_IMAGE = DEFAULT_IMAGE;

        vm.project = PortfolioProjectsService.project;
        vm.flow = {};
        vm.projectEditForm = null;

        vm.flowConfig = {
            target: MEDIA_URL,
            singleFile: true
        };

        vm.user = {};

        function updateUser(user) {
            function success(response) {
                Notification.primary(
                    {
                        message: 'Saved',
                        delay: 800,
                        replaceMessage: true
                    }
                );

                ngDialog.close();
            }

            function failed(response) {
                $log.error(response);
            }


            UserService
                .updateUser(user, true)
                .then(success, failed);
        }

        function getCurrentUser(project) {
            function success(response) {
                var projects = [];

                vm.user = response.data.object;

                if (!vm.user.metafields[7])
                    vm.user.metafields[7] = {
                        key: "projects",
                        type: "objects",
                        object_type: "projects",
                        objects: [],
                        value: null
                    };

                vm.user.metafields[7].objects.push(project);

                vm.user.metafields[7].objects.forEach(function (item) {
                    projects.push(item._id);
                });

                vm.user.metafields[7].value = projects.join();

                updateUser(vm.user);
            }

            function failed(response) {
                $log.error(response);
            }


            UserService
                .getCurrentUser(vm.project, true)
                .then(success, failed);
        }
        
        function createProject() {
            function success(response) {
                $log.info(response);

                getCurrentUser(response.data.object);
            }

            function failed(response) {
                $log.error(response);
            }
            
            PortfolioProjectsService
                .createProject(vm.project)
                .then(success, failed);
        }

        function cancelUpload() {
            vm.flow.cancel();
            vm.background = {
                'background-image': 'url(' + (vm.event.metafields[0].value ? vm.event.metafields[0].url : DEFAULT_IMAGE) + ')'
            };
        }

        function upload() {
            PortfolioProjectsService
                .upload(vm.flow.files[0].file)
                .then(function(response){

                    vm.project.metafields[1].value = response.media.name;
                    createProject();

                }, function(){
                    console.log('failed :(');
                }, function(progress){
                    vm.uploadProgress = progress;
                });
        }

        function save() {
            if (vm.flow.files.length && 
                vm.projectEditForm.$valid) 
                upload();
        }

    }
})();
