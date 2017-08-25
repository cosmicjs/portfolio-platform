(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('PortfolioProjectsEdit', PortfolioProjectsEdit);

    function PortfolioProjectsEdit($state, PortfolioProjectsService, Notification, $log, $scope, DEFAULT_IMAGE, MEDIA_URL, ngDialog) {
        var vm = this;

        vm.cancelUpload = cancelUpload;
        vm.getProject = getProject;
        vm.save = save;

        vm.uploadProgress = 0;
        vm.showContent = false;

        vm.DEFAULT_IMAGE = DEFAULT_IMAGE;

        vm.project = {};
        vm.flow = {};
        vm.projectEditForm = null;

        vm.flowConfig = {
            target: MEDIA_URL,
            singleFile: true
        };

        function getProject() {
            function success(response) {
                vm.project = response.data.object;
                
                $log.info(response);
            }

            function failed(response) {
                $log.error(response);
            }
           
            PortfolioProjectsService
                .getProjectBySlug($scope.ngDialogData.slug)
                .then(success, failed);
        }

        function updateProject() {
            function success(response) {
                $log.info(response);

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


            if (vm.projectEditForm.$valid)
                PortfolioProjectsService
                    .updateProject(vm.project)
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
                    updateProject();

                }, function(){
                    console.log('failed :(');
                }, function(progress){
                    vm.uploadProgress = progress;
                });
        }
        
        function save() {
            if (vm.flow.files.length) 
                upload();
            else
                updateProject();
        }

    }
})();
