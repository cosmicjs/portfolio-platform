(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('AdminAuthorsEdit', AdminAuthorsEdit);

    function AdminAuthorsEdit($state, AdminAuthorsService, Notification, $log, $scope, DEFAULT_IMAGE, MEDIA_URL, ngDialog) {
        var vm = this;

        vm.cancelUpload = cancelUpload;
        vm.save = save;

        vm.uploadProgress = 0;
        vm.showContent = false;

        vm.DEFAULT_IMAGE = DEFAULT_IMAGE;

        vm.author = {};
        vm.flow = {};
        vm.authorEditForm = null;

        vm.flowConfig = {
            target: MEDIA_URL,
            singleFile: true
        };

        function updateAuthor() {
            function success(response) {
                $log.info(response);

                Notification.primary(
                    {
                        message: 'Saved',
                        delay: 800,
                        replaceMessage: true
                    }
                );

                $state.go('admin.authors', null, {reload: true});
                ngDialog.close();
            }

            function failed(response) {
                $log.error(response);
            }


            if (vm.authorEditForm.$valid)
                AdminAuthorsService
                    .updateAuthor($scope.ngDialogData)
                    .then(success, failed);
        }

        function cancelUpload() {
            vm.flow.cancel();
            vm.background = {
                'background-image': 'url(' + (vm.event.metafields[0].value ? vm.event.metafields[0].url : DEFAULT_EVENT_IMAGE) + ')'
            };
        }

        function upload() {
            AdminAuthorsService
                .upload(vm.flow.files[0].file)
                .then(function(response){
                    
                    $scope.ngDialogData.metafields[1].value = response.media.name;
                    updateAuthor();

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
                updateAuthor();
        }

    }
})();
