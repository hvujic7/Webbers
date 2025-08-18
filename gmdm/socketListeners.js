// When a client connects to the server, the client receives all the offers stored on the server at that time before the client had joined.
socket.on("availableOffers", (offers) => {
  console.log(offers);
  createOfferEls(offers);
});

// If the client has already been connected to the server, but another client JUST sent an offer to server, we will receive it here now.
socket.on("newOfferAwaiting", (offers) => {
  console.log(offers);
  createOfferEls(offers);
});

// These next two events triggered by the server call functions in scripts.js.
socket.on("answerResponse", (offerObj) => {
  console.log(offerObj);
  addAnswer(offerObj);
});

socket.on("receivedIceCandidateFromServer", (iceCandidate) => {
  console.log(iceCandidate);
  addNewIceCandidate(iceCandidate);
});

// This function creates offer HTML elements.
// Basically, it makes those green buttons, one for every offer found on the server 
// (and they got there every time a client made an offer for somebody to join them and talk to them).
// This function mainly handles the HTML elements.
// The actual WebRTC functionality for answering an offer is in script.js,
// in the answerOffer function.
function createOfferEls(offers) {
  const answerEl = document.querySelector("#answer");
  offers.forEach((o) => {
    console.log(o);
    const newOfferEl = document.createElement("div");
    newOfferEl.innerHTML = `<button class="btn btn-success col-1">Answer ${o.offererUserName}</button>`;
    newOfferEl.addEventListener("click", () => answerOffer(o));
    answerEl.appendChild(newOfferEl);
  });
}
