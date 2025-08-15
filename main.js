const localConnection = new RTCPeerConnection();

const dataChannel = localConnection.createDataChannel("channel");

dataChannel.onmessage = e => console.log("Just got a message: " + e.data);
dataChannel.onopen = e => console.log("Connection opened!");

localConnection.onicecandidate = e => console.log("New ICE Candidate! Reprinting SDP: " + JSON.stringify(localConnection.localDescription));

localConnection.createOffer().then(o => localConnection.setLocalDescription(o)).then(a => console.log("Set successfully!"));

