(function() {
  var workplaceWiki;

  workplaceWiki = angular.module('workplaceWiki', ['ngSanitize']);

  workplaceWiki.controller('appController', [
    '$scope', '$http', function($scope, $http) {
      var _add_post, _updateDB, db, request;
      $scope.posts = {};
      $scope.posts._array = [];
      $scope.updating = false;
      $scope.updatedCount = 0;
      $scope.updateTotal = 0;
      db = null;
      _add_post = function(post) {
        if ($scope.posts[post.path]) {
          $scope.posts[post.path].updated = post.updated;
          $scope.posts[post.path].question = post.question;
          $scope.posts[post.path].answer = post.answer;
          return $scope.posts[post.path].title = post.title;
        } else {
          $scope.posts._array.push(post);
          return $scope.posts[post.path] = post;
        }
      };
      _updateDB = function() {
        return $http.get('dist/index.json').success(function(data) {
          $scope.updating = true;
          $scope.updatedCount = 0;
          $scope.updateTotal = data.length;
          return data.forEach(function(post) {
            return db.transaction('posts').objectStore('posts').get(post.path).onsuccess = function(event) {
              var db_post;
              db_post = event.target.result;
              if (!db_post) {
                return $http.get('dist/posts/' + post.path).success(function(data) {
                  post.question = data.match(/<!-- Question -->([\s\S]*?)<!-- \/Question -->/)[1].trim();
                  post.answer = data.match(/<!-- Answer -->([\s\S]*?)<!-- \/Answer -->/)[1].trim();
                  return db.transaction('posts', 'readwrite').objectStore('posts').add(post).onsuccess = function(event) {
                    return $scope.$apply(function() {
                      $scope.updatedCount += 1;
                      return _add_post(post);
                    });
                  };
                });
              } else if (db_post.updated !== post.updated) {
                return $http.get('dist/posts/' + post.path).success(function(data) {
                  db_post.question = data.match(/<!-- Question -->([\s\S]*?)<!-- \/Question -->/)[1].trim();
                  db_post.answer = data.match(/<!-- Answer -->([\s\S]*?)<!-- \/Answer -->/)[1].trim();
                  return db.transaction('posts', 'readwrite').objectStore('posts').put(db_post).onsuccess = function(event) {
                    return $scope.$apply(function() {
                      $scope.updatedCount += 1;
                      return _add_post(db_post);
                    });
                  };
                });
              } else {
                return $scope.$apply(function() {
                  $scope.updatedCount += 1;
                  return _add_post(db_post);
                });
              }
            };
          });
        });
      };
      request = window.indexedDB.open('workplaceWiki', 2);
      request.onerror = function(event) {
        return console.log("(" + request.errorCode + ") Failed to open connection to indexedDB");
      };
      request.onsuccess = function(event) {
        db = event.target.result;
        _updateDB();
        window.applicationCache.addEventListener('updateready', _updateDB);
        if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
          return _updateDB();
        }
      };
      return request.onupgradeneeded = function(event) {
        var objectStore;
        db = event.target.result;
        objectStore = db.createObjectStore('posts', {
          keyPath: 'path'
        });
        objectStore.createIndex('title', 'title', {
          unique: false
        });
        return objectStore.createIndex('path', 'path', {
          unique: true
        });
      };
    }
  ]);

}).call(this);
