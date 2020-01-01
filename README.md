# Jinaga React

[![Greenkeeper badge](https://badges.greenkeeper.io/michaellperry/jinaga-react.svg)](https://greenkeeper.io/)

Binding helpers for managing [React](https://reactjs.org) component state based on [Jinaga](https://jinaga.com) watches.

```bash
npm install --save jinaga react react-dom jinaga-react
```

Full documentation can be found at [https://jinaga.com/documents/jinaga-react/](https://jinaga.com/documents/jinaga-react/).

# Composition

User interfaces in React are composed from components.
The Jinaga helper library for React provides ways to connect components to Jinaga template functions to create dynamic user interfaces.
It breaks the problem into three layers:

* Specifications
* Mappings
* Containers

Mappings can further be used in collections to build structures of any depth.

## Specifications

Start by specifying a set of properties to be injected into a React component.

```javascript
const messageSpec = specificationFor(Message, {
    text: field(m => m.text),
    sender: property(j.for(Message.sender).then(UserName.forUser), n => n.value, "<sender>")
});
```

This specification defines two props.
The `text` prop will be given the value of the text field of the `Message` fact.
The `sender` prop will use the result of the template functions `Message.sender` and `UserName.forUser`.
This sets up a query that will take the sender of the message, and then watch for their user name.

By default, the property will have the value `"<sender>"`, which is just there so that something gets displayed.
That value will be used only if the sender has no name.
In other words, if the `UserName.forUser` template matches no facts.

You can get the results of a mapping with the hook `useResult`.
Pass the Jinaga object, the starting fact, and the specification.
Like all hooks, this can only be used within a render function -- typically in a function component.

```javascript
const messageView = ({ message }) => {
    const result = useResult(j, message, messageSpec);

    if (result === null) {
        return <p>Loading</p>;
    }
    else {
        const { text, sender } = message;

        return (
            <>
                <p className="message-text">{text}</p>
                <p className="message-sender">{sender}</p>
            </>
        );
    }
}
```

The hook returns null while the results are loading asynchronously, or if the starting fact is null.

## Mappings

Once you have a specification, you can map it to a React component.
Do this by calling the `mapProps` function with the specification, and then the `to` function with the component.
Function components or class components are accepted.
If the component takes additional properties, you can use the generic argument on `to` to declare them (TypeScript only).

```typescript
interface MessageProps {
    onReply(): void;
}

const messageMapping = mapProps(messageSpec).to<MessageProps>(({ text, sender, onReply }) => (
    <>
        <p className="message-text">{text}</p>
        <p className="message-sender">{sender}</p>
        <button onClick={onReply}>Reply</button>
    </>
));
```

Or if you prefer a class component rather than a function component, pass the constructor.

```javascript
class MessagePresenter extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <>
                <p className="message-text">{this.props.text}</p>
                <p className="message-sender">{this.props.sender}</p>
                <button onClick={this.props.onReply}>Reply</button>
            </>
        );
    }
}

const messageMapping = mapProps(messageSpec).to(MessagePresenter);
```

## Containers

Now that you've mapped the specified properties into a component, you can wrap that component in a container.
Define a container component with the `jiangaContainer` function.
Pass in the Jinaga instance (typically called `j`) and the mapping.

```javascript
const MessageView = jinagaContainer(j, messageMapping);
```

You can now use this container component as a regular React component.
It has a prop called `fact` that takes the starting point of the graph.
It also takes any unbound props that were added un the call to `mapProps`.`to`.

```javascript
const message = new Message("Twas Brillig", user, new Channel("General"), new Date());

function onReply() {
    // ...
}

ReactDOM.render(
    <MessageView fact={message} onReply={onReply} />,
    document.getElementById("message-host"));
```

## Collections

Of course, it doesn't make much sense to have a page that displays just one message.
You want a list of messages in a channel.
You can compose mappings into other specifications using the `collection` function.

```javascript
const channelSpec = specificationFor(Channel, {
    identifier: field(c => c.identifier),
    Messages: collection(j.for(Message.inChannel), messageMapping, descending(m => m.sentAt))
});
```

I gave the `Messages` prop a capitalized name.
Want to know why?
Because that lets me use it as a component!
Supply any unbound parameters.

```javascript
const channelMapping = channelSpec(( { identifier, Messages }) => (
    <>
        <h1>{identifier}</h1>
        <Messages onReply={onReply} />
    </>
));
```

The collection component will render all of the results of the template function using the child mapping, and in the specified order.

There are loads of ways to compose specifications and mappings.
Check out all of the field specification functions to explore all of the options.