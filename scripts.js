// Random username with hardcoded password.
const userName = "User-" + Math.floor(Math.random() * 100000);
const password = "x";

// Display the user's username on the HTML.
document.querySelector("#user-name").innerHTML = userName;

// If trying it on a phone, use this instead...
// const socket = io.connect("https://192.168.0.239:8181/", {
const socket = io.connect("https://localhost:8181/", {
  auth: {
    userName,
    password,
  },
});

// We are going to display the audio and visual streams on these video elements.
const localVideoEl = document.querySelector("#local-video");
const remoteVideoEl = document.querySelector("#remote-video");

let localStream; // A var to hold the local video stream.
let remoteStream; // A var to hold the remote video stream.
let peerConnection; // The peerConnection that the two clients use to talk.
let didIOffer = false;

// The STUN servers we will use to generate ICE candidates so that clients can find each other.
let peerConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

// This function is ran when the client initiates a call.
// Attached to an event handler at the bottom of this JavaScript file.
const call = async (e) => {

  // Get the caller's video.
  await fetchUserMedia();

  //peerConnection is all set with our STUN servers sent over
  await createPeerConnection();

  // It's time to create an offer, in the hopes that somebody answers it!
  try {
    console.log("Creating offer...");
    const offer = await peerConnection.createOffer();
    console.log(offer);
    peerConnection.setLocalDescription(offer); // This "offer" is what remote clients will use to try to connect to us.
    didIOffer = true;
    socket.emit("newOffer", offer); // Send this offer to the Signaling Server so that others connecting to said server may find us.
  } catch (err) {
    console.log(err);
  }
};

const answerOffer = async (offerObj) => {
  
  // Do the same two things we do if we were to make the call instead of answering the call,
  // except this time we send an offerObj to the other client so they can set their remote to us.
  await fetchUserMedia();
  await createPeerConnection(offerObj);

  const answer = await peerConnection.createAnswer({}); // Just to make the docs happy
  await peerConnection.setLocalDescription(answer); // This is CLIENT2, and CLIENT2 uses the answer as the localDesc
  
  console.log(offerObj);
  console.log(answer);
  // console.log(peerConnection.signalingState) //should be have-local-pranswer because CLIENT2 has set its local desc to its answer (but it won't be)
  // add the answer to the offerObj so the server knows which offer this is related to
  
  offerObj.answer = answer;
  
  // Emit the answer to the signaling server, so it can emit to CLIENT1.
  // Expect a response from the server with the already existing ICE candidates
  const offerIceCandidates = await socket.emitWithAck("newAnswer", offerObj);
  
  // Add ICE Candidates to the peerConnection.
  offerIceCandidates.forEach((c) => {
    peerConnection.addIceCandidate(c);
    console.log("======Added Ice Candidate======");
  });
  
  console.log(offerIceCandidates);
};

const addAnswer = async (offerObj) => {
  
  // The addAnswer function is called in socketListeners when an answerResponse is emitted.
  // At this point, the offer and answer have been exchanged!
  // Now CLIENT1 needs to set the remote
  await peerConnection.setRemoteDescription(offerObj.answer);
  // console.log(peerConnection.signalingState)
};

// Get the client's video and stream it to their local HTML video element.
// We don't want audio because the client can hear themselves already lol,
// they don't need their speakers playing back their own voice.
const fetchUserMedia = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        // audio: true,
      });
      localVideoEl.srcObject = stream;
      localStream = stream;
      resolve();
    } catch (err) {
      console.log(err);
      reject();
    }
  });
};

const createPeerConnection = (offerObj) => {
  return new Promise(async (resolve, reject) => {
    
    // RTCPeerConnection is the actual thing that creates the connection between clients.
    // We can pass a config object into RTCPeerConnection that contains the location of STUN servers
    // which will fetch us ICE candidates
    peerConnection = await new RTCPeerConnection(peerConfiguration);

    // Create a new MediaStream object, something built-in to JavaScript
    remoteStream = new MediaStream();

    // Set the remote video to play the remote stream from the client we are connecting to.
    // The remoteStream at this point is empty, but we will get it later from a client connecting to us
    // from an event found further down in this same function.
    remoteVideoEl.srcObject = remoteStream;

    // Get all the tracks for the local client, mainly just video and audio tracks.
    localStream.getTracks().forEach((track) => {
      
      // The local tracks will be sent once the connection is established
      peerConnection.addTrack(track, localStream);
    });

    // Just some logs to help us keep track of when the signaling state changes.
    peerConnection.addEventListener("signalingstatechange", (event) => {
      console.log(event);
      console.log(peerConnection.signalingState);
    });

    // When we find an ICE Candidate, we will send it to the signaling server
    // so that another client who wants to connect to us and can use it to send their stream over to ours.
    peerConnection.addEventListener("icecandidate", (e) => {
      console.log("........Ice candidate found!......");
      console.log(e);
      if (e.candidate) {
        socket.emit("sendIceCandidateToSignalingServer", {
          iceCandidate: e.candidate,
          iceUserName: userName,
          didIOffer,
        });
      }
    });

    // When this event called "track" gets fired, it means we got tracks from the client who
    // wants to connect to us.
    // In that case, add their tracks to our remote stream so we can see and hear them.
    peerConnection.addEventListener("track", (e) => {
      console.log("Got a track from the other peer!! How exciting");
      console.log(e);
      e.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track, remoteStream);
        console.log("Here's an exciting moment... fingers crossed.");
      });
    });

    // In one case, this function being called will not have an offerObj passed along with it.
    // In that case, this if wouldn't run.
    // That same one case is when running the function: call();
    // It only runs when we call this function from answerOffer().
    if (offerObj) {
      
      // console.log(peerConnection.signalingState) // Should be stable because no setDesc has been run yet
      await peerConnection.setRemoteDescription(offerObj.offer);
      // console.log(peerConnection.signalingState) // Should be have-remote-offer, because client2 has setRemoteDesc on the offer
    }
    
    // Everything went as planned, so mark as resolved.
    resolve();
  });
};

// This function is called from socketListeners.js.
// It passes in an iceCandidate, the one we will use to find the remote client to connect to.
const addNewIceCandidate = (iceCandidate) => {
  peerConnection.addIceCandidate(iceCandidate);
  console.log("======Added Ice Candidate======");
};

document.querySelector("#call").addEventListener("click", call);
