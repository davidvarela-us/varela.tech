import React, { useContext, createContext, FC } from 'react';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import * as commonmark from 'commonmark';
import './App.css';
import rose from './rose.jpg';

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
DONE construct a basic layout
DONE add some simple inline css
*/

/* CSS
DONE study CSS Grids: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout/Basic_Concepts_of_Grid_Layout
DONE find top personal techincal blogs and choose one to copy
TODO create fixed layout first, then make it responsive
TODO study CSS layouts in general
TODO get rid of most CSS magic numbers
* is it a good idea to mix grids and flex? -> YES
*/

/* FINAL PHASE
TODO create a landing page
TODO create a portfolio
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

const CodeBlock: React.FC = ({ children }) => (
    <pre style={{ font: 'Fira Code', fontSize: '1rem', backgroundColor: '#eeeeee', padding: '1rem', margin: '1rem 0' }}>
        {children}
    </pre>
);

const Emph: React.FC = ({ children }) => <span>{children}</span>;

const Heading: React.FC = ({ children }) => (
    <h2
        style={{
            fontFamily: 'Hind',
            marginTop: '1rem',
            marginBottom: '0.5rem',
            fontSize: '2rem',
            fontWeight: '500',
        }}
    >
        {children}
    </h2>
);

type LinkProps = {
    href: string; // TODO
};
const Link: React.FC<LinkProps> = ({ href, children }) => <a href={href}>{children}</a>;

const List: React.FC = ({ children }) => <ul>{children}</ul>;

const ListItem: React.FC = ({ children }) => <li>{children}</li>;

const OrderedList: React.FC = ({ children }) => <ol>{children}</ol>;

const Paragraph: React.FC = ({ children }) => <p>{children}</p>;

const Strong: React.FC = ({ children }) => <span style={{ fontWeight: 'bold' }}>{children}</span>;

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
        <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: 'Hind', fontSize: '3rem', fontWeight: '500' }}>{title}</h3>
                <div style={{ fontSize: '1rem', fontWeight: 'normal', color: '#555555' }}>
                    Published on {date} | By <a href="/about">David Varela</a>
                </div>
            </div>
            <img src={rose} style={{ width: '100%', aspectRatio: '2/1', objectFit: 'cover' }}></img>
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
                marginBottom: '3rem',
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
            <a className="IndexLink" href="/">
                <div style={{ padding: '0.2rem 0' }}>{post.title}</div>
            </a>
        </li>
    ));
    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ position: 'sticky', top: '4rem', paddingTop: '1rem' }}>
                <div style={{ fontWeight: 'bold', paddingBottom: '1rem' }}>IN THIS ARTICLE</div>
                <ul style={{ padding: 0, listStyleType: 'none' }}>{titles}</ul>
            </div>
        </div>
    );
});

type NavButtonProps = {
    href: string;
};

const NavButton: FC<NavButtonProps> = ({ children, href }) => {
    return (
        <div style={{ padding: '0 1rem' }}>
            <a className="NavButton" href={href}>
                {children}
            </a>
        </div>
    );
};

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
                    <NavButton href="/blog">BLOG</NavButton>
                    <NavButton href="/portfolio">PORTFOLIO</NavButton>
                    <NavButton href="/about">ABOUT</NavButton>
                </div>
            </div>
        </div>
    );
});

type LinkWidgetProps = {
    href: string; // TODO
    title: string;
    dims?: string;
};

const LinkWidget: FC<LinkWidgetProps> = ({ children, href, title, dims }) => {
    return (
        <div style={{ height: '2rem', width: '2rem', margin: '0 0.25rem' }}>
            <a href={href} title={title} className="LinkWidget">
                <svg
                    data-icon={title}
                    height="100%"
                    width="100%"
                    viewBox={dims ? `0 0 ${dims}` : '0 0 32 32'}
                    style={{ fill: 'currentcolor' }}
                >
                    <title>{title}</title>
                    {children}
                </svg>
            </a>
        </div>
    );
};

const Footer: FC = () => {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateAreas: `". links copyright"`,
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr',
                padding: '1rem 2rem',
                color: '#222222',
                backgroundColor: '#eeeeee',
            }}
        >
            <div
                style={{
                    gridArea: 'links',
                    alignSelf: 'center',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                }}
            >
                <LinkWidget href="https://github.com/00vareladavid" title="GitHub">
                    <path d="M0 18 C0 12 3 10 3 9 C2.5 7 2.5 4 3 3 C6 3 9 5 10 6 C12 5 14 5 16 5 C18 5 20 5 22 6 C23 5 26 3 29 3 C29.5 4 29.5 7 29 9 C29 10 32 12 32 18 C32 25 30 30 16 30 C2 30 0 25 0 18 M3 20 C3 24 4 28 16 28 C28 28 29 24 29 20 C29 16 28 14 16 14 C4 14 3 16 3 20 M8 21 A1.5 2.5 0 0 0 13 21 A1.5 2.5 0 0 0 8 21 M24 21 A1.5 2.5 0 0 0 19 21 A1.5 2.5 0 0 0 24 21 z"></path>
                </LinkWidget>
                <LinkWidget href="https://twitter.com/00vareladavid" title="Twitter">
                    <path d="M2 4 C6 8 10 12 15 11 A6 6 0 0 1 22 4 A6 6 0 0 1 26 6 A8 8 0 0 0 31 4 A8 8 0 0 1 28 8 A8 8 0 0 0 32 7 A8 8 0 0 1 28 11 A18 18 0 0 1 10 30 A18 18 0 0 1 0 27 A12 12 0 0 0 8 24 A8 8 0 0 1 3 20 A8 8 0 0 0 6 19.5 A8 8 0 0 1 0 12 A8 8 0 0 0 3 13 A8 8 0 0 1 2 4"></path>
                </LinkWidget>
                <LinkWidget href="https://news.ycombinator.com/user?id=00vareladavid" title="HackerNews" dims="448 512">
                    <path d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM21.2 229.2H21c.1-.1.2-.3.3-.4 0 .1 0 .3-.1.4zm218 53.9V384h-31.4V281.3L128 128h37.3c52.5 98.3 49.2 101.2 59.3 125.6 12.3-27 5.8-24.4 60.6-125.6H320l-80.8 155.1z"></path>
                </LinkWidget>
                <LinkWidget href="https://stackoverflow.com/users/7077117" title="StackOverflow" dims="384 512">
                    <path d="M290.7 311L95 269.7 86.8 309l195.7 41zm51-87L188.2 95.7l-25.5 30.8 153.5 128.3zm-31.2 39.7L129.2 179l-16.7 36.5L293.7 300zM262 32l-32 24 119.3 160.3 32-24zm20.5 328h-200v39.7h200zm39.7 80H42.7V320h-40v160h359.5V320h-40z"></path>
                </LinkWidget>
            </div>
            <div style={{ gridArea: 'copyright', display: 'flex', justifyContent: 'end', alignItems: 'center' }}>
                © 2022 David E Varela. All rights reserved.
            </div>
        </div>
    );
};

const store = new RootStore();

const App: FC = () => {
    let data = [
        {
            title: 'This Is a Mockup',
            date: 'November 10, 2019',
            content: `
# This Is a Poem About Fear

I must not fear.
Fear is the mind-killer.
Fear is the little-death that brings total obliteration.
I will face my fear
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
I will face my fear.
I will permit it to pass over me and through me.
And when it has gone past, I will turn the inner eye to see its path.
Where the fear has gone there will be nothing. Only I will remain.
[some link](google.com)

# The End

some more text:

* I must not fear
* fear is the mind-killer
* fear is the little death that brings total obliteration
* I will face my fear
* I will permit it to pass over me and through me
* When it has gone past I will turn the inner eye to see its path
* Where the fear has gone _there will be nothing_
* Only I will remain

and some closing remarks. wow so many words

# This Is a Poem About Fear
I must not fear.
Fear is the mind-killer.
Fear is the little-death that brings total obliteration.
I will face my fear.
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
            date: 'December 11, 2022',
            content: `
## This Is Just a Random Title

This is a bunch of **nothing** really.
Just some random words.

\`\`\`
/* this is a comment */
const foo = () => {
    return nothing;
}

/* and this is another comment */
const bar = () => {
    return (
        <div className="bar">
            this is some text
        </div>
    );
}
\`\`\`

I must not fear.
Fear is the mind-killer.
Fear is the little-death that brings total obliteration.
**I will face my fear**.
I will permit it to pass over me and through me.
And when it has gone past, I will turn the inner eye to see its path.
Where the fear has gone there will be nothing. Only I will remain.
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gridColumnGap: '1rem' }}>
                        <Content></Content>
                        <Index></Index>
                    </div>
                </div>
                <Footer></Footer>
            </div>
        </RootStoreContext.Provider>
    );
};

/* Font Awesome Free 5.15.3 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) */

export default App;
