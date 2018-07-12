module.exports = function(io){
 var userSocket  = 0;

 io.on('connection', function(socket){
  userSocket++;
  console.log("Client: ", userSocket);
  console.log("Socket.IO Started");

  //realtime Gps Socket
  socket.on('send_data_to_server', (data)=>{
   console.log(data);
   io.emit('send_data_to_client', {latitude: data.latitude, longitude: data.longitude});
  });

  //Settup socket untuk GPS
  socket.on('statusgps', (data)=>{
   console.log('gps: ', data.msg);
   io.emit('statusgps', {msg: data.msg});
  });

  //Settup socket untuk RELAY
  socket.on('relay1', (data)=>{
   console.log('relay 1 : ', data.msg);
   io.emit('relay1', {msg: data.msg});
  });

  //Settup socket untuk RELAY
  socket.on('relay2', (data)=>{
   console.log('relay 2 : ', data.msg);
   io.emit('relay2', {msg: data.msg});
  });

  //Settup socket untuk RELAY
  socket.on('relay3', (data)=>{
   console.log('relay 3 : ', data.msg);
   io.emit('relay3', {msg: data.msg});
  });

  //Settup socket untuk RELAY
  socket.on('relay4', (data)=>{
   console.log('relay 4 : ', data.msg);
   io.emit('relay4', {msg: data.msg});
  });

 //Settup socket untuk takeFoto
 socket.on('ambilfoto', (data)=>{
  console.log('ambil foto', data.msg);
  io.emit('ambilfoto', {msg: data.msg});
 });

 //Settup socket untuk takeFoto
 socket.on('refresh_foto', (data)=>{
  console.log('refresh_foto', data.msg);
  io.emit('refresh_foto', {msg: data.msg});
 });

  //Settup socket untuk realtime maps
  socket.on('activate_realtime_maps', (data)=>{
    console.log('activate_realtime_maps', data.msg);
    io.emit('activate_realtime_maps', {msg: data.msg});
   });

 //Settup statusbuzzer
 socket.on('statusbuzzer', (data)=>{
  console.log('statusbuzzer : ', data.msg);
  io.emit('statusbuzzer', {msg: data.msg});
 });

 socket.on('disconnect', function(){
  userSocket--;
  console.log("Client disconnected");
 });

 });
}
