# multiplayer.js

"omg making a multiplayer game is so hard johnfn"

NOT ANY MORE

`multiplayer.js` offers a simple way to structure your game project in such a way that making it multiplayer comes naturally.

First, you need to split up your game logic like this:

1. Game data. All of the internal representations of your game entities go in here.

2. Game update function. multiplayer.js wants a function defined like this:

    function update(data, events) {

Every tick it'll call that function, and it expects to receive back the updated data object. For example, if the data object is a unit and an enemy unit facing each other, and the event indicates that your unit should attack the enemy unit, then you should return an updated data object indicating your enemy is switching animations to the attack animation, that the enemy took damage, and so on.

3. A way to render. But I need to figure this out still... ugh