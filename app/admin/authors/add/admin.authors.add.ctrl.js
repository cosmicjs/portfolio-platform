(function () {
    'use strict'; 

    angular
        .module('main')
        .controller('AdminAuthorsAdd', AdminAuthorsAdd);

    function AdminAuthorsAdd($state, AdminAuthorsService, Notification, $log, $scope, MEDIA_URL, DEFAULT_IMAGE, ngDialog) {
        var vm = this;

        vm.cancelUpload = cancelUpload;
        vm.save = save;

        vm.DEFAULT_IMAGE = DEFAULT_IMAGE;

        vm.uploadProgress = 0;
        vm.showContent = false;

        vm.author = {};
        vm.flow = {};
        vm.authorEditForm = null;

        vm.flowConfig = {
            target: MEDIA_URL,
            singleFile: true
        };

        function addAuthor() {
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
                    .addAuthor($scope.ngDialogData)
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
                    addAuthor();

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
                addAuthor();
        }

    }
})();
