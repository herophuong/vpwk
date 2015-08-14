workplaceWiki = angular.module 'workplaceWiki', ['ngSanitize']

workplaceWiki.controller 'appController', ['$scope', '$http', ($scope, $http) ->
  $scope.posts = {}
  $scope.posts._array = [];
  $scope.updating = false;
  $scope.updatedCount = 0;
  $scope.updateTotal = 0;
  db = null;
  
  _add_post = (post) ->
    if $scope.posts[post.path]
      $scope.posts[post.path].updated = post.updated
      $scope.posts[post.path].question = post.question
      $scope.posts[post.path].answer = post.answer
      $scope.posts[post.path].title = post.title
    else
      $scope.posts._array.push post
      $scope.posts[post.path] = post
  _updateDB = () ->
    $http.get('dist/index.json').success (data) ->
      $scope.updating = true
      $scope.updatedCount = 0
      $scope.updateTotal = data.length

      data.forEach (post) ->
        db.transaction('posts').objectStore('posts').get(post.path).onsuccess = (event) ->
          db_post = event.target.result
          
          # Add post to database if not existed
          if !db_post
            $http.get('dist/posts/' + post.path).success (data) ->
              post.question = data.match(/<!-- Question -->([\s\S]*?)<!-- \/Question -->/)[1].trim()
              post.answer = data.match(/<!-- Answer -->([\s\S]*?)<!-- \/Answer -->/)[1].trim()

              db.transaction('posts', 'readwrite').objectStore('posts').add(post).onsuccess = (event) ->
                $scope.$apply ->
                  $scope.updatedCount += 1
                  _add_post post
          # If post exists, check for updated field then get new data
          else if db_post.updated != post.updated
            $http.get('dist/posts/' + post.path).success (data) ->
              db_post.question = data.match(/<!-- Question -->([\s\S]*?)<!-- \/Question -->/)[1].trim()
              db_post.answer = data.match(/<!-- Answer -->([\s\S]*?)<!-- \/Answer -->/)[1].trim()

              db.transaction('posts', 'readwrite').objectStore('posts').put(db_post).onsuccess = (event) ->
                $scope.$apply ->
                  $scope.updatedCount += 1
                  _add_post db_post
          # Else publish to model
          else
            $scope.$apply ->
              $scope.updatedCount += 1
              _add_post db_post

  # Prepare connection to IndexedDB
  request = window.indexedDB.open('workplaceWiki', 2);
  request.onerror = (event) ->
    console.log "(#{request.errorCode}) Failed to open connection to indexedDB"
  request.onsuccess = (event) ->
    db = event.target.result
    # Update data when start up
    _updateDB()

    # Tracking app cache and update data
    window.applicationCache.addEventListener 'updateready', _updateDB;
    if window.applicationCache.status == window.applicationCache.UPDATEREADY
      _updateDB()

  request.onupgradeneeded = (event) ->
    db = event.target.result

    objectStore = db.createObjectStore('posts', { keyPath: 'path' })

    objectStore.createIndex 'title', 'title', { unique: false }
    objectStore.createIndex 'path', 'path', { unique: true }
]
