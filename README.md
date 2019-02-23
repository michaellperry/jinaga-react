# Jinaga React

Binding helpers for managing [React](https://reactjs.org) component state based on [Jinaga](https://jinaga.com) watches.

```bash
npm install --save jinaga react react-dom jinaga-react
```

Use the `useJinaga` hook in a function component:

```javascript
export const ChannelView = ({ channel }) => {
    const state = useJinaga(j, channel, [
        collection('messages', j.for(Message.inChannel), m => m.key, [
            field('key', m => j.hash(m)),
            field('text', m => m.text),
            property('sender', j.for(Message.sender).then(UserName.forUser), n => n.value)
        ])
    ]);

    return (
        <ul>
            { state.messages.map(message => <li key={message.key}>
                <p>{ message.text }</p>
                <p>{ message.sender }</p>
            </li>) }
        </ul>
    );
};
```

Or use the `StateManager` class in a class component:

```javascript
export class ChannelView extends React.Component {
    constructor(props) {
        super(props);
        this.stateManager = StateManager.forComponent(this, j, props.channel, [
            collection('messages', j.for(Message.inChannel), m => m.key, [
                field('key', m => j.hash(m)),
                field('text', m => m.text),
                property('sender', j.for(Message.sender).then(UserName.forUser), n => n.value)
            ])
        ]);
        this.state = this.stateManager.initialState();
    }

    componentDidMount() {
        this.stateManager.start();
    }

    componentWillUnmount() {
        this.stateManager.stop();
    }

    render() {
        return (
            <ul>
                { this.state.messages.map(message => <li key={message.key}>
                    <p>{ message.text }</p>
                    <p>{ message.sender }</p>
                </li>) }
            </ul>
        );    
    }
}
```

## Field Specification Functions

Declare the fields of your component state using the field specification functions.
The first parameter is the name of the field in the component state.
The rest of the parameters extract data from a fact according to the kind of field you are specifying.

There are five specification functions provided out of the box:

* field
* projection
* collection
* property
* mutable

### Field

The simplest field specification function provides an immutable value based on the fact.
Use it to copy a field directly from the fact into state.

```javascript
field('text', m => m.text)
```

Or to compute the hash to use as a key.

```javascript
field('key', m => j.hash(m))
```

Or to store the fact itself.

```javascript
field('fact', m => m)
```

### Projection

A projection produces a single object.
This is useful for organizing component state, especially if you will be breaking down the rendering into several components.
Provide specifications for all of the fields of the child object.

```javascript
projection('user', [
    property('name', j.for(nameOfUser), n => n.value, '')
])
```

Now you have an object that has a subset of the component state, so you can render it separately.

```javascript
return (
    <UserView user={ state.user } />
);
```

### Collection

A collection field produces an array of child objects.
Each object must have a field that uniquely identifies it.
If you already have such a field within the model, feel free to use it.
But a good alternative is to use the fact's hash.
Provide specifications for all fields of the child objects, including the key.

```javascript
collection('messages', j.for(messagesInChannel), m => m.key, [
    field('key', m => j.hash(m))
])
```

### Property

A Jinaga property is a pattern for simulating changes to a value using immutable facts.
The `property` function translates this pattern into a state field that can change.

A property fact has a parent entity, a value, and an array of prior facts.

```javascript
const name1 = await j.fact({
    type: 'User.Name',
    user: { type: 'User', publicKey: '...' },
    value: 'Michael',
    prior: []
});
```

To change the value of a property, create a new fact that refers to the previous value.

```javascript
const name2 = await j.fact({
    type: 'User.Name',
    user: { type: 'User', publicKey: '...' },
    value: 'Mike',
    prior: [ name1 ]
});
```

Declare a template function that matches only the facts that have not been superseded.

```javascript
function nameOfUser(u) {
    return j.match({
        type: 'User.Name',
        user: u
    }).suchThat(nameIsCurrent);
}

function nameIsCurrent(n) {
    return j.notExists({
        type: 'User.Name',
        prior: [n]
    });
}
```

The `property` specification function will assign the value of the most recent fact to a state field.

```javascript
property('name', j.for(nameOfUser), n => n.value)
```

### Mutable

If you want the user to be able to edit the property, you will need to capture more information than the current value.
Use the `mutable` specification function to gather that information.

```javascript
mutable('name', j.for(nameOfUser), userNames => userNames
    .map(n => n.value)
    .join(', '))
```

Rather than selecting just a single value, the `mutable` specification function takes a conflict resolver.
This function receives an array of facts, not just one.
If that array is empty, then the property has not yet been initialized, and the resolver should return the default value.
If the array has only one fact, then there is no conflict, and the resolver returns the value from that fact.
But, if the array contains more than one fact, then a conflict has occurred.
The resolver determines the correct value given all of those candidates.

The resolver will typically be a map-reduce style function.
The `join` function used above is perfect for strings, because it gives an empty string by default, the single value if there is no conflict, and the list of candidate values if a conflict has occurred.

Another strategy is last write wins.
Since the order of the candidates is not guaranteed, this strategy relies upon a date being added to the fact.
Dates have been converted to strings, because facts are JSON objects.

```javascript
mutable('name', j.for(nameOfUser), userNames => userNames
    .reduce((a,b) => a.createdAt > b.createdAt ? a : b, { createdAt: '', value: '' } )
    .value)
```

The state field has a `value` field that contains the resolved value.
It also has some additional bookkeeping fields that keep track of candidates.

When the user begins editing the mutable property, take a snapshot of the state field.
Present them with the value, and allow them to make their changes.
When they save, use the `prior` function to turn those candidates into an array.
Then create a new fact if the value has changed or a conflict has been resolved.

```javascript
const name = state.name;
let value = name.value;

// Edit the value

const priorNames = prior(name);
if (value !== name.value || priorNames.length !== 1) {
    await j.fact({
        type: 'User.Name',
        user,
        value,
        prior: priorNames
    });
}
```