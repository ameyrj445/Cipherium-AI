import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
import AuthModal from '../components/AuthModal';
const props=()=>({authName:'',authEmail:'',authPassword:'',setAuthName:vi.fn(),setAuthEmail:vi.fn(),setAuthPassword:vi.fn(),setAuthMode:vi.fn(),setAuthError:vi.fn(),handleAuth:vi.fn(e=>e.preventDefault())});
it('does not render closed authentication dialog',()=>{const {container}=render(<AuthModal isOpen={false}/>);expect(container).toBeEmptyDOMElement()});
it('supports login fields, submit, mode changes, demo fill and close',()=>{
 const p=props(),close=vi.fn(); const {container}=render(<AuthModal {...p} onClose={close} authError="Invalid login"/>);
 expect(screen.getByText('Invalid login')).toBeInTheDocument();
 fireEvent.change(screen.getByPlaceholderText('you@domain.com'),{target:{value:'learner@example.com'}});
 fireEvent.change(screen.getByPlaceholderText('••••••••'),{target:{value:'new-password'}});
 expect(p.setAuthEmail).toHaveBeenCalledWith('learner@example.com');expect(p.setAuthPassword).toHaveBeenCalledWith('new-password');
 fireEvent.submit(container.querySelector('form'));expect(p.handleAuth).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button',{name:'Create Account'}));expect(p.setAuthMode).toHaveBeenLastCalledWith('register');
 fireEvent.click(screen.getByRole('button',{name:'Sign In'}));expect(p.setAuthMode).toHaveBeenLastCalledWith('login');
 fireEvent.click(screen.getByRole('button',{name:'Quick Fill Demo Account'}));expect(p.setAuthEmail).toHaveBeenLastCalledWith('student@cipherium.ai');expect(p.setAuthError).toHaveBeenCalledWith('');
 fireEvent.click(container.querySelector('button'));expect(close).toHaveBeenCalledOnce();
});
it('renders registration and loading states without submitting again',()=>{
 const p=props();const {rerender}=render(<AuthModal {...p} authMode="register"/>);
 expect(screen.getByText('Join Cipherium AI')).toBeInTheDocument();
 fireEvent.change(screen.getByPlaceholderText('e.g. Amey Jain'),{target:{value:'Learner'}});expect(p.setAuthName).toHaveBeenCalledWith('Learner');
 rerender(<AuthModal {...p} authMode="register" loading/>);
 expect(screen.getByRole('button',{name:'Authenticating...'})).toBeDisabled();
});
