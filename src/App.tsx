import React, { FC } from 'react';
import './App.css';

//DONE type 'post' argument
//TODO pass arguments through mobx
//TODO add some content
//TODO add helper library to convert from MD to virtual DOM
// * keep converter minimal
interface AppProps {
    post: {
        title: string,
        date: string,
    };
}

const App: FC<AppProps> = ({ post }) => {
    console.log(post);

    return (
        <div>
            <h1>{post.title}</h1>
            <h2>{post.date}</h2>
        </div>
    );
};

export default App;
