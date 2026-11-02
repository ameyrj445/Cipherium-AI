import React from 'react';
import {render,screen,fireEvent,act} from '@testing-library/react';
import {it,expect,vi,afterEach} from 'vitest';
import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import StickyRail from '../components/layout/StickyRail';
import TwoPaneLayout from '../components/layout/TwoPaneLayout';
vi.mock('../components/Sidebar',()=>({default:p=><nav><button onClick={p.onToggleCollapse}>Collapse nav</button><button onClick={p.onCloseDrawer}>Close drawer</button><span>{String(p.collapsed)}</span></nav>}));
vi.mock('../components/TopHeader',()=>({default:p=><header><button onClick={p.onToggleMobileDrawer}>Open drawer</button><span>{p.userName}</span></header>}));
const resize=w=>act(()=>{window.innerWidth=w;fireEvent(window,new Event('resize'))});
afterEach(()=>{localStorage.clear();vi.restoreAllMocks();window.innerWidth=1024});
it('shell remembers collapse, switches to mobile drawer and closes it on resize',()=>{
 window.innerWidth=1400;localStorage.setItem('cipherium_sidebar_collapsed','false');
 render(<AppShell token="test" user={{name:'Alex Learner',email:'a@example.com'}}><p>Page</p></AppShell>);
 expect(screen.getByText('Alex')).toBeInTheDocument();expect(screen.getByText('false')).toBeInTheDocument();
 fireEvent.click(screen.getByText('Collapse nav'));expect(localStorage.getItem('cipherium_sidebar_collapsed')).toBe('true');
 resize(500);expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
 fireEvent.click(screen.getByText('Open drawer'));expect(screen.getByRole('navigation')).toBeInTheDocument();
 fireEvent.click(screen.getByText('Close drawer'));expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
 fireEvent.click(screen.getByText('Open drawer'));resize(600);expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
 resize(1400);expect(screen.getByRole('navigation')).toBeInTheDocument();
});
it('shell survives corrupt and unavailable browser storage',()=>{
 localStorage.setItem('cipherium_sidebar_collapsed','invalid');
 render(<AppShell><p>Fallback page</p></AppShell>);
 expect(screen.getByText('Student')).toBeInTheDocument();
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked')});
 fireEvent.click(screen.getByText('Collapse nav'));expect(screen.getByText('Fallback page')).toBeInTheDocument();
});
it('container adapts gutters and layout modes',()=>{
 window.innerWidth=400;const {rerender}=render(<PageContainer data-testid="page">Content</PageContainer>);
 expect(screen.getByTestId('page')).toHaveStyle({paddingLeft:'24px'});resize(900);expect(screen.getByTestId('page')).toHaveStyle({paddingLeft:'32px'});resize(1400);expect(screen.getByTestId('page')).toHaveStyle({paddingLeft:'40px'});
 rerender(<PageContainer data-testid="page" as="section" fullHeight noGrid noPadding>Content</PageContainer>);
 expect(screen.getByTestId('page').tagName).toBe('SECTION');expect(screen.getByTestId('page')).toHaveStyle({paddingLeft:'0px',display:'flex',overflow:'hidden'});
});
it('rail persists collapsed state and expands on mobile',()=>{
 window.innerWidth=1400;localStorage.setItem('cipherium_rail_tools','true');
 render(<StickyRail id="tools" collapsible><p>Tool content</p></StickyRail>);
 expect(screen.queryByText('Tool content')).not.toBeInTheDocument();fireEvent.click(screen.getByLabelText('Expand side panel'));expect(screen.getByText('Tool content')).toBeInTheDocument();expect(localStorage.getItem('cipherium_rail_tools')).toBe('false');
 fireEvent.click(screen.getByLabelText('Collapse side panel'));resize(500);expect(screen.getByText('Tool content')).toBeInTheDocument();expect(screen.queryByLabelText('Expand side panel')).not.toBeInTheDocument();
});
it('rail tolerates invalid storage and write failure without losing contents',()=>{
 window.innerWidth=1400;localStorage.setItem('cipherium_rail_tools','bad');
 render(<StickyRail id="tools" collapsible sticky={false}><p>Tools</p></StickyRail>);
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked')});
 fireEvent.click(screen.getByLabelText('Collapse side panel'));fireEvent.click(screen.getByLabelText('Expand side panel'));expect(screen.getByText('Tools')).toBeInTheDocument();
});
it('two pane stacks at narrow widths and renders both panes',()=>{
 window.innerWidth=1400;render(<TwoPaneLayout left={<p>Left</p>} right={<p>Right</p>} rightSticky={false}/>);
 expect(screen.getByText('Left')).toBeInTheDocument();expect(screen.getByText('Right')).toBeInTheDocument();resize(500);expect(screen.getByText('Right')).toBeInTheDocument();
});
