import React, { useContext, createContext, FC } from 'react';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import './App.css';

//DONE type 'post' argument
//DONE pass arguments through mobx
//DONE add some content
//TODO add helper library to convert from MD to virtual DOM
// * keep converter minimal
//TODO read on Javascript objects and classes

interface Post {
    title: string;
    date: string;
    content: string;
}
class RootStore {
    post: Post | undefined = undefined;

    constructor() {
        makeAutoObservable(this);
    }
}

const RootStoreContext = createContext<RootStore>(new RootStore());

const Content: FC = observer(() => {
    const { post } = useContext(RootStoreContext);

    if (post == null) {
        return <></>;
    }

    console.log('rendering content');

    return (
        <div>
            <h1>{post.title}</h1>
            <h2>{post.date}</h2>
            <p>{post.content}</p>
        </div>
    );
});

const store = new RootStore();

const App: FC = () => {
    store.post = {
        title: 'this is a mockup, foo!!',
        date: 'Nov 10, 2019',
        content: `I must not fear.
Fear is the mind-killer.
Fear is the little-death that brings total obliteration.
I will face my fear.
I will permit it to pass over me and through me.
And when it has gone past, I will turn the inner eye to see its path.
Where the fear has gone there will be nothing. Only I will remain.`,
    };
    return (
        <RootStoreContext.Provider value={store}>
            <Content></Content>
        </RootStoreContext.Provider>
    );
};

export default App;
