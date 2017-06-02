angular.module('starter.controllers')
.controller('CameraCtrl', function($scope, $rootScope, $stateParams, socket, $ionicLoading, $compile, $http) {
  console.log("<< ------  CameraCtrl  ------ >> ");
  var TAG = "[camera]";
  var relay_socket = $rootScope.relay_socket;
  $scope.flip_card = false;
  
  get_camera_list();
  function get_camera_list() {
    var gateways = $rootScope.gateways;
    for (var i = 0; i < gateways.length; i++) {
      relay_socket.emit('get camera list',gateways[i]);
      //console.log('get_camera_list',gateways[i].mac);
    }
  }

  relay_socket.on('camera list', function (data) {
    var camera_list = data.stdout.split(/(?:\r\n|\r|\n)/g);
    camera_list.splice(0,1);
    camera_list.splice(camera_list.length - 1,1);

    for (var i = 0; i < camera_list.length; i++) {
      var parts = camera_list[i].split(" ");
      parts = parts[9].replace("/dev/video","");
      if (parts.length <= 1) {
        camera_list.splice(i,1);
        i--;
        continue;
      }
      if (parts[parts.length - 1] != '0') {
        camera_list.splice(i,1);
        i--;
        continue;
      }
      camera_list[i] = {camera_number:parts};
    }
    $scope.$apply(function () {
      var index = $rootScope.find_index($rootScope.gateways,'token',data.token);
      $rootScope.gateways[index].camera_list = camera_list;
      //console.log("camera list | ",camera_list);

      var index = $rootScope.find_index($rootScope.gateways,'token',data.token);
      for (var i = 0; i < camera_list.length; i++) {
        console.log(TAG,"get camera preivew",camera_list[i])
        relay_socket.emit('get camera preview',{token:$rootScope.gateways[index].token, camera_number:camera_list[i].camera_number});
      }

    });
  });

  relay_socket.on('camera preview', function (data) {
    var camera_number = data.camera_number;
    var mac = data.mac;
    var ctx = document.getElementById('previewCanvas_'+mac+'_'+camera_number).getContext('2d');
    console.log(TAG,"context:",ctx)
    //document.getElementById("play-button_"+mac+'_'+camera_number).style.display = "none";
    //document.getElementById("previewCanvas_"+mac+'_'+camera_number).style.background = "blue";
    //document.getElementById("videoCanvas_"+mac+'_'+camera_number).style.display = "none";
    var img = new Image();
    img.src = 'data:image/jpeg;base64,' + data.image;
    ctx.drawImage(img, 0, 0, 250, 150);
    console.log(TAG,"camera preview",mac,camera_number);
  });


  $scope.start_webcam = function(gateway, camera_number) {
    var command = {token:gateway.token, command:"start_webcam", camera_number:camera_number}
    relay_socket.emit('ffmpeg',command);
    $scope.start_stream(gateway.mac, camera_number);
  }

  $scope.start_stream = function(mac, camera_number) {
    var gateways = $rootScope.gateways;
    var i = $rootScope.find_index(gateways,"mac",mac);
    if (i < 0) return console.log("gateway not found",mac);
    var j = $rootScope.find_index(gateways[i].camera_list,"camera_number",camera_number);
    if (j < 0) return console.log("camera not found",camera_number);

    if (gateways[i].camera_list[j].stream_started) return console.log("stream already started");
    gateways[i].camera_list[j].camera_socket = 'ws://'+$rootScope.server_ip+':8084';
    gateways[i].camera_list[j].stream_started = true;
    gateways[i].camera_list[j].canvas = document.getElementById('videoCanvas_'+mac+'_'+camera_number);
    gateways[i].camera_list[j].player = new JSMpeg.Player(gateways[i].camera_list[j].camera_socket, {canvas:gateways[i].camera_list[j].canvas,token:gateways[i].token, camera:camera_number});
    console.log("camera_list: ",gateways[i].camera_list[j]);

    document.getElementById("play-button_"+mac+'_'+camera_number).style.display = "none";
    document.getElementById("previewCanvas_"+mac+'_'+camera_number).style.display = "none";
    document.getElementById("videoCanvas_"+mac+'_'+camera_number).style.display = "inline";
  }
  
  $scope.play_file = function(file, gateway, camera_number) {
    file = file.folder + "/" + file[8];
    var file_obj = {file:file, token:gateway.token}
    var command = {file:file, token:gateway.token, command:"play_file"}
    relay_socket.emit('ffmpeg',command);
    console.log("play_file",file_obj);
    $scope.start_stream(gateway.mac, camera_number);
  }

  $scope.play_folder = function(folder, gateway, camera_number) {
    /*for (var i =1; i < folder_list.length; i++) {
      if (folder_list[i].name == "images") continue;
      if (folder_list[i].name == "play all") continue;
      folder_list[i] = "file '" + folder_list[i].folder + "/" + folder_list[i].name +"'";
    }*/
    var command = {folder:folder, token:gateway.token, command:"play_folder"};
    console.log("play_folder",command);
    relay_socket.emit('ffmpeg',command);
    $scope.start_stream(gateway.mac, camera_number);
  }

  $scope.list_folder = function (gateway, camera_number) {
    var folder = "/var/lib/motion/camera"+camera_number[0];
    console.log("list folder",folder);
    relay_socket.emit('folder list',{token:gateway.token,folder:folder});
  }

  $scope.select_item = function (item, gateway, camera_number) {
    if (item[8])
      if (item[8].indexOf(".avi") > -1) {
        $scope.play_file(item, gateway, camera_number);
        return;
    }

    var folder = item.folder + "/" + item[8];
    if (item.name == "play all" ) {
      $scope.play_folder(item.folder, gateway, camera_number);
      return console.log("play all | " + item);
    }
    relay_socket.emit('folder list',{token:gateway.token,folder:folder});
  }

  $scope.fullscreen = function(div_id) { 
    console.log("fullscreen",div_id);
    if (document.getElementById(div_id).className == "") {
      document.getElementById(div_id).className = "col-lg-4 col-md-6 col-sm-12";
    } else document.getElementById(div_id).className = "";
  }

  relay_socket.on('folder list result', function (data) {
    var play_all_btn = false;
    $scope.flip_card = false;
    var folder_list = data.stdout.split(/(?:\r\n|\r|\n)/g);
    folder_list.splice(0,1);
    folder_list.splice(folder_list.length - 1,1);

    for (var i = 0; i < folder_list.length; i++) {
      var parts = folder_list[i].split(" ");
      if (parts.length < 8) continue;
      parts.folder = data.folder;
      for (var k = 0; k < parts.length; k++) {
        if (parts[k].length < 1) {
          parts.splice(k,1);
          k--;
        }
      }

      //format date
      parts[5] = parts[5].split("-");

      //format time
      parts[6] = parts[6].split(":");
      
      
      if (parts[8].charCodeAt(0) == 46) {
        if (parts[8].charCodeAt(1) == 46) {
        } else if (parts[8].length < 2) {
          folder_list.splice(i,1);
          i--;
          continue;
        }
      }
      parts.name = parts[8];
      folder_list[i] = parts;
      if (folder_list[i][8].indexOf(".avi") > -1) {
        play_all_btn = true;
        $scope.flip_card = true;
      }
      console.log("folder list result | ",data.mac);
    }
    if (play_all_btn) {
      folder_list.unshift({name:"play all", folder:parts.folder})
    }
    $scope.$apply(function () {
      var index = $rootScope.find_index($rootScope.gateways,'token',data.token);
      $rootScope.gateways[index].folder_list = folder_list;
    });
  });

})
