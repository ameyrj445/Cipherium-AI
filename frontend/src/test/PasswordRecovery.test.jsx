import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PasswordRecovery from '../components/PasswordRecovery';
import { authAPI } from '../services/api';

vi.mock('../services/api', () => ({ authAPI: { forgotPassword: vi.fn(), resetPassword: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

describe('password recovery', () => {
  it('requests a reset and shows account-safe confirmation', async () => {
    authAPI.forgotPassword.mockResolvedValue({});
    render(<PasswordRecovery mode="forgot" onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: ' user@example.com ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    await waitFor(() => expect(authAPI.forgotPassword).toHaveBeenCalledWith({ email: 'user@example.com' }));
    expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
  });

  it('does not submit without a token', () => {
    render(<PasswordRecovery mode="reset" token={null} onBack={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('missing a token');
    expect(authAPI.resetPassword).not.toHaveBeenCalled();
  });

  it('validates and submits the original password, then clears fields', async () => {
    authAPI.resetPassword.mockResolvedValue({});
    const onSuccess = vi.fn();
    render(<PasswordRecovery mode="reset" token="sample-token" onBack={() => {}} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: ' abcdef ' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: ' abcdef ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await waitFor(() => expect(authAPI.resetPassword).toHaveBeenCalledWith({ token: 'sample-token', new_password: ' abcdef ' }));
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Password updated');
  });

  it('shows rate limit and expired link errors without submitting twice', async () => {
    let reject;
    authAPI.resetPassword.mockReturnValue(new Promise((_, r) => { reject = r; }));
    render(<PasswordRecovery mode="reset" token="sample-token" onBack={() => {}} onSuccess={() => {}} />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'secret1' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'secret1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(screen.getByRole('button', { name: 'Please wait…' })).toBeDisabled();
    expect(authAPI.resetPassword).toHaveBeenCalledTimes(1);
    reject({ response: { status: 429, data: { error: 'private' } } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts');
    authAPI.resetPassword.mockRejectedValueOnce({ response: { status: 400 } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid or expired');
  });
});
