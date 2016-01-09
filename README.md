# riakcs-user-client
RiakCS User client, written in node

## Usage

    var RiakCsClient = require('./src/RiakCsClient.js');
    
    var access = "<RiakCS Access Key>";
    var secret = "<RiakCs Secret Key>";
        
    var client = new RiakCsClient(access, secret, 'http://riakcs.test:18080');
    client.getAllUsers(function (err, response) {
        console.log(err);
        console.log('%j', response);
    }
