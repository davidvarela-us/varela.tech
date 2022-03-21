import React, { useContext, createContext, FC } from 'react';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Outlet, Link, useParams } from 'react-router-dom';
import * as commonmark from 'commonmark';
import './App.css';
import dunes from './dunes.jpg';
import contrast from './contrast.jpg';
import roses from './rose.jpg';

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
DONE find top personal technical blogs and choose one to copy
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
    url: string;
    image: string;
    _ast: commonmark.Node | null;

    constructor(title: string, date: string, url: string, image: string) {
        makeAutoObservable(this);
        this.title = title;
        this.date = date;
        this.url = url;
        this.image = image;
        this._ast = null;
    }

    get ast(): commonmark.Node | null {
        return this._ast;
    }

    *loadMarkdown() {
        console.log('loading markdown');
        // eslint-disable-next-line
        // @ts-ignore
        const markdown = yield fetch(`/markdown/${this.url}`);
        const raw: string = yield markdown.text();
        const reader = new commonmark.Parser();
        this._ast = reader.parse(raw);
        console.log('done loading markdown');
    }
}

interface BlogPost {
    title: string;
    date: string;
    url: string;
    image: string;
}
class RootStore {
    _posts: BlogPostStore[] | undefined = undefined;
    _articleID: number | undefined = undefined;

    constructor() {
        makeAutoObservable(this);
    }

    get posts(): BlogPostStore[] | undefined {
        return this._posts;
    }

    get articleID(): number | undefined {
        return this._articleID;
    }

    set articleID(x: number | undefined) {
        this._articleID = x;
    }

    loadBlogPosts(xs: BlogPost[]) {
        this._posts = xs.map((x) => new BlogPostStore(x.title, x.date, x.url, x.image));
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

const Code: React.FC = ({ children }) => <code className="code">{children}</code>;

const CodeBlock: React.FC = ({ children }) => <pre className="codeBlock">{children}</pre>;

const Emph: React.FC = ({ children }) => <span>{children}</span>;

type HeadingProps = {
    id?: string;
};

const Heading: React.FC<HeadingProps> = ({ id, children }) => (
    <a href={id == null ? undefined : `#${id}`} id={id == null ? undefined : id}>
        <h2 className="heading">{children}</h2>
    </a>
);

type MDLinkProps = {
    href: string; // TODO
};
const MDLink: React.FC<MDLinkProps> = ({ href, children }) => <a href={href}>{children}</a>;

const List: React.FC = ({ children }) => <ul>{children}</ul>;

const ListItem: React.FC = ({ children }) => <li>{children}</li>;

const OrderedList: React.FC = ({ children }) => <ol>{children}</ol>;

const Paragraph: React.FC = ({ children }) => <p className="paragraph">{children}</p>;

const Strong: React.FC = ({ children }) => <span className="strong">{children}</span>;

const to_id = (title: string): string => title.toLowerCase().split(' ').join('_');

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
            return (
                <Heading id={node?.firstChild?.literal == null ? undefined : to_id(node.firstChild.literal)}>
                    {map_children(node)}
                </Heading>
            );
            break;
        case 'link':
            return <MDLink href={node.destination == null ? '' : node.destination}>{map_children(node)}</MDLink>;
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

const DATE_COLOR = '#555555';
const MAX_CONTENT_WIDTH = '786px';

type BlogHeaderProps = {
    title: string;
    date: string;
    image: string;
};

const BlogHeader: FC<BlogHeaderProps> = observer(({ title, date, image }) => {
    return (
        <div>
            <div className="blogHeader">
                <h1 className="blogHeaderTitle">{title}</h1>
                <div className="blogHeaderInfo">
                    Published on {date} | By <a href="/about">David Varela</a>
                </div>
            </div>
            <img src={image} className="blogHeaderImage"></img>
        </div>
    );
});

const Content: FC = observer(() => {
    const { posts, articleID } = useContext(RootStoreContext);

    if (posts == null || articleID == null || posts[articleID].ast == null) {
        return <></>;
    }

    console.log('rendering content');
    const post = posts[articleID];

    if (post.ast == null) {
        return <></>;
    }

    return (
        <div className="content">
            <BlogHeader title={post.title} date={post.date} image={post.image}></BlogHeader>
            <div>{map_children(post.ast)}</div>
        </div>
    );
});

const collect_headings = (root: commonmark.Node) => {
    const headings: Array<string> = [];

    collect_children(root).forEach((x) => {
        if (x.type === 'heading' && x?.firstChild?.literal != null) {
            headings.push(x.firstChild.literal);
        }
    });
    return headings;
};

const Index: FC = observer(() => {
    const { posts, articleID } = useContext(RootStoreContext);

    if (posts == null || articleID == null || posts[articleID].ast == null) {
        return <></>;
    }

    console.log('rendering index');

    const ast = posts[articleID].ast;

    if (ast == null) {
        return <></>;
    }

    const headings = collect_headings(ast);

    const titles = headings.map((heading, i) => (
        <li key={i}>
            <a className="IndexLink" href={`#${to_id(heading)}`}>
                <div className="indexLinkDiv">{heading}</div>
            </a>
        </li>
    ));

    return (
        <div className="indexBox">
            <div className="index">
                <div className="indexTitle">IN THIS ARTICLE</div>
                <ul className="indexList">{titles}</ul>
            </div>
        </div>
    );
});

export const Article: FC = observer(() => {
    const { posts, articleID } = useContext(RootStoreContext);

    console.log(`article: ${articleID}`);
    let post: BlogPostStore | undefined;

    if (posts != null && articleID != null) {
        post = posts[articleID];
    } else {
        return <></>;
    }

    if (post.ast == null) {
        post.loadMarkdown();
        return <></>;
    }

    return (
        <div className="centerContent">
            <div className="article">
                <Content></Content>
                <Index></Index>
            </div>
        </div>
    );
});

type NavButtonProps = {
    href: string;
    contact: boolean;
};

const NavButton: FC<NavButtonProps> = ({ children, href, contact }) => {
    return (
        <div className="navButtonDiv">
            <Link id={contact ? 'Contact' : undefined} className="navButton" to={href}>
                {children}
            </Link>
        </div>
    );
};

const Header: FC = observer(() => {
    return (
        <div className="header">
            <div className="brandingDiv">
                <a className="Branding" href="/">
                    David E Varela
                </a>
            </div>
            <div className="headerNavBarBox">
                <div className="headerNavBar">
                    <NavButton contact={false} href="/articles">
                        ARTICLES
                    </NavButton>
                    <NavButton contact={false} href="/portfolio">
                        PORTFOLIO
                    </NavButton>
                    <NavButton contact={false} href="/about">
                        ABOUT
                    </NavButton>
                    <NavButton contact={true} href="/contact">
                        CONTACT
                    </NavButton>
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
        <div className="LinkWidget">
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
        <div className="Footer">
            <div className="FooterLinks">
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
            <div className="copyright">© 2022 David E Varela. All rights reserved.</div>
        </div>
    );
};

const HeaderAndFooter: FC = ({ children }) => {
    return (
        <div className="HeaderAndFooter">
            <Header />
            {children}
            <Footer />
        </div>
    );
};

export const Landing: FC = () => {
    return (
        <HeaderAndFooter>
            <div className="centerContent">
                <div className="landing">This is the landing page.</div>
            </div>
        </HeaderAndFooter>
    );
};

const Block: FC = ({ children }) => {
    return <p className="block">{children}</p>;
};

export const About: FC = () => {
    return (
        <HeaderAndFooter>
            <div className="centerContent">
                <div className="about">
                    <Heading> About </Heading>
                    <Block>
                        I&apos;m David Varela, a web consultant based in San Jose, CA. I help businesses connect with
                        clients through the web.
                    </Block>
                    <Heading>My Philosophy</Heading>
                    <Block>
                        My philosophy is founded in relentless refinement. I believed that sustained focus and effort,
                        more than anything else, has the power to shape the world.
                    </Block>
                    <Heading> About Me </Heading>
                    <Block>
                        I run my own web consulting business. Before running my own business I helped build an insurance
                        technology startup, where I developed my passion for web technologies. I hold a Bachelor&apos;s
                        Degree in Computer Science from the University of California, Davis.
                    </Block>
                    <Heading>Let&apos;s Chat</Heading>
                    Interested in one of my articles? Looking to grow your business? Just want to say hello?
                    <Link to={'/contact'}>let&apos;s chat</Link>. I warmly welcome the opportunity to connect with
                    energetic, kind, thoughtful people.
                </div>
            </div>
        </HeaderAndFooter>
    );
};

export const Portfolio: FC = () => {
    return (
        <HeaderAndFooter>
            <div className="centerContent">
                <div className="portfolio">
                    <p>This is the portfolio.</p>
                </div>
            </div>
        </HeaderAndFooter>
    );
};

export const Contact: FC = () => {
    return (
        <HeaderAndFooter>
            <div className="centerContent">
                <div className="contact">
                    <p>
                        Ready to level up your web identity? Not sure where to start? Shoot me an email and let&apos;s
                        get started on building a brighter future for your business.
                    </p>
                    <Heading>Contact</Heading>
                    <ul>
                        <li>email: david@varela.tech | varela.tech@gmail.com</li>
                        <li>phone: 408 410 8208</li>
                    </ul>
                    <Heading>How I can help</Heading>
                    <p>
                        The web has enabled a new era. But it can also complex and difficult to manage. I specialize in
                        web design, efficiency, correctness, SEO, uptime, analytics, social media, user engagement.
                    </p>
                </div>
            </div>
        </HeaderAndFooter>
    );
};

type BlogIndexLinkProps = {
    title: string;
    href: string;
    date: string;
    image: string;
};

const BlogIndexLink: FC<BlogIndexLinkProps> = ({ title, href, date, image }) => {
    return (
        <li>
            <Link className="BlogIndexLink" to={href}>
                <div className="BlogIndexLinkDiv">
                    <img src={image} className="BlogIndexLinkImage"></img>
                    <span className="BlogIndexLinkTitle">{title}</span>
                    <span className="BlogIndexLinkDate">{date}</span>
                </div>
            </Link>
        </li>
    );
};

const BlogIndexMain: FC = () => {
    const { posts } = useContext(RootStoreContext);

    if (posts == null) {
        return <></>;
    }

    return (
        <div className="centerContent">
            <div className="BlogIndexMain">
                <h1 className="BlogIndexMainHeader">Articles</h1>
                <ul className="BlogIndexList">
                    {posts.map((post, i) => (
                        <BlogIndexLink
                            key={i}
                            title={post.title}
                            date={post.date}
                            image={post.image}
                            href={`/articles/${i}`}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
};

const ARTICLES = [
    {
        title: 'A Powerful Principle for System Design',
        date: 'March 12, 2022',
        url: '8020.md',
        image: contrast,
    },
    {
        title: 'An Introduction to Julia Pkg',
        date: 'January 10, 2021',
        url: 'pkg_tutorial.md',
        image: dunes,
    },
];

const store = new RootStore();
store.loadBlogPosts(ARTICLES);

export const BlogIndex: FC = observer(() => {
    const params = useParams();
    store.articleID = params.articleID == null ? undefined : parseInt(params.articleID);

    console.log(`article ID: ${store.articleID}`);

    return (
        <RootStoreContext.Provider value={store}>
            <HeaderAndFooter>{store.articleID == null ? <BlogIndexMain /> : <Outlet />}</HeaderAndFooter>
        </RootStoreContext.Provider>
    );
});

/* Font Awesome Free 5.15.3 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) */
