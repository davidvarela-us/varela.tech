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

/* FIRST PHASE
DONE convert markdown to html for a single post
DONE convert md -> html for  multiple posts
TODO add simple metadata: title, publish date, visible
TODO create an index
TODO read multiple files from disc
TODO construct a basic layout
TODO add some simple inline css
*/

/* CSS
DONE study CSS Grids: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout/Basic_Concepts_of_Grid_Layout
DONE find top personal techincal blogs and choose one to copy
TODO create fixed layout first, then make it responsive
TODO study CSS layouts in general
* is it a good idea to mix grids and flex? -> YES
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

const Heading: React.FC = ({ children }) => <h3 style={{ padding: '1rem 0', color: '#333333' }}>{children}</h3>;

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

type BlogHeaderProps = {
    title: string;
    date: string;
};

const BlogHeader: FC<BlogHeaderProps> = observer(({ title, date }) => {
    return (
        <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '40px', marginBottom: '0px' }}>{title}</h3>
            <h3 style={{ fontSize: '14px', color: '#555555' }}>{date}</h3>
        </div>
    );
});

const Content: FC = observer(() => {
    const { posts } = useContext(RootStoreContext);

    if (posts == null) {
        return <></>;
    }

    console.log('rendering content');

    const postElements = posts.map((post, i) => (
        <div key={i}>
            <BlogHeader title={post.title} date={post.date}></BlogHeader>
            <div>{map_children(post.ast)}</div>
        </div>
    ));
    return (
        <div
            style={{
                /* restrict max paragraph length */
                maxWidth: '786px',
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '15px',
            }}
        >
            {postElements}
        </div>
    );
});

const Index: FC = observer(() => {
    const { posts } = useContext(RootStoreContext);

    if (posts == null) {
        return <></>;
    }

    console.log('rendering index');
    const titles = posts.map((post, i) => (
        <li key={i}>
            <a>{post.title}</a>
        </li>
    ));
    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ position: 'sticky', top: '4rem', paddingTop: '1rem' }}>
                <div style={{ fontWeight: 'bold', paddingBottom: '1rem' }}>In this article</div>
                <ul style={{ padding: 0, listStyleType: 'none' }}>{titles}</ul>
            </div>
        </div>
    );
});

const Header: FC = observer(() => {
    return (
        <div
            style={{
                top: 0,
                position: 'sticky',
                alignSelf: 'start',
                padding: '0.5rem 5%',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '30px',
                backgroundColor: '#ffffff',
                borderBottom: 'solid 1px gainsboro',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'start',
                    alignItems: 'center',
                    fontFamily: 'Cinzel',
                    fontSize: '2rem',
                }}
            >
                <a className="Branding" href="/">
                    David E Varela
                </a>
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'end',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'gray' }}>
                    <div style={{ padding: '0 1rem' }}>BLOG</div>
                    <div style={{ padding: '0 1rem' }}>PORTFOLIO</div>
                    <div style={{ padding: '0 1rem' }}>ABOUT</div>
                    <div style={{ padding: '0 1rem' }}>LINKS</div>
                </div>
            </div>
        </div>
    );
});

const store = new RootStore();

const App: FC = () => {
    let data = [
        {
            title: 'This Is a Mockup',
            date: '11/10/2019',
            content: `
## This is a poem about fear
I must not fear.
Fear is the mind-killer.
Fear is the little-death that brings total obliteration.
**I will face my fear**.
I will permit it to pass over me and through me.
And when it has gone past, I will turn the inner eye to see its path.
Where the fear has gone there will be nothing. Only I will remain.

I must not fear.
Fear is the mind-killer.
Fear is the little-death that brings total obliteration.
**I will face my fear**.
I will permit it to pass over me and through me.
And when it has gone past, I will turn the inner eye to see its path.
Where the fear has gone there will be nothing. Only I will remain.

I must not fear.
Fear is the mind-killer.
Fear is the little-death that brings total obliteration.
[some other link](foobar.com)
**I will face my fear**.
I will permit it to pass over me and through me.
And when it has gone past, I will turn the inner eye to see its path.
Where the fear has gone there will be nothing. Only I will remain.
[some link](google.com)

## The end
* I must not fear
* fear is the mind-killer
* fear is the little death that brings total obliteration
* I will face my fear
* I will permit it to pass over me and through me
* When it has gone past I will turn the inner eye to see its path
* Where the fear has gone _there will be nothing_
* Only I will remain

## This is a poem about fear
I must not fear.
Fear is the mind-killer.
Fear is the little-death that brings total obliteration.
**I will face my fear**.
I will permit it to pass over me and through me.
And when it has gone past, I will turn the inner eye to see its path.
Where the fear has gone there will be nothing. Only I will remain.

I must not fear.
Fear is the mind-killer.
Fear is the little-death that brings total obliteration.
**I will face my fear**.
I will permit it to pass over me and through me.
And when it has gone past, I will turn the inner eye to see its path.
Where the fear has gone there will be nothing. Only I will remain.


`,
        },
        {
            title: 'This is a Second Post',
            date: '11/11/2021',
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
    ];
    data = [...data, ...data, ...data, ...data];
    store.loadBlogPosts(data);
    return (
        <RootStoreContext.Provider value={store}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateRows: 'auto auto auto',
                    rowGap: '10px',
                    alignItems: 'start',
                }}
            >
                <Header></Header>
                <div style={{ display: 'grid', justifyItems: 'center' }}>
                    <div style={{ display: 'grid', gridGap: '30px', gridTemplateColumns: '2fr 1fr', width: '60vw' }}>
                        <Content></Content>
                        <Index></Index>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'end',
                        padding: '1rem 5%',
                        color: '#222222',
                        backgroundColor: '#eeeeee',
                    }}
                >
                    © 2022 David E Varela. All rights reserved.
                </div>
            </div>
        </RootStoreContext.Provider>
    );
};

export default App;
