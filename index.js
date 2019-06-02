var express = require('express');
var axios = require('axios');
var wol = require('wake_on_lan');



var app = express();

app.get('/wake', function (req, res) {
  wol.wake('54:04:A6:EB:5D:25', function(error) {
    if (error) {
      // handle error
      return res.error("Couldn't wake up computer");
      
    } else {
      res.status(200);
      res.end("ok");
    }
  });
});

app.get('/off', function (req, res) {
let flag = false;

  axios.post('http://10.0.0.211:5609/sleep').then(function () {
  	flag = false;
  }).catch(function () {
  	flag = "Couldn't turn off computer";
  })

  setTimeout(function () {
  	if(flag){
  		return res.error(flag);
  	}
  	res.status(200)
  	res.end("ok")
  }, 2500);
});

app.listen(3078, function () {
  console.log('Wake on Lan at: http://localhost:3078/');
});
