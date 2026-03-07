import { db } from './firebase-config.js';

import {
    doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

//const dataInput = document.getElementById('data');


//document.getElementById("demo").innerHTML = "<h2>Not Clicked</h2>";

const collection = doc(db, 'collection/test1');

// Add a new document in collection "cities"

function newData() {
    const docData = {
    name: 'James',
    age: 100
    };
    setDoc(collection, docData);
}

function newUser(id, name, mail, color) {
  const userData = {
    uid: id,
    displayName: name,
    email: mail,
    avatarColor: color
  }
  const user = doc(db, 'users/' + id);
  setDoc(user, userData);
}

//savedRecipes: {uid, mealId, mealName, mealThumb, savedAt}. folders: {uid, name, mealIds[]}.

//TESTING - Aubrey
signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    //document.getElementById("demo").innerHTML = "<h2>Clicked</h2>";

    //newData();
    newUser(123, "Aubrey", "aubsickle@gmail.com", "#D4A5A5");

});
