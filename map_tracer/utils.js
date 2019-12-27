/**
 * @fileOverview Provide utility functions.
 */

function registerFirebase(firebaseKey) {
    myDataRef = new Firebase('https://' + firebaseKey + '.firebaseio.com/');
}

function updateLocation(name, latLng) {
    var toSave = {};
    toSave[name] = latLng;
    myDataRef.update(toSave); 
}