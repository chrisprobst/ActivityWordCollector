// Create the base module
var ActivityWordCollector = angular.module('ActivityWordCollector', ['ngRoute']);


ActivityWordCollector.config(function ($routeProvider) {
    $routeProvider.when('/', {
        controller: 'HomeController',
        templateUrl: 'views/Home.html'

    }).otherwise({
            redirectTo: '/'
        });
});


// Create the simple controller
ActivityWordCollector.controller('HomeController', function ($scope, $http) {

    $scope.uploadWord = function () {
        if ($scope.words) {
            console.log($scope.words);

            $http.post('/post', $scope.words).
                success(function (data, status, headers, config) {

                }).
                error(function (data, status, headers, config) {
                    alert('Es ist ein Verbindungsproblem aufgetreten, bitte lade die Seite neu oder wende dich an den Administrator!');
                });

            // Reset
            $scope.words = {};
        }
    }
});