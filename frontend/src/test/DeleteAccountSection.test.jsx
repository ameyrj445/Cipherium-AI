import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import useAccountDeletion from '../hooks/useAccountDeletion';
import SettingsView from '../components/SettingsView';
import { authAPI } from '../services/api';

vi.mock('../services/api', () => ({
  authAPI: { deleteAccount: vi.fn() },
  settingsAPI: { getProfileSettings: vi.fn().mockResolvedValue({}), updateProfileSettings: vi.fn().mockResolvedValue({}) },
  geminiAPI: { getStatus: vi.fn().mockResolvedValue({}) },
}));

const user = { id: 1, email: 'test@example.com', name: 'Test' };
const open = () => fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
const type = (value) => fireEvent.change(screen.getByLabelText('Deletion confirmation'), { target: { value } });
const submit = () => fireEvent.submit(screen.getByRole('form', { name: 'Confirm account deletion' }));

describe('Settings account deletion (mocked API only)', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });

  it('does not offer account deletion to guests', () => {
    render(<SettingsView />);
    expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
  });

  it('requires exact DELETE, guards form submission, and focuses the labelled input', () => {
    render(<SettingsView user={user} />);
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    open();
    expect(screen.getByLabelText('Deletion confirmation')).toHaveFocus();
    for (const value of ['', 'delete', ' DELETE', 'DELETE ', 'DELET']) {
      type(value);
      expect(screen.getByRole('button', { name: 'Permanently delete account' })).toBeDisabled();
      submit();
    }
    expect(authAPI.deleteAccount).not.toHaveBeenCalled();
    type('DELETE');
    expect(screen.getByRole('button', { name: 'Permanently delete account' })).toBeEnabled();
  });

  it.each(['Cancel', 'Escape'])('supports %s, restores focus, and resets confirmation on reopen', (action) => {
    render(<SettingsView user={user} />);
    open(); type('DELETE');
    if (action === 'Cancel') fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    else fireEvent.keyDown(screen.getByLabelText('Deletion confirmation'), { key: 'Escape' });
    expect(screen.queryByLabelText('Deletion confirmation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete account' })).toHaveFocus();
    open();
    expect(screen.getByLabelText('Deletion confirmation')).toHaveValue('');
    expect(authAPI.deleteAccount).not.toHaveBeenCalled();
  });

  it('locks pending controls, prevents repeated requests, and logs out only after success', async () => {
    let resolve;
    authAPI.deleteAccount.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const onLogout = vi.fn();
    render(<SettingsView user={user} onLogout={onLogout} />);
    open(); type('DELETE'); submit(); submit();
    expect(authAPI.deleteAccount).toHaveBeenCalledTimes(1);
    expect(onLogout).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByLabelText('Deletion confirmation')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Deleting your account');
    fireEvent.keyDown(screen.getByLabelText('Deletion confirmation'), { key: 'Escape' });
    expect(screen.getByLabelText('Deletion confirmation')).toBeInTheDocument();
    await act(async () => resolve({ data: { message: 'Deleted' } }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    submit();
    expect(authAPI.deleteAccount).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ response: { data: { detail: 'Session expired. Sign in again.' } } }, 'Session expired. Sign in again.'],
    [new Error('Network error'), 'Unable to delete your account. Please try again.'],
    [{ response: { data: { detail: [{ msg: 'invalid' }] } } }, 'Unable to delete your account. Please try again.'],
  ])('announces failure without logout and allows an explicit retry', async (error, message) => {
    authAPI.deleteAccount.mockRejectedValueOnce(error).mockResolvedValueOnce({});
    const onLogout = vi.fn();
    render(<SettingsView user={user} onLogout={onLogout} />);
    open(); type('DELETE'); submit();
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(onLogout).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    submit();
    await waitFor(() => expect(onLogout).toHaveBeenCalledTimes(1));
    expect(authAPI.deleteAccount).toHaveBeenCalledTimes(2);
  });

  it('keeps deletion locked after leaving Settings and returning while pending', async () => {
    let resolve;
    authAPI.deleteAccount.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const logout = vi.fn();
    function Harness({ visible }) {
      const { deleteAccount, deletionPending } = useAccountDeletion('session', logout);
      return visible ? <SettingsView user={user} onDeleteAccount={deleteAccount} deletionPending={deletionPending} /> : null;
    }
    const view = render(<Harness visible />);
    open(); type('DELETE');
    await act(async () => submit());
    view.rerender(<Harness visible={false} />);
    view.rerender(<Harness visible />);
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Deleting your account');
    expect(authAPI.deleteAccount).toHaveBeenCalledTimes(1);
    await act(async () => resolve({}));
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('discards confirmation when navigating away and back', () => {
    const view = render(<SettingsView user={user} />);
    open(); type('DELETE');
    view.unmount();
    render(<SettingsView user={user} />);
    open();
    expect(screen.getByLabelText('Deletion confirmation')).toHaveValue('');
    expect(authAPI.deleteAccount).not.toHaveBeenCalled();
  });
});
