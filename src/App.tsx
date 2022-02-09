import React, { useContext, createContext, FC } from 'react';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import * as commonmark from 'commonmark';
import './App.css';

/***********************************************************************
 * TODO
 ***********************************************************************/

/*
DONE type 'post' argument
DONE pass arguments through mobx
DONE add some content
DONE add helper library to convert from MD to virtual DOM
* keep converter minimal
TODO read on Javascript objects and classes
TODO automatically lint and test before commit
*/

/*
FIRST PHASE
DONE convert markdown to html for a single post
DONE convert md -> html for  multiple posts
TODO add simple metadata: title, publish date, visible
TODO create an index
TODO read multiple files from disc
TODO construct a basic layout
TODO add some simple inline css
*/

/***********************************************************************
 * STORES
 ***********************************************************************/

class BlogPostStore {
    title: string;
    date: string;
    content: string;
    _ast: commonmark.Node;

    constructor(title: string, date: string, content: string) {
        makeAutoObservable(this);
        this.title = title;
        this.date = date;
        this.content = content;
        const reader = new commonmark.Parser();
        this._ast = reader.parse(content);
    }

    get ast(): commonmark.Node {
        return this._ast;
    }
}

interface BlogPost {
    title: string;
    date: string;
    content: string;
}
class RootStore {
    _posts: BlogPostStore[] | undefined = undefined;

    constructor() {
        makeAutoObservable(this);
    }

    get posts(): BlogPostStore[] | undefined {
        return this._posts;
    }

    loadBlogPosts(xs: BlogPost[]) {
        this._posts = xs.map((x) => new BlogPostStore(x.title, x.date, x.content));
    }
}

const RootStoreContext = createContext<RootStore>(new RootStore());

/***********************************************************************
 * MARKDOWN TO HTML
 ***********************************************************************/

function collect_children(root: commonmark.Node) {
    const xs = [];
    let x = root.firstChild;
    while (x) {
        xs.push(x);
        x = x.next;
    }
    return xs;
}

const map_children = (node: commonmark.Node) => (
    <>
        {collect_children(node).map((x, i) => (
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            <Mapping node={x} key={i}></Mapping>
        ))}
    </>
);

const Other: React.FC = ({ children }) => <p>{children}</p>;

const Code: React.FC = ({ children }) => <code>{children}</code>;

const CodeBlock: React.FC = ({ children }) => <pre>{children}</pre>;

const Emph: React.FC = ({ children }) => <span>{children}</span>;

const Heading: React.FC = ({ children }) => (
    <h1 style={{ color: '#333333', textTransform: 'uppercase' }}>{children}</h1>
);

type LinkProps = {
    href: string; // TODO
};
const Link: React.FC<LinkProps> = ({ href, children }) => <a href={href}>{children}</a>;

const List: React.FC = ({ children }) => <ul>{children}</ul>;

const ListItem: React.FC = ({ children }) => <li>{children}</li>;

const OrderedList: React.FC = ({ children }) => <ol>{children}</ol>;

const Paragraph: React.FC = ({ children }) => <p>{children}</p>;

const Strong: React.FC = ({ children }) => <span>{children}</span>;

type MappingProps = {
    node: commonmark.Node;
};

const Mapping: FC<MappingProps> = ({ node }) => {
    switch (node.type) {
        case 'document':
            return <>{map_children(node)}</>;
            break;
        case 'text':
            return <>{node.literal}</>;
            break;
        case 'softbreak':
            return <span>{` `}</span>;
            break;
        case 'code':
            return <Code>{node.literal}</Code>;
            break;
        case 'code_block':
            return <CodeBlock>{node.literal}</CodeBlock>;
            break;
        case 'linebreak':
            return <Other>{map_children(node)}</Other>;
            break;
        case 'emph':
            return <Emph>{map_children(node)}</Emph>;
            break;
        case 'strong':
            return <Strong>{map_children(node)}</Strong>;
            break;
        case 'html_inline':
            return <Other>{map_children(node)} </Other>;
            break;
        case 'image':
            return <Other>{map_children(node)} </Other>;
            break;
        case 'paragraph':
            return <Paragraph>{map_children(node)}</Paragraph>;
            break;
        case 'block_quote':
            return <Other>{map_children(node)}</Other>;
            break;
        case 'item':
            return <ListItem>{node.firstChild == null ? <></> : map_children(node.firstChild)}</ListItem>;
            break;
        case 'html_block':
            return <Other>{map_children(node)}</Other>;
            break;
        case 'heading':
            return <Heading>{map_children(node)}</Heading>;
            break;
        case 'link':
            return <Link href={node.destination == null ? '' : node.destination}>{map_children(node)}</Link>;
            break;
        case 'list':
            if (node.listType === 'bullet') {
                return <List>{map_children(node)}</List>;
            }
            return <OrderedList>{map_children(node)}</OrderedList>;
            break;
        default:
            return <Other>{map_children(node)}</Other>;
            break;
    }
};

/***********************************************************************
 * CONTENT
 ***********************************************************************/

const Content: FC = observer(() => {
    const { posts } = useContext(RootStoreContext);

    if (posts == null) {
        return <></>;
    }

    console.log('rendering content');

    const postElements = posts.map((post, i) => (
        <div key={i} style={{ backgroundColor: '#eeeeee' }}>
            <h1>{post.title}</h1>
            <h2>{post.date}</h2>
            {map_children(post.ast)}
        </div>
    ));
    return <>{postElements}</>;
});

const Index: FC = observer(() => {
    const { posts } = useContext(RootStoreContext);

    if (posts == null) {
        return <></>;
    }

    console.log('rendering index');
    const titles = posts.map((post, i) => (
        <li key={i}>
            <a>
                <h1 style={{ textTransform: 'uppercase', color: 'red' }}>{post.title}</h1>
            </a>
        </li>
    ));
    return (
        <div style={{ backgroundColor: '#cccccc' }}>
            <h1> Table of Content </h1>
            <ul style={{ listStyleType: 'none' }}>{titles}</ul>
        </div>
    );
});

const store = new RootStore();

const App: FC = () => {
    store.loadBlogPosts([
        {
            title: 'this is a mockup, foo!!',
            date: 'Nov 10, 2019',
            content: `
## This is a poem about fear
I must not fear.
Fear is the mind-killer.
Fear is the little-death that brings total obliteration.
**I will face my fear**.
I will permit it to pass over me and through me.
And when it has gone past, I will turn the inner eye to see its path.
Where the fear has gone there will be nothing. Only I will remain.

## The end
* I must not fear
* fear is the mind-killer
* fear is the little death that brings total obliteration
* I will face my fear
* I will permit it to pass over me and through me
* When it has gone past I will turn the inner eye to see its path
* Where the fear has gone there will be nothing
* Only I will remain
`,
        },
        {
            title: 'this is a second post',
            date: 'Nov 11,2021',
            content: `
## This is not a poem about fear
This is a bunch of nothing really.
Just some random words.

* just
* some
* randoms
* words
`,
        },
    ]);
    return (
        <RootStoreContext.Provider value={store}>
            <Index></Index>
            <Content></Content>
        </RootStoreContext.Provider>
    );
};

export default App;
