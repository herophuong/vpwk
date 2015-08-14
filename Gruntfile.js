module.exports = function(grunt) {

  var path = require('path');
  var fs = require('fs');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      all: {
        src: ["dist/**"]
      }
    },
    copy: {
      all: {
        files: [
          {expand: true, cwd: 'src/', src: '**', dest: 'dist/'}
        ]
      }
    },
    bower_concat: {
      all: {
        dest: 'dist/js/_bower.js',
        cssDest: 'dist/css/_bower.css',
        exclude: [],
        dependencies: {
          'angularjs': 'jquery',
          'angular-sanitize': 'angularjs'
        },
        bowerOptions: {
          relative: false
        }
      }
    },
    coffee: {
      files: {
        expand: true,
        flatten: true,
        cwd: 'dist/js',
        src: ['*.coffee'],
        dest: 'dist/js',
        ext: '.js'
      }
    },
    less: {
      files: {
        expand: true,
        flatten: true,
        cwd: 'dist/css',
        src: ['*.less'],
        dest: 'dist/css',
        ext: '.css'
      }
    },
    concat: {
      scripts: {
        files: {
          'dist/main.js': ['dist/js/*.js']
        }
      },
      css: {
        files: {
          'dist/main.css': ['dist/css/*.css']
        }
      }
    },
    uglify: {
      build: {
        files: {
          'dist/main.min.js': ['dist/main.js']
        }
      }
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1
      },
      target: {
        files: {
          'dist/main.min.css': ['dist/main.css']
        }
      }
    },
    watch: {
      scripts: {
        files: ['src/js/*.js', 'src/js/*.coffee'],
        tasks: ['copy', 'coffee', 'concat:scripts', 'uglify', 'update_manifest']
      },
      css: {
        files: ['src/css/*.less', 'src/css/*.css'],
        tasks: ['copy', 'less', 'concat:css', 'cssmin', 'update_manifest']
      },
      posts: {
        files: ['src/posts/*.html'],
        tasks: ['copy', 'generate_index']
      },
      img: {
        files: ['src/img/*'],
        tasks: ['copy', 'update_manifest']
      },
      endpoint: {
        files: ['index.html'],
        tasks: ['update_manifest']
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bower-concat');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Generate post index
  grunt.registerTask('generate_index', 'Generate post index', function () {
    grunt.log.writeln('Generating post index...');
    var posts = fs.readdirSync('dist/posts'),
        index = [];
    posts.forEach(function(post) {
      try {
        var content = fs.readFileSync(path.join('dist/posts', post), 'utf8');
        var title = content.match(/<!-- Title -->\n(.*)\n/)[1];
        var updated = content.match(/<!-- Updated -->\n(.*)\n/)[1];
        index.push({
          title: title,
          updated: new Date(updated),
          path: post
        });
      } catch (e) {
        grunt.log.writeln('Can\'t read ' + post + '. Ignoring...');
      }
    });

    fs.writeFileSync('dist/index.json', JSON.stringify(index, null, 2));
    grunt.log.oklns('Indexed ' + index.length + ' post(s)');
  });

  grunt.registerTask('update_manifest', 'Update app cache manifest', function() {
    var manifest = fs.readFileSync('workplace-wiki.appcache', 'utf8'),
        versions = manifest.match(/v(\d+).(\d+).(\d+)/),
        old_version = versions[0],
        new_version = 'v' + versions[1] + '.' + versions[2] + '.' + (parseInt(versions[3]) + 1);
    manifest = manifest.replace(old_version, new_version);

    fs.writeFileSync('workplace-wiki.appcache', manifest);
    grunt.log.oklns('Increase manifest version from ' + old_version + ' to ' + new_version);
  });

  // Default task(s).
  grunt.registerTask('default', ['clean', 'copy', 'bower_concat', 'coffee', 'less',
    'concat', 'uglify', 'cssmin', 'generate_index', 'update_manifest', 'watch']);
};
